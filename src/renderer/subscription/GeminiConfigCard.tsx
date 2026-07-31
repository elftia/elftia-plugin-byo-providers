/**
 * GeminiConfigCard.tsx - Gemini token configuration card
 *
 * Supports two authorization methods:
 * - OAuth: Standard authorization flow
 * - Manual: Direct token input (with optional refresh token)
 */

import { Edit2,ExternalLink, Key, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback,useState } from 'react';

import { Button } from '../host/ui';
import { Select } from '../host/ui';
import { cn } from '../host/vendored/cn';

import { ManualInputModal } from './ManualInputModal';
import { OAuthFlow } from './OAuthFlow';
import { StatusBadge } from './StatusBadge';
import type { GeminiConfigCardProps, OAuthParams } from './types';

type GeminiAuthMethod = 'oauth' | 'manual';

export const GeminiConfigCard = ({
  t,
  config,
  onStartOAuth,
  onExchangeToken,
  onSetManualToken,
  onClear,
  onRefresh,
}: GeminiConfigCardProps) => {
  // Auth method state
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<GeminiAuthMethod>('oauth');

  // OAuth flow state
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  const [oauthParams, setOAuthParams] = useState<OAuthParams | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [oauthError, setOAuthError] = useState<string | null>(null);

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
      const params = await onStartOAuth();
      setOAuthParams(params);
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setIsOAuthInProgress(false);
    }
  }, [onStartOAuth]);

  // Exchange OAuth code
  const handleExchangeToken = useCallback(async () => {
    if (!authCode.trim() || !oauthParams) return;

    setOAuthError(null);
    setIsExchanging(true);
    try {
      // Thread the REAL init `state` (from onStartOAuth) — the host looks the
      // retained PKCE verifier up by it. The verifier never crosses to the plugin.
      await onExchangeToken(authCode.trim(), oauthParams.state);
      setIsOAuthInProgress(false);
      setOAuthParams(null);
      setAuthCode('');
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to exchange token');
    } finally {
      setIsExchanging(false);
    }
  }, [authCode, oauthParams, onExchangeToken]);

  // Cancel OAuth flow
  const handleCancelOAuth = useCallback(() => {
    setIsOAuthInProgress(false);
    setOAuthParams(null);
    setAuthCode('');
    setOAuthError(null);
  }, []);

  // Manual token input
  const handleManualSubmit = useCallback(async (
    accessToken: string,
    extra?: { refreshToken?: string }
  ) => {
    setManualError(null);
    setIsManualSubmitting(true);
    try {
      await onSetManualToken(accessToken, extra?.refreshToken);
      setIsManualModalOpen(false);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Failed to save token');
    } finally {
      setIsManualSubmitting(false);
    }
  }, [onSetManualToken]);

  // Refresh token
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

  const isConfigured = config?.status === 'authorized' || config?.status === 'configured';
  const isExpiredStatus = config?.status === 'expired';
  const hasRefreshToken = config?.hasRefreshToken;
  const expiresAt = config?.expiresAt ? new Date(config.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

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
              {t('settings.accountTokens.gemini.title')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('settings.accountTokens.gemini.description')}
            </p>
          </div>
        </div>
        <StatusBadge status={config?.status} t={t} />
      </div>

      {/* Error Message */}
      {(error || config?.errorMessage) ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error || config?.errorMessage}
        </div> : null}

      {/* OAuth Flow UI */}
      {isOAuthInProgress && oauthParams ? (
        <OAuthFlow
          t={t}
          platform="gemini"
          oauthParams={oauthParams}
          authCode={authCode}
          isExchanging={isExchanging}
          error={oauthError}
          onAuthCodeChange={setAuthCode}
          onExchange={handleExchangeToken}
          onCancel={handleCancelOAuth}
        />
      ) : (
        <>
          {/* Auth Method Selector (only shown when not configured) */}
          {!isConfigured && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.accountTokens.authMethod.label')}
              </label>
              <Select
                value={selectedAuthMethod}
                onChange={(value) => setSelectedAuthMethod(value as GeminiAuthMethod)}
                options={authMethodOptions}
              />
              <p className="text-xs text-text-muted">
                {t(`settings.accountTokens.authMethod.${selectedAuthMethod}.desc`)}
              </p>
            </div>
          )}

          {/* Token Info (when configured) */}
          {isConfigured ? <div className="space-y-2 text-sm">
              {expiresAt ? <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {t('settings.accountTokens.expiresAt')}
                  </span>
                  <span className={cn(isExpired ? 'text-warning' : 'text-foreground')}>
                    {expiresAt.toLocaleString()}
                  </span>
                </div> : null}
              {config?.lastRefreshedAt ? <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {t('settings.accountTokens.lastRefreshed')}
                  </span>
                  <span className="text-foreground">
                    {new Date(config.lastRefreshedAt).toLocaleString()}
                  </span>
                </div> : null}
            </div> : null}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {!isConfigured ? (
              selectedAuthMethod === 'manual' ? (
                <Button onClick={() => setIsManualModalOpen(true)} className="flex-1">
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('settings.accountTokens.actions.enterToken')}
                </Button>
              ) : (
                <Button onClick={handleStartOAuth} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('settings.accountTokens.actions.authorize')}
                </Button>
              )
            ) : null}
            {/* Refresh + clear — also shown for an EXPIRED config so a missed
                auto-refresh (Elftia not running before expiry) has a manual
                recovery entry. */}
            {isConfigured || isExpiredStatus ? (
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
        platform="gemini"
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualError(null);
        }}
        onSubmit={handleManualSubmit}
        isSubmitting={isManualSubmitting}
        error={manualError}
      />
    </div>
  );
};
