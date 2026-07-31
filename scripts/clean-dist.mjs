import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

if (dist === root || !dist.startsWith(`${root}\\`) && !dist.startsWith(`${root}/`)) {
  throw new Error(`Refusing to clean unexpected path: ${dist}`);
}

await rm(dist, { recursive: true, force: true });
