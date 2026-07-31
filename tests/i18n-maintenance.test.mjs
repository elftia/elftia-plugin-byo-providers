import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  localeSourceUsage,
  resolveLocaleSourceDir,
} from '../scripts/lib/locale-source.mjs';
import { findStandaloneBoundaryFailures } from '../scripts/lib/standalone-boundaries.mjs';

describe('standalone i18n maintenance boundaries', () => {
  it('requires a caller-supplied locale export with no implicit fallback', () => {
    expect(() =>
      resolveLocaleSourceDir([], {
        command: 'node scripts/harvest-i18n.mjs',
        isDirectory: vi.fn(),
      }),
    ).toThrow(localeSourceUsage('node scripts/harvest-i18n.mjs'));
  });

  it('resolves only the explicitly supplied directory', () => {
    const isDirectory = vi.fn(() => true);
    const cwd = resolve('standalone-project');

    expect(
      resolveLocaleSourceDir(['--locales-dir', 'locale-export'], {
        cwd,
        isDirectory,
      }),
    ).toBe(resolve(cwd, 'locale-export'));
    expect(isDirectory).toHaveBeenCalledExactlyOnceWith(resolve(cwd, 'locale-export'));
  });

  it('detects the former parent-checkout locale lookup shape', () => {
    const hostPath = ['packages', 'renderer', 'src', 'locales'].join('/');
    const oldCoupling = [
      "const repoRoot = resolve(here, '..', '..', '..');",
      `const localesDir = resolve(repoRoot, '${hostPath}');`,
    ].join('\n');

    expect(
      findStandaloneBoundaryFailures('scripts/harvest-i18n.mjs', oldCoupling, {
        maintenance: true,
      }),
    ).toEqual([
      expect.stringContaining('implicit host-tree path'),
      expect.stringContaining('escapes above the standalone project root'),
    ]);
  });
});
