import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import * as React from 'react';

import { Button, Input, Select, Switch } from '../host/ui';
import { Label } from '../host/vendored/label';
import { RevealableInput } from '../host/vendored/revealable-input';
import { useTranslation } from '../host/vendored/useTranslation';
import { openExternal } from '../externalLinksClient';

import type { WebSearchProvider, WebSearchProviderId } from './meta';
import { WEB_SEARCH_PROVIDER_META } from './meta';

interface ProviderPanelProps {
  providerId: WebSearchProviderId;
  provider: WebSearchProvider | undefined;
  configured: boolean;
  onUpdate: (id: WebSearchProviderId, updates: Partial<WebSearchProvider>) => void;
  onWriteKey: (id: WebSearchProviderId, apiKey: string) => void;
  onClearKey: (id: WebSearchProviderId) => void;
  onValidate: (id: WebSearchProviderId) => Promise<{ valid: boolean; error?: string }>;
}

export function ProviderPanel({
  providerId, provider, configured, onUpdate, onWriteKey, onClearKey, onValidate,
}: ProviderPanelProps) {
  const t = useTranslation();
  const [validating, setValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<{ valid: boolean; error?: string } | null>(null);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [apiKeyDraft, setApiKeyDraft] = React.useState('');
  const [basicAuthPasswordDraft, setBasicAuthPasswordDraft] = React.useState('');
  const validationRequest = React.useRef(0);
  const revision = React.useRef(0);
  React.useEffect(() => {
    revision.current += 1;
    validationRequest.current += 1;
    setBasicAuthPasswordDraft('');
    setApiKeyDraft('');
    setShowApiKey(false);
    setValidating(false);
    setValidationResult(null);
  }, [providerId]);

  const meta = WEB_SEARCH_PROVIDER_META[providerId];
  const current: WebSearchProvider = provider ?? { id: providerId, name: meta.name, type: meta.type, enabled: false };
  const publicMode = meta.supportsPublic && (current.authMode ?? 'public') === 'public';
  const update = (changes: Partial<WebSearchProvider>) => {
    revision.current += 1;
    setValidationResult(null);
    onUpdate(providerId, changes);
  };
  const handleValidate = async () => {
    const requestRevision = revision.current;
    const request = ++validationRequest.current;
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await onValidate(providerId);
      if (revision.current === requestRevision) setValidationResult(result);
    } catch (error) {
      if (revision.current === requestRevision) setValidationResult({
        valid: false, error: error instanceof Error ? error.message : t('settings.webSearch.validationFailed'),
      });
    } finally {
      if (validationRequest.current === request) setValidating(false);
    }
  };

  return (
    <div data-testid="provider-panel" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">{meta.name}</h3>
          <p className="text-sm text-muted-foreground">
            {t(providerId === 'deepseek' ? 'settings.webSearch.deepseekDescription'
              : providerId === 'searxng' ? 'settings.webSearch.selfHostedDescription'
                : publicMode ? 'settings.webSearch.publicDescription' : 'settings.webSearch.keyedDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meta.website ? (
            <Button data-testid={`settings-button-search-${providerId}-website`} variant="ghost" size="sm"
              aria-label={t('settings.webSearch.openWebsite', { provider: meta.name })}
              onClick={() => void openExternal(meta.website ?? '')}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </Button>
          ) : null}
          <Switch data-testid={`settings-button-search-${providerId}-toggle`} aria-label={meta.name}
            checked={current.enabled} onCheckedChange={(enabled) => update({ enabled })} />
        </div>
      </div>
      <div className="space-y-4 rounded-lg border border-border/50 bg-surface-1/50 p-4">
        {meta.supportsPublic ? (
          <div className="space-y-2">
            <Label htmlFor={`search-${providerId}-mode`}>{t('settings.webSearch.authMode')}</Label>
            <Select id={`search-${providerId}-mode`} data-testid="settings-input-search-auth-mode" value={current.authMode ?? 'public'}
              onChange={(value) => update({ authMode: value === 'api' ? 'api' : 'public' })}
              options={[
                { value: 'public', label: t('settings.webSearch.publicMode') },
                { value: 'api', label: t('settings.webSearch.apiMode') },
              ]} />
            <p className="text-xs text-muted-foreground">{t('settings.webSearch.modeKeyRetention')}</p>
          </div>
        ) : null}
        {meta.requiresApiKey ? (
          <div className="space-y-2">
            <Label htmlFor={`search-${providerId}-key`}>
              {t('settings.webSearch.apiKey')} ({t(publicMode || providerId === 'deepseek'
                ? 'settings.webSearch.optional' : 'settings.webSearch.required')})
            </Label>
            <RevealableInput id={`search-${providerId}-key`} data-testid="settings-input-search-api-key"
              aria-label={t('settings.webSearch.apiKey')} revealed={showApiKey} onRevealedChange={setShowApiKey}
              value={apiKeyDraft} onChange={(event) => {
                revision.current += 1;
                setValidationResult(null);
                setApiKeyDraft(event.target.value);
                onWriteKey(providerId, event.target.value);
              }} placeholder={t('settings.webSearch.apiKeyPlaceholder')} />
            <p data-testid={providerId === 'deepseek' ? 'deepseek-key-status' : 'settings-container-search-readiness'}
              className="text-xs text-muted-foreground">
              {t(configured ? 'settings.webSearch.configurationReady' : 'settings.webSearch.configurationMissing')}
            </p>
            {providerId === 'deepseek' ? <p className="text-xs text-muted-foreground">{t('settings.webSearch.deepseekKeyReuse')}</p> : null}
            <Button data-testid="settings-button-clear-search-key" variant="outline" size="sm" onClick={() => {
              revision.current += 1;
              setValidationResult(null);
              setApiKeyDraft('');
              onClearKey(providerId);
            }}>{t(providerId === 'deepseek' ? 'settings.webSearch.clearOverride' : 'settings.webSearch.clearKey')}</Button>
          </div>
        ) : null}
        {!publicMode ? (
          <div className="space-y-2">
            <Label htmlFor={`search-${providerId}-host`}>{t('settings.webSearch.apiHost')}
              {providerId === 'searxng' ? ` (${t('settings.webSearch.required')})` : null}
            </Label>
            <Input id={`search-${providerId}-host`} data-testid="settings-input-search-api-host" type="url"
              value={current.apiHost ?? ''} onChange={(event) => update({ apiHost: event.target.value })}
              placeholder={providerId === 'searxng' ? 'https://your-searxng-instance.com' : t('settings.webSearch.apiHostPlaceholder')} />
          </div>
        ) : null}
        {meta.modelPlaceholder ? (
          <div className="space-y-2">
            <Label htmlFor={`search-${providerId}-model`}>{t('settings.webSearch.model')}</Label>
            <Input id={`search-${providerId}-model`} data-testid="settings-input-search-model"
              value={current.model ?? ''} placeholder={meta.modelPlaceholder}
              onChange={(event) => update({ model: event.target.value })} />
          </div>
        ) : null}
        {providerId === 'searxng' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-searxng-username">{t('settings.webSearch.basicAuthUsername')}</Label>
              <Input id="search-searxng-username" data-testid="settings-input-search-basic-username"
                value={current.basicAuthUsername ?? ''} onChange={(event) => update({ basicAuthUsername: event.target.value })}
                placeholder={t('settings.webSearch.optional')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-searxng-password">{t('settings.webSearch.basicAuthPassword')}</Label>
              <Input id="search-searxng-password" data-testid="settings-input-search-basic-password" type="password"
                value={basicAuthPasswordDraft} onChange={(event) => {
                  setBasicAuthPasswordDraft(event.target.value);
                  if (event.target.value) update({ basicAuthPassword: event.target.value });
                }} placeholder={t('settings.webSearch.passwordPlaceholder')} />
              <Button data-testid="settings-button-clear-search-password" variant="outline" size="sm" onClick={() => {
                setBasicAuthPasswordDraft('');
                update({ basicAuthPassword: '' });
              }}>{t('settings.webSearch.clearPassword')}</Button>
            </div>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">{t('settings.webSearch.preferenceFallback')}</p>
        <div className="flex items-center gap-4 pt-2">
          <Button data-testid="settings-button-search-validate" variant="outline" size="sm"
            onClick={() => void handleValidate()} disabled={validating}>
            {validating ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('settings.webSearch.validate')}
          </Button>
          {validationResult ? (
            <div role="status" data-testid="settings-container-search-validation"
              className={`flex items-center gap-2 text-sm ${validationResult.valid ? 'text-primary' : 'text-destructive'}`}>
              {validationResult.valid ? <Check aria-hidden="true" className="h-4 w-4" /> : <X aria-hidden="true" className="h-4 w-4" />}
              {validationResult.valid ? t('settings.webSearch.validationSuccess')
                : validationResult.error || t('settings.webSearch.validationFailed')}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
