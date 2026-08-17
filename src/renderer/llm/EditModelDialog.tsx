import React, { useEffect } from 'react';

import type { LLMProvider, ModelGroup, OpenRouterProviderRouting } from '@byo/domain/llm';

import { Button, Input, Switch } from '../host/ui';
import { useTranslation } from '../host/vendored/useTranslation';

import { DEFAULT_MODEL_GROUP_ID } from './constants';
import { OpenRouterProviderConfig } from './OpenRouterProviderConfig';
import { isOpenRouterProvider } from './utils';

export interface EditModelEntry {
  id: string;
  name: string;
  groupId: string;
  openRouterProvider?: OpenRouterProviderRouting;
  vision?: boolean;
  reasoning?: boolean;
  /** User override of the max context window (tokens); empty = auto. */
  contextLength?: number;
  /** User override of the auto-compaction threshold (0–100 %); empty = default. */
  autoCompactThresholdPercent?: number;
}
interface EditModelDialogProps {
  selectedProvider: LLMProvider | null;
  showEditModelDialog: boolean;
  setShowEditModelDialog: (val: boolean) => void;
  editModelEntry: EditModelEntry;
  setEditModelEntry: React.Dispatch<React.SetStateAction<EditModelEntry>>;
  normalizedModelGroups: ModelGroup[];
  onApplyEditModelDialog: () => Promise<void>;
  setEditingModel: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
}

export function EditModelDialog({
  selectedProvider,
  showEditModelDialog,
  setShowEditModelDialog,
  editModelEntry,
  setEditModelEntry,
  normalizedModelGroups,
  onApplyEditModelDialog,
  setEditingModel
}: EditModelDialogProps) {
  const t = useTranslation();

  const handleClose = () => {
    setShowEditModelDialog(false);
    setEditingModel(null);
    setEditModelEntry({ id: '', name: '', groupId: 'default', openRouterProvider: undefined, vision: undefined, reasoning: undefined, contextLength: undefined, autoCompactThresholdPercent: undefined });
  };

  // ESC key handler
  useEffect(() => {
    if (!showEditModelDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModelDialog]);

  if (!selectedProvider || !showEditModelDialog) return null;

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
          <h3 className="text-lg font-semibold">{t('providerSettings.modelsManager.editDialog.title')}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('providerSettings.modelsManager.editDialog.subtitle')}
          </p>
        </div>
        <div className={`p-4 space-y-4 ${showOpenRouterConfig ? 'overflow-y-auto flex-1' : ''}`}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              {t('providerSettings.modelsManager.editDialog.modelId')}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={editModelEntry.id}
              onChange={(e) => setEditModelEntry(prev => ({ ...prev, id: e.target.value }))}
              placeholder={t('providerSettings.modelsManager.editDialog.modelIdPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.editDialog.modelIdHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('providerSettings.modelsManager.editDialog.modelName')}
            </label>
            <Input
              value={editModelEntry.name}
              onChange={(e) => setEditModelEntry(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('providerSettings.modelsManager.editDialog.modelNamePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.editDialog.modelNameHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('providerSettings.modelsManager.editDialog.group')}</label>
            <Input
              list="edit-model-group-suggestions"
              className="w-full"
              value={editModelEntry.groupId}
              onChange={(e) => setEditModelEntry(prev => ({ ...prev, groupId: e.target.value }))}
              placeholder={t('providerSettings.modelsManager.editDialog.groupPlaceholder')}
            />
            <datalist id="edit-model-group-suggestions">
              {normalizedModelGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {getGroupDisplayName(group)}
                </option>
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('providerSettings.modelsManager.editDialog.contextLength')}
            </label>
            <Input
              type="number"
              min={1}
              value={editModelEntry.contextLength ?? ''}
              onChange={(e) => setEditModelEntry(prev => ({
                ...prev,
                contextLength: e.target.value === '' ? undefined : Number(e.target.value),
              }))}
              placeholder={t('providerSettings.modelsManager.editDialog.contextLengthPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.editDialog.contextLengthHelper')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('providerSettings.modelsManager.editDialog.autoCompactThreshold')}
            </label>
            <Input
              type="number"
              min={0}
              max={95}
              value={editModelEntry.autoCompactThresholdPercent ?? ''}
              onChange={(e) => setEditModelEntry(prev => ({
                ...prev,
                autoCompactThresholdPercent: e.target.value === '' ? undefined : Number(e.target.value),
              }))}
              placeholder={t('providerSettings.modelsManager.editDialog.autoCompactThresholdPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('providerSettings.modelsManager.editDialog.autoCompactThresholdHelper')}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('providerSettings.modelsManager.editDialog.vision')}</label>
              <p className="text-xs text-muted-foreground">{t('providerSettings.modelsManager.editDialog.visionHint')}</p>
            </div>
            <Switch checked={editModelEntry.vision ?? false} onCheckedChange={(v) => setEditModelEntry(prev => ({ ...prev, vision: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('providerSettings.modelsManager.editDialog.reasoning')}</label>
              <p className="text-xs text-muted-foreground">{t('providerSettings.modelsManager.editDialog.reasoningHint')}</p>
            </div>
            <Switch checked={editModelEntry.reasoning ?? false} onCheckedChange={(v) => setEditModelEntry(prev => ({ ...prev, reasoning: v }))} />
          </div>

          {/* OpenRouter Provider Routing Configuration */}
          {isOpenRouterProvider(selectedProvider) && (
            <OpenRouterProviderConfig
              config={editModelEntry.openRouterProvider || {}}
              onChange={(config) => setEditModelEntry(prev => ({
                ...prev,
                openRouterProvider: Object.keys(config).length > 0 ? config : undefined
              }))}
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-muted/30 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            {t('providerSettings.modelsManager.editDialog.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void onApplyEditModelDialog()}
            disabled={!editModelEntry.id.trim()}
          >
            {t('providerSettings.modelsManager.editDialog.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
