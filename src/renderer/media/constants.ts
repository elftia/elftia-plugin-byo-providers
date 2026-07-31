/**
 * constants.ts - Media Provider Settings 常量定义
 *
 * 包含 Video Provider Library、Music Provider Library 和其他共享常量
 *
 * @module components/MediaProviderSettings/constants
 */

import type { MusicProviderDefinition,VideoProviderDefinition } from './types';

/**
 * Video Provider 配置库
 * 定义了所有支持的视频生成服务提供商
 */
export const VIDEO_PROVIDER_LIBRARY: VideoProviderDefinition[] = [
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Gemini + Veo pipeline for storyboard-to-video and live-action synthesis.',
    highlights: ['Veo', 'Scene control', 'Music-aware'],
    website: 'https://ai.google.dev',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/veo',
    status: 'beta',
    badge: 'Veo / Gemini',
    credentialFields: [
      { key: 'apiKey', label: 'Gemini API Key', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'Video Endpoint (optional)',
        placeholder: 'https://generativelanguage.googleapis.com'
      }
    ],
    models: [
      { id: 'veo-2', name: 'Veo 2 (Preview)', description: 'High fidelity, longer clips.' },
      { id: 'live-stage', name: 'Gemini Live Stage', description: 'Faster 15s clips.' }
    ],
    defaultModelId: 'veo-2'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Sora research access for cinematic shots and physics-aware motion.',
    highlights: ['Sora', 'Camera control', 'Physics'],
    website: 'https://openai.com/sora',
    docsUrl: 'https://platform.openai.com/docs/guides/video',
    status: 'comingSoon',
    badge: 'Sora',
    credentialFields: [
      { key: 'apiKey', label: 'OpenAI API Key', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'Base Endpoint (optional)',
        placeholder: 'https://api.openai.com'
      }
    ],
    models: [
      { id: 'sora-1-preview', name: 'Sora 1 Preview', description: 'Research access only.' }
    ],
    defaultModelId: 'sora-1-preview'
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Video Alpha brings MJ aesthetics into animated sequences from prompt + reference.',
    highlights: ['Video Alpha', 'Stylized motion', 'Reference images'],
    website: 'https://www.midjourney.com',
    docsUrl: 'https://docs.midjourney.com/docs/video-alpha',
    status: 'beta',
    badge: 'MJ Video',
    credentialFields: [
      { key: 'apiKey', label: 'API Key / Token', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'Webhook Endpoint',
        placeholder: 'https://api.midjourney.com'
      }
    ],
    models: [
      { id: 'video-alpha', name: 'Video Alpha', description: 'Stylized, aesthetic focus.' },
      { id: 'video-alpha-lite', name: 'Video Alpha Lite', description: 'Faster preview output.' }
    ],
    defaultModelId: 'video-alpha'
  },
  {
    id: 'jimeng',
    name: '即梦 (JiMeng)',
    description: 'Aliyun JiMeng video supports Chinese narration alignment and logo-safe outputs.',
    highlights: ['Chinese scripts', 'Character consistency', 'Template library'],
    website: 'https://tongyi.aliyun.com/dream',
    docsUrl: 'https://help.aliyun.com/zh/jimeng',
    status: 'stable',
    badge: 'JiMeng Video',
    credentialFields: [
      { key: 'apiKey', label: 'JiMeng API Key', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'API Endpoint',
        placeholder: 'https://dashscope.aliyuncs.com'
      },
      {
        key: 'location',
        label: 'Region (optional)',
        placeholder: 'cn-shanghai'
      }
    ],
    models: [
      { id: 'jimeng-pro', name: 'JiMeng Pro', description: 'Full quality output.' },
      { id: 'jimeng-lite', name: 'JiMeng Lite', description: 'Faster previews.' }
    ],
    defaultModelId: 'jimeng-pro'
  }
];

/**
 * Music Provider 配置库
 * 定义了所有支持的音乐生成服务提供商
 */
export const MUSIC_PROVIDER_LIBRARY: MusicProviderDefinition[] = [
  {
    id: 'suno',
    name: 'Suno',
    description: 'AI music generation with vocals, lyrics, and full instrumentals.',
    highlights: ['Vocals', 'Lyrics', 'Full songs'],
    website: 'https://suno.com',
    docsUrl: 'https://suno.com/developers',
    status: 'stable',
    badge: 'Suno v4',
    credentialFields: [
      { key: 'apiKey', label: 'Suno API Key', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'API Endpoint (optional)',
        placeholder: 'https://api.suno.com'
      }
    ],
    models: [
      { id: 'suno-v4', name: 'Suno v4', description: 'Latest model with improved vocals.' },
      { id: 'suno-v3.5', name: 'Suno v3.5', description: 'Stable production model.' },
      { id: 'suno-v3', name: 'Suno v3', description: 'Legacy model.' }
    ],
    defaultModelId: 'suno-v4'
  },
  {
    id: 'acemusic',
    name: 'ACEMusic',
    description: 'ACE-Step OpenRouter-compatible completion API for AI music generation with LLM-powered lyrics and caption. Hosted cloud or self-hosted (port 8002).',
    highlights: ['OpenAI Compatible', 'Vocals', 'Lyrics', 'Cover', 'Cloud'],
    website: 'https://acemusic.ai',
    docsUrl: '',
    status: 'stable',
    badge: 'ACE-Step',
    credentialFields: [
      { key: 'apiKey', label: 'API Key (optional)', secret: true, required: false },
      {
        key: 'endpoint',
        label: 'API Endpoint',
        placeholder: 'https://api.acemusic.ai',
        required: true
      }
    ],
    models: [
      { id: 'acemusic/acestep-v15-turbo', name: 'ACE-Step v1.5 Turbo', description: 'Default ACE-Step model for music generation.' }
    ],
    defaultModelId: 'acemusic/acestep-v15-turbo'
  },
  {
    id: 'acemusic-async',
    name: 'ACEMusic (Self-Hosted)',
    description: 'ACE-Step polling API for self-hosted servers: submit a task, poll for the result, then download the audio. Use for the async HTTP API (port 8001).',
    highlights: ['Self-Hosted', 'Polling', 'Vocals', 'Lyrics', 'Cover'],
    website: 'https://acemusic.ai',
    docsUrl: '',
    status: 'stable',
    badge: 'ACE-Step Async',
    credentialFields: [
      { key: 'apiKey', label: 'API Key (optional)', secret: true, required: false },
      {
        key: 'endpoint',
        label: 'API Endpoint',
        placeholder: 'http://127.0.0.1:8001',
        required: true
      }
    ],
    models: [
      { id: 'acestep-v15-turbo', name: 'ACE-Step v1.5 Turbo', description: 'Default ACE-Step model for music generation.' }
    ],
    defaultModelId: 'acestep-v15-turbo'
  }
];

/**
 * Music Provider 模板库
 * 用于创建自定义音乐提供商的基础模板
 */
export const MUSIC_PROVIDER_TEMPLATES: MusicProviderDefinition[] = [
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    description: 'Generic OpenAI-compatible music API endpoint.',
    highlights: ['OpenAI Compatible', 'Custom Endpoint'],
    status: 'stable',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'API Endpoint',
        placeholder: 'https://api.example.com/v1',
        required: true
      }
    ],
    models: [
      { id: 'default', name: 'Default Model', description: 'Default model.' }
    ],
    defaultModelId: 'default'
  },
  {
    id: 'suno-compatible',
    name: 'Suno Compatible',
    description: 'Suno-compatible API for third-party services.',
    highlights: ['Suno Compatible', 'Custom Endpoint'],
    status: 'stable',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', secret: true, required: true },
      {
        key: 'endpoint',
        label: 'API Endpoint',
        placeholder: 'https://api.example.com',
        required: true
      }
    ],
    models: [
      { id: 'chirp-v4', name: 'Chirp v4', description: 'Suno v4 compatible.' },
      { id: 'chirp-v3.5', name: 'Chirp v3.5', description: 'Suno v3.5 compatible.' }
    ],
    defaultModelId: 'chirp-v4'
  }
];
