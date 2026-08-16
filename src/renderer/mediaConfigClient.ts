/**
 * mediaConfigClient — typed renderer wrappers over the main-half `media.*` relay
 * (design D3).
 *
 * `host.services.mediaConfig` is MAIN-side; the renderer reaches it only through
 * `host.ipc.invoke` → the plugin's main relay. Every verb carries a `mediaType`
 * discriminator (image/video/music/tts/asr) — except the image-only
 * `resetProviderToDefaults(id)`.
 *
 * The relocated panels previously called `agent.{type}Providers.*` +
 * `useMediaProvidersData`. To keep that swap mechanical, this client exposes a
 * per-`mediaType` sub-object (`mediaConfigClient.image`, `.video`, …) whose
 * method names + argument forms + return TYPES MIRROR the host renderer's
 * `agent.{type}Providers` API (`@shared/agent` `Agent{Type}ProvidersApi`):
 * `list / update / createCustom / deleteCustom / refreshUpstreamModels /
 * setProviderKey`. The panel rewrite is then literally `agent.imageProviders` →
 * `mediaConfigClient.image`.
 *
 * Return types are the CANONICAL `@shared/*-types` per-type states (the same
 * types the panels are written against — bundled, pure contract types). At
 * RUNTIME the masked port BLANKS `config.apiKey` (+ vestigial byteplusAk/Sk) and
 * surfaces `configured`/`hasKey` (design D4) — the structural type is still the
 * canonical state, but the plugin never reads a plaintext stored key. The single
 * boundary cast (`asState`) mirrors the P2b `llmConfigClient` deviation.
 *
 * ── KEY-WRITE BOUNDARY (the LLM≠media difference, design D4) ──
 * A media key is written ONLY through `setProviderKey(id, apiKey)` (→
 * `media.setProviderKey` → `host.services.mediaConfig.setProviderKey` →
 * `secretsWrite` under the `media-<type>:<id>:apiKey` ref). The `update` patch
 * carries NO `apiKey`; the relocated `flushCredentialSave` routes secrets to
 * `setProviderKey` via `collectMediaSecretWrites`.
 *
 * @module byo-providers/renderer/mediaConfigClient
 */
import type { AsrProviderState, AsrProviderUpdatePayload } from '@byo/domain/asr-types';
import type {
  CustomImageProviderInput,
  MediaProviderState,
  MediaProviderUpdatePayload,
} from '@byo/domain/media-types';
import type { MusicProviderState, MusicProviderUpdatePayload } from '@byo/domain/music-types';
import type { HostMediaProviderSecretField, HostMediaType } from '@byo/domain/plugin-types';
import type { TtsProviderState, TtsProviderUpdatePayload } from '@byo/domain/tts-types';
import type { CustomVideoProviderInput, VideoProviderState, VideoProviderUpdatePayload } from '@byo/domain/video-types';

import { getHost } from './host/hostBridge';

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/** Ask the host renderer to invalidate the matching chat-facing provider cache. */
function notifyProviderConfigChanged(mediaType: HostMediaType): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('media-provider-config-changed', { detail: { mediaType } }),
  );
}

function mutationSucceeded(result: unknown): boolean {
  return !(
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    (result as { success?: unknown }).success === false
  );
}

type OpResult = { success: boolean; error?: string };
type RefreshResult<S> = { success: boolean; provider?: S; message?: string };

/**
 * The per-`mediaType` provider client shape, generic over the canonical
 * state/payload/custom-input types of one media type. Mirrors the host's
 * `Agent{Type}ProvidersApi` (the subset the panels use).
 */
/** The explicit reveal result (v1.50) — the one outward secret exception. */
type RevealResult = { success: boolean; value?: string; error?: string };

interface MediaTypeClient<State, UpdatePayload, CustomInput> {
  list(): Promise<State[]>;
  update(id: string, payload: UpdatePayload): Promise<State>;
  createCustom(payload: CustomInput): Promise<State>;
  deleteCustom(id: string): Promise<{ success: boolean }>;
  refreshUpstreamModels(id: string): Promise<RefreshResult<State>>;
  /** Write (or clear, when empty) the provider key — the ONLY media key-write path. */
  setProviderKey(id: string, apiKey: string): Promise<OpResult>;
  /**
   * Reveal the stored provider key (v1.50) — user-initiated display only (the
   * settings eye icon). Plain invoke: no provider-cache invalidation event.
   */
  revealProviderKey(id: string): Promise<RevealResult>;
}

interface VideoMediaTypeClient
  extends MediaTypeClient<VideoProviderState, VideoProviderUpdatePayload, CustomVideoProviderInput> {
  setProviderSecret(
    id: string,
    field: HostMediaProviderSecretField,
    value: string,
  ): Promise<OpResult>;
  /** Reveal a stored BytePlus secret field (v1.50) — display only. */
  revealProviderSecret(id: string, field: HostMediaProviderSecretField): Promise<RevealResult>;
}

/**
 * Build a per-type client. The masked relay returns the canonical state minus
 * the secret config (structurally still the state); the boundary invoke is typed
 * to the canonical shape the panels consume.
 */
function makeTypeClient<State, UpdatePayload, CustomInput>(
  mediaType: HostMediaType,
): MediaTypeClient<State, UpdatePayload, CustomInput> {
  return {
    list: () => invoke('media.listProviders', { mediaType }),
    // The masked port returns a `{ success, provider }` envelope; the host facade
    // unwraps it to a bare state. Unwrap here so the panels keep the bare-state
    // contract (`const updated = await mediaConfigClient.image.update(...)`).
    update: async (id, payload) => {
      const r = await invoke<{ success: boolean; provider?: State }>('media.updateProvider', {
        mediaType,
        id,
        patch: payload,
      });
      if (mutationSucceeded(r)) notifyProviderConfigChanged(mediaType);
      return (r?.provider ?? r) as State;
    },
    createCustom: async (input) => {
      const r = await invoke<{ success: boolean; provider?: State }>('media.createCustomProvider', {
        mediaType,
        input,
      });
      if (mutationSucceeded(r)) notifyProviderConfigChanged(mediaType);
      return (r?.provider ?? r) as State;
    },
    deleteCustom: async (id) => {
      const result = await invoke<{ success: boolean }>('media.deleteProvider', { mediaType, id });
      if (mutationSucceeded(result)) notifyProviderConfigChanged(mediaType);
      return result;
    },
    refreshUpstreamModels: async (id) => {
      const result = await invoke<RefreshResult<State>>('media.refreshUpstreamModels', { mediaType, id });
      if (mutationSucceeded(result)) notifyProviderConfigChanged(mediaType);
      return result;
    },
    setProviderKey: async (id, apiKey) => {
      const result = await invoke<OpResult>('media.setProviderKey', { mediaType, id, apiKey });
      if (mutationSucceeded(result)) notifyProviderConfigChanged(mediaType);
      return result;
    },
    revealProviderKey: (id) =>
      invoke<RevealResult>('media.revealProviderKey', { mediaType, id }),
  };
}

function makeVideoTypeClient(): VideoMediaTypeClient {
  return {
    ...makeTypeClient<VideoProviderState, VideoProviderUpdatePayload, CustomVideoProviderInput>(
      'video',
    ),
    setProviderSecret: async (id, field, value) => {
      const result = await invoke<OpResult>('media.setProviderSecret', {
        mediaType: 'video',
        id,
        field,
        value,
      });
      if (mutationSucceeded(result)) notifyProviderConfigChanged('video');
      return result;
    },
    revealProviderSecret: (id, field) =>
      invoke<RevealResult>('media.revealProviderSecret', {
        mediaType: 'video',
        id,
        field,
      }),
  };
}

/**
 * The masked-port media-config client. `mediaConfigClient.<type>` mirrors
 * `agent.{type}Providers`; `resetImageProviderToDefaults` is image-only.
 */
export const mediaConfigClient = {
  image: makeTypeClient<MediaProviderState, MediaProviderUpdatePayload, CustomImageProviderInput>('image'),
  video: makeVideoTypeClient(),
  music: makeTypeClient<MusicProviderState, MusicProviderUpdatePayload, { baseProviderId: string; name: string }>('music'),
  tts: makeTypeClient<TtsProviderState, TtsProviderUpdatePayload, { baseProviderId: string; name: string }>('tts'),
  asr: makeTypeClient<AsrProviderState, AsrProviderUpdatePayload, { baseProviderId: string; name: string }>('asr'),
  /** IMAGE-ONLY library reset (the port takes a bare `id`, no `mediaType`). */
  resetImageProviderToDefaults: async (
    id: string,
  ): Promise<{ success: boolean; provider?: MediaProviderState }> => {
    const result = await invoke<{ success: boolean; provider?: MediaProviderState }>(
      'media.resetProviderToDefaults',
      { id },
    );
    if (mutationSucceeded(result)) notifyProviderConfigChanged('image');
    return result;
  },
  /** List a media type's MASKED providers by discriminator (the generic hook). */
  listByType(mediaType: HostMediaType): Promise<unknown[]> {
    return invoke('media.listProviders', { mediaType });
  },
};

export type MediaConfigClient = typeof mediaConfigClient;
