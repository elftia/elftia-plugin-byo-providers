/**
 * AccountList.tsx - Multi-account list for a subscription provider (Claude-first).
 *
 * Renders each account with its label + status badge + expiry, plus set-active
 * and remove controls. Extracted from ClaudeConfigCard to keep that file under
 * the 800-line tsx cap (subscription-multi-account D9).
 */

import { AlertTriangle, Check, ChevronDown, ChevronRight, HardDriveDownload, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '../host/ui';
import { Input } from '../host/ui';
import { cn } from '../host/vendored/cn';

import { StatusBadge } from './StatusBadge';
import type { SubscriptionAccountSanitized, TranslationFn } from './types';

export interface AccountListProps {
  t: TranslationFn;
  accounts: SubscriptionAccountSanitized[];
  onSetActive: (id: string) => Promise<{ success: boolean; error?: string }>;
  onApplyToCli?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateLabel?: (id: string, label: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (id: string) => Promise<{ success: boolean; error?: string }>;
  /**
   * Manual token refresh for the ACTIVE account (the backend refresh runners
   * only operate on the active account; non-active rows must be set active
   * first). Shown on the active row only when its token is already expired —
   * the auto-refresh path can be missed entirely when Elftia wasn't running
   * before expiry.
   */
  onRefreshActive?: () => Promise<boolean>;
  /** Whether the active account holds a refresh token (top-level mirror). */
  activeCanRefresh?: boolean;
}

export const AccountList = ({
  t,
  accounts,
  onSetActive,
  onApplyToCli,
  onUpdateLabel,
  onRemove,
  onRefreshActive,
  activeCanRefresh,
}: AccountListProps) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftLabels, setDraftLabels] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const handleSetActive = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await onSetActive(id);
      } finally {
        setBusyId(null);
      }
    },
    [onSetActive],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await onRemove(id);
      } finally {
        setBusyId(null);
      }
    },
    [onRemove],
  );

  const handleApplyToCli = useCallback(
    async (id: string) => {
      if (!onApplyToCli) return;
      setBusyId(id);
      setNotice(null);
      try {
        const result = await onApplyToCli(id);
        setNotice({
          kind: result.success ? 'success' : 'error',
          text: result.success
            ? t('settings.accountTokens.accounts.applyToCliSuccess')
            : result.error ?? t('settings.accountTokens.accounts.applyToCliFailed'),
        });
      } catch (error) {
        setNotice({
          kind: 'error',
          text:
            error instanceof Error
              ? error.message
              : t('settings.accountTokens.accounts.applyToCliFailed'),
        });
      } finally {
        setBusyId(null);
      }
    },
    [onApplyToCli, t],
  );

  const handleRefreshActive = useCallback(
    async (id: string) => {
      if (!onRefreshActive) return;
      setBusyId(id);
      setNotice(null);
      try {
        const success = await onRefreshActive();
        if (!success) {
          setNotice({
            kind: 'error',
            text: t('settings.accountTokens.errors.refreshFailed'),
          });
        }
      } catch (error) {
        setNotice({
          kind: 'error',
          text:
            error instanceof Error
              ? error.message
              : t('settings.accountTokens.errors.refreshFailed'),
        });
      } finally {
        setBusyId(null);
      }
    },
    [onRefreshActive, t],
  );

  const handleSaveLabel = useCallback(
    async (account: SubscriptionAccountSanitized) => {
      if (!onUpdateLabel) return;
      const nextLabel = (draftLabels[account.id] ?? account.label ?? '').trim();
      const currentLabel = (account.label ?? '').trim();
      if (nextLabel === currentLabel) return;

      setBusyId(account.id);
      setNotice(null);
      try {
        const result = await onUpdateLabel(account.id, nextLabel);
        if (!result.success) {
          setNotice({
            kind: 'error',
            text: result.error ?? t('settings.accountTokens.accounts.updateLabelFailed'),
          });
        }
      } catch (error) {
        setNotice({
          kind: 'error',
          text:
            error instanceof Error
              ? error.message
              : t('settings.accountTokens.accounts.updateLabelFailed'),
        });
      } finally {
        setBusyId(null);
      }
    },
    [draftLabels, onUpdateLabel, t],
  );

  if (accounts.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="settings-account-list">
      <div className="text-sm font-medium text-foreground">
        {t('settings.accountTokens.accounts.title')}
      </div>
      <ul className="space-y-2">
        {accounts.map((account) => {
          const expiresAt = account.expiresAt ? new Date(account.expiresAt) : null;
          const lastRefreshedAt = account.lastRefreshedAt
            ? new Date(account.lastRefreshedAt)
            : null;
          const isBusy = busyId === account.id;
          const isExpanded = expandedId === account.id;
          const draftLabel = draftLabels[account.id] ?? account.label ?? '';
          const displayLabel = (account.label ?? '').trim() || account.id;
          // Expired = flagged by a failed refresh OR past its expiry time
          // (status stays 'authorized' when the auto-refresh window was missed
          // entirely, e.g. Elftia wasn't running before the token expired).
          const isRowExpired =
            account.status === 'expired' ||
            (expiresAt ? expiresAt.getTime() < Date.now() : false);
          const showRefresh = Boolean(
            account.isActive && isRowExpired && activeCanRefresh && onRefreshActive,
          );
          return (
            <li
              key={account.id}
              data-testid="settings-account-item"
              data-account-id={account.id}
              data-account-active={account.isActive ? 'true' : 'false'}
              className={cn(
                'rounded-md border px-3 py-2',
                account.isActive
                  ? 'border-primary/40 bg-surface-2/60'
                  : 'border-border/50 bg-surface-1/50',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : account.id)}
                  aria-expanded={isExpanded}
                  data-testid="settings-account-expand-btn"
                  data-account-id={account.id}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {displayLabel}
                  </span>
                  <StatusBadge status={account.status} t={t} />
                  {account.isActive ? (
                    <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                      {t('settings.accountTokens.accounts.active')}
                    </span>
                  ) : null}
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  {showRefresh ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleRefreshActive(account.id)}
                      data-testid="settings-account-refresh-btn"
                      data-account-id={account.id}
                      title={t('settings.accountTokens.actions.refresh')}
                    >
                      <RefreshCw className={cn('mr-1 h-3.5 w-3.5', isBusy && 'animate-spin')} />
                      {t('settings.accountTokens.actions.refresh')}
                    </Button>
                  ) : null}
                  {!account.isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleSetActive(account.id)}
                      data-testid="settings-account-set-active-btn"
                      data-account-id={account.id}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      {t('settings.accountTokens.accounts.setActive')}
                    </Button>
                  ) : null}
                  {onApplyToCli ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleApplyToCli(account.id)}
                      data-testid="settings-account-apply-cli-btn"
                      data-account-id={account.id}
                      title={t('settings.accountTokens.accounts.applyToCliTooltip')}
                    >
                      <HardDriveDownload className="mr-1 h-3.5 w-3.5" />
                      {t('settings.accountTokens.accounts.applyToCli')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleRemove(account.id)}
                    className="text-destructive hover:text-destructive"
                    data-testid="settings-account-remove-btn"
                    data-account-id={account.id}
                    aria-label={t('settings.accountTokens.accounts.remove')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {account.syncWarning === 'duplicate-token' ? (
                <p
                  className="mt-1.5 flex items-start gap-1.5 text-xs text-warning"
                  data-testid="settings-account-sync-warning"
                  data-account-id={account.id}
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t('settings.accountTokens.accounts.duplicateTokenWarning')}</span>
                </p>
              ) : null}
              {isExpanded ? (
                <div className="mt-2 space-y-2 border-t border-border/40 pt-2">
                  {onUpdateLabel ? (
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`account-label-${account.id}`}
                        className="text-xs font-medium text-text-muted"
                      >
                        {t('settings.accountTokens.accounts.labelInput')}
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`account-label-${account.id}`}
                          value={draftLabel}
                          onChange={(event) =>
                            setDraftLabels((previous) => ({
                              ...previous,
                              [account.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void handleSaveLabel(account);
                            }
                          }}
                          placeholder={t('settings.accountTokens.accounts.labelPlaceholder')}
                          disabled={isBusy}
                          data-testid="settings-account-row-label-input"
                          data-account-id={account.id}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy || draftLabel.trim() === (account.label ?? '').trim()}
                          onClick={() => void handleSaveLabel(account)}
                          data-testid="settings-account-row-label-save-btn"
                          data-account-id={account.id}
                          aria-label={t('settings.accountTokens.accounts.saveLabel')}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">
                  {account.authMethod ? (
                    <div className="flex justify-between gap-3">
                      <span>{t('settings.accountTokens.authMethod.label')}</span>
                      <span className="text-foreground">
                        {t(`settings.accountTokens.authMethod.${account.authMethod}.label`)}
                      </span>
                    </div>
                  ) : null}
                  {account.subscriptionLevel ? (
                    <div className="flex justify-between gap-3">
                      <span>{t('settings.accountTokens.subscriptionLevel.label')}</span>
                      <span className="text-foreground">{account.subscriptionLevel}</span>
                    </div>
                  ) : null}
                  {expiresAt ? (
                    <div className="flex justify-between gap-3">
                      <span>{t('settings.accountTokens.expiresAt')}</span>
                      <span className="text-foreground">{expiresAt.toLocaleString()}</span>
                    </div>
                  ) : null}
                  {lastRefreshedAt ? (
                    <div className="flex justify-between gap-3">
                      <span>{t('settings.accountTokens.lastRefreshed')}</span>
                      <span className="text-foreground">{lastRefreshedAt.toLocaleString()}</span>
                    </div>
                  ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {notice ? (
        <p
          className={cn(
            'text-xs',
            notice.kind === 'error' ? 'text-destructive' : 'text-text-muted',
          )}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
};
