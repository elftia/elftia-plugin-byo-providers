/**
 * music-constants.ts - Music Provider Settings 常量定义
 *
 * 包含 Music Provider Library 和其他共享常量
 *
 * @module components/provider-settings/media/music-constants
 */

export { MUSIC_PROVIDER_LIBRARY } from './music-catalog';

/**
 * 默认音乐配置
 */
export const DEFAULT_MUSIC_CONFIG = {
  duration: 'auto' as const,
  tempo: 'auto' as const,
  timeSignature: 'auto' as const,
  key: 'auto' as const,
  lyrics: '',
  simpleMode: true, // 默认启用简单模式
  instrumental: false,
  taskType: 'text2music' as const,
};

/**
 * 音乐任务类型选项
 */
export const MUSIC_TASK_OPTIONS = [
  { value: 'text2music', label: 'Text to Music' },
  { value: 'cover', label: 'Cover' },
  { value: 'edit', label: 'Edit' },
];

/**
 * Duration 范围常量
 */
export const DURATION_RANGE = {
  min: 10,
  max: 300,
};

/**
 * Tempo (BPM) 范围常量
 */
export const TEMPO_RANGE = {
  min: 30,
  max: 200,
};

/**
 * Time Signature 选项
 */
export const TIME_SIGNATURE_OPTIONS = [
  { value: '2', label: '2/4' },
  { value: '3', label: '3/4' },
  { value: '4', label: '4/4' },
  { value: '6', label: '6/8' },
];

/**
 * 钢琴键盘布局常量
 */
export const PIANO_LAYOUT = {
  /** 黑键位置音符（内部存储用升号） */
  blackKeys: ['C#', 'D#', null, 'F#', 'G#', 'A#'] as (string | null)[],
  /** 白键音符 */
  whiteKeys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
};
