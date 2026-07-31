/**
 * useModelManagement.ts - 模型管理 Hook
 *
 * 处理模型的增删改查操作和状态管理
 *
 * @module components/MediaProviderSettings/hooks/useModelManagement
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  BaseModel,
  GenericModelGroup,
  ModelEntry,
  ModelStatusMessage
} from '../types';
import {
  attachModelToGroup,
  buildNormalizedMediaGroups,
  DEFAULT_MEDIA_GROUP_ID,
  filterGroupsBySearch,
  findModelGroupId,
  normalizeMediaModels} from '../utils';

interface UseModelManagementOptions<T extends BaseModel> {
  /**
   * 原始模型列表
   */
  models: T[];
  /**
   * 原始分组列表
   */
  modelGroups?: GenericModelGroup<T>[];
  /**
   * 持久化模型变更的回调
   */
  onPersist: (
    models: T[],
    groups: GenericModelGroup<T>[]
  ) => Promise<boolean | undefined> | undefined;
  /**
   * 翻译函数
   */
  t: (key: string, params?: Record<string, string | number>) => string;
}

interface UseModelManagementReturn<T extends BaseModel> {
  // 状态
  modelSearchTerm: string;
  setModelSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  collapsedGroups: Record<string, boolean>;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  editingModel: { id: string; name: string } | null;
  setEditingModel: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
  showManageModels: boolean;
  setShowManageModels: React.Dispatch<React.SetStateAction<boolean>>;
  showAddModelDialog: boolean;
  setShowAddModelDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showEditModelDialog: boolean;
  setShowEditModelDialog: React.Dispatch<React.SetStateAction<boolean>>;
  newModelEntry: ModelEntry;
  setNewModelEntry: React.Dispatch<React.SetStateAction<ModelEntry>>;
  editModelEntry: ModelEntry;
  setEditModelEntry: React.Dispatch<React.SetStateAction<ModelEntry>>;
  modelStatus: ModelStatusMessage;
  setModelStatus: React.Dispatch<React.SetStateAction<ModelStatusMessage>>;

  // 计算属性
  normalizedModels: T[];
  normalizedGroups: GenericModelGroup<T>[];
  defaultGroupId: string;
  visibleGroups: GenericModelGroup<T>[];
  existingModelIds: Set<string>;

  // 动作
  toggleGroup: (groupId: string) => void;
  showModelMessage: (key: string, type?: 'success' | 'error') => void;
  handleRemoveModel: (modelId: string) => Promise<void> | void;
  handleToggleModel: (modelId: string, enabled: boolean) => Promise<void> | void;
  handleApplyModelEdit: () => Promise<void> | void;
  handleOpenEditModelDialog: (model: T) => void;
  handleApplyEditModelDialog: () => Promise<void> | void;
  handleAddModel: (id: string, name: string, groupId: string) => Promise<void> | void;
  handleAddCatalogModel: (model: T) => Promise<void> | void;
  resetState: () => void;
}

/**
 * 模型管理 Hook
 *
 * 提供完整的模型管理功能，包括：
 * - 模型列表的规范化和分组
 * - 搜索过滤
 * - 添加/编辑/删除模型
 * - 启用/禁用模型
 * - 分组折叠状态管理
 */
export function useModelManagement<T extends BaseModel>(
  options: UseModelManagementOptions<T>
): UseModelManagementReturn<T> {
  const { models, modelGroups, onPersist, t } = options;

  // 状态
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [editingModel, setEditingModel] = useState<{ id: string; name: string } | null>(null);
  const [showManageModels, setShowManageModels] = useState(false);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [showEditModelDialog, setShowEditModelDialog] = useState(false);
  const [newModelEntry, setNewModelEntry] = useState<ModelEntry>({
    id: '',
    name: '',
    groupId: DEFAULT_MEDIA_GROUP_ID,
    originalId: ''
  });
  const [editModelEntry, setEditModelEntry] = useState<ModelEntry>({
    id: '',
    name: '',
    groupId: DEFAULT_MEDIA_GROUP_ID,
    originalId: ''
  });
  const [modelStatus, setModelStatus] = useState<ModelStatusMessage>(null);

  // 计算属性
  const normalizedModels = useMemo<T[]>(() => {
    return normalizeMediaModels<T>(models);
  }, [models]);

  const normalizedGroups = useMemo<GenericModelGroup<T>[]>(() => {
    return buildNormalizedMediaGroups<T>(
      normalizedModels,
      modelGroups as GenericModelGroup<T>[] | undefined
    );
  }, [normalizedModels, modelGroups]);

  const defaultGroupId = normalizedGroups[0]?.id || DEFAULT_MEDIA_GROUP_ID;

  const visibleGroups = useMemo(() => {
    return filterGroupsBySearch(normalizedGroups, modelSearchTerm);
  }, [normalizedGroups, modelSearchTerm]);

  const existingModelIds = useMemo(
    () => new Set(normalizedModels.map((model) => model.id)),
    [normalizedModels]
  );

  // 状态自动清理
  useEffect(() => {
    if (!modelStatus) {
      return undefined;
    }
    const timer = setTimeout(() => setModelStatus(null), 2500);
    return () => clearTimeout(timer);
  }, [modelStatus]);

  // 动作
  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  const showModelMessage = useCallback(
    (key: string, type: 'success' | 'error' = 'success') => {
      setModelStatus({ type, message: t(key) });
    },
    [t]
  );

  const handleRemoveModel = useCallback(
    async (modelId: string) => {
      const nextModels = normalizedModels.filter((model) => model.id !== modelId);
      const baseGroups = normalizedGroups
        .map((group) => ({
          ...group,
          models: group.models.filter((model) => model.id !== modelId)
        }))
        .filter((group) => group.models.length > 0);
      const updatedGroups = buildNormalizedMediaGroups<T>(nextModels, baseGroups);
      const result = await onPersist(nextModels, updatedGroups);
      if (result !== false) {
        showModelMessage('providerSettings.modelsManager.messages.removed');
      }
    },
    [normalizedModels, normalizedGroups, onPersist, showModelMessage]
  );

  const handleToggleModel = useCallback(
    async (modelId: string, enabled: boolean) => {
      const nextModels = normalizedModels.map((model) =>
        model.id === modelId ? { ...model, enabled } : model
      );
      await onPersist(nextModels, normalizedGroups);
    },
    [normalizedModels, normalizedGroups, onPersist]
  );

  const handleApplyModelEdit = useCallback(async () => {
    if (!editingModel) {
      return;
    }
    const trimmed = editingModel.name.trim();
    if (!trimmed) {
      return;
    }
    const nextModels = normalizedModels.map((model) =>
      model.id === editingModel.id ? { ...model, name: trimmed } : model
    );
    const result = await onPersist(nextModels, normalizedGroups);
    if (result !== false) {
      showModelMessage('providerSettings.modelsManager.messages.updated');
      setEditingModel(null);
    }
  }, [editingModel, normalizedModels, normalizedGroups, onPersist, showModelMessage]);

  const handleOpenEditModelDialog = useCallback(
    (model: T) => {
      const currentGroupId = findModelGroupId(normalizedGroups, model.id, defaultGroupId);
      setEditModelEntry({
        id: model.id,
        name: model.name || model.id,
        groupId: currentGroupId,
        originalId: model.id
      });
      setShowEditModelDialog(true);
    },
    [normalizedGroups, defaultGroupId]
  );

  const handleApplyEditModelDialog = useCallback(async () => {
    const { id, name, groupId, originalId } = editModelEntry;
    const trimmedId = id.trim();
    if (!trimmedId) {
      return;
    }
    const trimmedName = name.trim() || trimmedId;
    const targetId = originalId || editModelEntry.id;
    if (trimmedId !== targetId && existingModelIds.has(trimmedId)) {
      showModelMessage('providerSettings.modelsManager.messages.duplicate', 'error');
      return;
    }
    const targetModel = normalizedModels.find((model) => model.id === targetId);
    if (!targetModel) {
      return;
    }
    const updatedModel = { ...targetModel, id: trimmedId, name: trimmedName };
    const targetGroupId = groupId || findModelGroupId(normalizedGroups, targetId, defaultGroupId);
    const baseGroups = normalizedGroups
      .map((group) => ({
        ...group,
        models: group.models.filter((m) => m.id !== targetId)
      }))
      .filter((group) => group.models.length > 0 || group.id === targetGroupId || group.id === DEFAULT_MEDIA_GROUP_ID);
    const nextGroups = attachModelToGroup<T>(baseGroups, targetGroupId, updatedModel);
    const nextModels = normalizedModels.map((model) =>
      model.id === targetId ? updatedModel : model
    );
    const result = await onPersist(nextModels, nextGroups);
    if (result !== false) {
      showModelMessage('providerSettings.modelsManager.messages.updated');
      setShowEditModelDialog(false);
      setEditModelEntry({ id: '', name: '', groupId: defaultGroupId, originalId: '' });
    }
  }, [
    editModelEntry,
    existingModelIds,
    normalizedModels,
    normalizedGroups,
    defaultGroupId,
    onPersist,
    showModelMessage
  ]);

  const handleAddModel = useCallback(
    async (id: string, name: string, groupId: string) => {
      const trimmedId = id.trim();
      if (!trimmedId) {
        return;
      }
      if (existingModelIds.has(trimmedId)) {
        showModelMessage('providerSettings.modelsManager.messages.duplicate', 'error');
        return;
      }
      const newModel = {
        id: trimmedId,
        name: name.trim() || trimmedId,
        enabled: true
      } as T;
      const nextModels = [...normalizedModels, newModel];
      const baseGroups = buildNormalizedMediaGroups<T>(nextModels, normalizedGroups);
      const targetGroup = groupId || defaultGroupId;
      const nextGroups = attachModelToGroup<T>(baseGroups, targetGroup, newModel);
      const result = await onPersist(nextModels, nextGroups);
      if (result !== false) {
        showModelMessage('providerSettings.modelsManager.messages.added');
        setShowAddModelDialog(false);
        setNewModelEntry({ id: '', name: '', groupId: targetGroup, originalId: '' });
      }
    },
    [
      existingModelIds,
      normalizedModels,
      normalizedGroups,
      defaultGroupId,
      onPersist,
      showModelMessage
    ]
  );

  const handleAddCatalogModel = useCallback(
    async (model: T) => {
      await handleAddModel(model.id, model.name, defaultGroupId);
    },
    [handleAddModel, defaultGroupId]
  );

  const resetState = useCallback(() => {
    setModelSearchTerm('');
    setCollapsedGroups({});
    setEditingModel(null);
    setShowManageModels(false);
    setShowAddModelDialog(false);
    setShowEditModelDialog(false);
    setModelStatus(null);
  }, []);

  return {
    // 状态
    modelSearchTerm,
    setModelSearchTerm,
    collapsedGroups,
    setCollapsedGroups,
    editingModel,
    setEditingModel,
    showManageModels,
    setShowManageModels,
    showAddModelDialog,
    setShowAddModelDialog,
    showEditModelDialog,
    setShowEditModelDialog,
    newModelEntry,
    setNewModelEntry,
    editModelEntry,
    setEditModelEntry,
    modelStatus,
    setModelStatus,

    // 计算属性
    normalizedModels,
    normalizedGroups,
    defaultGroupId,
    visibleGroups,
    existingModelIds,

    // 动作
    toggleGroup,
    showModelMessage,
    handleRemoveModel,
    handleToggleModel,
    handleApplyModelEdit,
    handleOpenEditModelDialog,
    handleApplyEditModelDialog,
    handleAddModel,
    handleAddCatalogModel,
    resetState
  };
}
