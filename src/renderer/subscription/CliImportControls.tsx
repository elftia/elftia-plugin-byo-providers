/**
 * CliImportControls.tsx - CLI credential re-import affordances (cli-token-import).
 *
 * Shared by ClaudeConfigCard / CodexConfigCard. Renders:
 *  - an "auto-import on refresh failure" Switch (the recovery for the rotating
 *    refresh-token race: the external CLI refreshed and rotated OUR refresh
 *    token out, so Elftia's own refresh now fails — read the live credential
 *    back from the CLI login file instead);
 *  - a controlled confirm dialog that performs a one-shot manual import.
 *
 * Only meaningful when the external store is Elftia-managed AND its marker
 * lineage matches the active account (`importAvailable`); the parent gates on
 * that flag (backend re-verifies — never imports a different account's tokens).
 */

import { useCallback, useState } from 'react';

import { ConfirmDialog } from '../host/ui';
import { Switch } from '../host/ui';
import { cn } from '../host/vendored/cn';

import type { CliImportResult, TranslationFn } from './types';

interface CliImportControlsProps {
  t: TranslationFn;
  /** Managed + marker lineage matches the active account. */
  importAvailable: boolean;
  autoImportEnabled: boolean;
  onSetAutoImport: (enabled: boolean) => Promise<void>;
  onImportFromCli: () => Promise<CliImportResult>;
  /** Confirm-dialog open state (the parent opens it on a refresh failure). */
  dialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  switchId: string;
}

/** Map a backend import failure reason to a localized message. */
function importErrorMessage(t: TranslationFn, reason?: string): string {
  switch (reason) {
    case 'not-rotated':
      return t('settings.accountTokens.cliImport.notRotated');
    case 'lineage-mismatch':
      return t('settings.accountTokens.cliImport.lineageMismatch');
    default:
      return t('settings.accountTokens.cliImport.importFailed');
  }
}

export const CliImportControls = ({
  t,
  importAvailable,
  autoImportEnabled,
  onSetAutoImport,
  onImportFromCli,
  dialogOpen,
  onDialogOpenChange,
  switchId,
}: CliImportControlsProps) => {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );

  const handleToggle = useCallback(
    async (next: boolean) => {
      setNotice(null);
      try {
        await onSetAutoImport(next);
      } catch (error) {
        setNotice({
          kind: 'error',
          text:
            error instanceof Error
              ? error.message
              : t('settings.accountTokens.cliImport.importFailed'),
        });
      }
    },
    [onSetAutoImport, t],
  );

  const handleImport = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await onImportFromCli();
      if (result.success) {
        setNotice({
          kind: 'success',
          text: result.refreshed
            ? t('settings.accountTokens.cliImport.importRefreshed')
            : t('settings.accountTokens.cliImport.importSuccess'),
        });
      } else {
        setNotice({ kind: 'error', text: importErrorMessage(t, result.error) });
      }
    } catch (error) {
      setNotice({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : t('settings.accountTokens.cliImport.importFailed'),
      });
    } finally {
      setBusy(false);
    }
  }, [onImportFromCli, t]);

  if (!importAvailable) return null;

  return (
    <div className="space-y-2" data-testid="settings-cli-import-controls">
      <div className="flex items-start justify-between gap-3 rounded-md bg-surface-2/40 px-3 py-2">
        <label htmlFor={switchId} className="min-w-0 flex-1">
          <span className="block text-sm text-foreground">
            {t('settings.accountTokens.cliImport.autoImportLabel')}
          </span>
          <span className="mt-0.5 block text-xs text-text-muted">
            {t('settings.accountTokens.cliImport.autoImportDesc')}
          </span>
        </label>
        <Switch
          id={switchId}
          checked={autoImportEnabled}
          onCheckedChange={(next) => void handleToggle(next)}
          data-testid="settings-cli-auto-import-switch"
        />
      </div>

      {notice ? (
        <p
          className={cn(
            'text-xs',
            notice.kind === 'error' ? 'text-destructive' : 'text-text-muted',
          )}
          aria-live="polite"
        >
          {notice.text}
        </p>
      ) : null}

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={onDialogOpenChange}
        title={t('settings.accountTokens.cliImport.dialogTitle')}
        description={t('settings.accountTokens.cliImport.dialogDescription')}
        confirmLabel={t('settings.accountTokens.cliImport.importConfirm')}
        variant="default"
        onConfirm={() => {
          if (busy) return;
          void handleImport();
        }}
      />
    </div>
  );
};
