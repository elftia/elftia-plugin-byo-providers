import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootUrl = new URL('..', import.meta.url);
const root = fileURLToPath(rootUrl);
const node = process.execPath;

function runNode(script, args = []) {
  const result = spawnSync(node, [fileURLToPath(new URL(script, rootUrl)), ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    if (result.error) console.error(result.error);
    process.exit(result.status ?? 1);
  }
}

runNode('scripts/clean-dist.mjs');
runNode('node_modules/vite/bin/vite.js', ['build', '--config', 'vite.renderer.config.ts']);
runNode('node_modules/vite/bin/vite.js', ['build', '--config', 'vite.main.config.ts']);

for (const script of [
  'copy-manifest.mjs',
  'check-manifest.mjs',
  'check-permissions.mjs',
  'check-bundle-leaks.mjs',
  'check-terminology.mjs',
]) {
  runNode(`scripts/${script}`);
}
