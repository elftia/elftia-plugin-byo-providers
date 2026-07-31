/**
 * useLlmProviders — plugin-owned provider-list state (design D2).
 *
 * Replaces the host `settingsStore` `useLlmProvidersData()` reactivity. The
 * plugin owns its OWN provider-list cache: it loads via the masked relay on
 * mount and refetches after every mutation. The returned shape mirrors the host
 * data hook (`{ providers, loading, error, refresh, updateProvider }`) so the
 * relocated `useProviderSettings` consumes it unchanged.
 *
 * Single instance per section render — pass the returned bag down so all panels
 * share one cache (avoids stale lists after a mutation in another panel).
 *
 * @module byo-providers/renderer/useLlmProviders
 */
import type { LLMProvider } from '@byo/domain/llm';

import { getHost } from './host/hostBridge';
import { llmConfigClient } from './llmConfigClient';

export interface LlmProvidersBag {
  readonly providers: LLMProvider[];
  readonly loading: boolean;
  readonly error: string | null;
  /** Force a refetch from the masked port. */
  readonly refresh: () => Promise<void>;
  /** Optimistic in-cache replace of one provider (id-matched). */
  readonly updateProvider: (provider: LLMProvider) => void;
}

export function useLlmProviders(): LlmProvidersBag {
  const React = getHost().react.instance;
  const [providers, setProviders] = React.useState<LLMProvider[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await llmConfigClient.getProviders();
      setProviders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateProvider = React.useCallback((updated: LLMProvider) => {
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  return { providers, loading, error, refresh, updateProvider };
}
