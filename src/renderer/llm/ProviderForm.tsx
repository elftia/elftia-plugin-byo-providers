import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Settings2,
} from 'lucide-react';
import React, { useState } from 'react';

import { type ApiFormat, BUILTIN_TRANSFORMERS, PROVIDER_TEMPLATES, type ProviderTemplate, type TransformerEntry } from '@byo/domain/llm';

import { Button, Input, Select, Switch } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import { TransformerConfig } from './TransformerConfig';
import type { ProviderFormData } from './types';

// Provider type options for the dropdown
const PROVIDER_TYPE_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure-openai', label: 'Azure OpenAI' },
  { value: 'openai-response', label: 'OpenAI (Responses API)' }
];

// Get template by apiFormat
const getTemplateByApiFormat = (apiFormat: ApiFormat): ProviderTemplate | undefined => {
  const templateMap: Record<ApiFormat, string> = {
    'openai': 'openai',
    'google': 'gemini',
    'anthropic': 'anthropic',
    'azure-openai': 'azure-openai',
    'openai-response': 'openai-response'
  };
  return PROVIDER_TEMPLATES.find(t => t.id === templateMap[apiFormat]);
};

interface ProviderFormProps {
  isEditing: boolean;
  isAddingNew: boolean;
  formData: ProviderFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProviderFormData>>;
  formError: string | null;
  showApiKey: boolean;
  setShowApiKey: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * provider-storage-secrets: whether the provider being edited already has a
   * stored (encrypted) key. The masked plugin port BLANKS `api_key` (it never
   * returns a stored plaintext key), so `hasKey` is the ONLY signal that a key
   * exists. When true and the field is untouched, render the "已配置/configured"
   * (`apiKeySetPlaceholder`) affordance; an empty field on save means
   * "leave it unchanged" (Option-A).
   */
  hasKey?: boolean;
  /** Same, for the coding-plan key. */
  hasCodingPlanKey?: boolean;
  onCancel: () => void;
  onSave: () => void;
}
export function ProviderForm({
  isEditing,
  isAddingNew,
  formData,
  setFormData,
  formError,
  showApiKey,
  setShowApiKey,
  hasKey,
  hasCodingPlanKey,
  onCancel,
  onSave
}: ProviderFormProps) {
  const t = useTranslation();
  // P2b-2 (`byo-p2-llm-2`) — the editable transformer collapsible (un-stubbed).
  const [showTransformerConfig, setShowTransformerConfig] = useState(false);

  // Get transformer entries from the provider config (the provider body's
  // `transformer.use`).
  const getTransformerEntries = (): TransformerEntry[] => {
    if (!formData.transformer?.use) return [];
    return formData.transformer.use;
  };

  // Update transformer entries — pure provider-body mutation; persistence rides
  // the EXISTING `updateProvider` (no IPC of its own, no host port/token).
  const handleTransformerChange = (entries: TransformerEntry[]) => {
    if (entries.length === 0) {
      setFormData(prev => ({ ...prev, transformer: undefined }));
    } else {
      setFormData(prev => ({
        ...prev,
        transformer: { use: entries }
      }));
    }
  };

  // Handle provider type change
  const handleProviderTypeChange = (apiFormat: string) => {
    const template = getTemplateByApiFormat(apiFormat as ApiFormat);
    if (template) {
      setFormData(prev => ({
        ...prev,
        apiFormat: template.apiFormat || 'openai',
        chatApiFormat: template.chatApiFormat || template.apiFormat || 'openai',
        apiType: template.apiType,
        api_base_url: template.api_base_url,
        models: [...template.models],
        modelConfigs: template.modelConfigs ? [...template.modelConfigs] : [],
        modelGroups: template.modelGroups ? [...template.modelGroups] : [],
        modelsEndpoint: template.modelsEndpoint,
        icon: template.icon,
        transformer: template.transformer,
        apiVersion: template.apiVersion
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        apiFormat: apiFormat as ApiFormat,
        apiVersion: undefined
      }));
    }
  };

  return (
    <div className="space-y-4 p-4">
      {formError ? <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
          {formError}
        </div> : null}

      {/* Provider Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('providerSettings.form.name')}</label>
        <Input
          placeholder={t('providerSettings.form.name')}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      {/* Provider Type (only for new providers) */}
      {isAddingNew ? <div className="space-y-2">
          <label className="text-sm font-medium">{t('providerSettings.form.providerType')}</label>
          <Select
            value={formData.apiFormat || 'openai'}
            onChange={handleProviderTypeChange}
            options={PROVIDER_TYPE_OPTIONS}
          />
        </div> : null}

      {/* API Key */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('providerSettings.form.apiKey')}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={hasKey && formData.api_key.length === 0
                ? t('providerSettings.form.apiKeySetPlaceholder')
                : t('providerSettings.form.apiKeyPlaceholder')}
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('providerSettings.form.apiKeyHelper')}
        </p>
      </div>

      {/* API Base URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('providerSettings.form.apiUrl')}</label>
        <Input
          placeholder={t('providerSettings.form.apiUrlPlaceholder')}
          value={formData.api_base_url}
          onChange={(e) => setFormData(prev => ({ ...prev, api_base_url: e.target.value }))}
        />
        {formData.api_base_url ? <p className="text-xs text-muted-foreground flex items-center gap-1">
            {t('providerSettings.form.apiUrlPreview')} {formData.api_base_url}
            <ExternalLink className="h-3 w-3" />
          </p> : null}
      </div>

      {/* Coding Plan Toggle */}
      <div className="border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">{t('providerSettings.form.codingPlan.label')}</label>
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.form.codingPlan.description')}
            </p>
          </div>
          <Switch
            checked={formData.codingPlan?.enabled ?? false}
            onCheckedChange={(checked) => setFormData(prev => ({
              ...prev,
              codingPlan: {
                ...prev.codingPlan,
                enabled: checked,
                baseUrl: prev.codingPlan?.baseUrl || '',
              }
            }))}
          />
        </div>
        {formData.codingPlan?.enabled ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('providerSettings.form.codingPlan.baseUrl')}
              </label>
              <Input
                placeholder={t('providerSettings.form.codingPlan.baseUrlPlaceholder')}
                value={formData.codingPlan.baseUrl || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  codingPlan: { ...prev.codingPlan!, baseUrl: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('providerSettings.form.codingPlan.apiKey')}
              </label>
              <Input
                type="password"
                placeholder={hasCodingPlanKey
                  ? t('providerSettings.form.apiKeySetPlaceholder')
                  : t('providerSettings.form.codingPlan.apiKeyPlaceholder')}
                value={formData.codingPlan.apiKey || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  codingPlan: { ...prev.codingPlan!, apiKey: e.target.value }
                }))}
              />
              <p className="text-xs text-muted-foreground">
                {t('providerSettings.form.codingPlan.apiKeyHelper')}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* API Version (Azure OpenAI only) */}
      {formData.apiFormat === 'azure-openai' ? <div className="space-y-2">
          <label className="text-sm font-medium">{t('providerSettings.form.apiVersion')}</label>
          <Input
            placeholder={t('providerSettings.form.apiVersionPlaceholder')}
            value={formData.apiVersion || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, apiVersion: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            {t('providerSettings.form.apiVersionHelper')}
          </p>
        </div> : null}

      {/* Official Anthropic API (Anthropic format only) */}
      {formData.apiFormat === 'anthropic' ? <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">{t('providerSettings.form.official')}</label>
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.form.officialHelper')}
            </p>
          </div>
          <Switch
            checked={formData.isOfficial ?? false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOfficial: checked }))}
          />
        </div> : null}

      {/* Max Concurrency */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('providerSettings.form.maxConcurrency')}</label>
        <Input
          type="number"
          min={1}
          max={100}
          placeholder="5"
          value={formData.maxConcurrency ?? ''}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
            setFormData(prev => ({ ...prev, maxConcurrency: val && val > 0 ? val : undefined }));
          }}
        />
        <p className="text-xs text-muted-foreground">
          {t('providerSettings.form.maxConcurrencyHelper')}
        </p>
      </div>

      {/* Transformer Configuration — Collapsible, editable (P2b-2 `byo-p2-llm-2`,
          un-stubbed). Pure controlled component: `BUILTIN_TRANSFORMERS` (bundled) +
          the provider body's `transformer.use`; `handleTransformerChange` updates
          `formData` and persistence rides the EXISTING `updateProvider`. NO IPC,
          port, or token of its own. Only when editing an existing provider. */}
      {!isAddingNew && (
        <div className="border rounded-lg">
          <button
            type="button"
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            onClick={() => setShowTransformerConfig(!showTransformerConfig)}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('providerSettings.form.transformerConfig')}</span>
              {getTransformerEntries().length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {getTransformerEntries().length}
                </span>
              )}
            </div>
            {showTransformerConfig ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showTransformerConfig ? <div className="p-3 border-t">
              <p className="text-xs text-muted-foreground mb-3">
                {t('providerSettings.form.transformerConfigDescription')}
              </p>
              <TransformerConfig
                availableTransformers={BUILTIN_TRANSFORMERS}
                selectedTransformers={getTransformerEntries()}
                onChange={handleTransformerChange}
              />
            </div> : null}
        </div>
      )}

      {/* Enabled */}
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
        />
        <label className="text-sm">{t('providerSettings.form.enabled')}</label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('providerSettings.form.buttons.cancel')}
        </Button>
        <Button onClick={onSave}>
          {isEditing
            ? t('providerSettings.form.buttons.submitUpdate')
            : t('providerSettings.form.buttons.submitAdd')}
        </Button>
      </div>
    </div>
  );
}
