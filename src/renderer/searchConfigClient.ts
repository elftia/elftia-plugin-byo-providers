/**
 * searchConfigClient — typed renderer wrappers over the main-half `search.*`
 * relay (P2d design D3).
 *
 * `host.services.searchConfig` is MAIN-side; the renderer reaches it only through
 * relay (P2d design D3). Targets the plugin's API/public/self-hosted search
 * settings; HTTP/local search execution remains host-owned.
 *
 * The relocated `ProviderPanel` previously consumed the host `webSearchStore`
 * (`updateProvider` / `writeProviderKey` / `validateProvider`). To keep that swap
 * mechanical, this client's verbs map 1:1 onto those props (D3):
 *   - `onUpdate(id, updates)` → config (enabled/host/authMode/model/basic-auth)
 *     (the port input carries NO apiKey)
 *   - `onWriteKey(id, apiKey)` → `setProviderKey(id, apiKey)` (the ONLY key-write path)
 *   - `onValidate(id)`         → `validate(id)`
 *
 * ── KEY BOUNDARY (Option-A, design D4) ──
 * `getProviderConfig` returns `HostMaskedSearchProviderConfig` with `apiKey` and
 * `basicAuthPassword` structurally absent, or `null` when unconfigured. The plugin
 * never reads stored search credentials. API keys cross inward only via `setProviderKey`
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
} from "@elftia/plugin-types";

import { getHost } from "./host/hostBridge";

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
    return invoke("search.getProviders");
  },
  /** A provider's masked config and readiness/presence flags; never stored credentials. */
  getProviderConfig(providerId: string): Promise<HostMaskedSearchProviderConfig | null> {
    return invoke('search.getProviderConfig', { providerId });
  },
  /** Configure fields; a SearXNG password is write-only and omitted unless explicitly edited. */
  configureProvider(config: HostSearchProviderConfigInput): Promise<HostSearchKeyWriteResult> {
    return invoke('search.configureProvider', { config });
  },
  /** Bulk-configure providers (each carries no apiKey). */
  configureProviders(
    configs: readonly HostSearchProviderConfigInput[],
  ): Promise<HostSearchKeyWriteResult> {
    return invoke("search.configureProviders", { configs });
  },
  /** Whether the provider is enabled (+ configured). */
  isProviderEnabled(providerId: string): Promise<boolean> {
    return invoke("search.isProviderEnabled", { providerId });
  },
  /** Validate a provider via a host-side test search; status only, never a key. */
  validate(providerId: string): Promise<HostSearchValidateResult> {
    return invoke("search.validate", { providerId });
  },
  /** Write (or clear, when empty) the provider key — the ONLY key-write path. */
  setProviderKey(
    providerId: string,
    apiKey: string,
  ): Promise<HostSearchKeyWriteResult> {
    return invoke("search.setProviderKey", { providerId, apiKey });
  },
};

export type SearchConfigClient = typeof searchConfigClient;
