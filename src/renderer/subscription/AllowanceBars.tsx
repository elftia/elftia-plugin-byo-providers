/**
 * AllowanceBars — secret-free usage-quota progress bars shared by the
 * subscription account rows and the provider key-pool rows.
 *
 * State contract (omnicross 0.3.1 parity): unknown / unsupported /
 * unavailable quota is NEVER drawn as a measured 0% — the bar is replaced by
 * an explicit state label. Measured percents are clamped to 0–100 for the
 * visual width only. Fetching is parent-driven (expand + manual refresh); no
 * background polling, so hidden tabs cost nothing.
 */
import { Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../host/ui';
import { cn } from '../host/vendored/cn';
import type { TranslateFn } from '../host/vendored/useTranslation';
import type { HostAccountAllowanceSnapshot, HostAllowanceWindow } from '@byo/domain/plugin-types';
import { subscriptionAuthClient } from '../subscriptionAuthClient';

export interface AllowanceBarsProps {
  t: TranslateFn;
  /** Present = fetch account allowance; absent renders nothing (feature-off). */
  providerId?: string;
  accountId: string;
  /** Extra testid scope so key rows and account rows stay distinguishable. */
  testidScope?: string;
}

interface QuotaView {
  windows: HostAllowanceWindow[];
  lastErrorCode?: string;
  observedAt?: string;
}

const STATE_LABEL_KEYS: Record<string, string> = {
  fresh: 'settings.accountTokens.allowance.stateFresh',
  stale: 'settings.accountTokens.allowance.stateStale',
  unavailable: 'settings.accountTokens.allowance.stateUnavailable',
  unsupported: 'settings.accountTokens.allowance.stateUnsupported',
};

function stateLabel(t: TranslateFn, key: string): string {
  return t(STATE_LABEL_KEYS[key] ?? 'settings.accountTokens.allowance.stateUnavailable');
}

function resetLabel(window: HostAllowanceWindow, t: TranslateFn): string {
  if (!window.resetsAt) return '';
  const resets = new Date(window.resetsAt);
  if (Number.isNaN(resets.getTime())) return '';
  return t('settings.accountTokens.allowance.resetsAt', {
    time: resets.toLocaleTimeString(),
  });
}

export function AllowanceBars({ t, providerId, accountId, testidScope = 'account' }: AllowanceBarsProps) {
  const [quota, setQuota] = useState<QuotaView | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (force: boolean) => {
      if (!providerId) return;
      setLoading(true);
      try {
        const snapshot = await subscriptionAuthClient.getAccountAllowance(
          providerId,
          accountId,
          force,
        );
        setQuota({
          windows: (snapshot as HostAccountAllowanceSnapshot).windows ?? [],
          lastErrorCode: snapshot.lastErrorCode,
          observedAt: snapshot.observedAt,
        });
      } catch {
        setQuota({ windows: [], lastErrorCode: 'quota-unavailable' });
      } finally {
        setLoading(false);
      }
    },
    [providerId, accountId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  if (!providerId) return null;

  return (
    <div className="space-y-1.5" data-testid={`settings-${testidScope}-allowance`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">
          {t('settings.accountTokens.allowance.title')}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => void load(true)}
          data-testid={`settings-${testidScope}-allowance-refresh-btn`}
          aria-label={t('settings.accountTokens.allowance.refresh')}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      {quota && quota.windows.length > 0 ? (
        <ul className="space-y-1.5">
          {quota.windows.map((window) => {
            const measured = window.usedPercent !== null && window.usedPercent !== undefined;
            const width = measured ? Math.min(100, Math.max(0, window.usedPercent ?? 0)) : 0;
            const nearing = measured && (window.usedPercent ?? 0) >= 80;
            return (
              <li
                key={window.id}
                className="space-y-0.5"
                data-testid={`settings-${testidScope}-allowance-window`}
                data-window-id={window.id}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{window.label}</span>
                  {measured ? (
                    <span className={cn('tabular-nums', nearing ? 'text-warning' : 'text-text-muted')}>
                      {Math.round(window.usedPercent ?? 0)}%
                    </span>
                  ) : (
                    <span className="text-text-muted">{stateLabel(t, window.state)}</span>
                  )}
                </div>
                {measured ? (
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(window.usedPercent ?? 0)}
                    aria-label={window.label}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full',
                        nearing ? 'bg-warning' : 'bg-primary',
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ) : null}
                {window.resetsAt && measured ? (
                  <p className="text-[10px] text-text-subtle">{resetLabel(window, t)}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-text-muted" data-testid={`settings-${testidScope}-allowance-empty`}>
          {quota?.lastErrorCode && quota.lastErrorCode.endsWith('_unsupported_provider')
            ? t('settings.accountTokens.allowance.stateUnsupported')
            : t('settings.accountTokens.allowance.stateUnavailable')}
        </p>
      )}
    </div>
  );
}
