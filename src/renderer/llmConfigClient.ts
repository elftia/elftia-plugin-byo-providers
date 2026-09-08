/**
 * llmConfigClient — typed renderer wrappers over the main-half `llm.*` relay
 * (design D2).
 *
 * `host.services.llmConfig` is MAIN-side; the renderer reaches it only through
 * `host.ipc.invoke` → the plugin's main relay. This client mirrors the host
 * renderer's `agent.llmConfig` API SHAPE (same method names + argument forms +
 * return types) so the relocated hooks/components swap `agent.llmConfig` →
 * `llmConfigClient` with minimal change.
 *
 * Key WRITES ride the provider/pool body (`api_key`/`apiKey` on
 * `addProvider`/`updateProvider`/`addApiKey`/`updateApiKey`), which the host's
 * `llmConfig` adapter routes to the secret store internally — so there is NO
 * separate `secrets.setKey` path and the plugin needs only `host:llm-config`.
 *
 * Return types are the CANONICAL `@shared/llm-config` types (bundled — pure
 * contract/data, no host renderer import). At RUNTIME the masked port BLANKS the
 * literal `api_key` and surfaces `hasKey` (design D3) — the structural type is
 * still the canonical provider/entry; the plugin never reads a plaintext key.
 *
 * @module byo-providers/renderer/llmConfigClient
 */
import type { HostModelTestResult, HostProviderKeyQuota } from '@byo/domain/plugin-types';

import type {
  ApiKeyEntry,
  ApiKeyEntryInput,
  KeyHealthMap,
  LLMProvider,
  ProviderModelDiscoveryResult,
  RouterConfig,
} from '@byo/domain/llm';

import { getHost } from './host/hostBridge';

type OpResult = { success: boolean; message?: string };
type ProviderResult = { success: boolean; provider?: LLMProvider; message?: string };
type KeyResult = { success: boolean; entry?: ApiKeyEntry; message?: string };

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/**
 * Notify the HOST renderer that the LLM provider list changed.
 *
 * The BYO plugin owns its OWN provider-list cache (`useLlmProviders`); the host's
 * `settingsStore.llmProviders` cache is SEPARATE. Without this signal a provider
 * add / enable-toggle / edit / delete / reorder / reset done through this client
 * stays INVISIBLE to host consumers — Settings → Default Model (the
 * `ProviderModelSelector`, which lists only `enabled` providers) and the chat
 * model picker — until the host cache is force-refreshed (today: an app restart).
 *
 * The host's `SettingsDataHost` listens for the `llm-providers-updated` window
 * event and force-refreshes its canonical cache; this mirrors the host's own
 * `ElfiContext` dispatch of the SAME event. The plugin runs in the host renderer
 * realm (it consumes the host React instance), so the event reaches that listener.
 *
 * Fire-and-forget + guarded: a non-DOM host (tests / SSR) or a dispatch failure
 * must never break the underlying mutation, which has already succeeded.
 */
function notifyHostProvidersChanged(): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('llm-providers-updated'));
    }
  } catch {
    // best-effort cross-cache sync — a notify failure never fails the op
  }
}

/**
 * Wrap a provider-LIST-mutating relay call so the host cache is refreshed once
 * the mutation resolves. A rejected mutation skips the notify (nothing changed);
 * a `{ success: false }` resolution still notifies (harmless — the host just
 * re-reads the unchanged list). The provider object/result is returned verbatim.
 */
async function mutateProviders<T>(method: string, payload?: unknown): Promise<T> {
  const result = await invoke<T>(method, payload);
  notifyHostProvidersChanged();
  return result;
}

/** The masked-port LLM-config client (mirrors `agent.llmConfig`). */
export const llmConfigClient = {
  // ── Providers ────────────────────────────────────────────────────────────
  getProviders: (): Promise<LLMProvider[]> => invoke('llm.getProviders'),
  getProvider: (id: string): Promise<LLMProvider | null> => invoke('llm.getProvider', { id }),
  addProvider: (payload: Omit<LLMProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderResult> =>
    mutateProviders('llm.addProvider', payload),
  updateProvider: (payload: Partial<LLMProvider> & { id: string }): Promise<ProviderResult> =>
    mutateProviders('llm.updateProvider', payload),
  deleteProvider: (id: string): Promise<OpResult> => mutateProviders('llm.deleteProvider', { id }),
  toggleProvider: (id: string, enabled: boolean): Promise<ProviderResult> =>
    mutateProviders('llm.toggleProvider', { id, enabled }),
  reorderProviders: (orderedIds: string[]): Promise<OpResult> =>
    mutateProviders('llm.reorderProviders', { orderedIds }),
  resetProvider: (id: string): Promise<ProviderResult> => mutateProviders('llm.resetProvider', { id }),
  discoverModels: (
    id: string,
    options?: { forceRefresh?: boolean },
  ): Promise<ProviderModelDiscoveryResult> => invoke('llm.discoverModels', { id, options }),
  /**
   * P2b-2 (`byo-p2-llm-2`) — probe a provider/model for reachability. A
   * connectivity DIAGNOSTIC (`{ success, message, response?, model, durationMs? }`);
   * NO secret crosses in or out (the host probes with the host-resolved key).
   */
  testModel: (providerId: string, modelId: string): Promise<HostModelTestResult> =>
    invoke('llm.testModel', { providerId, modelId }),
  /**
   * v1.50 (provider-key-reveal) — the ONE deliberate outward secret exception:
   * fetch the stored key for USER-INITIATED display (the settings eye icon).
   * Plain invoke (NOT `mutateProviders`) — a reveal is a read, it must not
   * trigger provider-cache refresh churn.
   */
  revealProviderKey: (id: string): Promise<{ success: boolean; value?: string; error?: string }> =>
    invoke('llm.revealProviderKey', { id }),

  // ── Presets ──────────────────────────────────────────────────────────────
  getProviderPresets: (): Promise<unknown> => invoke('llm.getProviderPresets'),
  addFromPreset: (payload: { presetId: string; apiKey?: string }): Promise<ProviderResult> =>
    mutateProviders('llm.addFromPreset', payload),

  // ── Key pool ───────────────────────────────────────────────────────────────
  getApiKeys: (providerId: string): Promise<ApiKeyEntry[]> =>
    invoke('llm.getApiKeys', { providerId }),
  addApiKey: (input: ApiKeyEntryInput): Promise<KeyResult> => invoke('llm.addApiKey', input),
  updateApiKey: (
    id: string,
    updates: Partial<Pick<ApiKeyEntry, 'label' | 'weight' | 'enabled' | 'apiKey'>>,
  ): Promise<KeyResult> => invoke('llm.updateApiKey', { id, ...updates }),
  deleteApiKey: (id: string): Promise<OpResult> => invoke('llm.deleteApiKey', { id }),
  toggleApiKey: (id: string, enabled: boolean): Promise<OpResult> =>
    invoke('llm.toggleApiKey', { id, enabled }),
  getKeyHealth: (providerId: string): Promise<KeyHealthMap> =>
    invoke('llm.getKeyHealth', { providerId }),
  getKeyQuota: (
    providerId: string,
    keyId: string,
    force?: boolean,
  ): Promise<HostProviderKeyQuota> => invoke('llm.getKeyQuota', { providerId, keyId, force }),

  // ── Default model (router config) ───────────────────────────────────────────
  getRouterConfig: (): Promise<RouterConfig> => invoke('llm.getRouterConfig'),
  setRouterConfig: (
    payload: Partial<RouterConfig>,
  ): Promise<{ success: boolean; router?: RouterConfig; message?: string }> =>
    invoke('llm.setRouterConfig', payload),
};

export type LlmConfigClient = typeof llmConfigClient;
