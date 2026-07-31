/**
 * @module shared/music-types/provider
 *
 * Music provider / model / credential field types. Plus the
 * MusicProviderDefinition shape — runtime state lives in ./state.
 *
 * @see BaseProvider for common interface pattern
 * @see MediaProviderDefinition for media provider pattern
 */

// Re-export base types for convenience
export type {
  BaseProvider,
  CredentialField,
  ProviderCredentials,
} from '../provider-types';

// ============================================================================
// Music Provider Types
// ============================================================================

export type MusicProviderStatus = 'stable' | 'beta' | 'comingSoon';

/**
 * 音乐提供商类型
 * - suno: Suno AI (vocals + instrumentals)
 * - udio: Udio (high-fidelity music)
 * - mubert: Mubert (royalty-free loops)
 * - soundraw: Soundraw (customizable tracks)
 * - acemusic: ACE-Step OpenRouter-compatible completion API (POST /v1/chat/completions)
 * - acemusic-async: ACE-Step polling API (POST /release_task → poll /query_result → GET /v1/audio)
 * - openrouter: OpenRouter (Lyria 3 Pro etc.)
 */
export type MusicProviderType =
  | 'suno'
  | 'udio'
  | 'mubert'
  | 'soundraw'
  | 'acemusic'
  | 'acemusic-async'
  | 'openrouter'
  | string;

export type MusicProviderCredentialKey = 'apiKey' | 'endpoint' | 'projectId';

export interface MusicProviderCredentialField {
  key: MusicProviderCredentialKey;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
}

// ============================================================================
// Music Model Types
// ============================================================================

/**
 * 音乐模型类型
 * - textToMusic: 文本生成音乐
 * - audioToMusic: 音频延续/变换
 * - extend: 扩展现有音轨
 */
export type MusicModelKind = 'textToMusic' | 'audioToMusic' | 'extend';

export interface MusicModelDefinition {
  id: string;
  name: string;
  description?: string;
  kind: MusicModelKind;
  /** 最大时长（秒） */
  maxDuration?: number;
  /** 支持的输出格式 */
  supportedFormats?: string[];
  /** 是否支持人声 */
  supportsVocals?: boolean;
  default?: boolean;
  enabled?: boolean;
}

export interface MusicModelGroup {
  id: string;
  name?: string;
  models: MusicModelDefinition[];
}

// ============================================================================
// Provider Definition
// ============================================================================

/**
 * 音乐 Provider 定义 (静态配置)
 *
 * Note: 遵循 BaseProvider 模式。
 * 共同字段: id, name, website, docsUrl, status
 *
 * @see BaseProvider for common interface pattern
 */
export interface MusicProviderDefinition {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 徽章文本 */
  badge?: string;
  /** 描述 */
  description: string;
  /** 亮点特性 */
  highlights: string[];
  /** 官网链接 */
  website?: string;
  /** 文档链接 */
  docsUrl?: string;
  /** 状态 */
  status?: MusicProviderStatus;
  /** Provider 类型 */
  type: MusicProviderType;
  /** 凭证字段定义 */
  credentialFields: MusicProviderCredentialField[];
  /** 模型列表 */
  models: MusicModelDefinition[];
  /** 默认模型 ID */
  defaultModelId: string;
  /** 模型分组 */
  modelGroups?: MusicModelGroup[];
  /** 是否为自定义 Provider */
  custom?: boolean;
  /** 基于的 Provider ID (自定义时) */
  baseProviderId?: string;
}
