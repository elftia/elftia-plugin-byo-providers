/**
 * constants.ts - Media Provider Settings 常量定义
 *
 * 包含 Video Provider Library、Music Provider Library 和其他共享常量
 *
 * @module components/MediaProviderSettings/constants
 */

import type { VideoProviderDefinition } from './types';

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

export { MUSIC_PROVIDER_LIBRARY, MUSIC_PROVIDER_TEMPLATES } from './music-catalog';
