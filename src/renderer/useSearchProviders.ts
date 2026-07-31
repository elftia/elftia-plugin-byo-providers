/**
 * useSearchProviders — plugin-owned API-key search-provider state (P2d design D3).
 *
 * Replaces the host `webSearchStore` `useWebSearchProviders()` the relocated
 * `ProviderPanel` consumed. The plugin owns its OWN per-provider masked-config
 * cache: the rendered provider id list is the plugin-local `getApiProviders()`
 * meta (the SSOT — the 7 `type:'api'` ids), and on mount it loads each provider's
 * MASKED config (`getProviderConfig(id)`) + enabled flag, refetching after a
 * mutation.
 *
 * NOTE (review M1): the displayed set is `metaApiIds` DIRECTLY, NOT an
 * intersection with the port's `getProviders().api`. That host list is a
 * hardcoded subset that OMITS `grok` (a fully-wired host provider the host tab
 * DOES show), so intersecting would silently drop grok from the plugin section.
 * The per-provider verbs (`getProviderConfig`/`isProviderEnabled`/`configureProvider`/
 * `setProviderKey`/`validate`) all work per-id regardless of that incomplete
 * list, so the meta is the only correct SSOT for which providers to render.
 *
 * ── OPTION-A "configured" SIGNAL (design D4, OQ1-resolved) ──
 * The masked port NEVER returns a plaintext key (`getProviderConfig` →
 * `apiKey?: never`), so "已配置" is derived from `getProviderConfig(id) !== null`
 * (a non-null masked config means configured) — and for searxng additionally
 * from `apiHost` presence (it is key-OPTIONAL, configured by its base URL). The
 * plugin never reads a stored key to decide this.
 *
 * @module byo-providers/renderer/useSearchProviders
 */
import type { HostMaskedSearchProviderConfig } from '@byo/domain/plugin-types';

import { getHost } from './host/hostBridge';
import { getApiProviders, type WebSearchProviderId } from './search/meta';
import { searchConfigClient } from './searchConfigClient';

/** One API provider's loaded masked state (config-derived; never a key). */
export interface SearchProviderEntry {
  readonly id: WebSearchProviderId;
  /** The MASKED config (no `apiKey`), or `null` when the provider is unconfigured. */
  readonly config: HostMaskedSearchProviderConfig | null;
  /** Whether the provider is enabled (+ configured) per the port. */
  readonly enabled: boolean;
}

export interface SearchProvidersBag {
  /** The plugin's API provider ids (meta order — the section SSOT; see M1 note). */
  readonly providerIds: WebSearchProviderId[];
  /** The loaded masked entries, keyed by id. */
  readonly entries: Record<string, SearchProviderEntry>;
  readonly loading: boolean;
  readonly error: string | null;
  /** Force a refetch from the masked port (call after a mutation). */
  readonly refresh: () => Promise<void>;
  /** Option-A "configured" signal: non-null masked config, or apiHost for searxng. */
  readonly isConfigured: (id: WebSearchProviderId) => boolean;
}

/** A masked config's non-secret `apiHost` (used for the searxng configured signal). */
function configApiHost(config: HostMaskedSearchProviderConfig | null): string | undefined {
  const v = (config as { apiHost?: unknown } | null)?.apiHost;
  return typeof v === 'string' ? v : undefined;
}

export function useSearchProviders(): SearchProvidersBag {
  const React = getHost().react.instance;
  // The plugin's own api-provider meta is the SOLE SSOT for which providers the
  // section renders (and their order) — the 7 `type:'api'` ids. NOT gated on the
  // port's `getProviders().api` (that hardcoded list omits grok → would silently
  // drop a wired provider; review M1). Per-provider verbs work per-id regardless.
  const providerIds = React.useMemo<WebSearchProviderId[]>(() => getApiProviders(), []);

  const [entries, setEntries] = React.useState<Record<string, SearchProviderEntry>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await Promise.all(
        providerIds.map(async (id) => {
          const [config, enabled] = await Promise.all([
            searchConfigClient.getProviderConfig(id).catch(() => null),
            searchConfigClient.isProviderEnabled(id).catch(() => false),
          ]);
          return [id, { id, config, enabled }] as const;
        }),
      );
      setEntries(Object.fromEntries(loaded));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [providerIds]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const isConfigured = React.useCallback(
    (id: WebSearchProviderId): boolean => {
      const entry = entries[id];
      if (!entry) return false;
      if (id === 'searxng') return Boolean(configApiHost(entry.config)?.trim());
      return entry.config !== null;
    },
    [entries],
  );

  return { providerIds, entries, loading, error, refresh, isConfigured };
}
