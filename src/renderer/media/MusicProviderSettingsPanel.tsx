/**
 * MusicProviderSettingsPanel.tsx - 音乐 Provider 设置面板
 *
 * 管理音乐生成服务提供商的配置、凭证和模型
 * 数据通过后端 IPC + SQLite 存储，与图像模型保持一致的架构
 *
 * @module components/MediaProviderSettings/MusicProviderSettingsPanel
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MusicProviderState } from '@byo/domain/music-types';

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
import { MUSIC_PROVIDER_TEMPLATES } from './constants';
import { useModelManagement } from './hooks';
import { ProviderDetailsPanel } from './shared/ProviderDetailsPanel';
import type {
  GenericModelGroup,
  MusicProviderDefinition,
  MusicProviderModel
} from './types';
import {
  buildNormalizedMediaGroups,
  cloneMusicModels,
  collectMediaSecretWrites,
  normalizeMediaModels,
  serializeMusicGroups
} from './utils';

/**
 * 音乐 Provider 设置面板组件
 */
export function MusicProviderSettingsPanel() {
  const t = useTranslation();
  const confirmDialog = useConfirmDialog();

  // 从后端 IPC + SQLite 加载 Provider 数据
  const { providers, loading: isLoading, refresh } = useMediaProvidersData('music');
  const allProviders = providers as unknown as MusicProviderState[];
  const isHydrated = !isLoading;

  // 添加 Provider 表单状态
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newProviderTemplate, setNewProviderTemplate] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  // 表单打开时设置默认模板
  useEffect(() => {
    if (!isAddFormOpen) {
      return;
    }
    if (!newProviderTemplate && MUSIC_PROVIDER_TEMPLATES.length > 0) {
      setNewProviderTemplate(MUSIC_PROVIDER_TEMPLATES[0].id);
    }
  }, [isAddFormOpen, newProviderTemplate]);

  // Provider 选择状态
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    allProviders[0]?.id ?? ''
  );

  // 表单状态
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const configFingerprintRef = useRef<string | null>(null);

  // 自动保存状态
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSaveRef = useRef(false);
  const skipFormSyncRef = useRef(false);
  const [credentialStatus, setCredentialStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const latestCredentialValuesRef = useRef<Record<string, string>>({});

  // 搜索状态
  const [musicSearchTerm, setMusicSearchTerm] = useState('');

  // providers 加载完成后初始化选中状态
  useEffect(() => {
    if (allProviders.length > 0 && !selectedProviderId) {
      setSelectedProviderId(allProviders[0].id);
    }
  }, [allProviders, selectedProviderId]);

  // 确保选中有效的 Provider
  useEffect(() => {
    if (allProviders.length > 0 && !allProviders.some((p) => p.id === selectedProviderId)) {
      queueMicrotask(() => setSelectedProviderId(allProviders[0]?.id ?? ''));
    }
  }, [selectedProviderId, allProviders]);

  const selectedProvider =
    allProviders.find((p) => p.id === selectedProviderId) ?? allProviders[0];

  // 凭证保存逻辑
  const flushCredentialSave = useCallback(
    async (values?: Record<string, string>) => {
      if (!selectedProvider) {
        return;
      }
      const source = values ?? latestCredentialValuesRef.current;
      // byo-media-secret-hardening: the apiKey routes through the one-way
      // `setProviderKey` channel into SecretsService; non-secret fields
      // (endpoint/url) ride the `update` patch (empty clears them).
      // byo-media-key-display-restore Fix 1: `collectMediaSecretWrites` SKIPS an
      // empty secret field (empty = "leave the stored key unchanged").
      const { secretWrites, nonSecret } = collectMediaSecretWrites(
        selectedProvider.credentialFields,
        source
      );
      const updatePayload: Record<string, string | undefined> = { ...nonSecret };
      updatePayload.defaultModelId = source.defaultModelId || selectedProvider.defaultModelId;
      setCredentialStatus('saving');
      try {
        for (const { key, value } of secretWrites) {
          if (key === 'apiKey') {
            await mediaConfigClient.music.setProviderKey(selectedProvider.id, value);
          }
        }
        await mediaConfigClient.music.update(selectedProvider.id, updatePayload);
        skipFormSyncRef.current = true;
        await refresh();
        setCredentialStatus('saved');
      } catch (error) {
        console.error('Failed to persist music provider credentials:', error);
        setCredentialStatus('error');
      }
    },
    [selectedProvider, refresh]
  );

  const scheduleCredentialSave = useCallback(
    (values: Record<string, string>) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        void flushCredentialSave(values);
      }, 1500);
    },
    [flushCredentialSave]
  );

  // 模型相关计算（从后端返回的 MusicProviderState 直接读取）
  const musicModels = useMemo<MusicProviderModel[]>(() => {
    return normalizeMediaModels<MusicProviderModel>(selectedProvider?.models ?? []);
  }, [selectedProvider?.models]);

  const musicGroups = useMemo<GenericModelGroup<MusicProviderModel>[]>(() => {
    return buildNormalizedMediaGroups<MusicProviderModel>(
      musicModels,
      selectedProvider?.modelGroups as GenericModelGroup<MusicProviderModel>[] | undefined
    );
  }, [musicModels, selectedProvider?.modelGroups]);

  // 持久化模型变更
  const persistMusicModels = useCallback(
    async (models: MusicProviderModel[], groups?: GenericModelGroup<MusicProviderModel>[]) => {
      if (!selectedProvider) {
        return false;
      }
      const normalizedGroups = serializeMusicGroups(
        groups ?? buildNormalizedMediaGroups<MusicProviderModel>(models, musicGroups)
      );
      try {
        await mediaConfigClient.music.update(selectedProvider.id, {
          models: cloneMusicModels(models) as unknown as never,
          modelGroups: normalizedGroups as unknown as never
        });
        skipFormSyncRef.current = true;
        await refresh();
        return true;
      } catch (error) {
        console.error('Failed to persist music models:', error);
        return false;
      }
    },
    [selectedProvider, musicGroups, refresh]
  );

  // 模型管理 Hook
  const modelManagement = useModelManagement<MusicProviderModel>({
    models: musicModels,
    modelGroups: musicGroups,
    onPersist: persistMusicModels,
    t
  });

  // 原始模型目录（来自 library 定义）
  const originalModels = useMemo(
    () => normalizeMediaModels<MusicProviderModel>(
      selectedProvider?.originalModels ?? selectedProvider?.models ?? []
    ),
    [selectedProvider?.originalModels, selectedProvider?.models]
  );
  const originalGroups = useMemo(
    () => selectedProvider?.originalModelGroups ?? selectedProvider?.modelGroups ?? [],
    [selectedProvider?.originalModelGroups, selectedProvider?.modelGroups]
  );

  // 刷新模型（优先从上游 API 拉取，不支持时回退到 library 默认）
  const handleRefreshModels = useCallback(async () => {
    if (!selectedProvider) {
      return;
    }
    // 优先尝试从上游刷新（目前只有 OpenRouter 支持）
    try {
      const result = await mediaConfigClient.music.refreshUpstreamModels(selectedProvider.id);
      if (result.success && result.provider) {
        skipFormSyncRef.current = true;
        await refresh();
        modelManagement.showModelMessage('providerSettings.modelsManager.messages.refreshed');
        return;
      }
      if (result.message && result.message !== 'unsupported') {
        // 真实错误 — 直接抛给用户，不再回退
        modelManagement.showModelMessage(
          'providerSettings.modelsManager.messages.refreshFailed',
          'error'
        );
        console.error('Failed to refresh music models from upstream:', result.message);
        return;
      }
      // unsupported — 走下面的 library-default 回退分支
    } catch (error) {
      console.error('Failed to refresh music models from upstream:', error);
      modelManagement.showModelMessage(
        'providerSettings.modelsManager.messages.refreshFailed',
        'error'
      );
      return;
    }
    // 回退路径：原本的 library-default 恢复逻辑
    try {
      const libModels = selectedProvider.originalModels ?? selectedProvider.models ?? [];
      const libGroups = selectedProvider.originalModelGroups ?? selectedProvider.modelGroups ?? [];
      await mediaConfigClient.music.update(selectedProvider.id, {
        models: libModels as unknown as never,
        modelGroups: libGroups as unknown as never,
        defaultModelId: selectedProvider.defaultModelId
      });
      skipFormSyncRef.current = true;
      await refresh();
      setFormValues((prev) => {
        const next = {
          ...prev,
          defaultModelId: selectedProvider.defaultModelId
        };
        latestCredentialValuesRef.current = next;
        return next;
      });
      modelManagement.showModelMessage('providerSettings.modelsManager.messages.updated');
    } catch (error) {
      console.error('Failed to restore music models:', error);
    }
  }, [selectedProvider, refresh, modelManagement]);

  // 设置默认模型
  const handleSetDefaultModel = useCallback(
    async (modelId: string) => {
      if (!selectedProvider) {
        return;
      }
      try {
        await mediaConfigClient.music.update(selectedProvider.id, { defaultModelId: modelId });
        skipFormSyncRef.current = true;
        setFormValues((prev) => {
          const next = { ...prev, defaultModelId: modelId };
          latestCredentialValuesRef.current = next;
          return next;
        });
        await refresh();
      } catch (error) {
        console.error('Failed to set default music model:', error);
      }
    },
    [selectedProvider, refresh]
  );

  // 过滤 Providers
  const filteredProviders = useMemo(() => {
    if (!musicSearchTerm.trim()) {
      return allProviders;
    }
    const term = musicSearchTerm.trim().toLowerCase();
    return allProviders.filter((p) => {
      const haystack = `${p.name} ${p.description ?? ''} ${p.badge ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [musicSearchTerm, allProviders]);

  // 同步表单值（从 provider.config 读取凭证）
  useEffect(() => {
    if (!selectedProvider) {
      return;
    }
    if (skipFormSyncRef.current) {
      skipFormSyncRef.current = false;
      return;
    }
    const config = selectedProvider.config ?? {};
    const fingerprint = JSON.stringify({
      id: selectedProvider.id,
      config
    });
    if (configFingerprintRef.current === fingerprint) {
      return;
    }
    configFingerprintRef.current = fingerprint;
    const nextValues: Record<string, string> = {};
    selectedProvider.credentialFields.forEach((field) => {
      const key = field.key as string;
      const stored = config[key as keyof typeof config];
      nextValues[key] = typeof stored === 'string' ? stored : '';
    });
    nextValues.defaultModelId = config.defaultModelId ?? selectedProvider.defaultModelId;
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    skipAutoSaveRef.current = true;
    queueMicrotask(() => {
      setFormValues(nextValues);
      latestCredentialValuesRef.current = nextValues;
      skipAutoSaveRef.current = false;
    });
  }, [selectedProvider]);

  // Provider 切换时重置状态
  useEffect(() => {
    queueMicrotask(() => {
      modelManagement.resetState();
      setCredentialStatus('idle');
    });
  }, [selectedProviderId, modelManagement.resetState]);

  // 更新新模型分组 ID
  useEffect(() => {
    modelManagement.setNewModelEntry((prev) => ({
      ...prev,
      groupId: modelManagement.defaultGroupId
    }));
  }, [modelManagement.defaultGroupId, selectedProviderId, modelManagement.setNewModelEntry]);

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
  const handleToggleProvider = useCallback(
    async (providerId: string, enabled: boolean) => {
      if (!isHydrated) {
        return;
      }
      try {
        await mediaConfigClient.music.update(providerId, { enabled });
        await refresh();
      } catch (error) {
        console.error('Failed to toggle music provider:', error);
      }
    },
    [isHydrated, refresh]
  );

  // 创建自定义 Provider
  const handleCreateCustomProvider = useCallback(async () => {
    if (!isHydrated) {
      return;
    }
    const template = MUSIC_PROVIDER_TEMPLATES.find((p) => p.id === newProviderTemplate);
    if (!template) {
      return;
    }
    const displayName =
      newProviderName.trim() ||
      t('mediaSettings.image.addProviderNameFallback', { template: template.name });
    setIsCreatingProvider(true);
    try {
      const result = await mediaConfigClient.music.createCustom({
        baseProviderId: template.id,
        name: displayName
      }) as unknown as { success: boolean; provider?: { id: string } };
      await refresh();
      if (result?.provider?.id) {
        setSelectedProviderId(result.provider.id);
      }
      setIsAddFormOpen(false);
      setNewProviderName('');
    } catch (error) {
      console.error('Failed to create custom music provider:', error);
    } finally {
      setIsCreatingProvider(false);
    }
  }, [
    isHydrated,
    newProviderTemplate,
    newProviderName,
    refresh,
    t
  ]);

  // 删除自定义 Provider
  const handleDeleteCustomProvider = useCallback(async () => {
    if (!selectedProvider?.custom || !isHydrated) {
      return;
    }
    const confirmed = await confirmDialog({
      title: t('mediaSettings.image.deleteCustom'),
      description: t('mediaSettings.image.deleteCustomConfirm', { name: selectedProvider.name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await mediaConfigClient.music.deleteCustom(selectedProvider.id);
      await refresh();
      const nextProviders = allProviders.filter((p) => p.id !== selectedProvider.id);
      setSelectedProviderId(nextProviders[0]?.id ?? '');
    } catch (error) {
      console.error('Failed to delete custom music provider:', error);
    }
  }, [
    selectedProvider,
    isHydrated,
    confirmDialog,
    refresh,
    allProviders,
    t
  ]);

  const selectedProviderEnabled = selectedProvider?.enabled !== false;
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
    formValues.defaultModelId ||
    selectedProvider?.config?.defaultModelId ||
    selectedProvider?.defaultModelId ||
    '';

  // 获取 Provider 启用状态（直接从 MusicProviderState 读取）
  const getProviderEnabled = useCallback(
    (provider: MusicProviderDefinition) => {
      const stateProvider = allProviders.find((p) => p.id === provider.id);
      return stateProvider?.enabled !== false;
    },
    [allProviders]
  );

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
          options={MUSIC_PROVIDER_TEMPLATES.map((template) => ({
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
          placeholder={MUSIC_PROVIDER_TEMPLATES.find((t) => t.id === newProviderTemplate)?.name ?? ''}
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
        providers={allProviders as unknown as MusicProviderDefinition[]}
        filteredProviders={filteredProviders as unknown as MusicProviderDefinition[]}
        selectedProviderId={selectedProviderId}
        onSelectProvider={setSelectedProviderId}
        searchTerm={musicSearchTerm}
        onSearchChange={setMusicSearchTerm}
        onAddProvider={() => setIsAddFormOpen((prev) => !prev)}
        showAddButton
        addButtonDisabled={!MUSIC_PROVIDER_TEMPLATES.length || !isHydrated}
        addFormSlot={addFormSlot}
        t={t}
        getProviderEnabled={getProviderEnabled}
        getModelCount={(provider) => provider.models?.length ?? 0}
      />

      {/* 右侧面板 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-1/60 wallpaper-blur">
        <div className="flex-1 overflow-y-auto min-h-0">
          {!selectedProvider ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('mediaSettings.music.noSelection')}
            </div>
          ) : (
            <ProviderDetailsPanel
              type="music"
              name={selectedProvider.name}
              typeBadge={getTypeBadge()}
              isCustom={selectedProvider.custom}
              enabled={selectedProviderEnabled}
              onToggleEnabled={(checked) => handleToggleProvider(selectedProvider.id, checked)}
              onDelete={selectedProvider.custom ? handleDeleteCustomProvider : undefined}
              credentialFields={selectedProvider.credentialFields as unknown as never}
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
        originalModels={originalModels}
        originalGroups={originalGroups as GenericModelGroup<MusicProviderModel>[]}
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
