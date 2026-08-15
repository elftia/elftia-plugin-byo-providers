import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const pkg = await readJson(resolve(root, 'package.json'));
const manifest = await readJson(resolve(root, 'elftia-plugin.json'));
const emittedManifestPath = resolve(root, 'dist/byo-providers/elftia-plugin.json');
const emittedManifest = await readJson(emittedManifestPath);
const sdk = await readJson(resolve(root, 'node_modules/@elftia/plugin-types/package.json'));

const requiredPermissions = [
  'host:llm-config',
  'host:media-config',
  'host:search-config',
  'host:object-storage-config',
  'host:subscription-auth',
  'host:agent-config',
  'host:cli-runtime',
  'host:secrets-pack',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(pkg.version === manifest.version, 'package and manifest versions differ');
assert(manifest.name === 'byo-providers', 'manifest name must be byo-providers');
assert(manifest.kind === 'app-extension', 'manifest kind must be app-extension');
assert(
  JSON.stringify(manifest.permissions) === JSON.stringify(requiredPermissions),
  'manifest permissions must be the exact dedicated BYO permissions',
);
assert(!manifest.permissions.includes('host:secrets-write'), 'host:secrets-write is forbidden');
const builtAgainst = manifest.contributes.main.builtAgainst;
const [builtMajor, builtMinor] = builtAgainst.split('.').map(Number);
const sdkMajor = Number(sdk.version.split('.')[0]);
assert(
  manifest.contributes.renderer.builtAgainst === builtAgainst,
  'renderer and main builtAgainst versions must match',
);
assert(
  builtMajor === sdkMajor && builtMinor >= manifest.contributes.main.requiredMinor,
  'manifest builtAgainst must share the locked SDK major and cover requiredMinor',
);
assert(
  manifest.contributes.renderer.entry === 'index.mjs',
  'renderer contribution must be index.mjs',
);
assert(
  manifest.contributes.main.entry === 'index.cjs',
  'main contribution must be index.cjs',
);
assert(
  JSON.stringify(emittedManifest) === JSON.stringify(manifest),
  'emitted manifest differs from the authored manifest',
);

await access(resolve(root, 'dist/byo-providers/renderer', manifest.contributes.renderer.entry));
await access(resolve(root, 'dist/byo-providers/main', manifest.contributes.main.entry));

const distEntries = await readdir(resolve(root, 'dist'), { withFileTypes: true });
assert(
  distEntries.length === 1 &&
    distEntries[0]?.isDirectory() &&
    distEntries[0]?.name === 'byo-providers',
  'dist must expose only dist/byo-providers/',
);

console.log(
  `manifest parity ok: ${manifest.name}@${manifest.version}, SDK ${sdk.version}`,
);
