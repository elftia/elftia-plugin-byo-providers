/**
 * ClaudeConfigCard.tsx - Claude token configuration card
 *
 * Supports three authorization methods:
 * - OAuth: Full access with automatic refresh
 * - Setup Token: Inference-only, long-lived
 * - Manual: Direct token input with subscription level
 */

import { Edit2, ExternalLink, Key, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback,useState } from 'react';

import { Button } from '../host/ui';
import { Select } from '../host/ui';
import { cn } from '../host/vendored/cn';

import { AccountList } from './AccountList';
import { ManualInputModal } from './ManualInputModal';
import { OAuthFlow } from './OAuthFlow';
import { parseOAuthPaste } from './oauthPaste';
import { StatusBadge } from './StatusBadge';
import type { ClaudeAuthMethod, ClaudeConfigCardProps, ManualTokenVerifyFailure, OAuthParams,SubscriptionLevel } from './types';
import { describeManualTokenError } from './types';

const AUTH_METHOD_OPTIONS = ['oauth', 'setup_token', 'manual'] as const;
const SUBSCRIPTION_LEVELS: SubscriptionLevel[] = ['Free', 'Pro', 'Max'];

export const ClaudeConfigCard = ({
  t,
  config,
  onStartOAuth,
  onExchangeOAuthToken,
  onStartSetupToken,
  onExchangeSetupToken,
  onSetManualToken,
  onUpdateSubscriptionLevel,
  onClear,
  onRefresh,
  accounts,
  onSetActiveAccount,
  onUpdateAccountLabel,
  onRemoveAccount,
  children,
}: ClaudeConfigCardProps) => {
  // Auth method state
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<ClaudeAuthMethod>(
    config?.authMethod ?? 'oauth'
  );
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start OAuth flow
  const handleStartOAuth = useCallback(async () => {
    setOAuthError(null);
    setIsOAuthInProgress(true);
    try {
      const params = selectedAuthMethod === 'setup_token'
        ? await onStartSetupToken()
        : await onStartOAuth();
      setOAuthParams(params);
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setIsOAuthInProgress(false);
    }
  }, [selectedAuthMethod, onStartOAuth, onStartSetupToken]);

  // Exchange OAuth code. Claude hands the user a combined `code#state` string;
  // split + CSRF-validate it (mirrors the daemon's loginClaude), then send the
  // CLEAN code with the REAL generated state (not the whole blob + state:'').
  const handleExchangeToken = useCallback(async () => {
    if (!authCode.trim() || !oAuthParams) return;

    const parsed = parseOAuthPaste(authCode, oAuthParams.state);
    if (parsed.ok === false) {
      const msgKey =
        parsed.reason === 'state-mismatch'
          ? 'settings.accountTokens.oauthFlow.stateMismatch'
          : 'settings.accountTokens.oauthFlow.emptyCode';
      setOAuthError(t(msgKey));
      return;
    }

    setOAuthError(null);
    setIsExchanging(true);
    const label = accountLabel.trim() || undefined;
    try {
      if (selectedAuthMethod === 'setup_token') {
        await onExchangeSetupToken(parsed.code, oAuthParams.state, label);
      } else {
        await onExchangeOAuthToken(parsed.code, oAuthParams.state, label);
      }
      setIsOAuthInProgress(false);
      setOAuthParams(null);
      setAuthCode('');
      setAccountLabel('');
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to exchange token');
    } finally {
      setIsExchanging(false);
    }
  }, [accountLabel, authCode, oAuthParams, selectedAuthMethod, onExchangeOAuthToken, onExchangeSetupToken, t]);

  // Cancel OAuth flow
  const handleCancelOAuth = useCallback(() => {
    setIsOAuthInProgress(false);
    setOAuthParams(null);
    setAuthCode('');
    setAccountLabel('');
    setOAuthError(null);
  }, []);

  // Manual token input
  const handleManualSubmit = useCallback(async (
    accessToken: string,
    extra?: { subscriptionLevel?: SubscriptionLevel; verify?: boolean }
  ) => {
    setManualError(null);
    setIsManualSubmitting(true);
    try {
      await onSetManualToken(
        accessToken,
        extra?.subscriptionLevel,
        accountLabel.trim() || undefined,
        extra?.verify !== undefined ? { verify: extra.verify } : undefined,
      );
      setIsManualModalOpen(false);
      setAccountLabel('');
    } catch (err) {
      // v1.72 — a verify refusal renders the localized reason taxonomy, never
      // a raw probe code.
      setManualError(
        describeManualTokenError(t, err as Error & { verifyFailure?: ManualTokenVerifyFailure }),
      );
    } finally {
      setIsManualSubmitting(false);
    }
  }, [accountLabel, onSetManualToken, t]);

  const handleRefresh = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);
    try {
      const success = await onRefresh();
      if (!success) {
        setError(t('settings.accountTokens.errors.refreshFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, t]);

  // Clear config
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

  // Update subscription level
  const handleSubscriptionChange = useCallback(async (level: SubscriptionLevel) => {
    setError(null);
    try {
      await onUpdateSubscriptionLevel(level);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription level');
    }
  }, [onUpdateSubscriptionLevel]);

  const isConfigured = config?.status === 'authorized' || config?.status === 'configured';
  const isExpiredStatus = config?.status === 'expired';
  const isMulti = Boolean(accounts && onSetActiveAccount && onRemoveAccount);
  const hasRefreshToken = config?.hasRefreshToken;
  const expiresAt = config?.expiresAt ? new Date(config.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  const authMethodOptions = AUTH_METHOD_OPTIONS.map((method) => ({
    value: method,
    label: t(`settings.accountTokens.authMethod.${method}.label`),
  }));

  const subscriptionOptions = SUBSCRIPTION_LEVELS.map((level) => ({
    value: level,
    label: t(`settings.accountTokens.subscriptionLevel.${level.toLowerCase()}.label`),
  }));

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
              {t('settings.accountTokens.claude.title')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('settings.accountTokens.claude.description')}
            </p>
          </div>
        </div>
        <StatusBadge status={config?.status} t={t} />
      </div>

      {/* Error Message */}
      {(error || config?.errorMessage) ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error || config?.errorMessage}
        </div> : null}

      {/* Multi-account list (set active / remove) */}
      {accounts && accounts.length > 0 && onSetActiveAccount && onRemoveAccount ? (
        <AccountList
          providerId="claude"
          t={t}
          accounts={accounts}
          onSetActive={onSetActiveAccount}
          onUpdateLabel={onUpdateAccountLabel}
          onRemove={onRemoveAccount}
          onRefreshActive={onRefresh}
          activeCanRefresh={hasRefreshToken}
        />
      ) : null}

      {isMulti ? (
        <p className="rounded-md bg-surface-2/40 px-3 py-2 text-xs text-text-muted">
          {t('settings.accountTokens.accounts.incognitoHint')}
        </p>
      ) : null}
      {/* OAuth Flow UI */}
      {isOAuthInProgress && oAuthParams ? (
        <OAuthFlow
          t={t}
          platform="claude"
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
          {(isMulti || !isConfigured) ? <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.accountTokens.authMethod.label')}
              </label>
              <Select
                value={selectedAuthMethod}
                onChange={(value) => setSelectedAuthMethod(value as ClaudeAuthMethod)}
                options={authMethodOptions}
              />
              <p className="text-xs text-text-muted">
                {t(`settings.accountTokens.authMethod.${selectedAuthMethod}.desc`)}
              </p>

            </div> : null}

          {/* Token Info (when configured) */}
          {isConfigured && !isMulti ? <div className="space-y-3 text-sm">
              {/* Auth Method */}
              <div className="flex items-center justify-between">
                <span className="text-text-muted">
                  {t('settings.accountTokens.authMethod.label')}
                </span>
                <span className="text-foreground">
                  {t(`settings.accountTokens.authMethod.${config?.authMethod ?? 'oauth'}.label`)}
                </span>
              </div>

              {/* Subscription Level */}
              <div className="flex items-center justify-between">
                <span className="text-text-muted">
                  {t('settings.accountTokens.subscriptionLevel.label')}
                </span>
                <div className="flex items-center gap-2">
                  <Select
                    value={config?.subscriptionLevel ?? 'Free'}
                    onChange={(value) => handleSubscriptionChange(value as SubscriptionLevel)}
                    options={subscriptionOptions}
                    size="sm"
                  />
                </div>
              </div>

              {/* Setup Token indicator */}
              {config?.isSetupToken ? <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {t('settings.accountTokens.tokenType')}
                  </span>
                  <span className="text-primary">
                    {t('settings.accountTokens.authMethod.setup_token.label')}
                  </span>
                </div> : null}

              {/* Expiry */}
              {expiresAt ? <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {t('settings.accountTokens.expiresAt')}
                  </span>
                  <span className={cn(isExpired ? 'text-warning' : 'text-foreground')}>
                    {expiresAt.toLocaleString()}
                  </span>
                </div> : null}

              {/* Last Refreshed */}
              {config?.lastRefreshedAt ? <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {t('settings.accountTokens.lastRefreshed')}
                  </span>
                  <span className="text-foreground">
                    {new Date(config.lastRefreshedAt).toLocaleString()}
                  </span>
                </div> : null}
            </div> : null}

          <div className="flex items-center gap-2 pt-2">
            {/* Add-account button — always available in multi-account mode,
                else the first-configure button. */}
            {isMulti || !isConfigured ? (
              selectedAuthMethod === 'manual' ? (
                <Button
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex-1"
                  data-testid="settings-account-add-btn"
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
                  data-testid="settings-account-add-btn"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isMulti
                    ? t('settings.accountTokens.accounts.addAccount')
                    : t('settings.accountTokens.actions.authorize')}
                </Button>
              )
            ) : null}

            {/* Active-account refresh + clear (single-account mode only — in
                multi-account mode refresh/removal are per-row in AccountList).
                Also shown for an EXPIRED config so a missed auto-refresh has a
                manual recovery entry. */}
            {(isConfigured || isExpiredStatus) && !isMulti ? (
              <>
                {hasRefreshToken ? <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex-1"
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                    {t('settings.accountTokens.actions.refresh')}
                  </Button> : null}
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isClearing}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('settings.accountTokens.actions.clear')}
                </Button>
              </>
            ) : null}
          </div>
        </>
      )}

      {/* Manual Input Modal */}
      <ManualInputModal
        t={t}
        platform="claude"
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

      {/* Subscription model list (v1.70; tab-mounted children slot) */}
      {children}
    </div>
  );
};
