/**
 * CliAvailabilityBadge - Shows CLI installation status
 */

import { CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react';

import type { CliAuthStatus } from '@byo/domain/cli-types';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface CliAvailabilityBadgeProps {
  status: CliAuthStatus | undefined;
  loading: boolean;
  t: TranslateFn;
}

export function CliAvailabilityBadge({ status, loading, t }: CliAvailabilityBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t('settings.codeCli.checking')}
      </span>
    );
  }

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CircleDashed className="h-3 w-3" />
        {t('settings.codeCli.notInstalled')}
      </span>
    );
  }

  // Installation status
  const installBadge = status.installed ? (
    <span className="inline-flex items-center gap-1 text-xs text-primary">
      <CheckCircle2 className="h-3 w-3" />
      {t('settings.codeCli.installed')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-destructive">
      <XCircle className="h-3 w-3" />
      {t('settings.codeCli.notInstalled')}
    </span>
  );

  return <div className="flex items-center gap-3">{installBadge}</div>;
}
