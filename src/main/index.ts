/**
 * byo-providers — MAIN half (`app-extension` plugin, P2b LLM UI).
 *
 * `activate(host)` registers a FLAT 1:1 relay of the LLM-config verbs over the
 * audited masked `host.services.llmConfig` port (host-API 1.21, `host:llm-config`).
 * The relocated renderer LLM UI reaches every verb via
 * `host.ipc.invoke('llm.<verb>')` (the P2a-proven scoped-IPC path) —
 * `host.services.*` are MAIN-side, the renderer cannot call them directly.
 *
 * NO `host:secrets-write` / `secrets.setKey` relay (P2b least-privilege): LLM
 * key WRITES ride the provider body (`api_key` on `addProvider`/`updateProvider`
 * + `apiKey` on the key-pool `addApiKey`/`updateApiKey`), which the host's
 * `llmConfig` adapter routes to `SecretsService` INTERNALLY under the
 * `llm-provider:` / `llm-pool-key:` refs. So this plugin only needs
 * `host:llm-config`.
 *
 * P2c (media) ADDS a parallel FLAT 1:1 relay of the masked `host.services.mediaConfig`
 * port (host-API 1.23 / setProviderKey 1.25, `host:media-config` ONLY), each verb
 * carrying a `mediaType ∈ {image,video,music,tts,asr}` discriminator (except
 * image-only `resetProviderToDefaults`). UNLIKE LLM, a media key is written ONLY
 * through `setProviderKey` (the media update patch dropped `apiKey`) — but that
 * verb is on the `mediaConfig` port itself: the port writes the key host-side
 * through the guarded `secretsWrite` body under the `media-<type>:<id>:apiKey` ref
 * AND synchronously invalidates the ConfigService cache. So the plugin needs ONLY
 * `host:media-config` (NOT `host:secrets-write` — it never calls that port; the
 * media key write is fully internalized behind `mediaConfig.setProviderKey`, the
 * same way LLM key writes are internalized behind `llmConfig`). NO preset verbs
 * (panels don't use them; the v1.23/1.25 port doesn't expose them).
 *
 * P2d (search) ADDS a parallel FLAT relay of the masked `host.services.searchConfig`
 * port (host-API 1.24, `host:search-config` ONLY) for the API-key web-search
 * providers (tavily/jina/zhipu/grok/exa/bocha/searxng). Same shape as media: the
 * masked `getProviderConfig` returns `apiKey?: never` (+ `null` when unconfigured)
 * — no key OUTWARD; a key crosses INWARD ONLY via `search.setProviderKey`, which
 * the port writes host-side under `search-provider:<id>:apiKey` + reconfigures the
 * cache. So the plugin needs ONLY `host:search-config`, NOT `host:secrets-write`.
 * NO local-* config verbs, NO `search` query-execution verb (host/execution-side,
 * deliberately off the port — the Test-Search button is sliced from the UI copy).
 *
 * P2b-2 (`byo-p2-llm-2`) ADDS the 3 features sliced from P2b: (1) `llm.testModel`
 * on the EXISTING masked `host.services.llmConfig` port (host-API 1.27,
 * `host:llm-config` — NO new token; a connectivity probe, NO-SECRET-IN-OR-OUT);
 * (2) a `secretsPack.export`/`secretsPack.import` relay over the NEW masked
 * `host.services.secretsPack` port (host-API 1.27, `host:secrets-pack` ONLY — the
 * encrypted credential migration pack, PASSPHRASE-IN/COUNTS-PATH-OUT: the host runs
 * the native dialog + all crypto + the file I/O + ingest; no blob/plaintext/
 * passphrase crosses back; DISTINCT from `host:secrets-write`, which this plugin
 * still never requests); (3) TransformerConfig (renderer-only, NO port — provider
 * body + the existing `llm.updateProvider`).
 *
 * KEY INVARIANTS (design D2 / D3 / D4):
 *   - Each handler is a 3-line delegation; the relay adds NO logic, just crosses
 *     the process boundary. The optional `host.services.{llmConfig,mediaConfig}`
 *     is guarded (`?.`) so an unwired/old host yields a clear failure, not a crash.
 *   - Returned providers/keys are MASKED by the port (`api_key`/`apiKey` blanked +
 *     `hasKey`); no plaintext key ever flows OUTWARD. An LLM key carried INWARD in a
 *     provider/pool body is host-routed to the secret store, never echoed back; a
 *     MEDIA key crosses INWARD only via `media.setProviderKey` (never the patch).
 *   - Imports NO `electron` / `@main` (Electron-free utilityProcess main build).
 *
 * @module byo-providers/main/index
 */
import type { AgentBackendHostApi, HostMediaType } from '@byo/domain/plugin-types';

/** Local alias for the media discriminator union. */
type MediaType = HostMediaType;

/** Narrow an unknown IPC payload to a record. */
function asRecord(payload: unknown): Record<string, unknown> {
  return (payload ?? {}) as Record<string, unknown>;
}

/**
 * The plugin's MAIN `activate` entry. The loader calls it once with a freshly
 * constructed {@link AgentBackendHostApi}.
 */
export function activate(host: AgentBackendHostApi): void {
  const missing = () => {
    throw new Error('[byo-providers] host.services.llmConfig is unavailable');
  };
  const mediaMissing = () => {
    throw new Error('[byo-providers] host.services.mediaConfig is unavailable');
  };
  const searchMissing = () => {
    throw new Error('[byo-providers] host.services.searchConfig is unavailable');
  };
  const subAuthMissing = () => {
    throw new Error('[byo-providers] host.services.subscriptionAuth is unavailable');
  };
  const agentCfgMissing = () => {
    throw new Error('[byo-providers] host.services.agentConfig is unavailable');
  };
  const cliRtMissing = () => {
    throw new Error('[byo-providers] host.services.cliRuntime is unavailable');
  };
  const secretsPackMissing = () => {
    throw new Error('[byo-providers] host.services.secretsPack is unavailable');
  };
  const llm = () => host.services.llmConfig ?? missing();
  const media = () => host.services.mediaConfig ?? mediaMissing();
  const search = () => host.services.searchConfig ?? searchMissing();
  // P2e (`byo-p2-subscription`) — the subscription/OAuth/CLI-account, cli
  // sub-settings, and CLI-runtime ports (host-API 1.26).
  const subAuth = () => host.services.subscriptionAuth ?? subAuthMissing();
  const agentCfg = () => host.services.agentConfig ?? agentCfgMissing();
  const cliRt = () => host.services.cliRuntime ?? cliRtMissing();
  // P2b-2 (`byo-p2-llm-2`) — the encrypted credential migration-pack port
  // (host-API 1.27). `testModel` rides the EXISTING `host.services.llmConfig`.
  const secretsPack = () => host.services.secretsPack ?? secretsPackMissing();
  /** Narrow an IPC payload's `mediaType` to the port's discriminator union. */
  const asMediaType = (v: unknown): MediaType => String(v) as MediaType;

  host.registerIpcMethods({
    // ── Providers ────────────────────────────────────────────────────────────
    'llm.getProviders': async () => (await llm()?.getProviders()) ?? [],
    'llm.getProvider': async (p) => (await llm()?.getProvider(String(asRecord(p).id))) ?? null,
    'llm.addProvider': async (p) => (await llm()?.addProvider(asRecord(p))) ?? missing(),
    'llm.updateProvider': async (p) => (await llm()?.updateProvider(asRecord(p))) ?? missing(),
    'llm.deleteProvider': async (p) => (await llm()?.deleteProvider(String(asRecord(p).id))) ?? missing(),
    'llm.toggleProvider': async (p) => {
      const { id, enabled } = asRecord(p);
      return (await llm()?.toggleProvider(String(id), Boolean(enabled))) ?? missing();
    },
    'llm.reorderProviders': async (p) => {
      const { orderedIds } = asRecord(p);
      return (await llm()?.reorderProviders((orderedIds as string[]) ?? [])) ?? missing();
    },
    'llm.resetProvider': async (p) => (await llm()?.resetProvider(String(asRecord(p).id))) ?? missing(),
    'llm.discoverModels': async (p) => {
      const { id, options } = asRecord(p);
      return (await llm()?.discoverModels(String(id), options as { forceRefresh?: boolean })) ?? missing();
    },
    // P2b-2 (`byo-p2-llm-2`) — the model connectivity probe over the EXISTING
    // `host.services.llmConfig` port (host-API 1.27, `host:llm-config` — NO new
    // token). NO-SECRET-IN-OR-OUT: the host sends a trivial prompt with the
    // host-resolved key; the diagnostic return carries no key/token.
    'llm.testModel': async (p) => {
      const { providerId, modelId } = asRecord(p);
      return (await llm()?.testModel(String(providerId), String(modelId))) ?? missing();
    },

    // ── Presets ──────────────────────────────────────────────────────────────
    'llm.getProviderPresets': async () => (await llm()?.getProviderPresets()) ?? [],
    'llm.addFromPreset': async (p) => {
      const { presetId, apiKey } = asRecord(p);
      return (await llm()?.addFromPreset(String(presetId), apiKey as string | undefined)) ?? missing();
    },

    // ── Key pool ─────────────────────────────────────────────────────────────
    'llm.getApiKeys': async (p) => (await llm()?.getApiKeys(String(asRecord(p).providerId))) ?? [],
    'llm.addApiKey': async (p) => (await llm()?.addApiKey(asRecord(p))) ?? missing(),
    'llm.updateApiKey': async (p) => (await llm()?.updateApiKey(asRecord(p))) ?? missing(),
    'llm.deleteApiKey': async (p) => (await llm()?.deleteApiKey(String(asRecord(p).id))) ?? missing(),
    'llm.toggleApiKey': async (p) => (await llm()?.toggleApiKey(asRecord(p))) ?? missing(),
    'llm.getKeyHealth': async (p) => (await llm()?.getKeyHealth(String(asRecord(p).providerId))) ?? {},

    // ── Default model (router config) ─────────────────────────────────────────
    'llm.getRouterConfig': async () => (await llm()?.getRouterConfig()) ?? null,
    'llm.setRouterConfig': async (p) => (await llm()?.setRouterConfig(asRecord(p))) ?? missing(),

    // ══ MEDIA (P2c) — flat mediaType-discriminated relay over host.services.mediaConfig ══
    // Each verb is a guarded 3-line delegation; the masked port strips apiKey +
    // byteplusAk/Sk on every return. Media keys cross INWARD ONLY via
    // `media.setProviderKey` (the update patch has NO apiKey). NO preset verbs.
    'media.listProviders': async (p) =>
      (await media()?.listProviders(asMediaType(asRecord(p).mediaType))) ?? [],
    'media.getProvider': async (p) => {
      const { mediaType, id } = asRecord(p);
      return (await media()?.getProvider(asMediaType(mediaType), String(id))) ?? null;
    },
    'media.updateProvider': async (p) => {
      const { mediaType, id, patch } = asRecord(p);
      return (
        (await media()?.updateProvider(asMediaType(mediaType), String(id), asRecord(patch))) ??
        mediaMissing()
      );
    },
    'media.toggleProvider': async (p) => {
      const { mediaType, id, enabled } = asRecord(p);
      return (
        (await media()?.toggleProvider(asMediaType(mediaType), String(id), Boolean(enabled))) ??
        mediaMissing()
      );
    },
    'media.createCustomProvider': async (p) => {
      const { mediaType, input } = asRecord(p);
      return (
        (await media()?.createCustomProvider(
          asMediaType(mediaType),
          asRecord(input) as { baseProviderId: string; name: string },
        )) ?? mediaMissing()
      );
    },
    'media.deleteProvider': async (p) => {
      const { mediaType, id } = asRecord(p);
      return (await media()?.deleteProvider(asMediaType(mediaType), String(id))) ?? mediaMissing();
    },
    'media.getGlobalSettings': async (p) =>
      (await media()?.getGlobalSettings(asMediaType(asRecord(p).mediaType))) ?? {},
    'media.setGlobalSettings': async (p) => {
      const { mediaType, settings } = asRecord(p);
      return (
        (await media()?.setGlobalSettings(asMediaType(mediaType), asRecord(settings))) ??
        mediaMissing()
      );
    },
    'media.refreshUpstreamModels': async (p) => {
      const { mediaType, id } = asRecord(p);
      return (
        (await media()?.refreshUpstreamModels(asMediaType(mediaType), String(id))) ?? mediaMissing()
      );
    },
    // IMAGE-ONLY: the only media type with a library reset (bare `id`, no mediaType).
    'media.resetProviderToDefaults': async (p) =>
      (await media()?.resetProviderToDefaults(String(asRecord(p).id))) ?? mediaMissing(),
    // The ONLY media key-write avenue (host-API 1.25). Delegates to the masked
    // port's `setProviderKey`, which writes the key host-side through the guarded
    // `secretsWrite` body under the per-type `media-<type>:<id>:apiKey` ref AND
    // synchronously invalidates the ConfigService cache (so the next
    // `listProviders` reflects the new `hasKey`/`configured` immediately — a raw
    // `secretsWrite.setSecret` would leave that derived flag stale for the cache
    // TTL). Empty clears. The key crosses INWARD only; never echoed back. The
    // `collectMediaSecretWrites` empty-skip guard upstream means empty never
    // reaches here on an unrelated edit.
    'media.setProviderKey': async (p) => {
      const { mediaType, id, apiKey } = asRecord(p);
      return (
        (await media()?.setProviderKey(asMediaType(mediaType), String(id), String(apiKey ?? ''))) ??
        mediaMissing()
      );
    },

    // ══ SEARCH (P2d) — flat relay over the masked host.services.searchConfig port ══
    // The API-KEY web-search providers (tavily/jina/zhipu/grok/exa/bocha/searxng).
    // Each verb is a guarded 3-line delegation over the masked port (host-API 1.24,
    // `host:search-config` ONLY). The masked `getProviderConfig` returns
    // `apiKey?: never` (structurally absent) + `null` when unconfigured — no key
    // ever flows OUTWARD. A search key crosses INWARD ONLY via
    // `search.setProviderKey` (the config verbs carry NO apiKey — the port strips
    // it regardless), which the port writes host-side through the EXISTING guarded
    // secret write under `search-provider:<id>:apiKey` AND reconfigures the cache
    // (the Jina sync). So the plugin needs ONLY `host:search-config`, NOT
    // `host:secrets-write` (the media lesson). NO local-* config verbs, NO `search`
    // query-execution verb — those are host/execution-side, deliberately off the port.
    'search.getProviders': async () => (await search()?.getProviders()) ?? { api: [], local: [] },
    'search.getProviderConfig': async (p) =>
      (await search()?.getProviderConfig(String(asRecord(p).providerId))) ?? null,
    'search.configureProvider': async (p) =>
      (await search()?.configureProvider(asRecord(p).config as never)) ?? searchMissing(),
    'search.configureProviders': async (p) =>
      (await search()?.configureProviders((asRecord(p).configs as never[]) ?? [])) ??
      searchMissing(),
    'search.isProviderEnabled': async (p) =>
      (await search()?.isProviderEnabled(String(asRecord(p).providerId))) ?? false,
    'search.validate': async (p) =>
      (await search()?.validate(String(asRecord(p).providerId))) ?? searchMissing(),
    // The ONLY search key-write avenue. Delegates to the masked port's
    // `setProviderKey`, which writes the key host-side through the guarded secret
    // write under `search-provider:<id>:apiKey` (empty clears) AND reconfigures the
    // in-memory provider map (the Jina reader refresh). The key crosses INWARD only;
    // never echoed back. An empty key never reaches here on an unrelated edit (the
    // renderer's empty-skip guard).
    'search.setProviderKey': async (p) => {
      const { providerId, apiKey } = asRecord(p);
      return (
        (await search()?.setProviderKey(String(providerId), String(apiKey ?? ''))) ??
        searchMissing()
      );
    },

    // ══ SUBSCRIPTION / OAUTH / CLI-ACCOUNT (P2e) — flat relay over host.services.subscriptionAuth ══
    // TOKEN-NEVER-CROSSES: OAuth init returns ONLY `{ authUrl, state }` (the PKCE
    // verifier stays host-side keyed by state — the plugin NEVER holds or relays
    // it); the exchange payload carries ONLY `{ authorizationCode, state, label? }`
    // (NO codeVerifier — the masked port forbids it; a stray one fails type-check).
    // Reads return sanitized `has*Token` descriptors; exchange/refresh/mutate +
    // the manual-token verbs return status only — no token/refresh/id/setup token
    // or api key ever flows OUTWARD. Manual-token + OpenCodeGo-key inputs cross
    // INWARD only (consumed host-side, never echoed). Guarded 3-line delegations.
    'subAuth.getClaudeAuthParams': async () =>
      (await subAuth()?.getClaudeAuthParams()) ?? subAuthMissing(),
    'subAuth.getClaudeSetupAuthParams': async () =>
      (await subAuth()?.getClaudeSetupAuthParams()) ?? subAuthMissing(),
    'subAuth.getCodexAuthParams': async () =>
      (await subAuth()?.getCodexAuthParams()) ?? subAuthMissing(),
    'subAuth.getGeminiAuthParams': async () =>
      (await subAuth()?.getGeminiAuthParams()) ?? subAuthMissing(),
    'subAuth.exchangeClaudeToken': async (p) =>
      (await subAuth()?.exchangeClaudeToken(asRecord(p) as never)) ?? subAuthMissing(),
    'subAuth.exchangeClaudeSetupToken': async (p) =>
      (await subAuth()?.exchangeClaudeSetupToken(asRecord(p) as never)) ?? subAuthMissing(),
    'subAuth.exchangeCodexToken': async (p) =>
      (await subAuth()?.exchangeCodexToken(asRecord(p) as never)) ?? subAuthMissing(),
    'subAuth.exchangeGeminiToken': async (p) =>
      (await subAuth()?.exchangeGeminiToken(asRecord(p) as never)) ?? subAuthMissing(),
    'subAuth.importFromExternalCli': async (p) =>
      (await subAuth()?.importFromExternalCli(String(asRecord(p).platform))) ?? subAuthMissing(),
    'subAuth.getCliAutoImport': async (p) =>
      (await subAuth()?.getCliAutoImport(String(asRecord(p).provider))) ?? false,
    'subAuth.setCliAutoImport': async (p) => {
      const { provider, enabled } = asRecord(p);
      await subAuth()?.setCliAutoImport(String(provider), Boolean(enabled));
      return { success: true };
    },
    'subAuth.getSanitized': async () => (await subAuth()?.getSanitized()) ?? {},
    'subAuth.listAccounts': async (p) =>
      (await subAuth()?.listAccounts(String(asRecord(p).provider))) ?? [],
    'subAuth.setActiveAccount': async (p) => {
      const { provider, id } = asRecord(p);
      return (await subAuth()?.setActiveAccount(String(provider), String(id))) ?? subAuthMissing();
    },
    'subAuth.removeAccount': async (p) => {
      const { provider, id } = asRecord(p);
      return (await subAuth()?.removeAccount(String(provider), String(id))) ?? subAuthMissing();
    },
    'subAuth.updateAccountLabel': async (p) => {
      const { provider, id, label } = asRecord(p);
      return (
        (await subAuth()?.updateAccountLabel(String(provider), String(id), String(label))) ??
        subAuthMissing()
      );
    },
    'subAuth.applyAccountToCli': async (p) => {
      const { provider, id } = asRecord(p);
      return (await subAuth()?.applyAccountToCli(String(provider), String(id))) ?? subAuthMissing();
    },
    'subAuth.refreshAccount': async (p) => {
      const { provider, id } = asRecord(p);
      return (await subAuth()?.refreshAccount(String(provider), String(id))) ?? false;
    },
    'subAuth.clearConfig': async (p) => {
      await subAuth()?.clearConfig(String(asRecord(p).platform));
      return { success: true };
    },
    'subAuth.listSubscriptions': async () => (await subAuth()?.listSubscriptions()) ?? [],
    'subAuth.subscriptionStatus': async (p) =>
      (await subAuth()?.subscriptionStatus(String(asRecord(p).providerId))) ?? {},
    'subAuth.setOpenCodeGoConfig': async (p) =>
      (await subAuth()?.setOpenCodeGoConfig(asRecord(p).request as Record<string, unknown>)) ??
      subAuthMissing(),
    'subAuth.addOpenCodeGoAccount': async (p) =>
      (await subAuth()?.addOpenCodeGoAccount(asRecord(p).request as Record<string, unknown>)) ??
      subAuthMissing(),
    'subAuth.clearOpenCodeGo': async () =>
      (await subAuth()?.clearOpenCodeGo()) ?? subAuthMissing(),
    'subAuth.refreshCredential': async (p) =>
      (await subAuth()?.refreshCredential(String(asRecord(p).providerId))) ?? subAuthMissing(),
    // Manual-token paste (INWARD-only; status-only return, no token echoed back).
    'subAuth.setClaudeManualToken': async (p) => {
      const { accessToken, subscriptionLevel, label } = asRecord(p);
      return (
        (await subAuth()?.setClaudeManualToken(
          String(accessToken ?? ''),
          subscriptionLevel as string | undefined,
          label as string | undefined,
        )) ?? subAuthMissing()
      );
    },
    'subAuth.setCodexManualToken': async (p) => {
      const { accessToken, label } = asRecord(p);
      return (
        (await subAuth()?.setCodexManualToken(
          String(accessToken ?? ''),
          label as string | undefined,
        )) ?? subAuthMissing()
      );
    },
    'subAuth.setGeminiManualToken': async (p) => {
      const { accessToken, refreshToken } = asRecord(p);
      return (
        (await subAuth()?.setGeminiManualToken(
          String(accessToken ?? ''),
          refreshToken as string | undefined,
        )) ?? subAuthMissing()
      );
    },
    'subAuth.updateClaudeSubscriptionLevel': async (p) =>
      (await subAuth()?.updateClaudeSubscriptionLevel(String(asRecord(p).level))) ??
      subAuthMissing(),

    // ══ AGENT-CONFIG (P2e) — cli sub-settings get/set over host.services.agentConfig ══
    // ONLY the 5 cli keys; the general `agentBackend` engine field is NOT exposed
    // (the port + adapter reject it). Guarded 3-line delegations.
    'agentCfg.getCliBackendConfig': async () =>
      (await agentCfg()?.getCliBackendConfig()) ?? {},
    'agentCfg.setCliBackendConfig': async (p) =>
      (await agentCfg()?.setCliBackendConfig(asRecord(p) as never)) ?? agentCfgMissing(),

    // ══ CLI-RUNTIME (P2e) — availability/install/launch over host.services.cliRuntime ══
    // NO-CREDENTIAL-ON-RETURN: `getAuthStatus` returns descriptors only; install/
    // launch are host-run actions returning `{ ok, error? }`. Guarded delegations.
    'cliRt.getAuthStatus': async (p) =>
      (await cliRt()?.getAuthStatus(asRecord(p) as { force?: boolean })) ?? [],
    'cliRt.setEnabled': async (p) => {
      const { backendId, enabled } = asRecord(p);
      return (await cliRt()?.setEnabled(String(backendId), Boolean(enabled))) ?? cliRtMissing();
    },
    'cliRt.install': async (p) =>
      (await cliRt()?.install(String(asRecord(p).backendId))) ?? cliRtMissing(),
    'cliRt.launchTerminal': async (p) =>
      (await cliRt()?.launchTerminal(asRecord(p) as never)) ?? cliRtMissing(),
    'cliRt.listBackends': async () => (await cliRt()?.listBackends()) ?? [],

    // ══ SECRETS-PACK (P2b-2) — encrypted credential migration pack over host.services.secretsPack ══
    // PASSPHRASE-IN, COUNTS/PATH/STATUS-OUT: each verb relays ONLY the passphrase
    // IN; the host runs the native save/open dialog + ALL crypto + the file I/O +
    // ingest entirely main-side and returns ONLY status/counts/path. The encrypted
    // `.epack` blob, the plaintext keys/tokens, and the passphrase NEVER flow back
    // OUTWARD (no return field can carry them). DISTINCT from `host:secrets-write`
    // (this plugin never requests it). Guarded 3-line delegations.
    'secretsPack.export': async (p) => {
      const { passphrase } = asRecord(p);
      return (await secretsPack()?.export({ passphrase: String(passphrase ?? '') })) ?? secretsPackMissing();
    },
    'secretsPack.import': async (p) => {
      const { passphrase } = asRecord(p);
      return (await secretsPack()?.import({ passphrase: String(passphrase ?? '') })) ?? secretsPackMissing();
    },
  });
}

/**
 * Optional main-side teardown. The host tears down registered IPC methods on
 * disable; this releases the plugin's OWN side effects (none here). Kept for the
 * hot-toggle reentrancy contract.
 */
export function deactivate(): void {
  // No plugin-owned side effects to release.
}

export default { activate, deactivate };
