/**
 * @module shared/media-types/provider
 *
 * Media provider status / type / credential field + model + group +
 * provider definition. Lean atom-level surface — state types live in
 * ./state.
 *
 * @see BaseProvider for common interface pattern
 */

// Re-export base types for convenience
export type {
  BaseModelConfig,
  BaseModelGroup,
  BaseProvider,
  ConfigServiceCacheStats,
  CredentialField,
  CredentialKey,
  IConfigService,
  ProviderCredentials,
  ProviderOperationResult,
  ProviderStatus} from '../provider-types';

// ============================================================================
// Media Provider Types
// ============================================================================

export type MediaProviderStatus = 'stable' | 'beta' | 'comingSoon';
// `wavespeed-relay` is the RUNTIME-ONLY official media relay provider type
// (relay-wave15-media-client). It is never persisted — synthesized at boot on a
// `relayProvider`-capable channel and dispatched to the `wavespeed-relay` image
// adapter via the registry (which keys on this string). No BYO row ever carries it.
export type MediaProviderType = 'geminiAistudio' | 'googleVertex' | 'openai' | 'xai' | 'openrouter' | 'wavespeed-relay';

export type MediaProviderCredentialKey =
  | 'apiKey'
  | 'projectId'
  | 'location'
  | 'endpoint';

/**
 * 媒体 Provider 凭证字段定义
 * @see CredentialField for base interface
 */
export interface MediaProviderCredentialField {
  key: MediaProviderCredentialKey;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
}

export type MediaModelKind =
  | 'imagenPredict'
  | 'geminiGenerate'
  | 'vertexGenerate'
  | 'openaiResponses'
  | 'xaiGenerate'
  | 'openrouterChatImage'
  // The official media relay's WaveSpeed-async image models (relay-wave15-media-
  // client). `kind` is required on MediaModelDefinition; the `wavespeed-relay`
  // image adapter ignores it (it dispatches on the model id, not the kind).
  | 'wavespeedRelay';

export interface MediaModelDefinition {
  id: string;
  name: string;
  description?: string;
  kind: MediaModelKind;
  maxImages?: number;
  aspectRatios?: string[];
  default?: boolean;
  enabled?: boolean;
}

/**
 * 媒体模型分组
 * @see BaseModelGroup for base interface
 */
export interface MediaModelGroup {
  id: string;
  name?: string;
  models: MediaModelDefinition[];
}

/**
 * 媒体 Provider 定义 (静态配置)
 *
 * Note: 遵循 BaseProvider 模式。
 * 共同字段: id, name, website, docsUrl, status
 *
 * @see BaseProvider for common interface pattern
 */
export interface MediaProviderDefinition {
  // ===== BaseProvider-like fields =====
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 官网链接 */
  website?: string;
  /** 文档链接 */
  docsUrl?: string;
  /** 状态 */
  status?: MediaProviderStatus;

  // ===== Media-specific fields =====
  /** 徽章文本 */
  badge?: string;
  /** 描述 */
  description: string;
  /** 亮点特性 */
  highlights: string[];
  /** Provider 类型 */
  type: MediaProviderType;
  /** 凭证字段定义 */
  credentialFields: MediaProviderCredentialField[];
  /** 模型列表 */
  models: MediaModelDefinition[];
  /** 默认模型 ID */
  defaultModelId: string;
  /** 是否为自定义 Provider */
  custom?: boolean;
  /** 基于的 Provider ID (自定义时) */
  baseProviderId?: string;
  /** 模型分组 */
  modelGroups?: MediaModelGroup[];
}
