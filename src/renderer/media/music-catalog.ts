/**
 * @module shared/music-types/data
 *
 * Built-in music provider definitions + provider templates
 * (authoritative source for backend seeding). Pure data table — kept
 * separate so the type surface stays small.
 */

import {
  DIRECT_MUSIC_PROVIDERS,
  SUNO_MODEL_PRESETS,
} from "./direct-music-providers";
import type { MusicProviderDefinition } from "@byo/domain/music-types";

/**
 * Built-in music provider definitions (authoritative source for backend seeding)
 */
export const MUSIC_PROVIDER_LIBRARY: MusicProviderDefinition[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    badge: "Multimodal",
    description:
      "Single OpenRouter key unlocks Google Lyria for full-song music generation with vocals, lyrics, and instrumentals. Convenience tier — slight markup vs. direct.",
    highlights: ["Lyria 3 Pro", "Vocals + lyrics", "One key for everything"],
    website: "https://openrouter.ai",
    docsUrl: "https://openrouter.ai/google/lyria-3-pro-preview",
    status: "beta",
    type: "openrouter",
    credentialFields: [
      {
        key: "apiKey",
        label: "OpenRouter API Key",
        secret: true,
        required: true,
        placeholder: "sk-or-...",
      },
      {
        key: "endpoint",
        label: "Base Endpoint (optional)",
        placeholder: "https://openrouter.ai/api/v1",
      },
    ],
    models: [
      {
        id: "google/lyria-3-pro-preview",
        name: "Lyria 3 Pro (preview)",
        description:
          "Google Lyria 3 Pro — full songs with vocals, timed lyrics, and 48 kHz stereo audio.",
        kind: "textToMusic",
        default: true,
      },
    ],
    defaultModelId: "google/lyria-3-pro-preview",
  },
  ...DIRECT_MUSIC_PROVIDERS,
  {
    id: "acemusic",
    name: "ACEMusic",
    badge: "ACE-Step",
    description:
      "ACE-Step OpenRouter-compatible completion API for AI music generation with LLM-powered lyrics and caption. Hosted cloud or self-hosted (port 8002).",
    highlights: ["OpenAI Compatible", "Vocals", "Lyrics", "Cover", "Cloud"],
    website: "https://acemusic.ai",
    docsUrl: "",
    status: "stable",
    type: "acemusic",
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key (optional)",
        secret: true,
        required: false,
      },
      {
        key: "endpoint",
        label: "API Endpoint",
        placeholder: "https://api.acemusic.ai",
        required: true,
      },
    ],
    models: [
      {
        id: "acemusic/acestep-v15-turbo",
        name: "ACE-Step v1.5 Turbo",
        description: "Default ACE-Step model for music generation.",
        kind: "textToMusic",
      },
    ],
    defaultModelId: "acemusic/acestep-v15-turbo",
  },
  {
    id: "acemusic-async",
    name: "ACEMusic (Self-Hosted)",
    badge: "ACE-Step Async",
    description:
      "ACE-Step polling API for self-hosted servers: submit a task, poll for the result, then download the audio. Use for the async HTTP API (port 8001).",
    highlights: ["Self-Hosted", "Polling", "Vocals", "Lyrics", "Cover"],
    website: "https://acemusic.ai",
    docsUrl: "",
    status: "stable",
    type: "acemusic-async",
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key (optional)",
        secret: true,
        required: false,
      },
      {
        key: "endpoint",
        label: "API Endpoint",
        placeholder: "http://127.0.0.1:8001",
        required: true,
      },
    ],
    models: [
      {
        id: "acestep-v15-turbo",
        name: "ACE-Step v1.5 Turbo",
        description: "Default ACE-Step model for music generation.",
        kind: "textToMusic",
      },
    ],
    defaultModelId: "acestep-v15-turbo",
  },
];

/**
 * Music provider templates for creating custom providers
 */
export const MUSIC_PROVIDER_TEMPLATES: MusicProviderDefinition[] = [
  ...DIRECT_MUSIC_PROVIDERS,
  {
    id: "openai-compatible",
    name: "OpenAI Compatible",
    description: "Generic OpenAI-compatible music API endpoint.",
    highlights: ["OpenAI Compatible", "Custom Endpoint"],
    status: "stable",
    type: "openai-compatible",
    credentialFields: [
      { key: "apiKey", label: "API Key", secret: true, required: true },
      {
        key: "endpoint",
        label: "API Endpoint",
        placeholder: "https://api.example.com/v1",
        required: true,
      },
    ],
    models: [
      {
        id: "default",
        name: "Default Model",
        description: "Default model.",
        kind: "textToMusic",
      },
    ],
    defaultModelId: "default",
  },
  {
    id: "suno-compatible",
    name: "Suno Compatible",
    description:
      "CometAPI / new-api Suno relay (submit/music + fetch task API).",
    highlights: ["Suno Compatible", "Custom Endpoint"],
    status: "stable",
    type: "suno-compatible",
    credentialFields: [
      { key: "apiKey", label: "API Key", secret: true, required: true },
      {
        key: "endpoint",
        label: "API Endpoint",
        placeholder: "https://api.example.com",
        required: true,
      },
    ],
    models: SUNO_MODEL_PRESETS,
    defaultModelId: "suno-v6",
  },
];
