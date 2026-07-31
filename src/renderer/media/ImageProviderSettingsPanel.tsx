/**
 * ImageProviderSettingsPanel.tsx - 图像 Provider 设置面板
 *
 * 管理图像生成服务提供商的配置、凭证和模型
 *
 * @module components/MediaProviderSettings/ImageProviderSettingsPanel
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  MediaModelDefinition,
  MediaProviderState,
  MediaProviderUpdatePayload
} from '@byo/domain/media-types';

import { Button, Input, Select } from '../host/ui';
import { useConfirmDialog } from '../host/vendored/useImperativeConfirm';
import { useTranslation } from '../host/vendored/useTranslation';
import { mediaConfigClient } from '../mediaConfigClient';
import { useMediaProviders as useMediaProvidersData } from '../useMediaProviders';

import {
  AddModelDialog,
  EditModelDialog,
  ManageModelsModal,
  ModelGroupList,
  ProviderSidebar
} from './components';
import { useModelManagement } from './hooks';
import { ProviderDetailsPanel } from './shared/ProviderDetailsPanel';
import type { GenericModelGroup } from './types';
import {
  buildNormalizedMediaGroups,
  collectMediaSecretWrites,
  normalizeMediaModels
} from './utils';

/**
 * 图像 Provider 设置面板组件
 */
export function ImageProviderSettingsPanel() {
  const t = useTranslation();
  const confirmDialog = useConfirmDialog();

  // 获取全局缓存刷新函数
  const { refresh: refreshGlobalCache } = useMediaProvidersData('image');

  // Provider 列表状态
  const [providers, setProviders] = useState<MediaProviderState[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [updatingProviderId, setUpdatingProviderId] = useState<string | null>(null);

  // 表单状态
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const configFingerprintRef = useRef<string>('');

  // 自动保存状态
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSaveRef = useRef(false);
  const [credentialStatus, setCredentialStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const latestCredentialValuesRef = useRef<Record<string, string>>({});

  // 添加 Provider 表单状态
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderTemplate, setNewProviderTemplate] = useState('');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  // 搜索状态
  const [imageSearchTerm, setImageSearchTerm] = useState('');

  // 加载 Providers
  const reloadProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    setProviderError(null);
    try {
      const data = await mediaConfigClient.image.list();
      setProviders(data);
      setSelectedProviderId((currentId) => {
        if (currentId && data.some((p) => p.id === currentId)) {
          return currentId;
        }
        return data[0]?.id ?? '';
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('mediaSettings.image.loadError');
      setProviderError(message);
    } finally {
      setIsLoadingProviders(false);
    }
  }, [t]);

  useEffect(() => {
    void reloadProviders();
  }, [reloadProviders]);

  useEffect(() => {
    if (!providers.length) {
      setSelectedProviderId('');
      return;
    }
    if (!providers.some((p) => p.id === selectedProviderId)) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  const selectedProvider =
    providers.find((p) => p.id === selectedProviderId) ?? providers[0];

  // 更新 Provider 状态
  const updateProviderState = useCallback((updated: MediaProviderState) => {
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  // 持久化 Provider 更新
  const persistProviderUpdate = useCallback(
    async (payload: MediaProviderUpdatePayload) => {
      if (!selectedProvider) {
        return null;
      }
      try {
        const updated = await mediaConfigClient.image.update(selectedProvider.id, payload);
        updateProviderState(updated);
        setProviderError(null);

        // 刷新全局缓存，确保首页等其他页面能立即看到更新
        await refreshGlobalCache();

        // 额外派发事件，确保所有监听的组件都能收到通知
        window.dispatchEvent(new CustomEvent('image-providers-updated'));

        return updated;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('mediaSettings.image.updateError');
        setProviderError(message);
        return null;
      }
    },
    [selectedProvider, t, updateProviderState, refreshGlobalCache]
  );

  // 模型管理 - 使用共享 Hook
  const modelManagement = useModelManagement<MediaModelDefinition>({
    models: selectedProvider?.models ?? [],
    modelGroups: selectedProvider?.modelGroups as GenericModelGroup<MediaModelDefinition>[] | undefined,
    onPersist: async (models, groups) => {
      const payload: MediaProviderUpdatePayload = {
        models: models.map((m) => ({ ...m })),
        modelGroups: groups.map((g) => ({
          id: g.id,
          name: g.name,
          models: g.models.map((m) => ({ ...m }))
        }))
      };
      const result = await persistProviderUpdate(payload);
      return result !== null;
    },
    t
  });

  // 原始模型目录
  const originalCatalog = useMemo(
    () => normalizeMediaModels<MediaModelDefinition>(selectedProvider?.originalModels ?? []),
    [selectedProvider?.originalModels]
  );
  const originalGroups = useMemo(
    () => selectedProvider?.originalModelGroups ?? [],
    [selectedProvider?.originalModelGroups]
  );

  // 刷新模型（优先从上游 API 拉取，不支持时回退到 library 默认）
  const handleRefreshModels = useCallback(async () => {
    if (!selectedProvider) return;
    // 优先尝试从上游刷新（目前只有 OpenRouter 支持）
    try {
      const result = await mediaConfigClient.image.refreshUpstreamModels(selectedProvider.id);
      if (result.success && result.provider) {
        updateProviderState(result.provider);
        setProviderError(null);
        modelManagement.showModelMessage('providerSettings.modelsManager.messages.refreshed');
        // 同步刷新全局缓存，确保首页等地立刻看到新模型
        await refreshGlobalCache();
        return;
      }
      if (result.message && result.message !== 'unsupported') {
        // 真实错误 — 直接抛给用户，不再回退（用户期望的是刷新）
        setProviderError(result.message);
        return;
      }
      // unsupported — 走下面的 library-default 回退分支
    } catch (err) {
      // 网络/意外错误 — 用户期望刷新，不应静默回退到 library
      setProviderError(err instanceof Error ? err.message : String(err));
      return;
    }
    // 回退路径：原本的 library-default 恢复逻辑
    const baseModels = originalCatalog;
    const baseGroups =
      originalGroups.length > 0
        ? originalGroups.map((g) => ({
            id: g.id,
            name: g.name,
            models: normalizeMediaModels<MediaModelDefinition>(g.models ?? [])
          }))
        : buildNormalizedMediaGroups<MediaModelDefinition>(baseModels, []);
    const payload: MediaProviderUpdatePayload = {
      models: baseModels.map((m) => ({ ...m })),
      modelGroups: baseGroups.map((g) => ({
        id: g.id,
        name: g.name,
        models: g.models.map((m) => ({ ...m }))
      }))
    };
    const updated = await persistProviderUpdate(payload);
    if (updated) {
      modelManagement.showModelMessage('providerSettings.modelsManager.messages.updated');
    }
  }, [
    selectedProvider,
    updateProviderState,
    refreshGlobalCache,
    originalCatalog,
    originalGroups,
    persistProviderUpdate,
    modelManagement
  ]);

  // 凭证保存逻辑
  const flushCredentialSave = useCallback(
    async (values?: Record<string, string>) => {
      if (!selectedProvider) {
        return;
      }
      const source = values ?? latestCredentialValuesRef.current;
      // byo-media-secret-hardening: the apiKey routes through the one-way
      // `setProviderKey` channel into SecretsService; non-secret fields ride the
      // `update` patch. Plaintext keys NEVER cross the update patch.
      // byo-media-key-display-restore Fix 1: `collectMediaSecretWrites` SKIPS an
      // empty secret field (empty = "leave the stored key unchanged"), so an
      // empty apiKey can never trigger a delete.
      const { secretWrites, nonSecret } = collectMediaSecretWrites(
        selectedProvider.credentialFields,
        source
      );
      const payload: MediaProviderUpdatePayload = {
        ...nonSecret,
        defaultModelId: source.defaultModelId || selectedProvider.defaultModelId
      };
      setCredentialStatus('saving');
      try {
        for (const { key, value } of secretWrites) {
          if (key === 'apiKey') {
            await mediaConfigClient.image.setProviderKey(selectedProvider.id, value);
          }
        }
      } catch (error) {
        console.error('Failed to persist image provider key:', error);
        setCredentialStatus('error');
        return;
      }
      const updated = await persistProviderUpdate(payload);
      setCredentialStatus(updated ? 'saved' : 'error');
    },
    [persistProviderUpdate, selectedProvider]
  );

  const scheduleCredentialSave = useCallback(
    (values: Record<string, string>) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        void flushCredentialSave(values);
      }, 600);
    },
    [flushCredentialSave]
  );

  // 设置默认模型
  const handleSetDefaultModel = useCallback(
    async (modelId: string) => {
      if (!selectedProvider) {
        return;
      }
      skipAutoSaveRef.current = true;
      setFormValues((prev) => {
        const next = { ...prev, defaultModelId: modelId };
        latestCredentialValuesRef.current = next;
        return next;
      });
      skipAutoSaveRef.current = false;
      setCredentialStatus('saving');
      const updated = await persistProviderUpdate({ defaultModelId: modelId });
      setCredentialStatus(updated ? 'saved' : 'error');
    },
    [selectedProvider, persistProviderUpdate]
  );

  // 内置模板
  const builtinTemplates = useMemo(
    () => providers.filter((p) => !p.custom),
    [providers]
  );

  useEffect(() => {
    if (!isAddFormOpen) {
      return;
    }
    if (!newProviderTemplate && builtinTemplates.length > 0) {
      setNewProviderTemplate(builtinTemplates[0].id);
    }
  }, [isAddFormOpen, builtinTemplates, newProviderTemplate]);

  // 过滤 Providers
  const filteredProviders = useMemo(() => {
    if (!imageSearchTerm.trim()) {
      return providers;
    }
    const term = imageSearchTerm.trim().toLowerCase();
    return providers.filter((p) => {
      const haystack = `${p.name} ${p.description ?? ''} ${p.badge ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [providers, imageSearchTerm]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // 凭证状态自动重置
  useEffect(() => {
    if (credentialStatus === 'saved' || credentialStatus === 'error') {
      const timer = setTimeout(() => setCredentialStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [credentialStatus]);

  // Provider 切换时重置状态
  useEffect(() => {
    modelManagement.resetState();
  }, [selectedProvider?.id, modelManagement.resetState]);

  // 更新新模型分组 ID
  useEffect(() => {
    modelManagement.setNewModelEntry((prev) => ({
      ...prev,
      groupId: modelManagement.defaultGroupId
    }));
  }, [modelManagement.defaultGroupId, selectedProvider?.id, modelManagement.setNewModelEntry]);

  // 同步表单值
  useEffect(() => {
    if (!selectedProvider) {
      return;
    }
    const fingerprint = JSON.stringify({
      id: selectedProvider.id,
      config: selectedProvider.config
    });
    if (configFingerprintRef.current === fingerprint) {
      return;
    }
    configFingerprintRef.current = fingerprint;
    const nextValues: Record<string, string> = {};
    selectedProvider.credentialFields.forEach((field) => {
      const value = (selectedProvider.config as Record<string, unknown>)[field.key];
      nextValues[field.key] = typeof value === 'string' ? value : '';
    });
    nextValues.defaultModelId =
      selectedProvider.config.defaultModelId ?? selectedProvider.defaultModelId ?? '';
    skipAutoSaveRef.current = true;
    setFormValues(nextValues);
    latestCredentialValuesRef.current = nextValues;
    skipAutoSaveRef.current = false;
  }, [selectedProvider]);

  // 状态标签
  const getTypeBadge = () => {
    if (!selectedProvider) return '';
    if (selectedProvider.badge) return selectedProvider.badge;
    if (!selectedProvider.status || selectedProvider.status === 'stable') {
      return t('mediaSettings.common.status.stable');
    }
    return t(`mediaSettings.common.status.${selectedProvider.status}`);
  };

  // 字段变更处理
  const handleFieldChange = (field: string, value: string) => {
    setFormValues((prev) => {
      const next = {
        ...prev,
        [field]: value
      };
      latestCredentialValuesRef.current = next;
      if (!skipAutoSaveRef.current) {
        scheduleCredentialSave(next);
      }
      return next;
    });
  };

  // 切换 Provider 启用状态
  const handleToggleProvider = async (provider: MediaProviderState, enabled: boolean) => {
    setUpdatingProviderId(provider.id);
    await persistProviderUpdate({ enabled });
    setUpdatingProviderId(null);
  };

  // 创建自定义 Provider
  const handleCreateCustomProvider = useCallback(async () => {
    const template = builtinTemplates.find((p) => p.id === newProviderTemplate);
    if (!template) {
      setProviderError(t('mediaSettings.image.addProviderTemplateMissing'));
      return;
    }
    const displayName =
      newProviderName.trim() ||
      t('mediaSettings.image.addProviderNameFallback', { template: template.name });
    setIsCreatingProvider(true);
    setProviderError(null);
    try {
      const created = await mediaConfigClient.image.createCustom({
        baseProviderId: template.id,
        name: displayName
      });
      await reloadProviders();
      setSelectedProviderId(created.id);
      setIsAddFormOpen(false);
      setNewProviderName('');

      // 刷新全局缓存并派发事件
      await refreshGlobalCache();
      window.dispatchEvent(new CustomEvent('image-providers-updated'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('mediaSettings.image.updateError');
      setProviderError(message);
    } finally {
      setIsCreatingProvider(false);
    }
  }, [builtinTemplates, newProviderName, newProviderTemplate, reloadProviders, refreshGlobalCache, t]);

  // 删除自定义 Provider
  const handleDeleteCustomProvider = useCallback(async () => {
    if (!selectedProvider?.custom) {
      return;
    }
    const confirmMessage = t('mediaSettings.image.deleteCustomConfirm', {
      name: selectedProvider.name
    });
    const confirmed = await confirmDialog({
      title: t('mediaSettings.image.deleteCustom'),
      description: confirmMessage,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger'
    });
    if (!confirmed) return;
    setProviderError(null);
    try {
      await mediaConfigClient.image.deleteCustom(selectedProvider.id);
      setSelectedProviderId('');
      await reloadProviders();

      // 刷新全局缓存并派发事件
      await refreshGlobalCache();
      window.dispatchEvent(new CustomEvent('image-providers-updated'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('mediaSettings.image.updateError');
      setProviderError(message);
    }
  }, [confirmDialog, reloadProviders, refreshGlobalCache, selectedProvider, t]);

  // 加载中状态
  if (!providers.length && isLoadingProviders) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {t('mediaSettings.image.loading')}
      </div>
    );
  }

  const selectedProviderEnabled = selectedProvider?.enabled ?? false;
  const isCredentialSaving = credentialStatus === 'saving';
  const credentialStatusMessage =
    credentialStatus === 'saving'
      ? t('settings.status.saving')
      : credentialStatus === 'saved'
        ? t('settings.status.saved')
        : credentialStatus === 'error'
          ? t('settings.status.error')
          : null;
  const currentDefaultModelId =
    formValues.defaultModelId || selectedProvider?.defaultModelId || '';

  // 添加表单插槽
  const addFormSlot = isAddFormOpen ? (
    <div className="space-y-2 rounded-md border border-border bg-surface-1 wallpaper-blur p-3">
      <div className="text-xs font-semibold uppercase tracking-wide">
        {t('mediaSettings.image.addProviderTitle')}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">
          {t('mediaSettings.image.addProviderTemplate')}
        </label>
        <Select
          value={newProviderTemplate}
          onChange={setNewProviderTemplate}
          className="w-full"
          size="sm"
          options={builtinTemplates.map((template) => ({
            value: template.id,
            label: template.name
          }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">
          {t('mediaSettings.image.addProviderNameLabel')}
        </label>
        <Input
          value={newProviderName}
          onChange={(e) => setNewProviderName(e.target.value)}
          placeholder={builtinTemplates.find((t) => t.id === newProviderTemplate)?.name ?? ''}
          className="text-sm"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsAddFormOpen(false);
            setNewProviderName('');
          }}
        >
          {t('mediaSettings.image.addProviderCancel')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleCreateCustomProvider}
          disabled={isCreatingProvider || !newProviderTemplate}
        >
          {isCreatingProvider
            ? t('mediaSettings.image.addProviderCreating')
            : t('mediaSettings.image.addProviderCreate')}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full overflow-hidden bg-surface-0">
        <ProviderSidebar
          providers={providers}
          filteredProviders={filteredProviders}
          selectedProviderId={selectedProviderId}
          onSelectProvider={setSelectedProviderId}
          searchTerm={imageSearchTerm}
          onSearchChange={setImageSearchTerm}
          isLoading={isLoadingProviders}
          onAddProvider={() => setIsAddFormOpen((prev) => !prev)}
          showAddButton
          addButtonDisabled={!builtinTemplates.length}
          addFormSlot={addFormSlot}
          t={t}
          getModelCount={(provider) => provider.models?.length ?? 0}
        />

        {/* 右侧面板 */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-1/60 wallpaper-blur">
          <div className="flex-1 overflow-y-auto min-h-0">
            {!selectedProvider ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('mediaSettings.image.noSelection')}
              </div>
            ) : (
              <ProviderDetailsPanel
                type="image"
                name={selectedProvider.name}
                typeBadge={getTypeBadge()}
                isCustom={selectedProvider.custom}
                enabled={selectedProviderEnabled}
                onToggleEnabled={(checked) => handleToggleProvider(selectedProvider, checked)}
                switchDisabled={isLoadingProviders || updatingProviderId === selectedProvider.id}
                onDelete={selectedProvider.custom ? handleDeleteCustomProvider : undefined}
                errorMessage={providerError}
                credentialFields={selectedProvider.credentialFields}
                formValues={formValues}
                onFieldChange={handleFieldChange}
                isCredentialSaving={isCredentialSaving}
                credentialStatusMessage={credentialStatusMessage}
                modelManagement={{
                  modelSearchTerm: modelManagement.modelSearchTerm,
                  setModelSearchTerm: modelManagement.setModelSearchTerm,
                  setShowManageModels: modelManagement.setShowManageModels,
                  setShowAddModelDialog: modelManagement.setShowAddModelDialog,
                  setNewModelEntry: modelManagement.setNewModelEntry,
                  defaultGroupId: modelManagement.defaultGroupId,
                  modelStatus: modelManagement.modelStatus
                }}
                modelListSlot={
                  <ModelGroupList
                    visibleGroups={modelManagement.visibleGroups}
                    collapsedGroups={modelManagement.collapsedGroups}
                    onToggleGroup={modelManagement.toggleGroup}
                    defaultModelId={currentDefaultModelId}
                    onSetDefault={handleSetDefaultModel}
                    onToggleModel={modelManagement.handleToggleModel}
                    onEditModel={modelManagement.handleOpenEditModelDialog}
                    onRemoveModel={modelManagement.handleRemoveModel}
                    editingModel={modelManagement.editingModel}
                    setEditingModel={modelManagement.setEditingModel}
                    onApplyEdit={modelManagement.handleApplyModelEdit}
                    t={t}
                  />
                }
                docsUrl={selectedProvider.docsUrl ?? selectedProvider.website}
                t={t}
              />
            )}
          </div>
        </div>

        {/* 弹窗 */}
        <ManageModelsModal
          isOpen={modelManagement.showManageModels}
          onClose={() => modelManagement.setShowManageModels(false)}
          providerName={selectedProvider?.name ?? ''}
          originalModels={originalCatalog}
          originalGroups={originalGroups as GenericModelGroup<MediaModelDefinition>[]}
          existingModelIds={modelManagement.existingModelIds}
          onAddModel={modelManagement.handleAddCatalogModel}
          onRestore={handleRefreshModels}
          t={t}
        />
        <AddModelDialog
          isOpen={modelManagement.showAddModelDialog}
          onClose={() => {
            modelManagement.setShowAddModelDialog(false);
            modelManagement.setNewModelEntry({
              id: '',
              name: '',
              groupId: modelManagement.defaultGroupId,
              originalId: ''
            });
          }}
          modelEntry={modelManagement.newModelEntry}
          setModelEntry={modelManagement.setNewModelEntry}
          groups={modelManagement.normalizedGroups}
          onSubmit={modelManagement.handleAddModel}
          t={t}
        />
        <EditModelDialog
          isOpen={modelManagement.showEditModelDialog}
          onClose={() => {
            modelManagement.setShowEditModelDialog(false);
            modelManagement.setEditModelEntry({
              id: '',
              name: '',
              groupId: modelManagement.defaultGroupId,
              originalId: ''
            });
          }}
          modelEntry={modelManagement.editModelEntry}
          setModelEntry={modelManagement.setEditModelEntry}
          groups={modelManagement.normalizedGroups}
          onSubmit={modelManagement.handleApplyEditModelDialog}
          t={t}
        />
      </div>
  );
}
