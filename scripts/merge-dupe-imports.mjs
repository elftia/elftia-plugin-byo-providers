/**
 * merge-dupe-imports.mjs — one-shot codemod: merge duplicate
 * `import { ... } from '<same path>'` lines (created by the UI-import rewrite
 * collapsing several `@/components/ui/*` modules onto `../host/ui`) into a single
 * import per module, preserving order of first appearance. Type-only imports are
 * kept type-only only if EVERY merged line was type-only.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const IMPORT_RE = /^import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)';\s*$/;

for (const file of walk(root)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  // Group named imports by module path.
  const groups = new Map(); // path -> { firstIdx, names:Set, allType:bool }
  const dropIdx = new Set();
  lines.forEach((line, idx) => {
    const m = IMPORT_RE.exec(line);
    if (!m) return;
    const [, typeKw, body, path] = m;
    const names = body
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!groups.has(path)) {
      groups.set(path, { firstIdx: idx, names: [], allType: true, seen: new Set() });
    }
    const g = groups.get(path);
    if (g.firstIdx !== idx) dropIdx.add(idx);
    for (const n of names) {
      if (!g.seen.has(n)) {
        g.seen.add(n);
        g.names.push(n);
      }
    }
    if (!typeKw) g.allType = false;
  });

  let changed = false;
  // Rewrite the first line of each multi-line group.
  for (const [path, g] of groups) {
    const occurrences = [...lines.keys()].filter((i) => {
      const m = IMPORT_RE.exec(lines[i]);
      return m && m[3] === path;
    });
    if (occurrences.length <= 1) continue;
    changed = true;
    const kw = g.allType ? 'type ' : '';
    lines[g.firstIdx] = `import ${kw}{ ${g.names.join(', ')} } from '${path}';`;
  }
  if (!changed) continue;
  const next = lines.filter((_, idx) => !dropIdx.has(idx)).join('\n');
  writeFileSync(file, next, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`merged: ${file}`);
}
