/**
 * utils.ts - Media Provider Settings 工具函数
 *
 * 包含 Image 和 Video Provider Settings 共享的工具函数
 *
 * @module components/MediaProviderSettings/utils
 */

import type {
  AsrModelGroup,
  AsrProviderModel,
  BaseModel,
  GenericModelGroup,
  MusicModelGroup,
  MusicProviderModel,
  ProviderStatus,
  TtsModelGroup,
  TtsProviderModel,
  VideoModelGroup,
  VideoProviderModel} from './types';

// ============================================================================
// 常量
// ============================================================================

export const DEFAULT_MEDIA_GROUP_ID = 'default';
export const DEFAULT_MEDIA_GROUP_NAME = 'Default';

// ============================================================================
// 凭证保存：拆分 secret / 非 secret 字段（byo-media-key-display-restore）
// ============================================================================

/** Minimal credential-field shape the secret-write splitter needs. */
export interface MediaCredentialFieldLike {
  key: string;
  secret?: boolean;
}

/** Result of {@link collectMediaSecretWrites}: secret writes + non-secret patch. */
export interface MediaCredentialSplit {
  /**
   * Secret fields with a NON-EMPTY (trimmed) value, to be written one-way via
   * `setProviderKey`. An EMPTY secret field is DELIBERATELY OMITTED — empty
   * means "leave the stored key unchanged" (matches the LLM form), so it must
   * never reach `setProviderKey` (empty → deleteSecret). Deleting a key is an
   * explicit action, not the absence of input.
   */
  secretWrites: Array<{ key: string; value: string }>;
  /** Non-secret credential fields (trimmed) → the `update` patch. */
  nonSecret: Record<string, string>;
}

/**
 * Split a media provider's credential fields into one-way secret writes and a
 * non-secret patch, applying the empty-secret-skip guard
 * (byo-media-key-display-restore Fix 1). The SSOT for the "empty secret =
 * leave unchanged" semantic shared by all 5 media panels' `flushCredentialSave`.
 */
export const collectMediaSecretWrites = (
  credentialFields: MediaCredentialFieldLike[],
  source: Record<string, string>
): MediaCredentialSplit => {
  const secretWrites: Array<{ key: string; value: string }> = [];
  const nonSecret: Record<string, string> = {};
  for (const field of credentialFields) {
    const trimmed = (source[field.key] ?? '').trim();
    if (field.secret) {
      // Empty secret → SKIP (never push, never call setProviderKey).
      if (trimmed) {
        secretWrites.push({ key: field.key, value: trimmed });
      }
    } else {
      nonSecret[field.key] = trimmed;
    }
  }
  return { secretWrites, nonSecret };
};

// ============================================================================
// 模型规范化函数
// ============================================================================

/**
 * 规范化媒体模型数组，确保每个模型都有 enabled 属性
 */
export const normalizeMediaModels = <T extends BaseModel>(models: T[] = []): T[] =>
  models.map((model) => ({
    ...model,
    enabled: model.enabled !== false
  }));

/**
 * 构建规范化的媒体模型分组
 * 将未分组的模型放入默认组
 */
export const buildNormalizedMediaGroups = <T extends BaseModel>(
  models: T[],
  groups?: GenericModelGroup<T>[]
): GenericModelGroup<T>[] => {
  const normalized =
    groups?.map((group) => ({
      ...group,
      models: group.models
        .map((model) => models.find((entry) => entry.id === model.id) || model)
        .filter(Boolean) as T[]
    })) ?? [];

  const assigned = new Set<string>();
  normalized.forEach((group) => {
    group.models.forEach((model) => assigned.add(model.id));
  });

  const remaining = models.filter((model) => !assigned.has(model.id));
  if (remaining.length > 0) {
    const defaultGroupIndex = normalized.findIndex((group) => group.id === DEFAULT_MEDIA_GROUP_ID);
    if (defaultGroupIndex >= 0) {
      normalized[defaultGroupIndex] = {
        ...normalized[defaultGroupIndex],
        models: [...normalized[defaultGroupIndex].models, ...remaining]
      };
    } else {
      normalized.push({
        id: DEFAULT_MEDIA_GROUP_ID,
        name: DEFAULT_MEDIA_GROUP_NAME,
        models: remaining
      });
    }
  }

  if (!normalized.length) {
    return [
      {
        id: DEFAULT_MEDIA_GROUP_ID,
        name: DEFAULT_MEDIA_GROUP_NAME,
        models
      }
    ];
  }

  return normalized;
};

/**
 * 将模型附加到指定分组
 */
export const attachModelToGroup = <T extends BaseModel>(
  groups: GenericModelGroup<T>[],
  groupId: string,
  model: T
): GenericModelGroup<T>[] => {
  let found = false;
  const next = groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }
    found = true;
    if (group.models.some((existing) => existing.id === model.id)) {
      return group;
    }
    return {
      ...group,
      models: [...group.models, model]
    };
  });

  if (!found) {
    return [
      ...next,
      {
        id: groupId || DEFAULT_MEDIA_GROUP_ID,
        name: groupId === DEFAULT_MEDIA_GROUP_ID ? DEFAULT_MEDIA_GROUP_NAME : groupId,
        models: [model]
      }
    ];
  }

  return next;
};

/**
 * 根据搜索词过滤模型分组
 */
export const filterGroupsBySearch = <T extends BaseModel>(
  groups: GenericModelGroup<T>[],
  term: string
): GenericModelGroup<T>[] => {
  if (!term.trim()) {
    return groups;
  }
  const lowered = term.trim().toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      models: group.models.filter((model) => {
        const haystack = `${model.name} ${model.id} ${model.description ?? ''}`.toLowerCase();
        return haystack.includes(lowered);
      })
    }))
    .filter((group) => group.models.length > 0);
};

// ============================================================================
// Video 特定工具函数
// ============================================================================

/**
 * 克隆 Video 模型数组
 */
export const cloneVideoModels = (models: VideoProviderModel[] = []): VideoProviderModel[] =>
  models.map((model) => ({ ...model }));

/**
 * 序列化 Video 模型分组
 */
export const serializeVideoGroups = (
  groups: GenericModelGroup<VideoProviderModel>[]
): VideoModelGroup[] =>
  groups.map((group) => ({
    id: group.id,
    name: group.name,
    models: cloneVideoModels(group.models)
  }));

// ============================================================================
// Music 特定工具函数
// ============================================================================

/**
 * 克隆 Music 模型数组
 */
export const cloneMusicModels = (models: MusicProviderModel[] = []): MusicProviderModel[] =>
  models.map((model) => ({ ...model }));

/**
 * 序列化 Music 模型分组
 */
export const serializeMusicGroups = (
  groups: GenericModelGroup<MusicProviderModel>[]
): MusicModelGroup[] =>
  groups.map((group) => ({
    id: group.id,
    name: group.name,
    models: cloneMusicModels(group.models)
  }));

// ============================================================================
// ASR 特定工具函数
// ============================================================================

/**
 * 克隆 ASR 模型数组
 */
export const cloneAsrModels = (models: AsrProviderModel[] = []): AsrProviderModel[] =>
  models.map((model) => ({ ...model }));

/**
 * 序列化 ASR 模型分组
 */
export const serializeAsrGroups = (
  groups: GenericModelGroup<AsrProviderModel>[]
): AsrModelGroup[] =>
  groups.map((group) => ({
    id: group.id,
    name: group.name,
    models: cloneAsrModels(group.models)
  }));

// ============================================================================
// TTS 特定工具函数
// ============================================================================

/**
 * 克隆 TTS 模型数组
 */
export const cloneTtsModels = (models: TtsProviderModel[] = []): TtsProviderModel[] =>
  models.map((model) => ({ ...model }));

/**
 * 序列化 TTS 模型分组
 */
export const serializeTtsGroups = (
  groups: GenericModelGroup<TtsProviderModel>[]
): TtsModelGroup[] =>
  groups.map((group) => ({
    id: group.id,
    name: group.name,
    models: cloneTtsModels(group.models)
  }));

// ============================================================================
// UI 辅助函数
// ============================================================================

/**
 * 获取状态对应的颜色类名
 */
export const statusColor = (status?: ProviderStatus, enabled?: boolean): string => {
  if (enabled === false) {
    return 'bg-slate-400';
  }
  switch (status) {
    case 'beta':
      return 'bg-amber-500';
    case 'comingSoon':
      return 'bg-slate-400';
    default:
      return 'bg-primary';
  }
};

/**
 * 在分组中查找模型所属的组 ID
 */
export const findModelGroupId = <T extends BaseModel>(
  groups: GenericModelGroup<T>[],
  modelId: string,
  defaultGroupId: string
): string => {
  for (const group of groups) {
    if (group.models.some((m) => m.id === modelId)) {
      return group.id;
    }
  }
  return defaultGroupId;
};
