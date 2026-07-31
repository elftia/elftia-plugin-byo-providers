/**
 * searchConfigClient — typed renderer wrappers over the main-half `search.*`
 * relay (P2d design D3).
 *
 * `host.services.searchConfig` is MAIN-side; the renderer reaches it only through
 * `host.ipc.invoke` → the plugin's main relay. Targets the API-KEY web-search
 * providers (tavily/jina/zhipu/grok/exa/bocha/searxng); the keyless `local-*`
 * providers and `webSearch.search` query execution are NOT on the port (host-only).
 *
 * The relocated `ProviderPanel` previously consumed the host `webSearchStore`
 * (`updateProvider` / `writeProviderKey` / `validateProvider`). To keep that swap
 * mechanical, this client's verbs map 1:1 onto those props (D3):
 *   - `onUpdate(id, updates)`  → `configureProvider({ id, enabled, apiHost, basicAuth* })`
 *     (NON-secret config; the port input carries NO apiKey)
 *   - `onWriteKey(id, apiKey)` → `setProviderKey(id, apiKey)` (the ONLY key-write path)
 *   - `onValidate(id)`         → `validate(id)`
 *
 * ── KEY BOUNDARY (Option-A, design D4) ──
 * `getProviderConfig` returns `HostMaskedSearchProviderConfig` with `apiKey?: never`
 * (structurally absent) or `null` when unconfigured — the plugin NEVER reads a
 * plaintext stored search key. The key crosses INWARD only via `setProviderKey`
 * (→ `search.setProviderKey` → `host.services.searchConfig.setProviderKey` →
 * `SecretsService` under `search-provider:<id>:apiKey` + cache reconfigure).
 *
 * @module byo-providers/renderer/searchConfigClient
 */
import type {
  HostMaskedSearchProviderConfig,
  HostSearchKeyWriteResult,
  HostSearchProviderConfigInput,
  HostSearchProvidersList,
  HostSearchValidateResult,
} from '@byo/domain/plugin-types';

import { getHost } from './host/hostBridge';

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/**
 * The masked-port search-config client. Every verb is a thin typed `invoke` over
 * the main relay; the returns are the audited contract DTOs (the masked config
 * has no plaintext `apiKey`).
 */
export const searchConfigClient = {
  /** The supported provider id lists (the plugin uses only `.api`). */
  getProviders(): Promise<HostSearchProvidersList> {
    return invoke('search.getProviders');
  },
  /** A provider's MASKED non-secret config, or `null` when unconfigured. */
  getProviderConfig(providerId: string): Promise<HostMaskedSearchProviderConfig | null> {
    return invoke('search.getProviderConfig', { providerId });
  },
  /** Write a provider's NON-SECRET config (enabled/apiHost/basic-auth — NO apiKey). */
  configureProvider(config: HostSearchProviderConfigInput): Promise<HostSearchKeyWriteResult> {
    return invoke('search.configureProvider', { config });
  },
  /** Bulk-configure providers (each carries no apiKey). */
  configureProviders(
    configs: readonly HostSearchProviderConfigInput[],
  ): Promise<HostSearchKeyWriteResult> {
    return invoke('search.configureProviders', { configs });
  },
  /** Whether the provider is enabled (+ configured). */
  isProviderEnabled(providerId: string): Promise<boolean> {
    return invoke('search.isProviderEnabled', { providerId });
  },
  /** Validate a provider via a host-side test search; status only, never a key. */
  validate(providerId: string): Promise<HostSearchValidateResult> {
    return invoke('search.validate', { providerId });
  },
  /** Write (or clear, when empty) the provider key — the ONLY key-write path. */
  setProviderKey(providerId: string, apiKey: string): Promise<HostSearchKeyWriteResult> {
    return invoke('search.setProviderKey', { providerId, apiKey });
  },
};

export type SearchConfigClient = typeof searchConfigClient;
