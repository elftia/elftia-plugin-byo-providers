import React, { useEffect } from 'react';

import type { LLMProvider, ModelGroup, OpenRouterProviderRouting } from '@byo/domain/llm';

import { Button, Input, Switch } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import { DEFAULT_MODEL_GROUP_ID } from './constants';
import { OpenRouterProviderConfig } from './OpenRouterProviderConfig';
import { isOpenRouterProvider } from './utils';

interface ManualModelDialogProps {
  selectedProvider: LLMProvider | null;
  showAddModelDialog: boolean;
  setShowAddModelDialog: (val: boolean) => void;
  newModelEntry: { id: string; name: string; groupId: string; openRouterProvider?: OpenRouterProviderRouting; vision?: boolean; reasoning?: boolean };
  setNewModelEntry: React.Dispatch<React.SetStateAction<{ id: string; name: string; groupId: string; openRouterProvider?: OpenRouterProviderRouting; vision?: boolean; reasoning?: boolean }>>;
  normalizedModelGroups: ModelGroup[];
  defaultGroupId: string;
  onAddModelEntry: (id: string, name: string, groupId: string, openRouterProvider?: OpenRouterProviderRouting, vision?: boolean, reasoning?: boolean) => Promise<void>;
}
export function ManualModelDialog({
  selectedProvider,
  showAddModelDialog,
  setShowAddModelDialog,
  newModelEntry,
  setNewModelEntry,
  normalizedModelGroups,
  defaultGroupId,
  onAddModelEntry
}: ManualModelDialogProps) {
  const t = useTranslation();

  const handleClose = () => {
    setShowAddModelDialog(false);
    setNewModelEntry({ id: '', name: '', groupId: defaultGroupId, openRouterProvider: undefined, vision: undefined, reasoning: undefined });
  };

  // ESC key handler
  useEffect(() => {
    if (!showAddModelDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModelDialog]);

  if (!selectedProvider || !showAddModelDialog) return null;

  const getGroupDisplayName = (group: ModelGroup) => {
    if (group.id === DEFAULT_MODEL_GROUP_ID) {
      return t('providerSettings.modelsManager.defaultGroup');
    }
    return group.name || group.id;
  };

  const showOpenRouterConfig = isOpenRouterProvider(selectedProvider);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-background border rounded-lg shadow-xl w-full ${showOpenRouterConfig ? 'max-w-lg max-h-[90vh] flex flex-col' : 'max-w-md'}`}>
        <div className="p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">{t('providerSettings.modelsManager.manualDialog.title')}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('providerSettings.modelsManager.manualDialog.subtitle')}
          </p>
        </div>
        <div className={`p-4 space-y-4 ${showOpenRouterConfig ? 'overflow-y-auto flex-1' : ''}`}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              {t('providerSettings.modelsManager.manualDialog.modelId')}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={newModelEntry.id}
              onChange={(e) => setNewModelEntry(prev => ({ ...prev, id: e.target.value }))}
              placeholder={t('providerSettings.modelsManager.manualDialog.modelIdPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.manualDialog.modelIdHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('providerSettings.modelsManager.manualDialog.modelName')}
            </label>
            <Input
              value={newModelEntry.name}
              onChange={(e) => setNewModelEntry(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('providerSettings.modelsManager.manualDialog.modelNamePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.manualDialog.modelNameHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('providerSettings.modelsManager.manualDialog.group')}</label>
            <Input
              list="model-group-suggestions"
              className="w-full"
              value={newModelEntry.groupId}
              onChange={(e) => setNewModelEntry(prev => ({ ...prev, groupId: e.target.value }))}
              placeholder={t('providerSettings.modelsManager.manualDialog.groupPlaceholder')}
            />
            <datalist id="model-group-suggestions">
              {normalizedModelGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {getGroupDisplayName(group)}
                </option>
              ))}
            </datalist>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('providerSettings.modelsManager.editDialog.vision')}</label>
              <p className="text-xs text-muted-foreground">{t('providerSettings.modelsManager.editDialog.visionHint')}</p>
            </div>
            <Switch checked={newModelEntry.vision ?? false} onCheckedChange={(v) => setNewModelEntry(prev => ({ ...prev, vision: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('providerSettings.modelsManager.editDialog.reasoning')}</label>
              <p className="text-xs text-muted-foreground">{t('providerSettings.modelsManager.editDialog.reasoningHint')}</p>
            </div>
            <Switch checked={newModelEntry.reasoning ?? false} onCheckedChange={(v) => setNewModelEntry(prev => ({ ...prev, reasoning: v }))} />
          </div>

          {/* OpenRouter Provider Routing Configuration */}
          {showOpenRouterConfig ? <OpenRouterProviderConfig
              config={newModelEntry.openRouterProvider || {}}
              onChange={(config) => setNewModelEntry(prev => ({
                ...prev,
                openRouterProvider: Object.keys(config).length > 0 ? config : undefined
              }))}
            /> : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-muted/30 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            {t('providerSettings.modelsManager.manualDialog.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void onAddModelEntry(newModelEntry.id, newModelEntry.name, newModelEntry.groupId, newModelEntry.openRouterProvider, newModelEntry.vision, newModelEntry.reasoning)}
            disabled={!newModelEntry.id.trim()}
          >
            {t('providerSettings.modelsManager.manualDialog.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
