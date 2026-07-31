/**
 * VideoProviderSettingsPanel.tsx - 视频 Provider 设置面板
 *
 * 管理视频生成服务提供商的配置、凭证和模型
 * 数据通过后端 IPC + SQLite 存储，与图像模型保持一致的架构
 *
 * @module components/MediaProviderSettings/VideoProviderSettingsPanel
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { VideoProviderState } from '@byo/domain/video-types';

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
  ProviderSidebar} from './components';
import { useModelManagement } from './hooks';
import { ProviderDetailsPanel } from './shared/ProviderDetailsPanel';
import type {
  GenericModelGroup,
  VideoProviderDefinition,
  VideoProviderModel
} from './types';
import {
  buildNormalizedMediaGroups,
  cloneVideoModels,
  collectMediaSecretWrites,
  normalizeMediaModels,
  serializeVideoGroups
} from './utils';

/**
 * 视频 Provider 设置面板组件
 */
export function VideoProviderSettingsPanel() {
  const t = useTranslation();
  const confirmDialog = useConfirmDialog();

  // 从后端 IPC + SQLite 加载 Provider 数据
  const { providers, loading: isLoading, refresh } = useMediaProvidersData('video');
  const allProviders = providers as unknown as VideoProviderState[];
  const isHydrated = !isLoading;

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
  const [credentialStatus, setCredentialStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const latestCredentialValuesRef = useRef<Record<string, string>>({});

  // 搜索状态
  const [videoSearchTerm, setVideoSearchTerm] = useState('');

  // 自定义 Provider 创建表单状态
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderTemplate, setNewProviderTemplate] = useState('');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  // providers 加载完成后初始化选中状态
  useEffect(() => {
    if (allProviders.length > 0 && !selectedProviderId) {
      queueMicrotask(() => setSelectedProviderId(allProviders[0].id));
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
      // byo-media-secret-hardening: secret fields (`secret: true`) route through
      // the one-way `setProviderKey` channel into SecretsService; non-secret
      // fields ride the `update` patch. The video provider's secret fields are
      // `apiKey` AND the BytePlus asset-library `byteplusAk`/`byteplusSk` — but
      // the latter two have NO generation-side consumer and the IPC patch never
      // declared them (a dead write path), so we intentionally persist ONLY the
      // `apiKey` secret (the others are a no-op until/unless asset-library upload
      // is wired). Plaintext secrets NEVER cross the `update` patch.
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
          // Only `apiKey` has a live consumer; byteplusAk/Sk are vestigial (see above).
          if (key === 'apiKey') {
            await mediaConfigClient.video.setProviderKey(selectedProvider.id, value);
          }
        }
        await mediaConfigClient.video.update(selectedProvider.id, updatePayload);
        skipFormSyncRef.current = true;
        await refresh();
        setCredentialStatus('saved');
      } catch (error) {
        console.error('Failed to persist video provider credentials:', error);
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
      }, 600);
    },
    [flushCredentialSave]
  );

  // 模型相关计算（从后端返回的 VideoProviderState 直接读取）
  const videoModels = useMemo<VideoProviderModel[]>(() => {
    return normalizeMediaModels<VideoProviderModel>(selectedProvider?.models ?? []);
  }, [selectedProvider?.models]);

  const videoGroups = useMemo<GenericModelGroup<VideoProviderModel>[]>(() => {
    return buildNormalizedMediaGroups<VideoProviderModel>(
      videoModels,
      selectedProvider?.modelGroups as GenericModelGroup<VideoProviderModel>[] | undefined
    );
  }, [videoModels, selectedProvider?.modelGroups]);

  // 持久化模型变更
  const persistVideoModels = useCallback(
    async (models: VideoProviderModel[], groups?: GenericModelGroup<VideoProviderModel>[]) => {
      if (!selectedProvider) {
        return false;
      }
      const normalizedGroups = serializeVideoGroups(
        groups ?? buildNormalizedMediaGroups<VideoProviderModel>(models, videoGroups)
      );
      try {
        await mediaConfigClient.video.update(selectedProvider.id, {
          models: cloneVideoModels(models) as unknown as never,
          modelGroups: normalizedGroups as unknown as never
        });
        skipFormSyncRef.current = true;
        await refresh();
        return true;
      } catch (error) {
        console.error('Failed to persist video models:', error);
        return false;
      }
    },
    [selectedProvider, videoGroups, refresh]
  );

  // 模型管理 Hook
  const modelManagement = useModelManagement<VideoProviderModel>({
    models: videoModels,
    modelGroups: videoGroups,
    onPersist: persistVideoModels,
    t
  });

  // 原始模型目录（来自 library 定义）
  const originalModels = useMemo(
    () => normalizeMediaModels<VideoProviderModel>(
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
      const result = await mediaConfigClient.video.refreshUpstreamModels(selectedProvider.id);
      if (result.success && result.provider) {
        skipFormSyncRef.current = true;
        await refresh();
        modelManagement.showModelMessage('providerSettings.modelsManager.messages.refreshed');
        return;
      }
      if (result.message && result.message !== 'unsupported') {
        modelManagement.showModelMessage(
          'providerSettings.modelsManager.messages.refreshFailed',
          'error'
        );
        console.error('Failed to refresh video models from upstream:', result.message);
        return;
      }
      // unsupported — 走下面的 library-default 回退分支
    } catch (error) {
      console.error('Failed to refresh video models from upstream:', error);
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
      await mediaConfigClient.video.update(selectedProvider.id, {
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
      console.error('Failed to restore video models:', error);
    }
  }, [selectedProvider, refresh, modelManagement]);

  // 设置默认模型
  const handleSetDefaultModel = useCallback(
    async (modelId: string) => {
      if (!selectedProvider) {
        return;
      }
      try {
        await mediaConfigClient.video.update(selectedProvider.id, { defaultModelId: modelId });
        skipFormSyncRef.current = true;
        setFormValues((prev) => {
          const next = { ...prev, defaultModelId: modelId };
          latestCredentialValuesRef.current = next;
          return next;
        });
        await refresh();
      } catch (error) {
        console.error('Failed to set default video model:', error);
      }
    },
    [selectedProvider, refresh]
  );

  // 过滤 Providers
  const filteredProviders = useMemo(() => {
    if (!videoSearchTerm.trim()) {
      return allProviders;
    }
    const term = videoSearchTerm.trim().toLowerCase();
    return allProviders.filter((p) => {
      const haystack = `${p.name} ${p.description ?? ''} ${p.badge ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [videoSearchTerm, allProviders]);

  // 内置 Provider 模板列表（用于创建自定义 Provider）
  const builtinTemplates = useMemo(
    () => allProviders.filter((p) => !p.custom),
    [allProviders]
  );

  // 打开添加表单时自动选中第一个模板
  useEffect(() => {
    if (isAddFormOpen && !newProviderTemplate && builtinTemplates.length > 0) {
      setNewProviderTemplate(builtinTemplates[0].id);
    }
  }, [isAddFormOpen, builtinTemplates, newProviderTemplate]);

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
        await mediaConfigClient.video.update(providerId, { enabled });
        await refresh();
      } catch (error) {
        console.error('Failed to toggle video provider:', error);
      }
    },
    [isHydrated, refresh]
  );

  // 创建自定义 Provider
  const handleCreateCustomProvider = useCallback(async () => {
    const template = builtinTemplates.find((p) => p.id === newProviderTemplate);
    if (!template) return;
    const displayName =
      newProviderName.trim() ||
      t('mediaSettings.video.addProviderNameFallback', { template: template.name });
    setIsCreatingProvider(true);
    try {
      const created = await mediaConfigClient.video.createCustom({
        baseProviderId: template.id,
        name: displayName
      });
      await refresh();
      setSelectedProviderId(created.id);
      setIsAddFormOpen(false);
      setNewProviderName('');
    } catch (error) {
      console.error('Failed to create custom video provider:', error);
    } finally {
      setIsCreatingProvider(false);
    }
  }, [builtinTemplates, newProviderName, newProviderTemplate, refresh, t]);

  // 删除自定义 Provider
  const handleDeleteCustomProvider = useCallback(async () => {
    if (!selectedProvider?.custom) return;
    const confirmed = await confirmDialog({
      title: t('mediaSettings.video.deleteCustom'),
      description: t('mediaSettings.video.deleteCustomConfirm', { name: selectedProvider.name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await mediaConfigClient.video.deleteCustom(selectedProvider.id);
      setSelectedProviderId('');
      await refresh();
    } catch (error) {
      console.error('Failed to delete custom video provider:', error);
    }
  }, [confirmDialog, refresh, selectedProvider, t]);

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

  // 获取 Provider 启用状态（直接从 VideoProviderState 读取）
  const getProviderEnabled = useCallback(
    (provider: VideoProviderDefinition) => {
      const stateProvider = allProviders.find((p) => p.id === provider.id);
      return stateProvider?.enabled !== false;
    },
    [allProviders]
  );

  // 添加表单插槽
  const addFormSlot = isAddFormOpen ? (
    <div className="space-y-2 rounded-md border border-border bg-surface-1 wallpaper-blur p-3">
      <div className="text-xs font-semibold uppercase tracking-wide">
        {t('mediaSettings.video.addProviderTitle')}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">
          {t('mediaSettings.video.addProviderTemplate')}
        </label>
        <Select
          value={newProviderTemplate}
          onChange={setNewProviderTemplate}
          className="w-full"
          size="sm"
          options={builtinTemplates.map((tpl) => ({
            value: tpl.id,
            label: tpl.name
          }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">
          {t('mediaSettings.video.addProviderNameLabel')}
        </label>
        <Input
          value={newProviderName}
          onChange={(e) => setNewProviderName(e.target.value)}
          placeholder={builtinTemplates.find((tpl) => tpl.id === newProviderTemplate)?.name ?? ''}
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
          {t('mediaSettings.video.addProviderCancel')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleCreateCustomProvider}
          disabled={isCreatingProvider || !newProviderTemplate}
        >
          {isCreatingProvider
            ? t('mediaSettings.video.addProviderCreating')
            : t('mediaSettings.video.addProviderCreate')}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full overflow-hidden bg-surface-0">
      <ProviderSidebar
        providers={allProviders as unknown as VideoProviderDefinition[]}
        filteredProviders={filteredProviders as unknown as VideoProviderDefinition[]}
        selectedProviderId={selectedProviderId}
        onSelectProvider={setSelectedProviderId}
        searchTerm={videoSearchTerm}
        onSearchChange={setVideoSearchTerm}
        onAddProvider={() => setIsAddFormOpen((prev) => !prev)}
        showAddButton
        addButtonDisabled={!builtinTemplates.length}
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
              {t('mediaSettings.video.noSelection')}
            </div>
          ) : (
            <ProviderDetailsPanel
              type="video"
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
        originalGroups={originalGroups as GenericModelGroup<VideoProviderModel>[]}
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
