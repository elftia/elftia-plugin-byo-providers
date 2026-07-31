/**
 * music-constants.ts - Music Provider Settings 常量定义
 *
 * 包含 Music Provider Library 和其他共享常量
 *
 * @module components/provider-settings/media/music-constants
 */

import type { MusicProviderDefinition } from '@byo/domain/music-types';

/**
 * Music Provider 配置库
 * 定义了所有支持的音乐生成服务提供商
 */
export const MUSIC_PROVIDER_LIBRARY: MusicProviderDefinition[] = [
  {
    id: 'suno',
    name: 'Suno',
    badge: 'Suno AI',
    description: 'AI music generation with vocals, lyrics, and multiple genres.',
    highlights: ['Vocals', 'Lyrics input', 'Multi-genre', 'Song structure'],
    website: 'https://suno.com',
    docsUrl: 'https://suno.com/developers',
    status: 'stable',
    type: 'suno',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'Suno API Key',
        secret: true,
        required: true,
        placeholder: 'sk-...',
      },
      {
        key: 'endpoint',
        label: 'Base Endpoint (optional)',
        placeholder: 'https://api.suno.ai',
      },
    ],
    models: [
      {
        id: 'suno-v3.5',
        name: 'Suno v3.5',
        description: 'Latest model with improved vocals and lyrics.',
        kind: 'textToMusic',
        maxDuration: 240,
        supportsVocals: true,
        default: true,
      },
      {
        id: 'suno-v3',
        name: 'Suno v3',
        description: 'Stable model for consistent outputs.',
        kind: 'textToMusic',
        maxDuration: 180,
        supportsVocals: true,
      },
      {
        id: 'suno-chirp',
        name: 'Chirp',
        description: 'Fast preview generation.',
        kind: 'textToMusic',
        maxDuration: 60,
        supportsVocals: true,
      },
    ],
    defaultModelId: 'suno-v3.5',
  },
  {
    id: 'udio',
    name: 'Udio',
    badge: 'Udio AI',
    description: 'High-fidelity music generation with studio quality.',
    highlights: ['Studio quality', 'Multiple stems', 'Remix capability'],
    website: 'https://udio.com',
    docsUrl: 'https://udio.com/api',
    status: 'beta',
    type: 'udio',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'Udio API Key',
        secret: true,
        required: true,
      },
      {
        key: 'endpoint',
        label: 'Base Endpoint (optional)',
        placeholder: 'https://api.udio.com',
      },
    ],
    models: [
      {
        id: 'udio-v1',
        name: 'Udio v1',
        description: 'Full studio quality output.',
        kind: 'textToMusic',
        maxDuration: 300,
        supportsVocals: true,
        default: true,
      },
      {
        id: 'udio-lite',
        name: 'Udio Lite',
        description: 'Faster preview quality.',
        kind: 'textToMusic',
        maxDuration: 120,
        supportsVocals: true,
      },
    ],
    defaultModelId: 'udio-v1',
  },
  {
    id: 'mubert',
    name: 'Mubert',
    badge: 'Royalty Free',
    description: 'Royalty-free AI-generated music for commercial use.',
    highlights: ['Royalty-free', 'Commercial license', 'Loop-ready'],
    website: 'https://mubert.com',
    docsUrl: 'https://mubert.com/developers',
    status: 'stable',
    type: 'mubert',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'Mubert API Key',
        secret: true,
        required: true,
      },
      {
        key: 'endpoint',
        label: 'Base Endpoint (optional)',
        placeholder: 'https://api.mubert.com',
      },
    ],
    models: [
      {
        id: 'mubert-studio',
        name: 'Mubert Studio',
        description: 'Full featured music generation.',
        kind: 'textToMusic',
        maxDuration: 300,
        supportsVocals: false,
        default: true,
      },
      {
        id: 'mubert-loop',
        name: 'Mubert Loop',
        description: 'Seamless loop generation.',
        kind: 'textToMusic',
        maxDuration: 60,
        supportsVocals: false,
      },
    ],
    defaultModelId: 'mubert-studio',
  },
  {
    id: 'soundraw',
    name: 'Soundraw',
    badge: 'Customizable',
    description: 'Customizable AI music with fine-grained control.',
    highlights: ['Customizable', 'Mood control', 'Tempo control'],
    website: 'https://soundraw.io',
    docsUrl: 'https://soundraw.io/api',
    status: 'stable',
    type: 'soundraw',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'Soundraw API Key',
        secret: true,
        required: true,
      },
      {
        key: 'endpoint',
        label: 'Base Endpoint (optional)',
        placeholder: 'https://api.soundraw.io',
      },
    ],
    models: [
      {
        id: 'soundraw-pro',
        name: 'Soundraw Pro',
        description: 'Full customization control.',
        kind: 'textToMusic',
        maxDuration: 300,
        supportsVocals: false,
        default: true,
      },
      {
        id: 'soundraw-quick',
        name: 'Soundraw Quick',
        description: 'Fast generation mode.',
        kind: 'textToMusic',
        maxDuration: 60,
        supportsVocals: false,
      },
    ],
    defaultModelId: 'soundraw-pro',
  },
];

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
