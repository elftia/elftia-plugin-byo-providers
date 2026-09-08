import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'elftia-plugin.json'), 'utf8'));
const main = await readFile(resolve(root, 'dist/byo-providers/main/index.cjs'), 'utf8');
const serviceToPermission = new Map([
  ['llmConfig', 'host:llm-config'],
  ['mediaConfig', 'host:media-config'],
  ['searchConfig', 'host:search-config'],
  ['objectStorageConfig', 'host:object-storage-config'],
  ['subscriptionAuth', 'host:subscription-auth'],
  ['agentConfig', 'host:agent-config'],
  ['cliRuntime', 'host:cli-runtime'],
  ['secretsPack', 'host:secrets-pack'],
  ['externalLinks', 'host:external-links'],
  ['secretsWrite', 'host:secrets-write'],
]);

const detectedServices = new Set(
  [...main.matchAll(/services\.([A-Za-z0-9_$]+)/g)].map((match) => match[1]),
);
const unknown = [...detectedServices].filter((service) => !serviceToPermission.has(service));
const detectedPermissions = new Set(
  [...detectedServices]
    .map((service) => serviceToPermission.get(service))
    .filter(Boolean),
);
const declared = new Set(manifest.permissions);
const undeclared = [...detectedPermissions].filter((permission) => !declared.has(permission));
const undetected = [...declared].filter((permission) => !detectedPermissions.has(permission));

if (
  unknown.length ||
  undeclared.length ||
  undetected.length ||
  detectedServices.has('secretsWrite') ||
  declared.has('host:secrets-write')
) {
  throw new Error(
    JSON.stringify({ unknown, undeclared, undetected, detectedServices: [...detectedServices] }),
  );
}

console.log(`permission audit ok: ${[...detectedPermissions].sort().join(', ')}`);
