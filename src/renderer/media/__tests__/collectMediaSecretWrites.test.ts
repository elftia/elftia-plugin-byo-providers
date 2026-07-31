/**
 * Tests for `collectMediaSecretWrites` (change `byo-media-key-display-restore`,
 * Fix 1 — the data-loss guard SSOT shared by all 5 media panels'
 * `flushCredentialSave`).
 *
 * The just-shipped hardening masked the key out of the renderer read, so the
 * apiKey field reached the panel EMPTY; the old code pushed it UNCONDITIONALLY
 * to `setProviderKey`, where empty → deleteSecret. Net: editing any field wiped
 * the stored key. This helper SKIPS empty secret fields entirely, so an empty
 * apiKey can never trigger a delete; only non-empty secrets are written.
 */

import { describe, expect, it } from 'vitest';

import { collectMediaSecretWrites } from '../utils';

const FIELDS = [
  { key: 'apiKey', secret: true },
  { key: 'endpoint', secret: false },
];

describe('collectMediaSecretWrites — empty secret never reaches setProviderKey', () => {
  it('SKIPS an empty secret field (no secretWrites entry → no setProviderKey call)', () => {
    const { secretWrites, nonSecret } = collectMediaSecretWrites(FIELDS, {
      apiKey: '',
      endpoint: 'https://api.example.com',
    });
    expect(secretWrites).toEqual([]);
    expect(nonSecret).toEqual({ endpoint: 'https://api.example.com' });
  });

  it('SKIPS a whitespace-only secret field', () => {
    const { secretWrites } = collectMediaSecretWrites(FIELDS, {
      apiKey: '   ',
      endpoint: '',
    });
    expect(secretWrites).toEqual([]);
  });

  it('writes a NON-EMPTY secret field (trimmed)', () => {
    const { secretWrites, nonSecret } = collectMediaSecretWrites(FIELDS, {
      apiKey: '  sk-real-key  ',
      endpoint: 'https://api.example.com',
    });
    expect(secretWrites).toEqual([{ key: 'apiKey', value: 'sk-real-key' }]);
    expect(nonSecret).toEqual({ endpoint: 'https://api.example.com' });
  });

  it('REGRESSION: editing a non-secret field while the key is at its pre-filled value does NOT delete the key', () => {
    // The key field is pre-filled with the real (un-masked) key; the user only
    // edits a non-secret field. The flush must NOT clear the key: a non-empty
    // secret value re-writes the SAME key (idempotent), never an empty delete.
    const { secretWrites } = collectMediaSecretWrites(FIELDS, {
      apiKey: 'sk-prefilled-key', // unchanged pre-filled value
      endpoint: 'https://changed.example.com', // the edited non-secret field
    });
    // A write occurs but it is the SAME key (no delete) — the stored key survives.
    expect(secretWrites).toEqual([{ key: 'apiKey', value: 'sk-prefilled-key' }]);
    // Crucially, no empty value is ever produced for the secret.
    expect(secretWrites.some((w) => w.value === '')).toBe(false);
  });

  it('handles multiple secret fields, skipping only the empty ones', () => {
    const fields = [
      { key: 'apiKey', secret: true },
      { key: 'byteplusAk', secret: true },
      { key: 'byteplusSk', secret: true },
      { key: 'endpoint', secret: false },
    ];
    const { secretWrites, nonSecret } = collectMediaSecretWrites(fields, {
      apiKey: 'sk-x',
      byteplusAk: '',
      byteplusSk: 'sk-sk',
      endpoint: 'https://e',
    });
    expect(secretWrites).toEqual([
      { key: 'apiKey', value: 'sk-x' },
      { key: 'byteplusSk', value: 'sk-sk' },
    ]);
    expect(nonSecret).toEqual({ endpoint: 'https://e' });
  });

  it('treats a missing source value as empty (skipped)', () => {
    const { secretWrites, nonSecret } = collectMediaSecretWrites(FIELDS, {});
    expect(secretWrites).toEqual([]);
    expect(nonSecret).toEqual({ endpoint: '' });
  });
});
