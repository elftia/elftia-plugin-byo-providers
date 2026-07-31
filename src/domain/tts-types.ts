/**
 * Text-to-Speech (TTS) Provider Types
 *
 * Defines provider, model, and synthesis types for TTS services.
 * Follows the MediaProvider pattern (same as Music/Video/Image).
 *
 * @see MusicProviderDefinition for similar pattern
 */

// Re-export base types for convenience
export type {
  BaseProvider,
  CredentialField,
  ProviderCredentials,
} from './provider-types';

// ============================================================================
// TTS Provider Types
// ============================================================================

export type TtsProviderStatus = 'stable' | 'beta' | 'comingSoon';

export type TtsProviderType =
  | 'elevenlabs-tts'
  | 'fishaudio-tts'
  | 'mimo-tts'
  | 'openai-tts'
  | 'openrouter-tts'
  | 'cartesia-tts'
  | 'deepgram-tts'
  | 'hume-tts'
  | 'lmnt-tts'
  | string;

export type TtsProviderCredentialKey = 'apiKey' | 'endpoint';

export interface TtsProviderCredentialField {
  key: TtsProviderCredentialKey;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
}

// ============================================================================
// TTS Model Types
// ============================================================================

export interface TtsModelDefinition {
  id: string;
  name: string;
  description?: string;
  /** Supported output formats */
  outputFormats?: string[];
  /** Supported languages */
  languages?: string[];
  /**
   * Whether the model speaks a real-time streaming-synthesis protocol. Resolved
   * from the canonical registry via `resolveTtsModelCapabilities` and surfaced
   * through `TtsProviderState.models` so the renderer can gate the read-aloud
   * button. (streaming-tts-foundation / design D7.)
   */
  supportsStreaming?: boolean;
  default?: boolean;
  enabled?: boolean;
}

export interface TtsModelGroup {
  id: string;
  name?: string;
  models: TtsModelDefinition[];
}

// ============================================================================
// Voice Types
// ============================================================================

export interface TtsVoice {
  id: string;
  name: string;
  description?: string;
  language?: string;
  /** Preview audio URL */
  previewUrl?: string;
}

// ============================================================================
// Provider Definition
// ============================================================================

export interface TtsProviderDefinition {
  id: string;
  name: string;
  badge?: string;
  description: string;
  highlights: string[];
  website?: string;
  docsUrl?: string;
  status?: TtsProviderStatus;
  type: TtsProviderType;
  credentialFields: TtsProviderCredentialField[];
  models: TtsModelDefinition[];
  defaultModelId: string;
  modelGroups?: TtsModelGroup[];
  custom?: boolean;
  baseProviderId?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredTtsProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
  defaultModelId?: string;
  /** Default voice ID for this provider */
  defaultVoiceId?: string;
}

export interface TtsProviderState extends TtsProviderDefinition {
  enabled: boolean;
  configured: boolean;
  config: StoredTtsProviderConfig;
  originalModels?: TtsModelDefinition[];
  originalModelGroups?: TtsModelGroup[];
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface TtsRequest {
  text: string;
  providerId?: string;
  modelId?: string;
  voiceId?: string;
  outputFormat?: 'mp3' | 'wav' | 'ogg' | 'pcm' | 'opus';
}

export interface TtsResult {
  success: boolean;
  /** Saved audio file path */
  audioPath?: string;
  duration?: number;
  format?: string;
  error?: string;
}

// ============================================================================
// Update Payload
// ============================================================================

export interface TtsProviderUpdatePayload extends Partial<StoredTtsProviderConfig> {
  models?: TtsModelDefinition[];
  modelGroups?: TtsModelGroup[];
}

// ============================================================================
// Global TTS Settings
// ============================================================================

export interface GlobalTtsSettings {
  defaultProviderId?: string;
  defaultVoiceId?: string;
}
