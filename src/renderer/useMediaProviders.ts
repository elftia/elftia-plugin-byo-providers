/**
 * useMediaProviders — plugin-owned per-`mediaType` provider-list state (design D3).
 *
 * Replaces the host `settingsStore` `useMediaProvidersData(mediaType)` the
 * relocated panels consumed. The plugin owns its OWN per-type provider-list
 * cache: it loads via the masked `media.listProviders` relay on mount and
 * refetches after every mutation. The returned shape mirrors the host data hook
 * (`{ providers, loading, refresh }`) so the panels' `const { providers,
 * loading: isLoading, refresh } = useMediaProvidersData('video')` becomes
 * `… = useMediaProviders('video')` with no further change.
 *
 * One instance per panel render (each panel owns its mediaType). The returned
 * `providers` are MASKED (`config.apiKey` + byteplusAk/Sk stripped, `hasKey`/
 * `configured` present) — the plugin never sees a plaintext stored media key.
 *
 * @module byo-providers/renderer/useMediaProviders
 */
import type { HostMaskedMediaProvider, HostMediaType } from '@byo/domain/plugin-types';

import { getHost } from './host/hostBridge';
import { mediaConfigClient } from './mediaConfigClient';

export interface MediaProvidersBag {
  /**
   * The MASKED provider list for this media type. Typed loose (`unknown[]`) — the
   * panels cast it to the canonical per-type state (`as unknown as
   * VideoProviderState[]`), exactly as they did with the host `useMediaProvidersData`.
   * The runtime objects ARE the canonical state minus the secret config.
   */
  readonly providers: HostMaskedMediaProvider[];
  readonly loading: boolean;
  readonly error: string | null;
  /** Force a refetch from the masked port (the panels call this after a mutation). */
  readonly refresh: () => Promise<void>;
}

export function useMediaProviders(mediaType: HostMediaType): MediaProvidersBag {
  const React = getHost().react.instance;
  const [providers, setProviders] = React.useState<HostMaskedMediaProvider[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = (await mediaConfigClient.listByType(mediaType)) as HostMaskedMediaProvider[];
      setProviders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [mediaType]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { providers, loading, error, refresh };
}
