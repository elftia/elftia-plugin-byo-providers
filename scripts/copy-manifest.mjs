import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputRoot = resolve(root, 'dist/byo-providers');

await mkdir(outputRoot, { recursive: true });
await copyFile(
  resolve(root, 'elftia-plugin.json'),
  resolve(outputRoot, 'elftia-plugin.json'),
);
