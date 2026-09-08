/**
 * KeyQuotaBars — plan-quota progress bars for one provider pool key
 * (coding-plan keys' same-key usage endpoint; host-API v1.64).
 *
 * Same state contract as the account allowance bars: unsupported /
 * unavailable is an explicit label, never a measured 0%. Fetched once per
 * mount plus manual refresh — no background polling.
 */
import { Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../host/ui';
import { cn } from '../host/vendored/cn';
import type { TranslateFn } from '../host/vendored/useTranslation';
import type { HostProviderKeyQuota } from '@byo/domain/plugin-types';
import { llmConfigClient } from '../llmConfigClient';

export interface KeyQuotaBarsProps {
  t: TranslateFn;
  providerId: string;
  keyId: string;
}

export function KeyQuotaBars({ t, providerId, keyId }: KeyQuotaBarsProps) {
  const [quota, setQuota] = useState<HostProviderKeyQuota | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (force: boolean) => {
      setLoading(true);
      try {
        setQuota(await llmConfigClient.getKeyQuota(providerId, keyId, force));
      } catch {
        setQuota(null);
      } finally {
        setLoading(false);
      }
    },
    [providerId, keyId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  if (quota && quota.supported === false) return null;

  return (
    <div className="space-y-1" data-testid="provider-key-quota" data-key-id={keyId}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          {t('providerSettings.apiKeyPool.quota.title')}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => void load(true)}
          data-testid="provider-key-quota-refresh-btn"
          aria-label={t('providerSettings.apiKeyPool.quota.refresh')}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </div>
      {quota && quota.windows.length > 0 ? (
        <ul className="space-y-1">
          {quota.windows.map((window) => {
            const measured = window.usedPercent !== null && window.usedPercent !== undefined;
            const width = measured ? Math.min(100, Math.max(0, window.usedPercent ?? 0)) : 0;
            const nearing = measured && (window.usedPercent ?? 0) >= 80;
            return (
              <li key={window.id} className="space-y-0.5" data-testid="provider-key-quota-window">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-foreground">{window.label}</span>
                  {measured ? (
                    <span className={cn('tabular-nums', nearing ? 'text-warning' : 'text-muted-foreground')}>
                      {Math.round(window.usedPercent ?? 0)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t('providerSettings.apiKeyPool.quota.stateUnavailable')}
                    </span>
                  )}
                </div>
                {measured ? (
                  <div
                    className="h-1 w-full overflow-hidden rounded-full bg-surface-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(window.usedPercent ?? 0)}
                    aria-label={window.label}
                  >
                    <div
                      className={cn('h-full rounded-full', nearing ? 'bg-warning' : 'bg-primary')}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          {t('providerSettings.apiKeyPool.quota.stateUnavailable')}
        </p>
      )}
    </div>
  );
}
