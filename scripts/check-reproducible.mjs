import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const recordPath = resolve(root, 'verification/reproducibility.json');
const update = process.argv.includes('--update');
const npmExecPath = process.env.npm_execpath;
const pluginId = 'byo-providers';

if (!npmExecPath) throw new Error('npm_execpath is unavailable');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function run(command, args, cwd, stdio = 'inherit') {
  return execFileSync(command, args, { cwd, stdio });
}

function trackedPaths() {
  const output = run('git', ['ls-files', '-z'], root, 'pipe');
  return output.toString('utf8').split('\0').filter(Boolean);
}

function copyTrackedTree(target) {
  for (const tracked of trackedPaths()) {
    const source = resolve(root, tracked);
    if (!lstatSync(source).isFile()) {
      throw new Error(`reproducibility input is not a regular file: ${tracked}`);
    }
    const destination = resolve(target, tracked);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
  run('git', ['init', '--quiet'], target);
  run('git', ['add', '--all'], target, 'pipe');
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

function snapshotTree(directory) {
  return filesUnder(directory)
    .sort()
    .map((file) => ({
      path: relative(directory, file).replaceAll('\\', '/'),
      bytes: readFileSync(file),
    }));
}

function compareTrees(first, second) {
  if (first.length !== second.length) return false;
  return first.every(
    (file, index) =>
      file.path === second[index]?.path && file.bytes.equals(second[index]?.bytes),
  );
}

function inventory(tree) {
  return tree.map((file) => ({ path: file.path, sha256: sha256(file.bytes) }));
}

function treeSha256(tree) {
  const hash = createHash('sha256');
  for (const file of tree) {
    hash.update(`${file.path}\0${file.bytes.length}\0`);
    hash.update(file.bytes);
  }
  return hash.digest('hex');
}

function buildClean(target) {
  copyTrackedTree(target);
  run(process.execPath, [npmExecPath, 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], target);
  run(process.execPath, [npmExecPath, 'run', 'build'], target);
  run(process.execPath, [npmExecPath, 'run', 'release'], target);

  const manifest = JSON.parse(
    readFileSync(join(target, 'dist', pluginId, 'elftia-plugin.json'), 'utf8'),
  );
  const releaseRoot = join(target, 'release', manifest.version);
  const epkg = readFileSync(join(releaseRoot, `${pluginId}.epkg`));
  const sidecar = readFileSync(join(releaseRoot, `${pluginId}.json`));
  const metadata = JSON.parse(sidecar.toString('utf8'));
  const tree = snapshotTree(join(target, 'dist', pluginId));

  if (!epkg.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    throw new Error('EPKG is not a standard ZIP container');
  }
  if (
    metadata.format !== 'elftia-plugin-package' ||
    metadata.formatVersion !== 2 ||
    metadata.id !== pluginId ||
    metadata.version !== manifest.version ||
    metadata.sha256 !== sha256(epkg) ||
    metadata.size !== epkg.length ||
    metadata.fileCount !== tree.length
  ) {
    throw new Error(`invalid EPKG v2 sidecar: ${JSON.stringify(metadata)}`);
  }
  return { manifest, tree, epkg, sidecar };
}

const tempParent = resolve(tmpdir());
const tempRoot = mkdtempSync(join(tempParent, `${pluginId}-repro-`));
try {
  const first = buildClean(join(tempRoot, 'a'));
  const second = buildClean(join(tempRoot, 'b'));
  if (
    !compareTrees(first.tree, second.tree) ||
    !first.epkg.equals(second.epkg) ||
    !first.sidecar.equals(second.sidecar)
  ) {
    throw new Error('two clean builds do not produce byte-identical tree/EPKG/sidecar output');
  }

  const files = inventory(second.tree);
  const release = {
    epkgSha256: sha256(second.epkg),
    sidecarSha256: sha256(second.sidecar),
    size: second.epkg.length,
    fileCount: second.tree.length,
    treeSha256: treeSha256(second.tree),
  };
  let previous = null;
  try {
    previous = JSON.parse(readFileSync(recordPath, 'utf8'));
  } catch {
    previous = null;
  }
  const stale =
    !previous ||
    JSON.stringify(previous.files) !== JSON.stringify(files) ||
    JSON.stringify(previous.release) !== JSON.stringify(release);
  if (stale && !update) {
    throw new Error(
      'verification/reproducibility.json is stale; run ' +
        '`node scripts/check-reproducible.mjs --update` and commit the refresh',
    );
  }
  if (update) {
    writeFileSync(
      recordPath,
      `${JSON.stringify(
        {
          sdk: '1.25.0',
          artifact: `dist/${pluginId}/`,
          buildsCompared: 2,
          files,
          release,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }
  console.log(
    JSON.stringify({ plugin: pluginId, version: second.manifest.version, release }, null, 2),
  );
} finally {
  if (dirname(tempRoot) !== tempParent || !basename(tempRoot).startsWith(`${pluginId}-repro-`)) {
    throw new Error(`refusing to remove unexpected temp root: ${tempRoot}`);
  }
  rmSync(tempRoot, { recursive: true, force: true });
}
