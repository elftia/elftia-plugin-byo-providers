import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'dist/byo-providers');

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

const verificationDir = resolve(root, 'verification');
await mkdir(verificationDir, { recursive: true });
await writeFile(
  resolve(verificationDir, 'reproducibility.json'),
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

console.log(`reproducibility ok (${second.length} files)`);
