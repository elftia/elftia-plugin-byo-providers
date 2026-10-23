/**
 * useSearchProviders — plugin-owned API-key search-provider state (P2d design D3).
 *
 * Replaces the host `webSearchStore` `useWebSearchProviders()` the relocated
 * `ProviderPanel` consumed. The plugin owns its OWN per-provider masked-config
 * cache: the rendered provider id list is the plugin-local `getApiProviders()`
 * metadata, and on mount it loads each provider's
 * MASKED config (`getProviderConfig(id)`) + enabled flag, refetching after a
 * mutation.
 *
 * The plugin-local metadata determines rows. Only the backend's masked
 * `configured` projection determines readiness, including public-mode support
 * and DeepSeek's request-time official LLM key reuse.
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
  /** Backend readiness projection; never inferred from a non-null config. */
  readonly isConfigured: (id: WebSearchProviderId) => boolean;
}


export function useSearchProviders(): SearchProvidersBag {
  const React = getHost().react.instance;
  // Metadata determines rows; backend projections determine credential availability.
  const providerIds = React.useMemo<WebSearchProviderId[]>(() => getApiProviders(), []);

  const [entries, setEntries] = React.useState<Record<string, SearchProviderEntry>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const refreshGeneration = React.useRef(0);

  const refresh = React.useCallback(async () => {
    const generation = ++refreshGeneration.current;
    setLoading(true);
    setError(null);
    try {
      const loaded = await Promise.all(
        providerIds.map(async (id) => {
          const [config, enabled] = await Promise.all([
            searchConfigClient.getProviderConfig(id),
            searchConfigClient.isProviderEnabled(id),
          ]);
          return [id, { id, config, enabled }] as const;
        }),
      );
      if (generation === refreshGeneration.current) setEntries(Object.fromEntries(loaded));
    } catch (e) {
      if (generation === refreshGeneration.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (generation === refreshGeneration.current) setLoading(false);
    }
  }, [providerIds]);

  React.useEffect(() => {
    void refresh();
    return () => { refreshGeneration.current += 1; };
  }, [refresh]);

  const isConfigured = React.useCallback(
    (id: WebSearchProviderId): boolean => {
      const entry = entries[id];
      if (!entry) return false;
      return entry.config?.configured === true;
    },
    [entries],
  );

  return { providerIds, entries, loading, error, refresh, isConfigured };
}
