import { statSync } from 'node:fs';
import { resolve } from 'node:path';

export const LOCALES_DIR_FLAG = '--locales-dir';

export function localeSourceUsage(command) {
  return `${command} ${LOCALES_DIR_FLAG} <standalone-locale-export-directory>`;
}

/**
 * Resolve a caller-owned locale export directory.
 *
 * There is deliberately no inferred checkout-relative fallback. Maintenance
 * callers must choose the input explicitly, so a standalone clone never probes
 * parent or sibling repositories.
 */
export function resolveLocaleSourceDir(
  args,
  {
    cwd = process.cwd(),
    command = 'node <harvester>',
    isDirectory = (path) => statSync(path).isDirectory(),
  } = {},
) {
  const flagIndex = args.indexOf(LOCALES_DIR_FLAG);
  const value = flagIndex >= 0 ? args[flagIndex + 1] : undefined;
  const hasUnknownArgs = args.some(
    (arg, index) => index !== flagIndex && index !== flagIndex + 1,
  );

  if (
    flagIndex < 0 ||
    !value ||
    value.startsWith('-') ||
    hasUnknownArgs ||
    args.indexOf(LOCALES_DIR_FLAG, flagIndex + 1) >= 0
  ) {
    throw new Error(
      `A standalone locale export is required.\nUsage: ${localeSourceUsage(command)}`,
    );
  }

  const directory = resolve(cwd, value);
  if (!isDirectory(directory)) {
    throw new Error(`Locale export directory does not exist: ${directory}`);
  }
  return directory;
}
