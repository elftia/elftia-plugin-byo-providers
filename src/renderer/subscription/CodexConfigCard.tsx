/**
 * CodexConfigCard.tsx - Codex/OpenAI token configuration card (multi-account).
 *
 * Supports two authorization methods (each APPENDS a new account —
 * code-cli-account-switching D1):
 * - OAuth: Standard authorization flow
 * - Manual: Direct token input
 *
 * In multi-account mode renders an `AccountList` (set-active / remove per row)
 * mirroring `ClaudeConfigCard`.
 */

import { Edit2, ExternalLink, Key, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '../host/ui';
import { Select } from '../host/ui';

import { AccountList } from './AccountList';
import { ManualInputModal } from './ManualInputModal';
import { OAuthFlow } from './OAuthFlow';
import { StatusBadge } from './StatusBadge';
import type { CodexConfigCardProps, OAuthParams } from './types';

type CodexAuthMethod = 'oauth' | 'manual';

export const CodexConfigCard = ({
  t,
  config,
  onStartOAuth,
  onExchangeToken,
  onSetManualToken,
  onClear,
  onRefresh,
  accounts,
  onSetActiveAccount,
  onUpdateAccountLabel,
  onRemoveAccount,
}: CodexConfigCardProps) => {
  // Auth method state
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<CodexAuthMethod>('oauth');
  const [accountLabel, setAccountLabel] = useState('');

  // OAuth flow state
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  const [oAuthParams, setOAuthParams] = useState<OAuthParams | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [oAuthError, setOAuthError] = useState<string | null>(null);

  // Manual input modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Action state
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMulti = Boolean(accounts && onSetActiveAccount && onRemoveAccount);

  // Start OAuth flow
  const handleStartOAuth = useCallback(async () => {
    setOAuthError(null);
    setIsOAuthInProgress(true);
    try {
      const params = await onStartOAuth();
      setOAuthParams(params);
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setIsOAuthInProgress(false);
    }
  }, [onStartOAuth]);

  // Exchange OAuth code (appends a new account with the optional label).
  const handleExchangeToken = useCallback(async () => {
    if (!authCode.trim() || !oAuthParams) return;

    setOAuthError(null);
    setIsExchanging(true);
    const label = accountLabel.trim() || undefined;
    try {
      // Thread the REAL init `state` (from onStartOAuth) — the host looks the
      // retained PKCE verifier up by it. The verifier never crosses to the plugin.
      await onExchangeToken(authCode.trim(), oAuthParams.state, label);
      setIsOAuthInProgress(false);
      setOAuthParams(null);
      setAuthCode('');
      setAccountLabel('');
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to exchange token');
    } finally {
      setIsExchanging(false);
    }
  }, [accountLabel, authCode, oAuthParams, onExchangeToken]);

  // Cancel OAuth flow
  const handleCancelOAuth = useCallback(() => {
    setIsOAuthInProgress(false);
    setOAuthParams(null);
    setAuthCode('');
    setAccountLabel('');
    setOAuthError(null);
  }, []);

  // Manual token input (appends a new account with the optional label).
  const handleManualSubmit = useCallback(
    async (accessToken: string) => {
      setManualError(null);
      setIsManualSubmitting(true);
      try {
        await onSetManualToken(accessToken, accountLabel.trim() || undefined);
        setIsManualModalOpen(false);
        setAccountLabel('');
      } catch (err) {
        setManualError(err instanceof Error ? err.message : 'Failed to save token');
      } finally {
        setIsManualSubmitting(false);
      }
    },
    [accountLabel, onSetManualToken],
  );

  // Clear config (single-account mode only — multi-account removes per-row).
  const handleClear = useCallback(async () => {
    setError(null);
    setIsClearing(true);
    try {
      await onClear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear configuration');
    } finally {
      setIsClearing(false);
    }
  }, [onClear]);

  const isConfigured = config?.status === 'authorized' || config?.status === 'configured';

  const authMethodOptions = [
    { value: 'oauth', label: t('settings.accountTokens.authMethod.oauth.label') },
    { value: 'manual', label: t('settings.accountTokens.authMethod.manual.label') },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface-1/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
            <Key className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {t('settings.accountTokens.codex.title')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('settings.accountTokens.codex.description')}
            </p>
          </div>
        </div>
        <StatusBadge status={config?.status} t={t} />
      </div>

      {/* Error Message */}
      {error || config?.errorMessage ? (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error || config?.errorMessage}
        </div>
      ) : null}

      {/* Multi-account list (set active / refresh-expired / remove) */}
      {accounts && accounts.length > 0 && onSetActiveAccount && onRemoveAccount ? (
        <AccountList
          t={t}
          accounts={accounts}
          onSetActive={onSetActiveAccount}
          onUpdateLabel={onUpdateAccountLabel}
          onRemove={onRemoveAccount}
          onRefreshActive={onRefresh}
          activeCanRefresh={config?.hasRefreshToken}
        />
      ) : null}

      {/* OAuth Flow UI */}
      {isOAuthInProgress && oAuthParams ? (
        <OAuthFlow
          t={t}
          platform="codex"
          oauthParams={oAuthParams}
          accountLabel={accountLabel}
          authCode={authCode}
          isExchanging={isExchanging}
          error={oAuthError}
          onAccountLabelChange={setAccountLabel}
          onAuthCodeChange={setAuthCode}
          onExchange={handleExchangeToken}
          onCancel={handleCancelOAuth}
        />
      ) : (
        <>
          {/* Auth Method Selector — always shown in multi-account mode (each
              login appends a new account), else only when not configured. */}
          {isMulti || !isConfigured ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.accountTokens.authMethod.label')}
              </label>
              <Select
                value={selectedAuthMethod}
                onChange={(value) => setSelectedAuthMethod(value as CodexAuthMethod)}
                options={authMethodOptions}
              />
              <p className="text-xs text-text-muted">
                {t(`settings.accountTokens.authMethod.${selectedAuthMethod}.desc`)}
              </p>

            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-2">
            {/* Add-account button — always available in multi-account mode,
                else the first-configure button. */}
            {isMulti || !isConfigured ? (
              selectedAuthMethod === 'manual' ? (
                <Button
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex-1"
                  data-testid="settings-codex-account-add-btn"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isMulti
                    ? t('settings.accountTokens.accounts.addAccount')
                    : t('settings.accountTokens.actions.enterToken')}
                </Button>
              ) : (
                <Button
                  onClick={handleStartOAuth}
                  className="flex-1"
                  data-testid="settings-codex-account-add-btn"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isMulti
                    ? t('settings.accountTokens.accounts.addAccount')
                    : t('settings.accountTokens.actions.authorize')}
                </Button>
              )
            ) : null}

            {/* Clear (single-account mode only — multi-account removes per-row). */}
            {isConfigured && !isMulti ? (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isClearing}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('settings.accountTokens.actions.clear')}
              </Button>
            ) : null}
          </div>
        </>
      )}

      {/* Manual Input Modal */}
      <ManualInputModal
        t={t}
        platform="codex"
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setAccountLabel('');
          setManualError(null);
        }}
        onSubmit={handleManualSubmit}
        isSubmitting={isManualSubmitting}
        error={manualError}
        accountLabel={accountLabel}
        onAccountLabelChange={setAccountLabel}
      />
    </div>
  );
};
