/**
 * ManualInputModal.tsx - Modal for manual token input
 *
 * Allows users to manually enter access tokens for Claude, Codex, and Gemini.
 */

import { RefreshCw, Save, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../host/ui';
import { Input } from '../host/ui';
import { Select } from '../host/ui';
import { RevealableInput } from '../host/vendored/revealable-input';

import { subscriptionAuthClient } from '../subscriptionAuthClient';
import type { ManualInputModalProps, SubscriptionLevel } from './types';

const SUBSCRIPTION_LEVELS: SubscriptionLevel[] = ['Free', 'Pro', 'Max'];

export const ManualInputModal = ({
  t,
  platform,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  accountLabel,
  onAccountLabelChange,
  verifySupported,
}: ManualInputModalProps) => {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [subscriptionLevel, setSubscriptionLevel] = useState<SubscriptionLevel>('Free');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);
  // v1.72 verify-before-persist: offered ONLY when the host honors the option
  // (feature-detected; an older host silently ignores it, so a checked box
  // would mislead). Default ON — an invalid token should never silently land.
  const [hostVerifySupported, setHostVerifySupported] = useState(false);
  const [verify, setVerify] = useState(true);

  useEffect(() => {
    if (verifySupported !== undefined) {
      setHostVerifySupported(verifySupported);
      return;
    }
    let alive = true;
    subscriptionAuthClient
      .manualTokenVerifySupported()
      .then((supported) => {
        if (alive) setHostVerifySupported(supported);
      })
      .catch(() => {
        // Older main halves lack the probe — the checkbox stays hidden.
      });
    return () => {
      alive = false;
    };
  }, [verifySupported]);

  const handleSubmit = useCallback(async () => {
    if (!accessToken.trim()) return;

    const extra: {
      subscriptionLevel?: SubscriptionLevel;
      refreshToken?: string;
      verify?: boolean;
    } = {};
    if (platform === 'claude') {
      extra.subscriptionLevel = subscriptionLevel;
    }
    if (platform === 'gemini' && refreshToken.trim()) {
      extra.refreshToken = refreshToken.trim();
    }
    if (hostVerifySupported) {
      extra.verify = verify;
    }

    await onSubmit(accessToken.trim(), extra);
    // Reset form on success
    setAccessToken('');
    setRefreshToken('');
    setSubscriptionLevel('Free');
  }, [accessToken, refreshToken, subscriptionLevel, platform, onSubmit, hostVerifySupported, verify]);

  const handleClose = useCallback(() => {
    setAccessToken('');
    setRefreshToken('');
    setSubscriptionLevel('Free');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const subscriptionOptions = SUBSCRIPTION_LEVELS.map((level) => ({
    value: level,
    label: t(`settings.accountTokens.subscriptionLevel.${level.toLowerCase()}.label`),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-surface-1 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {t('settings.accountTokens.manual.title')}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-text-muted mb-4">
          {t(`settings.accountTokens.manual.${platform}.description`)}
        </p>

        {/* Form */}
        <div className="space-y-4">
          {/* Account label */}
          {onAccountLabelChange ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.accountTokens.accounts.labelInput')}
              </label>
              <Input
                value={accountLabel ?? ''}
                onChange={(event) => onAccountLabelChange(event.target.value)}
                placeholder={t('settings.accountTokens.accounts.labelPlaceholder')}
                data-testid="settings-manual-account-label-input"
              />
            </div>
          ) : null}

          {/* Access Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('settings.accountTokens.manual.accessToken')}
            </label>
            <RevealableInput
              revealed={showAccessToken}
              onRevealedChange={setShowAccessToken}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={t('settings.accountTokens.manual.accessToken.placeholder')}
            />
          </div>

          {/* Subscription Level (Claude only) */}
          {platform === 'claude' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.accountTokens.subscriptionLevel.label')}
              </label>
              <Select
                value={subscriptionLevel}
                onChange={(value) => setSubscriptionLevel(value as SubscriptionLevel)}
                options={subscriptionOptions}
              />
              <p className="text-xs text-text-muted">
                {t(`settings.accountTokens.subscriptionLevel.${subscriptionLevel.toLowerCase()}.desc`)}
              </p>
            </div>
          )}

          {/* Refresh Token (Gemini only) */}
          {platform === 'gemini' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.accountTokens.manual.refreshToken')}{' '}
                <span className="text-text-muted font-normal">
                  ({t('common.optional')})
                </span>
              </label>
              <RevealableInput
                revealed={showRefreshToken}
                onRevealedChange={setShowRefreshToken}
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder={t('settings.accountTokens.manual.refreshToken.placeholder')}
              />
            </div>
          )}

          {/* Verify-before-persist (v1.72; hosts that honor the option only) */}
          {hostVerifySupported ? (
            <label
              className="flex cursor-pointer items-start gap-2 rounded-md bg-surface-2 p-3 text-xs text-text-muted"
              data-testid="settings-manual-verify-toggle"
            >
              <input
                type="checkbox"
                checked={verify}
                onChange={(event) => setVerify(event.target.checked)}
                className="mt-0.5"
                data-testid="settings-manual-verify-checkbox"
              />
              <span>
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {t('settings.accountTokens.manual.verify.label')}
                </span>
                <br />
                {t('settings.accountTokens.manual.verify.desc')}
              </span>
            </label>
          ) : null}

          {/* Hint */}
          <div className="rounded-md bg-surface-2 p-3 text-xs text-text-muted">
            {t('settings.accountTokens.manual.hint')}
          </div>

          {/* Error */}
          {error ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div> : null}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!accessToken.trim() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('common.save')}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
};
