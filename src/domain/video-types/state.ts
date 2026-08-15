/**
 * @module shared/video-types/state
 *
 * Stored + runtime state for video providers + update payload + global
 * settings + custom-provider creation input.
 */

import type {
  VideoModelDefinition,
  VideoModelGroup,
  VideoProviderDefinition,
} from './capabilities';

export interface StoredVideoProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
  projectId?: string;
  location?: string;
  defaultModelId?: string;
  concurrency?: number;
  retryCount?: number;
  /** BytePlus Access Key — only used by the standalone Seedance VOD provider. */
  byteplusAk?: string;
  /** BytePlus Secret Key — pairs with byteplusAk for the VOD workflow. */
  byteplusSk?: string;
}

export interface VideoProviderState extends VideoProviderDefinition {
  enabled: boolean;
  configured: boolean;
  config: StoredVideoProviderConfig;
  originalModels?: VideoModelDefinition[];
  originalModelGroups?: VideoModelGroup[];
}

export interface VideoProviderUpdatePayload extends Partial<StoredVideoProviderConfig> {
  models?: VideoModelDefinition[];
  modelGroups?: VideoModelGroup[];
}

export interface VideoProviderResult {
  success: boolean;
  provider?: VideoProviderState;
  message?: string;
}

export interface GlobalVideoSettings {
  concurrency: number;
  retryCount: number;
  defaultProviderId?: string;
}

export interface CustomVideoProviderInput {
  baseProviderId: string;
  name: string;
  description?: string;
  badge?: string;
  docsUrl?: string;
}
