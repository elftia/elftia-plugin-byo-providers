import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'dist/byo-providers');

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

const files = [];
for (const file of (await walk(artifact)).sort()) {
  const bytes = await readFile(file);
  files.push({
    path: relative(artifact, file).replaceAll('\\', '/'),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

console.log(JSON.stringify({ artifact: 'dist/byo-providers/', files }, null, 2));
