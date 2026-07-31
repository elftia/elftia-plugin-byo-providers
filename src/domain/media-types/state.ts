/**
 * @module shared/media-types/state
 *
 * Stored / runtime state for media providers + update payload + model
 * override + custom-image provider input.
 *
 * @see BaseProvider for common interface pattern
 */

import type {
  MediaModelDefinition,
  MediaModelGroup,
  MediaProviderDefinition,
} from './provider';

/**
 * 存储的媒体 Provider 配置 (凭证)
 * @see ProviderCredentials for base interface
 */
export interface StoredMediaProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  projectId?: string;
  location?: string;
  endpoint?: string;
  defaultModelId?: string;
  /** Max concurrent requests (default: 1) */
  concurrency?: number;
  /** Retry count on failure (default: 2) */
  retryCount?: number;
  /** Default resolution for new sessions (default: '2k') */
  defaultResolution?: string;
  /** Default aspect ratio for new sessions (default: 'auto') */
  defaultAspectRatio?: string;
}

/**
 * 媒体 Provider 运行时状态
 *
 * 扩展 MediaProviderDefinition，添加运行时状态。
 * Note: 遵循 BaseProvider 模式，添加了 enabled 字段。
 *
 * @see BaseProvider for common interface pattern
 */
export interface MediaProviderState extends MediaProviderDefinition {
  /** 是否启用 (BaseProvider field) */
  enabled: boolean;
  /** 是否已配置凭证 */
  configured: boolean;
  /** 凭证配置 */
  config: StoredMediaProviderConfig;
  /** 模型分组 (可覆盖) */
  modelGroups?: MediaModelGroup[];
  /** 原始模型列表 */
  originalModels?: MediaModelDefinition[];
  /** 原始模型分组 */
  originalModelGroups?: MediaModelGroup[];
}

export interface MediaProviderModelOverride {
  models?: MediaModelDefinition[];
  modelGroups?: MediaModelGroup[];
}

export interface MediaProviderUpdatePayload extends Partial<StoredMediaProviderConfig> {
  models?: MediaModelDefinition[];
  modelGroups?: MediaModelGroup[];
}

export interface CustomImageProviderInput {
  baseProviderId: string;
  name: string;
  description?: string;
  badge?: string;
  docsUrl?: string;
}
