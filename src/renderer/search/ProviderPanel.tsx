/**
 * ProviderPanel.tsx — API 服务商配置面板 (relocated from the host
 * `web-search-tab/panels/ProviderPanel.tsx`, P2d design D1/D3/D4/D5).
 *
 * Displays a single API-key search provider's config form over the MASKED
 * `host.services.searchConfig` port:
 *   - provider info (name / description / website)
 *   - enabled switch                          → `configureProvider` (non-secret)
 *   - API Key input (Option-A reveal)         → `setProviderKey` (the ONLY key path)
 *   - API Host (required for searxng)         → `configureProvider` (non-secret)
 *   - searxng HTTP basic-auth                 → `configureProvider` (non-secret)
 *   - Validate button                         → `validate` (on the port)
 *
 * DEVIATIONS FROM THE HOST COPY (intentional):
 *   - imports repointed to the `host/` bridge (host.ui primitives + vendored
 *     label / cn / revealable-input / useTranslation) — NO `@/...` survives.
 *   - the SLICED Test-Search block (state + handler + UI) is REMOVED: it called
 *     host-only `window.native.webSearch.search` (query EXECUTION), which is NOT
 *     on the config port (the LLM ModelTest analog, design D5). `validate` stays.
 *   - Option-A (design D4): the masked port never returns a stored plaintext key,
 *     so the key field holds only the just-typed local value; a configured
 *     provider shows a "已配置/configured" indicator + dots. An empty key field on
 *     save does NOT call `setProviderKey` (the empty-skip guard) — the stored key
 *     is retained.
 *
 * @module byo-providers/renderer/search/ProviderPanel
 */
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import * as React from 'react';

import { Button, Input, Switch } from '../host/ui';
import { cn } from '../host/vendored/cn';
import { Label } from '../host/vendored/label';
import { RevealableInput } from '../host/vendored/revealable-input';
import { useTranslation } from '../host/vendored/useTranslation';

import type { WebSearchProvider, WebSearchProviderId } from './meta';
import { WEB_SEARCH_PROVIDER_META } from './meta';

interface ProviderPanelProps {
  providerId: WebSearchProviderId;
  /** The provider's current non-secret config (enabled/apiHost/basic-auth). */
  provider: WebSearchProvider | undefined;
  /** Option-A: whether a stored key/config exists (drives the "configured" hint). */
  configured: boolean;
  /** Non-secret config write (enabled / apiHost / basic-auth — NEVER the key). */
  onUpdate: (id: WebSearchProviderId, updates: Partial<WebSearchProvider>) => void;
  /**
   * Write the API key through the dedicated one-way `setProviderKey` relay. Empty
   * is skipped by the caller (leaves the stored key). Separate from `onUpdate`
   * because the key never rides the non-secret config push.
   */
  onWriteKey: (id: WebSearchProviderId, apiKey: string) => void;
  onValidate: (id: WebSearchProviderId) => Promise<{ valid: boolean; error?: string }>;
}

export function ProviderPanel({
  providerId,
  provider,
  configured,
  onUpdate,
  onWriteKey,
  onValidate,
}: ProviderPanelProps) {
  const t = useTranslation();
  const [validating, setValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const [showApiKey, setShowApiKey] = React.useState(false);

  // Option-A: the key field holds ONLY the just-typed local value for this
  // session. The masked port never hands the plugin a plaintext stored key, so
  // this starts empty even for a configured provider (it shows the indicator
  // instead). Reset when switching providers.
  const [apiKeyDraft, setApiKeyDraft] = React.useState('');
  React.useEffect(() => {
    setApiKeyDraft('');
    setShowApiKey(false);
    setValidationResult(null);
  }, [providerId]);

  const providerMeta = WEB_SEARCH_PROVIDER_META[providerId];

  const currentProvider: WebSearchProvider = provider || {
    id: providerId,
    name: providerMeta.name,
    type: providerMeta.type,
    enabled: true,
    apiHost: '',
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await onValidate(providerId);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div data-testid="provider-panel" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">{providerMeta.name}</h3>
          <p className="text-sm text-muted-foreground">{providerMeta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {providerMeta.website ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(providerMeta.website, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          ) : null}
          <Switch
            checked={currentProvider.enabled}
            onCheckedChange={(checked) => onUpdate(providerId, { enabled: checked })}
          />
        </div>
      </div>

      {/* Configuration Form */}
      <div className="rounded-lg border border-border/50 bg-surface-1/50 p-4 space-y-4">
        {/* API Key (for providers that require it) */}
        {providerMeta.requiresApiKey ? (
          <div className="space-y-2">
            <Label className="text-sm">{t('settings.webSearch.apiKey')}</Label>
            <RevealableInput
              revealed={showApiKey}
              onRevealedChange={setShowApiKey}
              value={apiKeyDraft}
              onChange={(e) => {
                setApiKeyDraft(e.target.value);
                onWriteKey(providerId, e.target.value);
              }}
              placeholder={
                configured
                  ? t('settings.webSearch.validationSuccess')
                  : t('settings.webSearch.apiKeyPlaceholder')
              }
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.webSearch.apiKeyMultiple')}
            </p>
          </div>
        ) : null}

        {/* API Host (optional for most, required for Searxng) */}
        <div className="space-y-2">
          <Label className="text-sm">
            {t('settings.webSearch.apiHost')}
            {providerId === 'searxng' && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            type="url"
            value={currentProvider.apiHost || ''}
            onChange={(e) => onUpdate(providerId, { apiHost: e.target.value })}
            placeholder={
              providerId === 'searxng'
                ? 'https://your-searxng-instance.com'
                : t('settings.webSearch.apiHostPlaceholder')
            }
          />
        </div>

        {/* Basic Auth for Searxng */}
        {providerId === 'searxng' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('settings.webSearch.basicAuthUsername')}</Label>
              <Input
                type="text"
                value={currentProvider.basicAuthUsername || ''}
                onChange={(e) => onUpdate(providerId, { basicAuthUsername: e.target.value })}
                placeholder={t('settings.webSearch.optional')}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('settings.webSearch.basicAuthPassword')}</Label>
              <Input
                type="password"
                value={currentProvider.basicAuthPassword || ''}
                onChange={(e) => onUpdate(providerId, { basicAuthPassword: e.target.value })}
                placeholder={t('settings.webSearch.optional')}
              />
            </div>
          </div>
        )}

        {/* Validation (Test-Search query execution is sliced — host-only) */}
        <div className="flex items-center gap-4 pt-2">
          <Button variant="outline" size="sm" onClick={handleValidate} disabled={validating}>
            {validating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {t('settings.webSearch.validate')}
          </Button>

          {validationResult ? (
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                validationResult.valid ? 'text-green-500' : 'text-red-500',
              )}
            >
              {validationResult.valid ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('settings.webSearch.validationSuccess')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  {validationResult.error || t('settings.webSearch.validationFailed')}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
