/**
 * types.ts - Media Provider Settings 类型定义
 *
 * 包含 Image 和 Video Provider Settings 共享的类型定义
 *
 * @module components/MediaProviderSettings/types
 */

import type {
  MediaModelDefinition,
  MediaModelGroup,
  MediaProviderCredentialField} from '@byo/domain/media-types';

// ============================================================================
// 基础类型
// ============================================================================

export type MediaType = 'image' | 'video' | 'music' | 'asr' | 'tts';

export type ProviderStatus = 'stable' | 'beta' | 'comingSoon';

export type CredentialStatus = 'idle' | 'saving' | 'saved' | 'error';

export type ModelStatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

// ============================================================================
// 通用媒体模型类型
// ============================================================================

export type BaseModel = {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
};

export interface GenericModelGroup<T extends BaseModel> {
  id: string;
  name?: string;
  models: T[];
}

// ============================================================================
// Provider 信息类型
// ============================================================================

export interface MediaProviderInfo {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  website?: string;
  docsUrl?: string;
  status?: ProviderStatus;
  badge?: string;
}

// ============================================================================
// Video Provider 特定类型
// ============================================================================

export interface VideoProviderModel {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface VideoModelGroup {
  id: string;
  name?: string;
  models: VideoProviderModel[];
}

export interface VideoProviderDefinition extends MediaProviderInfo {
  credentialFields: MediaProviderCredentialField[];
  models: VideoProviderModel[];
  defaultModelId: string;
  modelGroups?: VideoModelGroup[];
}

export interface VideoProviderConfigEntry {
  enabled: boolean;
  defaultModelId: string;
  fields: Record<string, string>;
  models?: VideoProviderModel[];
  modelGroups?: VideoModelGroup[];
}

export type VideoProviderConfigMap = Record<string, VideoProviderConfigEntry>;

// ============================================================================
// Music Provider 特定类型
// ============================================================================

export interface MusicProviderModel {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface MusicModelGroup {
  id: string;
  name?: string;
  models: MusicProviderModel[];
}

export interface MusicProviderDefinition extends MediaProviderInfo {
  credentialFields: MediaProviderCredentialField[];
  models: MusicProviderModel[];
  defaultModelId: string;
  modelGroups?: MusicModelGroup[];
  /** Whether this is a custom provider created by user */
  custom?: boolean;
  /** Base provider ID if this is a custom provider */
  baseProviderId?: string;
}

export interface MusicProviderConfigEntry {
  enabled: boolean;
  defaultModelId: string;
  fields: Record<string, string>;
  models?: MusicProviderModel[];
  modelGroups?: MusicModelGroup[];
}

export type MusicProviderConfigMap = Record<string, MusicProviderConfigEntry>;

// ============================================================================
// ASR Provider 特定类型
// ============================================================================

export interface AsrProviderModel {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface AsrModelGroup {
  id: string;
  name?: string;
  models: AsrProviderModel[];
}

export interface AsrProviderDefinition extends MediaProviderInfo {
  credentialFields: MediaProviderCredentialField[];
  models: AsrProviderModel[];
  defaultModelId: string;
  modelGroups?: AsrModelGroup[];
  custom?: boolean;
  baseProviderId?: string;
}

export interface AsrProviderConfigEntry {
  enabled: boolean;
  defaultModelId: string;
  fields: Record<string, string>;
  models?: AsrProviderModel[];
  modelGroups?: AsrModelGroup[];
}

export type AsrProviderConfigMap = Record<string, AsrProviderConfigEntry>;

// ============================================================================
// TTS Provider 特定类型
// ============================================================================

export interface TtsProviderModel {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface TtsModelGroup {
  id: string;
  name?: string;
  models: TtsProviderModel[];
}

export interface TtsProviderDefinition extends MediaProviderInfo {
  credentialFields: MediaProviderCredentialField[];
  models: TtsProviderModel[];
  defaultModelId: string;
  modelGroups?: TtsModelGroup[];
  /** Whether this is a custom provider created by user */
  custom?: boolean;
  /** Base provider ID if this is a custom provider */
  baseProviderId?: string;
}

export interface TtsProviderConfigEntry {
  enabled: boolean;
  defaultModelId: string;
  fields: Record<string, string>;
  models?: TtsProviderModel[];
  modelGroups?: TtsModelGroup[];
}

export type TtsProviderConfigMap = Record<string, TtsProviderConfigEntry>;

// ============================================================================
// 模型编辑相关类型
// ============================================================================

export interface ModelEntry {
  id: string;
  name: string;
  groupId: string;
  originalId?: string;
}

// ============================================================================
// Re-exports from media-types
// ============================================================================

export type {
  MediaModelDefinition,
  MediaModelGroup,
  MediaProviderCredentialField};
