/**
 * @module shared/music-types/params
 *
 * Music-domain primitives — note / key / time-signature + the composite
 * MusicGenerationParams + the music UI task-type & config record + the
 * provider-update payload + result wrappers.
 */

import type { MusicModelDefinition, MusicModelGroup } from './provider';
import type { StoredMusicProviderConfig } from './state';

/**
 * 音名类型（内部存储用升号）
 */
export type MusicNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

/**
 * 节拍记号
 * 值对应每小节的拍数：2=2/4, 3=3/4, 4=4/4, 6=6/8
 */
export type TimeSignature = '2' | '3' | '4' | '6' | 'auto';

/**
 * 调性定义
 * 内部存储统一使用升号格式，显示时根据调式自动转换
 *
 * @example 存储 { note: 'C#', mode: 'major' } => 显示 "D♭ Major"
 * @example 存储 { note: 'C#', mode: 'minor' } => 显示 "C# Minor"
 */
export interface MusicKey {
  /** 音名（内部存储用升号） */
  note: MusicNote;
  /** 调式 */
  mode: 'major' | 'minor';
}

/**
 * 音乐生成参数
 */
export interface MusicGenerationParams {
  /** 时长（秒），auto 表示自动 */
  duration?: number | 'auto';
  /** 节拍速度（bpm），auto 表示自动 */
  tempo?: number | 'auto';
  /** 节拍记号 */
  timeSignature?: TimeSignature;
  /** 调性 */
  key?: MusicKey | 'auto';
}

// ============================================================================
// Update Payload + Result wrappers
// ============================================================================

export interface MusicProviderUpdatePayload extends Partial<StoredMusicProviderConfig> {
  models?: MusicModelDefinition[];
  modelGroups?: MusicModelGroup[];
}

// ============================================================================
// Global Music Settings
// ============================================================================

export interface GlobalMusicSettings {
  defaultDuration: number | 'auto';
  defaultTempo: number | 'auto';
  defaultTimeSignature: TimeSignature;
  defaultKey: MusicKey | 'auto';
  concurrency: number;
  retryCount: number;
}

// ============================================================================
// Music Config (UI State)
// ============================================================================

/**
 * 音乐任务类型（基于 ACEMusic API）
 */
export type MusicTaskType = 'text2music' | 'cover' | 'edit';

/**
 * 音乐配置状态（用于输入框组件）
 */
export interface MusicConfig {
  duration: number | 'auto';
  tempo: number | 'auto';
  timeSignature: TimeSignature;
  key: MusicKey | 'auto';
  /** 歌词内容 */
  lyrics: string;
  /** 简单模式（隐藏歌词输入，启用 sample_mode） */
  simpleMode: boolean;
  /** 纯音乐模式（无人声） */
  instrumental: boolean;
  /** 任务类型 */
  taskType: MusicTaskType;
}
