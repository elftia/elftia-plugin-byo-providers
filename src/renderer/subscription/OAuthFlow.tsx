/**
 * OAuthFlow.tsx - OAuth authorization flow UI component
 *
 * Provides step-by-step guidance for OAuth and Setup Token authorization flows.
 */

import { Check, CheckCircle, Copy, ExternalLink,RefreshCw } from 'lucide-react';
import { useCallback,useState } from 'react';

import { Button } from '../host/ui';
import { Input } from '../host/ui';

import type { OAuthFlowProps } from './types';

export const OAuthFlow = ({
  t,
  platform: _platform,
  oauthParams,
  accountLabel,
  authCode,
  isExchanging,
  error,
  onAccountLabelChange,
  onAuthCodeChange,
  onExchange,
  onCancel,
}: OAuthFlowProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    if (!oauthParams.authUrl) return;
    try {
      await navigator.clipboard.writeText(oauthParams.authUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors
    }
  }, [oauthParams.authUrl]);

  const handleOpenUrl = useCallback(() => {
    window.open(oauthParams.authUrl, '_blank');
  }, [oauthParams.authUrl]);

  return (
    <div className="space-y-4">
      {onAccountLabelChange ? (
        <div className="rounded-md bg-surface-2 p-4 space-y-2">
          <label
            htmlFor="oauth-account-label"
            className="text-sm font-medium text-foreground"
          >
            {t('settings.accountTokens.accounts.labelInput')}
          </label>
          <Input
            id="oauth-account-label"
            value={accountLabel ?? ''}
            onChange={(event) => onAccountLabelChange(event.target.value)}
            placeholder={t('settings.accountTokens.accounts.labelPlaceholder')}
            data-testid="settings-oauth-account-label-input"
          />
        </div>
      ) : null}

      {/* Step 1: Open Auth URL */}
      <div className="rounded-md bg-surface-2 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            1
          </span>
          <span className="font-medium text-foreground">
            {t('settings.accountTokens.oauth.step1.title')}
          </span>
        </div>
        <p className="text-sm text-text-muted pl-8">
          {t('settings.accountTokens.oauth.step1.desc')}
        </p>
        <div className="flex items-center gap-2 pl-8">
          <Button onClick={handleOpenUrl} variant="default" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('settings.accountTokens.oauth.openAuthPage')}
          </Button>
        </div>
      </div>

      {/* Step 2: Auth URL Info */}
      <div className="rounded-md bg-surface-2 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            2
          </span>
          <span className="font-medium text-foreground">
            {t('settings.accountTokens.oauth.step2.title')}
          </span>
        </div>
        <p className="text-sm text-text-muted pl-8">
          {t('settings.accountTokens.oauth.step2.desc')}
        </p>
      </div>

      {/* Step 3: Copy Auth Code */}
      <div className="rounded-md bg-surface-2 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            3
          </span>
          <span className="font-medium text-foreground">
            {t('settings.accountTokens.oauth.step3.title')}
          </span>
        </div>
        <p className="text-sm text-text-muted pl-8">
          {t('settings.accountTokens.oauth.step3.desc')}
        </p>
      </div>

      {/* Step 4: Paste Auth Code */}
      <div className="rounded-md bg-surface-2 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            4
          </span>
          <span className="font-medium text-foreground">
            {t('settings.accountTokens.oauth.step4.title')}
          </span>
        </div>
        <p className="text-sm text-text-muted pl-8">
          {t('settings.accountTokens.oauth.step4.desc')}
        </p>
        <div className="pl-8">
          <input
            type="text"
            value={authCode}
            onChange={(e) => onAuthCodeChange(e.target.value)}
            placeholder={t('settings.accountTokens.oauthFlow.codePlaceholder')}
            className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Error Message */}
      {error ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div> : null}

      {/* Auth URL (collapsible) */}
      <details className="rounded-md bg-surface-1/50 p-3">
        <summary className="text-sm text-text-muted cursor-pointer">
          {t('settings.accountTokens.oauth.showUrl')}
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 text-xs bg-surface-1 rounded px-2 py-1 truncate">
            {oauthParams.authUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyUrl}
            className="flex-shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </details>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={onExchange}
          disabled={!authCode.trim() || isExchanging}
          className="flex-1"
        >
          {isExchanging ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {t('settings.accountTokens.oauthFlow.authorize')}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
};
