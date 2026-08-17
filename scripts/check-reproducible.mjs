import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'dist/byo-providers');
const recordPath = resolve(root, 'verification/reproducibility.json');
const update = process.argv.includes('--update');

function build() {
  const result = spawnSync(process.execPath, [resolve(root, 'scripts/build.mjs')], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else files.push(child);
  }
  return files;
}

async function snapshot() {
  const files = [];
  for (const file of (await walk(artifact)).sort()) {
    const bytes = await readFile(file);
    files.push({
      path: relative(artifact, file).replaceAll('\\', '/'),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  return files;
}

build();
const first = await snapshot();
build();
const second = await snapshot();

if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error(
    `clean builds are not reproducible:\nfirst=${JSON.stringify(first)}\nsecond=${JSON.stringify(second)}`,
  );
}

// The committed record is the audit anchor for byte-pinned release gates
// downstream (fleet descriptor inventory hashes). A double build that merely
// agrees with itself used to silently rewrite this file, so a stale record
// passed verify and poisoned desk-derived pins. Compare instead; refresh only
// via the explicit --update escape hatch, then commit the result.
let previous = null;
try {
  previous = JSON.parse(await readFile(recordPath, 'utf8'));
} catch {
  previous = null;
}
const missing = !previous || !Array.isArray(previous.files);
const stale = !missing && JSON.stringify(previous.files) !== JSON.stringify(second);
if ((missing || stale) && !update) {
  if (missing) {
    console.error(
      'verification/reproducibility.json is missing or unreadable; run ' +
        '`node scripts/check-reproducible.mjs --update` and commit the record',
    );
  } else {
    const before = new Map(previous.files.map((file) => [file.path, file.sha256]));
    const changed = second
      .filter((file) => before.get(file.path) !== file.sha256)
      .map((file) => file.path);
    const removed = previous.files.filter(
      (file) => !second.some((entry) => entry.path === file.path),
    );
    console.error(
      `committed reproducibility record is stale (changed: ${changed.join(', ') || '-'}; ` +
        `removed: ${removed.map((file) => file.path).join(', ') || '-'}); run ` +
        '`node scripts/check-reproducible.mjs --update` and commit the refresh',
    );
  }
  process.exit(1);
}

if (update) {
  await writeFile(
    recordPath,
    `${JSON.stringify(
      {
        sdk: '1.25.0',
        artifact: 'dist/byo-providers/',
        buildsCompared: 2,
        files: second,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  console.log(`reproducibility ok (${second.length} files); record refreshed`);
} else {
  console.log(`reproducibility ok (${second.length} files, matches the committed record)`);
}
