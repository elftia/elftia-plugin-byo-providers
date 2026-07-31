/**
 * @module shared/music-types/state
 *
 * Stored / runtime state for music providers + result wrapper + display
 * utilities for note rendering.
 */

import type { MusicKey, TimeSignature } from './params';
import type {
  MusicModelDefinition,
  MusicModelGroup,
  MusicProviderDefinition,
} from './provider';

// ============================================================================
// Storage Types
// ============================================================================

/**
 * 存储的音乐 Provider 配置 (凭证)
 * @see ProviderCredentials for base interface
 */
export interface StoredMusicProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
  projectId?: string;
  defaultModelId?: string;
  /** 默认时长 */
  defaultDuration?: number | 'auto';
  /** 默认节拍 */
  defaultTempo?: number | 'auto';
  /** 默认节拍记号 */
  defaultTimeSignature?: TimeSignature;
  /** 默认调性 */
  defaultKey?: MusicKey | 'auto';
  /** 并发数 (default: 1) */
  concurrency?: number;
  /** 重试次数 (default: 2) */
  retryCount?: number;
}

/**
 * 音乐 Provider 运行时状态
 *
 * 扩展 MusicProviderDefinition，添加运行时状态。
 * Note: 遵循 BaseProvider 模式，添加了 enabled 字段。
 *
 * @see BaseProvider for common interface pattern
 */
export interface MusicProviderState extends MusicProviderDefinition {
  /** 是否启用 (BaseProvider field) */
  enabled: boolean;
  /** 是否已配置凭证 */
  configured: boolean;
  /** 凭证配置 */
  config: StoredMusicProviderConfig;
  /** 原始模型列表 */
  originalModels?: MusicModelDefinition[];
  /** 原始模型分组 */
  originalModelGroups?: MusicModelGroup[];
}

export interface MusicProviderResult {
  success: boolean;
  provider?: MusicProviderState;
  message?: string;
}

// ============================================================================
// Note Display Utilities
// ============================================================================

/**
 * 根据调式返回专业的标准命名映射
 */
export const NOTE_DISPLAY_MAP: Record<string, { major: string; minor: string }> = {
  'C#': { major: 'D♭', minor: 'C#' },
  'D#': { major: 'E♭', minor: 'E♭' },  // D# minor 极少用
  'F#': { major: 'F#', minor: 'F#' },  // 两者都常用
  'G#': { major: 'A♭', minor: 'G#' },
  'A#': { major: 'B♭', minor: 'B♭' },  // A# minor 极少用
};

/**
 * 获取音名的显示文本（根据调式智能转换）
 * @param note 内部存储的音名（升号格式）
 * @param mode 调式
 * @returns 显示用的音名
 */
export const getDisplayNote = (note: string, mode: 'major' | 'minor'): string => {
  return NOTE_DISPLAY_MAP[note]?.[mode] || note;
};

/**
 * 获取完整的调性显示文本
 * @example getKeyDisplayText('C#', 'minor') => 'C# Minor'
 * @example getKeyDisplayText('C#', 'major') => 'D♭ Major'
 */
export const getKeyDisplayText = (note: string, mode: 'major' | 'minor'): string => {
  const displayNote = getDisplayNote(note, mode);
  return `${displayNote} ${mode === 'major' ? 'Major' : 'Minor'}`;
};
