/**
 * @module shared/video-types/capabilities
 *
 * Per-modality input capabilities + input modes + model definition +
 * model group + provider definition. The capability surface is consumed
 * by the per-model input renderer to decide which slots to show.
 */

import type {
  VideoProviderCredentialField,
  VideoProviderStatus,
  VideoProviderType,
} from './provider';

export type VideoModelKind = 'textToVideo' | 'imageToVideo' | 'extend';

/**
 * Per-modality input slot description for a video model.
 * `max` defaults to 1 when the modality is supported but unspecified.
 * `required` defaults to false (text is required when text is present).
 */
export interface VideoInputCapability {
  max?: number;
  required?: boolean;
}

/**
 * Declarative description of what input modalities a model accepts.
 * Omitting a key means the modality is NOT supported. Omitting the whole
 * object on a model means text-only (see resolveVideoInputCapabilities).
 */
export interface VideoInputCapabilities {
  text?: VideoInputCapability;
  firstFrame?: VideoInputCapability;
  lastFrame?: VideoInputCapability;
  referenceImage?: VideoInputCapability;
  referenceVideo?: VideoInputCapability;
  referenceAudio?: VideoInputCapability;
}

export type VideoInputModality = keyof VideoInputCapabilities;

/**
 * Mutually-exclusive input mode (e.g. Seedance 2.0 cannot mix first/last
 * frame with multimodal reference inputs in the same request).
 */
export interface VideoInputMode {
  id: string;
  label: string;
  /** Modalities visible/usable while this mode is active. */
  uses: VideoInputModality[];
}

export interface VideoModelDefinition {
  id: string;
  name: string;
  description?: string;
  kind?: VideoModelKind;
  maxDuration?: number;
  default?: boolean;
  enabled?: boolean;
  aspectRatios?: string[];
  durations?: number[];
  resolutions?: string[];
  inputCapabilities?: VideoInputCapabilities;
  /**
   * Optional list of mutually-exclusive input modes. When set with length > 1
   * the UI renders a mode tab strip and only `uses[]` modalities for the
   * active mode are rendered.
   */
  inputModes?: VideoInputMode[];
  /**
   * True if the model can generate synchronized audio for the output video
   * (Seedance 2.0, PixVerse V6 t2v/i2v). Drives whether the settings popover
   * exposes the audio toggle. Default: false.
   */
  supportsAudioGeneration?: boolean;
}

export interface VideoModelGroup {
  id: string;
  name?: string;
  models: VideoModelDefinition[];
}

export interface VideoProviderDefinition {
  id: string;
  name: string;
  badge?: string;
  description: string;
  highlights: string[];
  website?: string;
  docsUrl?: string;
  status?: VideoProviderStatus;
  type: VideoProviderType;
  credentialFields: VideoProviderCredentialField[];
  models: VideoModelDefinition[];
  defaultModelId: string;
  modelGroups?: VideoModelGroup[];
  custom?: boolean;
  baseProviderId?: string;
}
