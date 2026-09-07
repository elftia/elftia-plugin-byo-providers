/**
 * GrokConfigCard.tsx - Grok (xAI SuperGrok) subscription card (RFC 8628
 * device flow).
 *
 * The login shows a verification URL + user code; the HOST polls the device
 * endpoint and persists the completed credential. The plugin only ever sees
 * the display-only flow view — never the deviceCode or tokens.
 */

import { ExternalLink, Key, Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '../host/ui';
import { cn } from '../host/vendored/cn';

import { openExternal } from '../externalLinksClient';
import { AccountList } from './AccountList';
import { StatusBadge } from './StatusBadge';
import type { DeviceFlowView, GrokConfigCardProps, TranslationFn } from './types';

/** Poll cadence while a device flow is pending (RFC 8628 default interval). */
const POLL_INTERVAL_MS = 5_000;
/** Stop polling after this long regardless of upstream lifetime. */
const POLL_DEADLINE_MS = 15 * 60_000;

export const GrokConfigCard = ({
  t,
  config,
  accounts,
  onStartLogin,
  onPollFlow,
  onCancelFlow,
  onSetActiveAccount,
  onUpdateAccountLabel,
  onRemoveAccount,
  onClear,
  onRefresh,
  children,
}: GrokConfigCardProps) => {
  const [flow, setFlow] = useState<DeviceFlowView | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowStartedAt = useRef(0);

  const stopPollTimer = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Poll loop: schedule the next poll while the flow is pending.
  useEffect(() => {
    if (flow?.state !== 'pending') {
      stopPollTimer();
      setIsPolling(false);
      return;
    }
    if (Date.now() - flowStartedAt.current > POLL_DEADLINE_MS) {
      setFlow({ ...flow, state: 'error', error: 'expired' });
      return;
    }
    setIsPolling(true);
    pollTimer.current = setTimeout(async () => {
      try {
        const next = await onPollFlow(flow.sessionId);
        setFlow(next);
      } catch (err) {
        setFlow({
          ...flow,
          state: 'error',
          error: err instanceof Error ? err.message : 'poll failed',
        });
      }
    }, POLL_INTERVAL_MS);
    return stopPollTimer;
  }, [flow, onPollFlow, stopPollTimer]);

  useEffect(() => stopPollTimer, [stopPollTimer]);

  const handleStart = useCallback(async () => {
    setError(null);
    setIsStarting(true);
    try {
      const view = await onStartLogin();
      flowStartedAt.current = Date.now();
      setFlow(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start device flow');
    } finally {
      setIsStarting(false);
    }
  }, [onStartLogin]);

  const handleCancel = useCallback(async () => {
    if (!flow) return;
    stopPollTimer();
    const sessionId = flow.sessionId;
    setFlow(null);
    try {
      await onCancelFlow(sessionId);
    } catch {
      // Cancellation is best-effort; the host flow expires on its own.
    }
  }, [flow, onCancelFlow, stopPollTimer]);

  const handleRefresh = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);
    try {
      const success = await onRefresh();
      if (!success) setError(t('settings.accountTokens.errors.refreshFailed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, t]);

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
  const hasAccounts = Boolean(accounts && accounts.length > 0);
  const flowErrorText = flow?.state === 'error'
    ? t('settings.accountTokens.grok.flowErrors.expired')
    : undefined;
  const inlineError = error ?? config?.errorMessage;

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
              {t('settings.accountTokens.grok.title')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('settings.accountTokens.grok.description')}
            </p>
          </div>
        </div>
        <StatusBadge status={config?.status} t={t} />
      </div>

      {inlineError ? (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {inlineError}
        </div>
      ) : null}

      {/* Multi-account list */}
      {hasAccounts && onSetActiveAccount && onRemoveAccount ? (
        <AccountList
          t={t as TranslationFn}
          accounts={accounts ?? []}
          onSetActive={onSetActiveAccount}
          onUpdateLabel={onUpdateAccountLabel}
          onRemove={onRemoveAccount}
          activeCanRefresh={config?.hasRefreshToken}
          providerId="grok"
        />
      ) : null}

      {/* Device flow panel */}
      {flow && flow.state !== 'error' ? (
        <div
          className="space-y-3 rounded-md border border-border/40 bg-surface-2/40 p-3"
          data-testid="settings-grok-device-flow"
          data-flow-state={flow.state}
        >
          {flow.state === 'pending' ? (
            <>
              <p className="text-sm text-foreground">
                {t('settings.accountTokens.grok.flowInstructions')}
              </p>
              <div className="flex items-center gap-3">
                <code
                  className="rounded bg-surface-1 px-3 py-1.5 font-mono text-base tracking-wider text-foreground"
                  data-testid="settings-grok-user-code"
                >
                  {flow.userCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Sandboxed opaque-origin frame: window.open is a no-op —
                    // the host opens the page; the URL below stays selectable.
                    void openExternal(flow.verificationUriComplete ?? flow.verificationUri);
                  }}
                  data-testid="settings-grok-open-verification-btn"
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  {t('settings.accountTokens.grok.openVerification')}
                </Button>
              </div>
              <code
                className="block select-text break-all rounded bg-surface-1 px-2 py-1.5 text-xs text-text-muted"
                data-testid="settings-grok-verification-url"
              >
                {flow.verificationUriComplete ?? flow.verificationUri}
              </code>
              <p className="flex items-center gap-2 text-xs text-text-muted">
                <Loader2 className={cn('h-3.5 w-3.5', isPolling && 'animate-spin')} />
                {t('settings.accountTokens.grok.waitingForApproval')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCancel()}
                data-testid="settings-grok-cancel-btn"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {t('settings.accountTokens.grok.cancel')}
              </Button>
            </>
          ) : (
            <p className="text-sm text-primary" data-testid="settings-grok-flow-done">
              {t('settings.accountTokens.grok.flowDone')}
            </p>
          )}
        </div>
      ) : null}

      {flowErrorText ? (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="settings-grok-flow-error">
          {flowErrorText}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isStarting || (flow?.state === 'pending')}
          onClick={() => void handleStart()}
          data-testid="settings-grok-add-account-btn"
        >
          <Key className="mr-1 h-3.5 w-3.5" />
          {t('settings.accountTokens.grok.addAccount')}
        </Button>
        {isConfigured ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing || !config?.hasRefreshToken}
              onClick={() => void handleRefresh()}
              data-testid="settings-grok-refresh-btn"
            >
              <RefreshCw className={cn('mr-1 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              {t('settings.accountTokens.actions.refresh')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isClearing}
              onClick={() => void handleClear()}
              className="text-destructive hover:text-destructive"
              data-testid="settings-grok-clear-btn"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {t('settings.accountTokens.actions.clear')}
            </Button>
          </>
        ) : null}
      </div>

      {/* Subscription model list (v1.70; tab-mounted children slot) */}
      {children}
    </div>
  );
};
