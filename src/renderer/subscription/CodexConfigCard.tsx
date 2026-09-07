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

import { Edit2, ExternalLink, Key, Loader2, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '../host/ui';
import { Select } from '../host/ui';
import { cn } from '../host/vendored/cn';

import { openExternal } from '../externalLinksClient';
import { AccountList } from './AccountList';
import { ManualInputModal } from './ManualInputModal';
import { OAuthFlow } from './OAuthFlow';
import { StatusBadge } from './StatusBadge';
import type { CodexConfigCardProps, OAuthParams } from './types';

type CodexAuthMethod = 'oauth' | 'manual';

/** Poll cadence while a codex loopback sign-in is pending. */
const LOOPBACK_POLL_INTERVAL_MS = 3_000;
/** Stop polling after this long regardless of the host-side listener TTL. */
const LOOPBACK_POLL_DEADLINE_MS = 10 * 60_000;

export const CodexConfigCard = ({
  t,
  config,
  onStartOAuth,
  onExchangeToken,
  onStartLoopbackLogin,
  onPollLoopbackFlow,
  onCancelLoopbackFlow,
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

  // OAuth flow state (manual-paste fallback)
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

  // Codex loopback sign-in state (v1.67 auto-complete; the PRIMARY path when
  // the host exposes the verbs — older hosts fall back to the paste flow).
  const loopbackSupported = Boolean(onStartLoopbackLogin && onPollLoopbackFlow);
  const [loopback, setLoopback] = useState<{ sessionId: string; authUrl: string } | null>(null);
  const [loopbackError, setLoopbackError] = useState<string | null>(null);
  const [isLoopbackStarting, setIsLoopbackStarting] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopbackStartedAt = useRef(0);

  const stopPollTimer = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Loopback poll loop: schedule the next poll while the sign-in is pending.
  useEffect(() => {
    if (!loopback) {
      stopPollTimer();
      return;
    }
    if (Date.now() - loopbackStartedAt.current > LOOPBACK_POLL_DEADLINE_MS) {
      setLoopbackError(t('settings.accountTokens.codex.loopbackErrors.timeout'));
      setLoopback(null);
      return;
    }
    pollTimer.current = setTimeout(async () => {
      try {
        const view = await onPollLoopbackFlow?.(loopback.sessionId);
        if (!view) return;
        if (view.state === 'done') {
          setLoopback(null);
        } else if (view.state === 'error') {
          setLoopbackError(view.error ?? t('settings.accountTokens.codex.loopbackErrors.failed'));
          setLoopback(null);
        }
      } catch {
        // A transient poll failure keeps the flow alive — the next tick
        // retries; the host-side TTL is the real deadline.
      }
    }, LOOPBACK_POLL_INTERVAL_MS);
    return stopPollTimer;
  }, [loopback, onPollLoopbackFlow, stopPollTimer, t]);

  useEffect(() => stopPollTimer, [stopPollTimer]);

  // Start the codex sign-in: the loopback flow when the host supports it
  // (the browser auto-completes via 127.0.0.1:1455 — no code to paste), else
  // the classic paste flow.
  const handleStartOAuth = useCallback(async () => {
    setOAuthError(null);
    if (loopbackSupported) {
      setLoopbackError(null);
      setIsLoopbackStarting(true);
      try {
        const started = await onStartLoopbackLogin?.();
        if (!started) return;
        if (!started.ok) {
          setOAuthError(started.error);
          return;
        }
        loopbackStartedAt.current = Date.now();
        setLoopback({ sessionId: started.sessionId, authUrl: started.authUrl });
        // The sandboxed frame cannot window.open — the host opens the page.
        void openExternal(started.authUrl);
      } catch (err) {
        setOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth');
      } finally {
        setIsLoopbackStarting(false);
      }
      return;
    }
    setIsOAuthInProgress(true);
    try {
      const params = await onStartOAuth();
      setOAuthParams(params);
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setIsOAuthInProgress(false);
    }
  }, [loopbackSupported, onStartLoopbackLogin, onStartOAuth]);

  // Abandon the loopback sign-in and fall back to the classic paste flow
  // (a FRESH manual flow — the loopback's state/verifier never crossed out).
  const handleFallbackToPaste = useCallback(async () => {
    const session = loopback;
    setLoopback(null);
    setLoopbackError(null);
    if (session) await onCancelLoopbackFlow?.(session.sessionId);
    setIsOAuthInProgress(true);
    try {
      const params = await onStartOAuth();
      setOAuthParams(params);
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setIsOAuthInProgress(false);
    }
  }, [loopback, onCancelLoopbackFlow, onStartOAuth]);

  const handleCancelLoopback = useCallback(async () => {
    const session = loopback;
    setLoopback(null);
    if (session) await onCancelLoopbackFlow?.(session.sessionId);
  }, [loopback, onCancelLoopbackFlow]);

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
          providerId="codex"
          t={t}
          accounts={accounts}
          onSetActive={onSetActiveAccount}
          onUpdateLabel={onUpdateAccountLabel}
          onRemove={onRemoveAccount}
          onRefreshActive={onRefresh}
          activeCanRefresh={config?.hasRefreshToken}
        />
      ) : null}

      {/* Codex loopback sign-in panel (auto-complete; no code to paste). */}
      {loopback ? (
        <div
          className="space-y-3 rounded-md border border-border/40 bg-surface-2/40 p-3"
          data-testid="settings-codex-loopback-panel"
        >
          <p className="text-sm text-foreground">
            {t('settings.accountTokens.codex.loopbackWaiting')}
          </p>
          <code
            className="block select-text break-all rounded bg-surface-1 px-2 py-1.5 text-xs text-text-muted"
            data-testid="settings-codex-loopback-url"
          >
            {loopback.authUrl}
          </code>
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('settings.accountTokens.codex.loopbackHint')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void openExternal(loopback.authUrl)}
              data-testid="settings-codex-loopback-reopen-btn"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              {t('settings.accountTokens.codex.reopenAuthPage')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleFallbackToPaste()}
              data-testid="settings-codex-loopback-fallback-btn"
            >
              {t('settings.accountTokens.codex.fallbackToPaste')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleCancelLoopback()}
              data-testid="settings-codex-loopback-cancel-btn"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              {t('settings.accountTokens.codex.loopbackCancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {loopbackError ? (
        <div
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          data-testid="settings-codex-loopback-error"
        >
          {loopbackError}
        </div>
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
                  disabled={isLoopbackStarting || loopback !== null}
                  className="flex-1"
                  data-testid="settings-codex-account-add-btn"
                >
                  {isLoopbackStarting ? (
                    <Loader2 className={cn('h-4 w-4 mr-2 animate-spin')} />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
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
