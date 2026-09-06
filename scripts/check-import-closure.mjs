import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { createRequire } from 'node:module';

import { findStandaloneBoundaryFailures } from './lib/standalone-boundaries.mjs';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const scriptsRoot = resolve(root, 'scripts');
const sourceRoots = [resolve(root, 'src'), resolve(root, 'tests'), scriptsRoot];
const configFiles = [
  resolve(root, 'vite.main.config.ts'),
  resolve(root, 'vite.renderer.config.ts'),
  resolve(root, 'vitest.config.ts'),
];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const forbiddenPrefixes = [
  '@/',
  '@main/',
  '@shared/',
  '@elftia/shared',
];

async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (sourceExtensions.has(extname(entry.name))) files.push(child);
  }
  return files;
}

function localCandidates(path) {
  return [
    path,
    ...[...sourceExtensions].map((extension) => `${path}${extension}`),
    ...[...sourceExtensions].map((extension) => resolve(path, `index${extension}`)),
  ];
}

const files = [...(await Promise.all(sourceRoots.map(walk))).flat(), ...configFiles];
const failures = [];

for (const file of files) {
  const text = await readFile(file, 'utf8');
  failures.push(
    ...findStandaloneBoundaryFailures(file, text, {
      maintenance: file.startsWith(`${scriptsRoot}\\`) || file.startsWith(`${scriptsRoot}/`),
    }),
  );
  const specifiers = new Set();
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : file.endsWith('.jsx')
        ? ts.ScriptKind.JSX
        : file.endsWith('.ts')
          ? ts.ScriptKind.TS
          : ts.ScriptKind.JS,
  );
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  for (const specifier of specifiers) {
    if (
      forbiddenPrefixes.some((prefix) => specifier.startsWith(prefix)) ||
      /^[A-Za-z]:[\\/]/.test(specifier)
    ) {
      failures.push(`${file}: forbidden host-private specifier ${specifier}`);
      continue;
    }
    if (specifier.startsWith('@byo/')) {
      const local = resolve(root, 'src', specifier.slice('@byo/'.length));
      if (!localCandidates(local).some((candidate) => require('node:fs').existsSync(candidate))) {
        failures.push(`${file}: unresolved local specifier ${specifier}`);
      }
      continue;
    }
    if (specifier.startsWith('.')) {
      const local = resolve(dirname(file), specifier);
      if (!localCandidates(local).some((candidate) => require('node:fs').existsSync(candidate))) {
        failures.push(`${file}: unresolved relative specifier ${specifier}`);
      }
      continue;
    }
    if (specifier.startsWith('node:')) continue;
    try {
      require.resolve(specifier);
    } catch {
      failures.push(`${file}: unresolved registry specifier ${specifier}`);
    }
  }
}

const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
for (const [name, expected] of [
  ['@elftia/plugin-types', '1.25.0'],
  ['@elftia/agent-spec', '1.25.0'],
  ['@omnicross/contracts', '0.4.2'],
]) {
  const entry = lock.packages?.[`node_modules/${name}`];
  if (
    !entry ||
    entry.version !== expected ||
    entry.link ||
    typeof entry.resolved !== 'string' ||
    !entry.resolved.startsWith('https://registry.npmjs.org/')
  ) {
    failures.push(`${name}@${expected} is not registry-backed in package-lock.json`);
  }
}

if (failures.length) {
  throw new Error(`standalone import closure failed:\n${failures.join('\n')}`);
}

console.log(`standalone import closure ok (${files.length} files)`);
