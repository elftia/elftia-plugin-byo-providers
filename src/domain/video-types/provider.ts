/**
 * @module shared/video-types/provider
 *
 * Video provider status + provider-type discriminator + credential field
 * key/shape. Lean atom-level surface — model + capability + state types
 * live in their own sub-files.
 */

export type VideoProviderStatus = 'stable' | 'beta' | 'comingSoon';

/**
 * VideoProviderType 映射到实际 API 路由适配器:
 * - openai-official: Sora/Veo → POST /v1/videos (FormData)
 * - unified: Runway/Hunyuan/PixVerse/Hailuo/Vidu/Grok/LTX/Ovi → POST /v1/video/generations
 * - volc: Seedance → POST /volc/v1/contents/generations/tasks
 * - wan: Alibaba Wan → POST /ali/bailian/.../video-synthesis
 * - kling: Kling → POST /kling/v1/videos/{path}
 * - replicate: Replicate → POST /replicate/v1/predictions
 * - openrouter: OpenRouter unified video endpoint → POST /api/v1/videos (async poll)
 */
export type VideoProviderType =
  | 'openai-official'
  | 'unified'
  | 'volc'
  | 'seedance-v2'
  | 'pixverse'
  | 'wan'
  | 'kling'
  | 'replicate'
  | 'openrouter'
  | string;

export type VideoProviderCredentialKey =
  | 'apiKey'
  | 'endpoint'
  | 'projectId'
  | 'location'
  | 'byteplusAk'
  | 'byteplusSk';

export interface VideoProviderCredentialField {
  key: VideoProviderCredentialKey;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
}
