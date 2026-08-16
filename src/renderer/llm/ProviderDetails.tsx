import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  RotateCcw,
  Settings2,
  TestTube,
  Trash2,
  X
} from 'lucide-react';
import React, { useState } from 'react';

import type { LLMProvider, ModelConfig, ModelGroup } from '@byo/domain/llm';

import { Badge, Button, ConfirmDialog, Input, Switch } from '../host/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../host/vendored/dialog';
import { FormField } from '../host/vendored/form-field';
import { RevealableInput } from '../host/vendored/revealable-input';
import { SettingRow } from '../host/vendored/setting-row';
import { useTranslation } from '../host/vendored/useTranslation';

import { ApiKeyPoolSection } from './ApiKeyPoolSection';
import { ModelTestDialog } from './ModelTestDialog';
import { ProviderApiModeSwitcher } from './ProviderApiModeSwitcher';
import { getProviderDisplayName } from './utils';

interface ProviderDetailsProps {
  selectedProvider: LLMProvider | null;
  visibleModelGroups: ModelGroup[];
  inlineName: string;
  setInlineName: (val: string) => void;
  inlineApiKey: string;
  setInlineApiKey: (val: string) => void;
  /** provider-key-reveal: display-only fetched key (overrides inlineApiKey when non-null). */
  revealedApiKey?: string | null;
  /** provider-key-reveal: eye toggle that fetches the stored key on show. */
  onToggleShowApiKey?: (next: boolean | undefined) => void;
  /** provider-key-reveal: input change that drops the display-only override. */
  onApiKeyInputChange?: (val: string) => void;
  inlineApiUrl: string;
  setInlineApiUrl: (val: string) => void;
  inlineModelsEndpoint: string;
  setInlineModelsEndpoint: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  modelStatus: { type: 'success' | 'error'; message: string } | null;
  modelSearch: string;
  setModelSearch: (val: string) => void;
  collapsedGroups: Record<string, boolean>;
  toggleGroupCollapse: (id: string) => void;
  editingModel: { id: string; name: string } | null;
  setEditingModel: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;

  inlineMaxConcurrency: string;
  setInlineMaxConcurrency: (val: string) => void;

  onInlineUpdate: (field: string, value: string) => Promise<void>;
  onSelectApiMode?: (modeId: string, opts?: { keepCustomizations?: boolean }) => Promise<boolean>;
  onToggleProvider: (enabled: boolean) => Promise<void>;
  onToggleOfficial: (isOfficial: boolean) => Promise<void>;
  onDeleteProvider: () => Promise<void>;
  /** Reset this provider to catalog defaults (provider-storage-overlay). */
  onResetProvider?: (id?: string) => Promise<void>;
  onShowManageModels: () => void;
  onShowAddModelDialog: () => void;
  onApplyModelEdit: () => Promise<void>;
  onToggleModelEnabled: (id: string, enabled: boolean) => Promise<void>;
  onRemoveModel: (id: string) => Promise<void>;
  onShowEditModelDialog: (model: ModelConfig) => void;
}

export function ProviderDetails({
  selectedProvider,
  visibleModelGroups,
  inlineName,
  setInlineName,
  inlineApiKey,
  setInlineApiKey,
  revealedApiKey,
  onToggleShowApiKey,
  onApiKeyInputChange,
  inlineApiUrl,
  setInlineApiUrl,
  inlineModelsEndpoint,
  setInlineModelsEndpoint,
  showApiKey,
  setShowApiKey,
  modelStatus,
  modelSearch,
  setModelSearch,
  collapsedGroups,
  toggleGroupCollapse,
  editingModel,
  setEditingModel,
  inlineMaxConcurrency,
  setInlineMaxConcurrency,
  onInlineUpdate,
  onSelectApiMode,
  onToggleProvider,
  onToggleOfficial,
  onDeleteProvider,
  onResetProvider,
  onShowManageModels,
  onShowAddModelDialog,
  onApplyModelEdit,
  onToggleModelEnabled,
  onRemoveModel,
  onShowEditModelDialog
}: ProviderDetailsProps) {
  const t = useTranslation();
  const [pendingModeSwitch, setPendingModeSwitch] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  // P2b-2 (`byo-p2-llm-2`) — the model under connectivity test (the dialog opens
  // when set; auto-runs the probe over `llm.testModel`). No secret crosses.
  const [testingModel, setTestingModel] = useState<{ id: string; name: string } | null>(null);

  if (!selectedProvider) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {t('providerSettings.details.noSelection')}
      </div>
    );
  }

  const emptyState = visibleModelGroups.length === 0;

  // provider-storage-overlay: show "restore defaults" only when the user has
  // customized a preset-tracked field. `overriddenFields` is the read-only
  // projection of the backend `userOverrides.fields`, and is ONLY ever populated
  // for preset-derived rows by `resolveEffectiveProvider` — so a non-empty list
  // already implies preset-derived (custom rows get `[]`).
  const hasOverrides = Boolean(
    onResetProvider && (selectedProvider.overriddenFields?.length ?? 0) > 0,
  );

  const getGroupDisplayName = (group: ModelGroup) => {
    if (group.id === 'default') {
      return t('providerSettings.modelsManager.defaultGroup');
    }
    return group.name || group.id;
  };

  const getApiFormatLabel = (provider: LLMProvider): string => {
    // Use apiFormat (v3 field) first, fall back to apiType for legacy
    const format = provider.apiFormat || provider.apiType;
    switch (format) {
      case 'anthropic':
        return t('providerSettings.tags.anthropic');
      case 'google':
        return t('providerSettings.tags.gemini');
      case 'claudecode':
        return t('providerSettings.tags.claudeCode');
      case 'openai':
      default:
        return t('providerSettings.tags.openai');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            {selectedProvider.isSystem ? (
              // Built-in providers display a locale-aware translated name and
              // can't be renamed. This avoids the "user-rename vs i18n" tug
              // of war and keeps the UI consistent across locales.
              <h2 className="h-9 text-lg font-semibold flex items-center px-0">
                {getProviderDisplayName(t, selectedProvider)}
              </h2>
            ) : (
              <Input
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                onBlur={() => {
                  if (inlineName.trim() && inlineName !== selectedProvider.name) {
                    void onInlineUpdate('name', inlineName.trim());
                  }
                }}
                className="h-9 text-lg font-semibold border-transparent hover:border-border focus:border-border bg-transparent px-0"
              />
            )}
            <Badge variant="outline">
              {getApiFormatLabel(selectedProvider)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Restore-defaults — only when this preset-derived row has user
              overrides (provider-storage-overlay). Clears userOverrides so the
              live catalog flows again; key + sessions preserved. */}
          {hasOverrides ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmResetOpen(true)}
              title={t('providerSettings.reset.button')}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('providerSettings.reset.button')}
            </Button>
          ) : null}
          <Switch
            checked={selectedProvider.enabled}
            onCheckedChange={onToggleProvider}
          />
          {/* Delete button - only for non-system providers */}
          {!selectedProvider.isSystem && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => void onDeleteProvider()}
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* API Key - Inline Editable. The masked plugin port BLANKS `api_key` and
          never returns a stored plaintext key, so the field starts EMPTY for a
          configured provider; `selectedProvider.hasKey` is the only "configured"
          signal — when set and the field is untouched we show the
          "已配置/configured" (`apiKeySetPlaceholder`) affordance. The eye fetches
          the stored key through the explicit reveal verb (v1.50) and shows it
          READ-ONLY (a revealed value never enters the editable/persist state);
          hiding or editing drops it. An empty blur leaves the stored key
          unchanged (Option-A). */}
      <FormField
        label={t('providerSettings.credentials.apiKey')}
        description={t('providerSettings.form.apiKeyHelper')}
      >
        <RevealableInput
          revealed={showApiKey}
          onRevealedChange={onToggleShowApiKey ?? setShowApiKey}
          placeholder={selectedProvider.hasKey && inlineApiKey.length === 0 && revealedApiKey == null
            ? t('providerSettings.form.apiKeySetPlaceholder')
            : t('providerSettings.form.apiKeyPlaceholder')}
          value={revealedApiKey ?? inlineApiKey}
          readOnly={revealedApiKey != null}
          onChange={(e) => {
            if (revealedApiKey != null && onApiKeyInputChange) {
              onApiKeyInputChange(e.target.value);
            } else {
              setInlineApiKey(e.target.value);
            }
          }}
          onBlur={() => {
            // Only persist a non-empty replacement; empty = leave unchanged.
            if (inlineApiKey.trim().length > 0 && inlineApiKey !== (selectedProvider.api_key || '')) {
              onInlineUpdate('api_key', inlineApiKey);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </FormField>

      {/* API Key Pool */}
      <ApiKeyPoolSection providerId={selectedProvider.id} />

      {/* API mode switcher — only renders when provider declares >= 2 modes */}
      {(() => {
        const apiModes = selectedProvider.apiModes;
        if (!apiModes || apiModes.length < 2 || !onSelectApiMode) return null;
        return (
        <FormField label={t('apiMode.label')}>
          <div className="flex flex-col gap-1.5">
            <ProviderApiModeSwitcher
              modes={apiModes}
              selectedId={selectedProvider.selectedApiModeId}
              onChange={(modeId) => {
                if (modeId === selectedProvider.selectedApiModeId) return;
                const next = apiModes.find(m => m.id === modeId);
                const current = apiModes.find(m => m.id === selectedProvider.selectedApiModeId);
                if (!next) return;
                // If user customized URL or key away from current mode default, ask before overwriting.
                const urlIsCustom = !!current && (selectedProvider.api_base_url || '') !== current.baseUrl;
                const keyIsCustom = !!current && current.apiKey !== undefined && (selectedProvider.api_key || '') !== current.apiKey;
                if (urlIsCustom || keyIsCustom) {
                  setPendingModeSwitch(modeId);
                } else {
                  void onSelectApiMode(modeId);
                }
              }}
            />
            {(() => {
              const active = apiModes.find(m => m.id === selectedProvider.selectedApiModeId);
              if (!active?.note) return null;
              return <p className="text-[11px] text-muted-foreground">{t(active.note) || active.note}</p>;
            })()}
            {(() => {
              const active = apiModes.find(m => m.id === selectedProvider.selectedApiModeId);
              if (!active?.apiKeyPrefix) return null;
              return (
                <p className="text-[11px] text-muted-foreground">
                  {t('apiMode.apiKeyPrefixHint', { prefix: active.apiKeyPrefix })}
                </p>
              );
            })()}
          </div>
        </FormField>
        );
      })()}

      <Dialog
        open={pendingModeSwitch !== null}
        onOpenChange={(open) => { if (!open) setPendingModeSwitch(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('apiMode.confirmOverwriteTitle')}</DialogTitle>
            <DialogDescription>{t('apiMode.confirmOverwriteBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingModeSwitch(null)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingModeSwitch && onSelectApiMode) {
                  void onSelectApiMode(pendingModeSwitch, { keepCustomizations: true });
                }
                setPendingModeSwitch(null);
              }}
            >
              {t('apiMode.keepCustomizations')}
            </Button>
            <Button
              onClick={() => {
                if (pendingModeSwitch && onSelectApiMode) {
                  void onSelectApiMode(pendingModeSwitch);
                }
                setPendingModeSwitch(null);
              }}
            >
              {t('apiMode.overwriteAndSwitch')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API URL - Inline Editable */}
      <FormField
        label={t('providerSettings.credentials.apiBaseUrl')}
        labelAction={selectedProvider.website ? (
          <a
            href={selectedProvider.website}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={t('mediaSettings.common.learnMore')}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : undefined}
      >
        <Input
          placeholder={selectedProvider.api_base_url || t('providerSettings.form.apiUrlPlaceholder')}
          value={inlineApiUrl}
          onChange={(e) => setInlineApiUrl(e.target.value)}
          onBlur={() => {
            if (inlineApiUrl !== (selectedProvider.api_base_url || '')) {
              onInlineUpdate('api_base_url', inlineApiUrl);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </FormField>

      {/* Official Anthropic API toggle (Anthropic format only) */}
      {(selectedProvider.apiFormat || selectedProvider.apiType) === 'anthropic' ? (
        <SettingRow
          label={t('providerSettings.form.official')}
          description={t('providerSettings.form.officialHelper')}
          className="border-0 bg-transparent px-0"
        >
          <Switch
            checked={selectedProvider.isOfficial ?? false}
            onCheckedChange={onToggleOfficial}
          />
        </SettingRow>
      ) : null}

      {/* Max Concurrent Requests — `-1` means unlimited (matches runtime check
          in AgentProxyServer: `> 0` creates a semaphore, anything else doesn't). */}
      <FormField label={t('providerSettings.form.maxConcurrency')} description={t('providerSettings.form.maxConcurrencyHelper')}>
        <Input
          type="number"
          min={-1}
          max={100}
          placeholder="-1"
          value={inlineMaxConcurrency}
          onChange={(e) => setInlineMaxConcurrency(e.target.value)}
          onBlur={() => {
            const current = selectedProvider.maxConcurrency != null ? String(selectedProvider.maxConcurrency) : '';
            if (inlineMaxConcurrency !== current) {
              void onInlineUpdate('maxConcurrency', inlineMaxConcurrency);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </FormField>

      {modelStatus ? <div
          className={`text-xs px-3 py-2 rounded border ${
            modelStatus.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {modelStatus.message}
        </div> : null}

      {/* Model management section */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px]">
            <Input
              placeholder={t('providerSettings.modelsManager.searchPlaceholder')}
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              className="pr-8"
            />
            {modelSearch ? <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => setModelSearch('')}
              >
                <X className="h-4 w-4" />
              </button> : null}
          </div>
          {/* Manage button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShowManageModels}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            {t('providerSettings.modelsManager.manage')}
          </Button>
          {/* Add model button */}
          <Button
            type="button"
            size="sm"
            onClick={onShowAddModelDialog}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('providerSettings.modelsManager.add')}
          </Button>
        </div>
        {/* Models endpoint */}
        <div className="space-y-1">
          <label className="text-xs font-medium">{t('providerSettings.details.modelsEndpoint')}</label>
          <Input
            value={inlineModelsEndpoint}
            placeholder={`${selectedProvider.api_base_url?.replace(/\/chat\/completions$/, '/models') || ''}`}
            onChange={(e) => setInlineModelsEndpoint(e.target.value)}
            onBlur={() => {
              if ((inlineModelsEndpoint || '') !== (selectedProvider.modelsEndpoint || '')) {
                void onInlineUpdate('modelsEndpoint', inlineModelsEndpoint.trim());
              }
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            {t('providerSettings.details.modelsEndpointHelper')}
          </p>
        </div>
      </div>

      {/* Model list - always shown */}
      <div className="space-y-2">
        {emptyState ? (
          <div className="text-sm text-muted-foreground italic">
            {t('providerSettings.modelsManager.empty')}
          </div>
        ) : (
          visibleModelGroups.map(group => (
            <div key={group.id} className="border rounded-md overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors"
                onClick={() => toggleGroupCollapse(group.id)}
              >
                <div>
                  <div className="text-sm font-medium">{getGroupDisplayName(group)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('providerSettings.listStatus', { count: group.models.length })}
                  </div>
                </div>
                {collapsedGroups[group.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              {!collapsedGroups[group.id] && (
                <div className="divide-y">
                  {group.models.map(model => {
                    const isEditing = editingModel?.id === model.id;
                    const enabled = model.enabled !== false;
                    return (
                      <div key={model.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingModel?.name || ''}
                                onChange={(e) =>
                                  setEditingModel(prev =>
                                    prev ? { ...prev, name: e.target.value } : prev
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    void onApplyModelEdit();
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingModel(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button size="sm" onClick={() => void onApplyModelEdit()}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingModel(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-sm truncate">{model.name || model.id}</div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground truncate">{model.id}</span>
                                {model.vision ? <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">{t('providerSettings.modelsManager.filters.vision')}</Badge> : null}
                                {model.reasoning ? <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">{t('providerSettings.modelsManager.filters.reasoning')}</Badge> : null}
                              </div>
                            </>
                          )}
                        </div>
                        {!isEditing && (
                          <>
                            <Badge variant={enabled ? 'outline' : 'secondary'}>
                              {enabled
                                ? t('providerSettings.modelsManager.enabled')
                                : t('providerSettings.modelsManager.disabled')}
                            </Badge>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) => {
                                void onToggleModelEnabled(model.id, checked);
                              }}
                            />
                            {/* Model-test button (P2b-2 `byo-p2-llm-2`): wired to
                                `llmConfigClient.testModel` via the `llm.testModel`
                                relay → `host.services.llmConfig.testModel`. No
                                secret crosses (a connectivity diagnostic only). */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={t('providerSettings.modelsManager.testDialog.testButton')}
                              onClick={() => setTestingModel({ id: model.id, name: model.name || model.id })}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onShowEditModelDialog(model)}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/80"
                              onClick={() => void onRemoveModel(model.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Model Test Dialog (P2b-2 `byo-p2-llm-2`) — auto-runs the connectivity
          probe over `llm.testModel`; no secret crosses. */}
      {selectedProvider && testingModel ? <ModelTestDialog
          open={!!testingModel}
          onOpenChange={(open) => { if (!open) setTestingModel(null); }}
          providerId={selectedProvider.id}
          providerName={getProviderDisplayName(t, selectedProvider)}
          modelId={testingModel.id}
          modelName={testingModel.name}
        /> : null}

      {/* Reset-to-default confirmation (provider-storage-overlay) */}
      <ConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title={t('providerSettings.reset.confirmTitle')}
        description={t('providerSettings.reset.confirmBody')}
        confirmLabel={t('providerSettings.reset.confirmButton')}
        variant="default"
        onConfirm={() => {
          void onResetProvider?.(selectedProvider.id);
          setConfirmResetOpen(false);
        }}
      />
    </div>
  );
}
