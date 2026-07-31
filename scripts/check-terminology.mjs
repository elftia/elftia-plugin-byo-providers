import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const legacy = ['renderer', 'extension'].join('-');
const allowedMigrationDocs = new Set([resolve(root, 'README.md')]);
const roots = [
  resolve(root, 'src'),
  resolve(root, 'tests'),
  resolve(root, 'scripts'),
  resolve(root, 'dist'),
];
const topFiles = [
  resolve(root, 'package.json'),
  resolve(root, 'elftia-plugin.json'),
  resolve(root, 'vite.main.config.ts'),
  resolve(root, 'vite.renderer.config.ts'),
];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md']);

async function walk(path) {
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'check-terminology.mjs') continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (extensions.has(extname(entry.name))) files.push(child);
  }
  return files;
}

const failures = [];
for (const file of [...(await Promise.all(roots.map(walk))).flat(), ...topFiles]) {
  if (allowedMigrationDocs.has(file)) continue;
  const text = await readFile(file, 'utf8');
  if (text.includes(legacy)) failures.push(file);
}

if (failures.length) {
  throw new Error(`legacy plugin terminology found:\n${failures.join('\n')}`);
}

console.log('canonical app-extension terminology ok');
