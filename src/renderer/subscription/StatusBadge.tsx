/**
 * StatusBadge.tsx - Token status badge component
 */

import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

import { cn } from '../host/vendored/cn';

import type { StatusBadgeProps, StatusConfig, TokenStatus } from './types';

export const StatusBadge = ({ status, t }: StatusBadgeProps) => {
  const config: Record<TokenStatus, StatusConfig> = {
    unconfigured: {
      icon: XCircle,
      className: 'text-text-muted',
      label: t('settings.accountTokens.status.unconfigured'),
    },
    authorized: {
      icon: CheckCircle,
      className: 'text-success',
      label: t('settings.accountTokens.status.authorized'),
    },
    configured: {
      icon: CheckCircle,
      className: 'text-primary',
      label: t('settings.accountTokens.status.configured'),
    },
    expired: {
      icon: Clock,
      className: 'text-warning',
      label: t('settings.accountTokens.status.expired'),
    },
    error: {
      icon: AlertCircle,
      className: 'text-destructive',
      label: t('settings.accountTokens.status.error'),
    },
  };

  const currentStatus = status ?? 'unconfigured';
  const { icon: Icon, className, label } = config[currentStatus];

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
};
