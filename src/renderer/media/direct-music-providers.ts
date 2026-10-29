import type {
  MusicModelDefinition,
  MusicProviderDefinition,
} from "@byo/domain/music-types";

export const SUNO_MODEL_PRESETS: MusicModelDefinition[] = [
  {
    id: "suno-v6",
    name: "Suno v6",
    kind: "textToMusic",
    default: true,
    description: "chirp-hawk; two clips per request.",
  },
  {
    id: "suno-v5.5",
    name: "Suno v5.5",
    kind: "textToMusic",
    description: "chirp-fenix; relay routing may use v6.",
  },
  {
    id: "suno-v5",
    name: "Suno v5",
    kind: "textToMusic",
    description: "chirp-crow; two clips per request.",
  },
];

export const DIRECT_MUSIC_PROVIDERS: MusicProviderDefinition[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    badge: "Eleven Music 2.5",
    type: "elevenlabs",
    description:
      "Eleven Music with multilingual vocals, lyrics and instrumentals from 3 seconds to 5 minutes.",
    highlights: ["Vocals", "Lyrics", "Target duration"],
    website: "https://elevenlabs.io",
    docsUrl: "https://elevenlabs.io/docs/api-reference/music",
    status: "stable",
    credentialFields: [
      {
        key: "apiKey",
        label: "ElevenLabs API Key",
        secret: true,
        required: true,
      },
      {
        key: "endpoint",
        label: "API Endpoint (optional)",
        placeholder: "https://api.elevenlabs.io",
      },
    ],
    models: [
      {
        id: "music_v2_5",
        name: "Eleven Music 2.5",
        kind: "textToMusic",
        default: true,
      },
      { id: "music_v2", name: "Eleven Music 2", kind: "textToMusic" },
    ],
    defaultModelId: "music_v2_5",
  },
  {
    id: "lyria",
    name: "Google Lyria",
    badge: "Lyria 3.5",
    type: "lyria",
    description:
      "Direct Google Gemini Interactions API for songs with vocals, lyrics and instrumentals.",
    highlights: ["Google Gemini API", "Vocals", "Lyrics"],
    website: "https://ai.google.dev",
    docsUrl: "https://ai.google.dev/gemini-api/docs/music-generation",
    status: "stable",
    credentialFields: [
      { key: "apiKey", label: "Google API Key", secret: true, required: true },
      {
        key: "endpoint",
        label: "API Endpoint (optional)",
        placeholder: "https://generativelanguage.googleapis.com",
      },
    ],
    models: [
      {
        id: "lyria-3.5",
        name: "Lyria 3.5",
        kind: "textToMusic",
        default: true,
      },
      {
        id: "lyria-3-pro-preview",
        name: "Lyria 3 Pro (preview)",
        kind: "textToMusic",
      },
      {
        id: "lyria-3-clip-preview",
        name: "Lyria 3 Clip (preview)",
        kind: "textToMusic",
        description: "Fixed 30-second clips.",
      },
    ],
    defaultModelId: "lyria-3.5",
  },
  {
    id: "mureka",
    name: "Mureka",
    badge: "Mureka V9.5",
    type: "mureka",
    description:
      "Mureka songs and instrumentals with asynchronous generation; two songs per request by default.",
    highlights: ["Vocals", "Lyrics generation", "Instrumentals"],
    website: "https://platform.mureka.ai",
    docsUrl: "https://platform.mureka.ai/docs",
    status: "stable",
    credentialFields: [
      { key: "apiKey", label: "Mureka API Key", secret: true, required: true },
      {
        key: "endpoint",
        label: "API Endpoint (optional)",
        placeholder: "https://api.mureka.ai",
      },
    ],
    models: [
      {
        id: "mureka-9.5",
        name: "Mureka V9.5",
        kind: "textToMusic",
        default: true,
      },
      { id: "mureka-9", name: "Mureka V9", kind: "textToMusic" },
      {
        id: "mureka-o2",
        name: "Mureka O2",
        kind: "textToMusic",
        description:
          "MusiCoT song model; instrumental generation is not supported.",
      },
    ],
    defaultModelId: "mureka-9.5",
  },
  {
    id: "suno",
    name: "Suno",
    badge: "Suno v6",
    type: "suno",
    description:
      "Suno through a CometAPI / new-api compatible relay, with two clips per request.",
    highlights: ["Vocals", "Lyrics", "Full songs"],
    website: "https://suno.com",
    docsUrl: "https://www.cometapi.com",
    status: "stable",
    credentialFields: [
      { key: "apiKey", label: "Relay API Key", secret: true, required: true },
      {
        key: "endpoint",
        label: "Relay Endpoint (optional)",
        placeholder: "https://api.cometapi.com",
      },
    ],
    models: SUNO_MODEL_PRESETS,
    defaultModelId: "suno-v6",
  },
];
