/**
 * MigrationPackDialogs — the encrypted credential migration-pack export/import
 * bar + dialogs. A CROSS-PAGE primitive (`secrets-pack-media-search`): mounted on
 * the LLM, the 5 media, and the search settings pages — one pack migrates ALL
 * domains (LLM + pool + tokens + media + search). Relocated from `llm/` to a
 * neutral `shared/` dir so `media/` and `search/` don't reach INTO the `llm/`
 * feature dir; its relative imports (`../host/*`, `../secretsPackClient`) stay
 * valid at the same depth.
 *
 * COPIED originally from the host
 * `features/settings/components/provider-settings/llm/MigrationPackDialogs.tsx`
 * (P2b-2 `byo-p2-llm-2`), rewired to the plugin bridge:
 *   - `@/components/ui/{button,input}` → `../host/ui`
 *   - `@/shared/ipc/secretsPack` → `../secretsPackClient` (the `secretsPack.*`
 *     relay → `host.services.secretsPack`, host-API 1.27, `host:secrets-pack`)
 *   - `@/shared/state/LocaleContext` → `../host/vendored/useTranslation`
 *   - `@elftia/shared/contracts/api/secretsPack` constants are VENDORED locally
 *     (two trivial literals — avoids dragging the shared contract module's zod
 *     into the plugin renderer bundle); the `SecretsPackImportCounts` shape is a
 *     type-only import (erased at build, resolved via the `@elftia/shared` alias
 *     for tsc only).
 *
 * PASSPHRASE-IN, COUNTS/PATH/STATUS-OUT: the renderer passes ONLY the passphrase
 * to `secretsPackClient`; the host runs the native save/open dialog + ALL crypto +
 * the file I/O + ingest entirely main-side and returns counts/path/status only.
 * The encrypted `.epack` blob and the plaintext secrets NEVER cross to the plugin.
 *
 * @module byo-providers/renderer/shared/MigrationPackDialogs
 */
import type { SecretsPackImportCounts } from '@byo/domain/secrets-pack';
import { Download, KeyRound, Loader2, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button, Input } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';
import { secretsPackClient } from '../secretsPackClient';

// Vendored from `@elftia/shared/contracts/api/secretsPack` (design D6): the two
// passphrase-length literals. The host re-checks min-length AUTHORITATIVELY in the
// main process (`assertPassphraseStrength`) — these only drive the renderer hint/
// gate. Kept in sync with the SSOT by value (8 / 12).
const MIN_PASSPHRASE_LENGTH = 8;
const RECOMMENDED_PASSPHRASE_LENGTH = 12;

type StrengthLevel = 'weak' | 'fair' | 'strong';

function passphraseStrength(value: string): StrengthLevel {
  if (value.length < MIN_PASSPHRASE_LENGTH) return 'weak';
  if (value.length < RECOMMENDED_PASSPHRASE_LENGTH) return 'fair';
  return 'strong';
}

function useEscClose(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

// ---------------------------------------------------------------------------
// Export dialog
// ---------------------------------------------------------------------------

function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement | null {
  const t = useTranslation();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const close = () => {
    setPassphrase('');
    setConfirm('');
    setStatus(null);
    setBusy(false);
    onClose();
  };
  useEscClose(open, close);

  if (!open) return null;

  const strength = passphraseStrength(passphrase);
  const meetsMin = passphrase.length >= MIN_PASSPHRASE_LENGTH;
  const matches = passphrase.length > 0 && passphrase === confirm;
  const canSubmit = meetsMin && matches && !busy;

  const handleExport = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await secretsPackClient.export({ passphrase });
      if (res.success) {
        setStatus({ kind: 'success', text: t('providerSettings.migrationPack.export.success') });
      } else if (res.canceled) {
        setStatus(null);
      } else {
        setStatus({ kind: 'error', text: t('providerSettings.migrationPack.export.error') });
      }
    } catch {
      setStatus({ kind: 'error', text: t('providerSettings.migrationPack.export.error') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-background border rounded-lg shadow-xl w-full max-w-md wallpaper-solid"
        data-testid="dialog-migration-pack-export"
      >
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{t('providerSettings.migrationPack.export.title')}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('providerSettings.migrationPack.export.subtitle')}
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div
            className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground"
            role="alert"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-warning mt-0.5" aria-hidden="true" />
            <span>{t('providerSettings.migrationPack.export.warning')}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="migration-pack-passphrase">
              {t('providerSettings.migrationPack.passphrase')}
            </label>
            <Input
              id="migration-pack-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={t('providerSettings.migrationPack.passphrasePlaceholder')}
              data-testid="dialog-migration-pack-export-passphrase"
            />
            {passphrase.length > 0 ? (
              <p
                className={
                  strength === 'strong'
                    ? 'text-xs text-success'
                    : strength === 'fair'
                      ? 'text-xs text-warning'
                      : 'text-xs text-destructive'
                }
              >
                {t(`providerSettings.migrationPack.strength.${strength}`)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('providerSettings.migrationPack.passphraseHint')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="migration-pack-confirm">
              {t('providerSettings.migrationPack.confirm')}
            </label>
            <Input
              id="migration-pack-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('providerSettings.migrationPack.confirmPlaceholder')}
              data-testid="dialog-migration-pack-export-confirm"
            />
            {confirm.length > 0 && !matches ? (
              <p className="text-xs text-destructive">
                {t('providerSettings.migrationPack.mismatch')}
              </p>
            ) : null}
          </div>

          {status ? (
            <p
              className={status.kind === 'success' ? 'text-xs text-success' : 'text-xs text-destructive'}
              role="status"
            >
              {status.text}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-muted/30">
          <Button type="button" variant="ghost" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleExport()}
            disabled={!canSubmit}
            data-testid="dialog-migration-pack-export-submit"
          >
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            {t('providerSettings.migrationPack.export.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import dialog
// ---------------------------------------------------------------------------

function ImportSummary({ counts }: { counts: SecretsPackImportCounts }): React.ReactElement {
  const t = useTranslation();
  return (
    <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs space-y-1" role="status">
      <p className="text-foreground font-medium">{t('providerSettings.migrationPack.import.successTitle')}</p>
      <p className="text-muted-foreground">
        {t('providerSettings.migrationPack.import.summary', {
          providerKeys: counts.providerKeys,
          poolKeys: counts.poolKeys,
          tokenSets: counts.tokenSets,
        })}
      </p>
      {counts.mediaKeys + counts.searchKeys > 0 ? (
        <p className="text-muted-foreground">
          {t('providerSettings.migrationPack.import.summaryExtra', {
            mediaKeys: counts.mediaKeys,
            searchKeys: counts.searchKeys,
          })}
        </p>
      ) : null}
      {counts.duplicatePoolKeys > 0 ? (
        <p className="text-muted-foreground">
          {t('providerSettings.migrationPack.import.duplicates', { count: counts.duplicatePoolKeys })}
        </p>
      ) : null}
      {counts.skipped.length > 0 ? (
        <p className="text-muted-foreground">
          {t('providerSettings.migrationPack.import.skipped', { names: counts.skipped.join(', ') })}
        </p>
      ) : null}
    </div>
  );
}

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement | null {
  const t = useTranslation();
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<SecretsPackImportCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setPassphrase('');
    setCounts(null);
    setError(null);
    setBusy(false);
    onClose();
  };
  useEscClose(open, close);

  if (!open) return null;

  const canSubmit = passphrase.length > 0 && !busy;

  const handleImport = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setCounts(null);
    try {
      const res = await secretsPackClient.import({ passphrase });
      if (res.success && res.imported) {
        setCounts(res.imported);
      } else if (res.canceled) {
        // User dismissed the open dialog — no-op.
      } else {
        setError(t('providerSettings.migrationPack.import.error'));
      }
    } catch {
      setError(t('providerSettings.migrationPack.import.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-background border rounded-lg shadow-xl w-full max-w-md wallpaper-solid"
        data-testid="dialog-migration-pack-import"
      >
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{t('providerSettings.migrationPack.import.title')}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('providerSettings.migrationPack.import.subtitle')}
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="migration-pack-import-passphrase">
              {t('providerSettings.migrationPack.passphrase')}
            </label>
            <Input
              id="migration-pack-import-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={t('providerSettings.migrationPack.passphrasePlaceholder')}
              data-testid="dialog-migration-pack-import-passphrase"
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.migrationPack.import.hint')}
            </p>
          </div>

          {counts ? <ImportSummary counts={counts} /> : null}
          {error ? (
            <p className="text-xs text-destructive" role="status">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-muted/30">
          <Button type="button" variant="ghost" onClick={close}>
            {counts ? t('common.close') : t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={!canSubmit}
            data-testid="dialog-migration-pack-import-submit"
          >
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            {t('providerSettings.migrationPack.import.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trigger bar (hung off the provider settings header)
// ---------------------------------------------------------------------------

export function MigrationPackDialogs(): React.ReactElement {
  const t = useTranslation();
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-b border-border/50"
      data-testid="settings-migration-pack-bar"
    >
      <span className="text-xs text-muted-foreground flex-1 min-w-0">
        {t('providerSettings.migrationPack.barHint')}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setExportOpen(true)}
        data-testid="settings-migration-pack-export-btn"
      >
        <Download className="h-4 w-4 mr-1" />
        {t('providerSettings.migrationPack.export.button')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setImportOpen(true)}
        data-testid="settings-migration-pack-import-btn"
      >
        <Upload className="h-4 w-4 mr-1" />
        {t('providerSettings.migrationPack.import.button')}
      </Button>

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
