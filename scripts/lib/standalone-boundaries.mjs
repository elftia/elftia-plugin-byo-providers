const hostTreeFragments = [
  ['packages', 'renderer', 'src', 'locales'].join('/'),
  ['packages', 'byo-providers'].join('/'),
  ['resources', 'plugins', 'app-extensions', 'byo-providers'].join('/'),
];

const implicitScriptEscape =
  /resolve\s*\(\s*(?:here|import\.meta\.dirname)\s*,\s*['"]\.\.['"]\s*,\s*['"]\.\.['"]/;
const absolutePathLiteral =
  /(?:['"`])(?:[A-Za-z]:[\\/]|\/(?:Users|home|opt|workspace)\/)[^'"`\r\n]*(?:['"`])/;

/**
 * Static maintenance-boundary checks kept separate so the guard can be tested
 * against the old coupling shape without writing a coupled fixture to disk.
 */
export function findStandaloneBoundaryFailures(file, text, { maintenance = false } = {}) {
  const failures = [];
  const normalized = text.replaceAll('\\', '/');

  for (const fragment of hostTreeFragments) {
    if (normalized.includes(fragment)) {
      failures.push(`${file}: implicit host-tree path ${fragment}`);
    }
  }

  if (maintenance && implicitScriptEscape.test(text)) {
    failures.push(`${file}: static path escapes above the standalone project root`);
  }
  if (maintenance && absolutePathLiteral.test(text)) {
    failures.push(`${file}: absolute filesystem path literal is not standalone`);
  }

  return failures;
}
