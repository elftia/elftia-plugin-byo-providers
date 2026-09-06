/**
 * OpenCodeGoConfigCard.tsx - OpenCodeGo (static-bearer) account card.
 *
 * NEW in code-cli-account-switching. OpenCodeGo uses a static API key (no
 * OAuth), so "add account" is a FORM (required apiKey + optional label /
 * baseUrl / zenBaseUrl) rather than a login button. Renders the multi-account
 * `AccountList` for set-active / remove. Set-active is internal-pointer-only —
 * OpenCodeGo has no external CLI native store, so NO external write occurs.
 */

import { AlertTriangle, KeyRound, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '../host/ui';
import { Input } from '../host/ui';

import { AccountList } from './AccountList';
import { StatusBadge } from './StatusBadge';
import type { AccountMutationResult, OpenCodeGoConfigCardProps } from './types';

export const OpenCodeGoConfigCard = ({
  t,
  config,
  accounts,
  onAddAccount,
  onSetActiveAccount,
  onUpdateAccountLabel,
  onRemoveAccount,
}: OpenCodeGoConfigCardProps) => {
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [zenBaseUrl, setZenBaseUrl] = useState('');

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAccounts = Boolean(accounts && accounts.length > 0);

  const resetAddForm = useCallback(() => {
    setApiKey('');
    setLabel('');
    setBaseUrl('');
    setZenBaseUrl('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!apiKey.trim()) {
      setError(t('settings.accountTokens.openCodeGo.apiKeyRequired'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onAddAccount({
        apiKey: apiKey.trim(),
        label: label.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        zenBaseUrl: zenBaseUrl.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error ?? t('settings.accountTokens.openCodeGo.addFailed'));
        return;
      }
      resetAddForm();
      setIsAddFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.accountTokens.openCodeGo.addFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [apiKey, label, baseUrl, zenBaseUrl, onAddAccount, resetAddForm, t]);

  const handleCancelAdd = useCallback(() => {
    resetAddForm();
    setError(null);
    setIsAddFormOpen(false);
  }, [resetAddForm]);

  const handleSetActive = useCallback(
    (id: string): Promise<AccountMutationResult> => onSetActiveAccount(id),
    [onSetActiveAccount],
  );
  const handleRemove = useCallback(
    (id: string): Promise<AccountMutationResult> => onRemoveAccount(id),
    [onRemoveAccount],
  );

  return (
    <div className="rounded-lg border border-border bg-surface-1/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
            <KeyRound className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {t('settings.accountTokens.openCodeGo.title')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('settings.accountTokens.openCodeGo.description')}
            </p>
          </div>
        </div>
        <StatusBadge status={config?.status} t={t} />
      </div>

      {/* Active-account host display (non-secret baseUrl / zenBaseUrl). */}
      {config?.baseUrl || config?.zenBaseUrl ? (
        <div className="space-y-1 text-sm">
          {config?.baseUrl ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-muted">
                {t('settings.accountTokens.openCodeGo.baseUrlLabel')}
              </span>
              <span className="truncate text-foreground">{config.baseUrl}</span>
            </div>
          ) : null}
          {config?.zenBaseUrl ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-muted">
                {t('settings.accountTokens.openCodeGo.zenBaseUrlLabel')}
              </span>
              <span className="truncate text-foreground">{config.zenBaseUrl}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Error Message */}
      {error || config?.errorMessage ? (
        <div
          className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          data-testid="settings-opencodego-error"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error || config?.errorMessage}</span>
        </div>
      ) : null}

      {/* Multi-account list (set active / remove) */}
      {hasAccounts && accounts ? (
        <AccountList
          providerId="opencodego"
          t={t}
          accounts={accounts}
          onSetActive={handleSetActive}
          onUpdateLabel={onUpdateAccountLabel}
          onRemove={handleRemove}
        />
      ) : null}

      {/* Add-account flow (API key + optional label / baseUrl / zenBaseUrl) */}
      {isAddFormOpen ? (
        <div className="space-y-3" data-testid="settings-opencodego-form">
          <div className="space-y-1.5">
            <label htmlFor="opencodego-api-key" className="text-sm font-medium text-foreground">
              {t('settings.accountTokens.openCodeGo.apiKeyLabel')}
            </label>
            <Input
              id="opencodego-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('settings.accountTokens.openCodeGo.apiKeyPlaceholder')}
              data-testid="settings-opencodego-apikey-input"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="opencode-label" className="text-sm font-medium text-foreground">
              {t('settings.accountTokens.accounts.labelInput')}
            </label>
            <Input
              id="opencode-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('settings.accountTokens.accounts.labelPlaceholder')}
              data-testid="settings-opencode-label-input"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="opencodego-base-url" className="text-sm font-medium text-foreground">
              {t('settings.accountTokens.openCodeGo.baseUrlLabel')}
            </label>
            <Input
              id="opencodego-base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={t('settings.accountTokens.openCodeGo.baseUrlPlaceholder')}
              data-testid="settings-opencodego-baseurl-input"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="opencodego-zen-base-url" className="text-sm font-medium text-foreground">
              {t('settings.accountTokens.openCodeGo.zenBaseUrlLabel')}
            </label>
            <Input
              id="opencodego-zen-base-url"
              value={zenBaseUrl}
              onChange={(e) => setZenBaseUrl(e.target.value)}
              placeholder={t('settings.accountTokens.openCodeGo.zenBaseUrlPlaceholder')}
              data-testid="settings-opencodego-zenbaseurl-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || !apiKey.trim()}
              className="flex-1"
              data-testid="settings-opencodego-account-add-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('settings.accountTokens.accounts.addAccount')}
            </Button>
            <Button variant="outline" onClick={handleCancelAdd} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => {
            setError(null);
            setIsAddFormOpen(true);
          }}
          className="w-full"
          data-testid="settings-opencodego-account-add-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('settings.accountTokens.accounts.addAccount')}
        </Button>
      )}
    </div>
  );
};
