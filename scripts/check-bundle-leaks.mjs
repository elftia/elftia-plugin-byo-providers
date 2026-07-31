import { readFile, readdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'dist/byo-providers');

async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (['.js', '.mjs', '.cjs'].includes(extname(entry.name))) files.push(child);
  }
  return files;
}

const failures = [];
for (const file of await walk(artifact)) {
  const text = await readFile(file, 'utf8');
  const rel = relative(artifact, file);
  const checks = [
    [/(?:from|import\()\s*['"]@(?:shared\/|main\/|elftia\/shared)/, 'host-private import'],
    [/(?:from|import\()\s*['"]@\//, 'host renderer alias'],
    [/(?:from|require\()\s*['"]electron['"]/, 'Electron edge'],
    [/[A-Za-z]:[\\/].*elftia[\\/].*packages[\\/]/i, 'host absolute path'],
  ];
  if (rel.startsWith('renderer')) {
    checks.push([/\bprocess(?:\.|\[)/, 'browser process access']);
    checks.push([
      /ReactCurrentDispatcher|__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED|react\.production\.min/,
      'bundled duplicate React runtime',
    ]);
  }
  for (const [pattern, label] of checks) {
    if (pattern.test(text)) failures.push(`${rel}: ${label}`);
  }
}

if (failures.length) {
  throw new Error(`bundle leak guard failed:\n${failures.join('\n')}`);
}

console.log('bundle leak guard ok');
