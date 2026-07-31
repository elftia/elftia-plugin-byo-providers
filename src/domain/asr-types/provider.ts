/**
 * @module shared/asr-types/provider
 *
 * ASR provider / model / state types + storage + request/response shapes
 * + update payload + global settings. Excludes the static provider
 * library data (see ./data).
 */

// Re-export base types for convenience
export type {
  BaseProvider,
  CredentialField,
  ProviderCredentials,
} from '../provider-types';

// ============================================================================
// ASR Provider Types
// ============================================================================

export type AsrProviderStatus = 'stable' | 'beta' | 'comingSoon';

export type AsrProviderType =
  | 'openai-whisper'
  | 'elevenlabs-stt'
  | 'fishaudio-asr'
  | 'grok-stt'
  | 'openrouter-asr'
  | 'deepgram-stt'
  | 'soniox-stt'
  | 'assemblyai-stt'
  | string;

export type AsrProviderCredentialKey = 'apiKey' | 'endpoint';

export interface AsrProviderCredentialField {
  key: AsrProviderCredentialKey;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
}

// ============================================================================
// ASR Model Types
// ============================================================================

export interface AsrModelDefinition {
  id: string;
  name: string;
  description?: string;
  /** Max file size in bytes */
  maxFileSize?: number;
  /** Supported audio formats (e.g. ['mp3', 'wav', 'ogg']) */
  supportedFormats?: string[];
  /** Feature flags */
  features?: ('timestamps' | 'diarization' | 'custom_vocabulary')[];
  /**
   * Whether this model supports real-time (websocket) streaming transcription.
   * Surfaced from the canonical ASR registry (`KnownAsrModelCapabilities`) so
   * the renderer can pick the transcription path. Flag only in Phase 1; the
   * capability-gated path selection that consumes it lands in Phase 2
   * (voice-input-asr). Absent / `false` = batch-only.
   */
  supportsStreaming?: boolean;
  default?: boolean;
  enabled?: boolean;
}

export interface AsrModelGroup {
  id: string;
  name?: string;
  models: AsrModelDefinition[];
}

// ============================================================================
// Provider Definition
// ============================================================================

export interface AsrProviderDefinition {
  id: string;
  name: string;
  badge?: string;
  description: string;
  highlights: string[];
  website?: string;
  docsUrl?: string;
  status?: AsrProviderStatus;
  type: AsrProviderType;
  credentialFields: AsrProviderCredentialField[];
  models: AsrModelDefinition[];
  defaultModelId: string;
  modelGroups?: AsrModelGroup[];
  custom?: boolean;
  baseProviderId?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredAsrProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
  defaultModelId?: string;
}

export interface AsrProviderState extends AsrProviderDefinition {
  enabled: boolean;
  configured: boolean;
  config: StoredAsrProviderConfig;
  originalModels?: AsrModelDefinition[];
  originalModelGroups?: AsrModelGroup[];
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface TranscriptionRequest {
  /** Local file path to audio */
  audioPath: string;
  /** Provider ID (resolved from settings if omitted) */
  providerId?: string;
  /** Model ID (resolved from provider default if omitted) */
  modelId?: string;
  /** Language hint (ISO code, optional for auto-detect) */
  language?: string;
  /** Response format preference */
  responseFormat?: 'text' | 'json' | 'verbose_json';
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  speakerId?: string;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
  words?: TranscriptionWord[];
  error?: string;
}

// ============================================================================
// Update Payload
// ============================================================================

export interface AsrProviderUpdatePayload extends Partial<StoredAsrProviderConfig> {
  models?: AsrModelDefinition[];
  modelGroups?: AsrModelGroup[];
}

// ============================================================================
// Global ASR Settings
// ============================================================================

export interface GlobalAsrSettings {
  defaultProviderId?: string;
  /**
   * Default transcription language hint (ISO code, e.g. `'en'`, `'zh'`).
   * `undefined` / absent = auto-detect (no hint passed to the provider).
   * Set in Settings → Default Models → ASR; consumed by both the batch and
   * streaming transcription paths (voice-input-asr).
   */
  language?: string;
}
