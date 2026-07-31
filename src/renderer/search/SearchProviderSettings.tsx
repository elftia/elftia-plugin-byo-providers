/**
 * SearchProviderSettings.tsx — the plugin's "Search Providers" section body
 * (P2d design D2/D3/D4). A self-contained 2-column mini-tab: the api-only
 * `SearchProviderSidebar` + the relocated `ProviderPanel`, mirroring the host
 * web-search tab's API-provider half (the general-settings + local-* halves stay
 * host-only, dual-track).
 *
 * The data layer is the masked `searchConfigClient` + `useSearchProviders` hook
 * (NOT the host `webSearchStore`). It maps the panel props onto the relay (D3):
 *   - `onUpdate`   → `configureProvider(full non-secret config)` + refetch
 *   - `onWriteKey` → debounced `setProviderKey` (empty-skip; Option-A D4) + refetch
 *   - `onValidate` → `validate`
 *
 * @module byo-providers/renderer/search/SearchProviderSettings
 */
import * as React from 'react';

import { getHost } from '../host/hostBridge';
import { searchConfigClient } from '../searchConfigClient';
import { useSearchProviders } from '../useSearchProviders';

import type { WebSearchProvider, WebSearchProviderId } from './meta';
import { ProviderPanel } from './ProviderPanel';
import { SearchProviderSidebar } from './SearchProviderSidebar';

// The encrypted credential migration-pack bar (`secrets-pack-media-search`) — one
// pack migrates ALL domains (LLM + media + search), so it sits at the top of the
// search settings page too. Lazy-split like the host `llm/ProviderSettings.tsx`.
const MigrationPackDialogs = React.lazy(() =>
  import('../shared/MigrationPackDialogs').then((m) => ({ default: m.MigrationPackDialogs })),
);

/** Per-provider debounce for the one-way `setProviderKey` write. */
const KEY_WRITE_DEBOUNCE_MS = 500;

/** Project a masked config to the non-secret form-state the panel reads. */
function toFormProvider(
  id: WebSearchProviderId,
  config: Record<string, unknown> | null,
  enabled: boolean,
): WebSearchProvider {
  const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
  return {
    id,
    name: id,
    type: 'api',
    enabled,
    apiHost: str(config?.apiHost),
    basicAuthUsername: str(config?.basicAuthUsername),
    basicAuthPassword: str(config?.basicAuthPassword),
  };
}

export function SearchProviderSettings() {
  const React_ = getHost().react.instance;
  const { providerIds, entries, refresh, isConfigured } = useSearchProviders();

  const [selectedId, setSelectedId] = React_.useState<WebSearchProviderId>(
    providerIds[0] ?? 'tavily',
  );

  // Keep the selection valid as the provider list resolves.
  React_.useEffect(() => {
    if (providerIds.length > 0 && !providerIds.includes(selectedId)) {
      setSelectedId(providerIds[0]);
    }
  }, [providerIds, selectedId]);

  const keyTimers = React_.useRef<Map<WebSearchProviderId, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const selectedEntry = entries[selectedId];
  const selectedProvider = toFormProvider(
    selectedId,
    (selectedEntry?.config ?? null) as Record<string, unknown> | null,
    selectedEntry?.enabled ?? true,
  );

  // Non-secret config write: merge the delta over the current masked config and
  // push the FULL non-secret config (the port's `configureProvider` is a full
  // configure; no apiKey rides it). Refetch to reflect enabled/configured changes.
  const onUpdate = React_.useCallback(
    (id: WebSearchProviderId, updates: Partial<WebSearchProvider>) => {
      // Guard (review m1): never push a full configure for a provider whose entry
      // hasn't loaded yet — `toFormProvider` defaults `enabled` to true, so an
      // edit before load would silently RESURRECT a host-disabled provider. The
      // panel only renders post-load in practice; this closes the latent foot-gun.
      const loadedEntry = entries[id];
      if (!loadedEntry) return;
      const current = toFormProvider(
        id,
        (loadedEntry.config ?? null) as Record<string, unknown> | null,
        loadedEntry.enabled,
      );
      const next = { ...current, ...updates };
      void searchConfigClient
        .configureProvider({
          id,
          enabled: next.enabled,
          apiHost: next.apiHost,
          basicAuthUsername: next.basicAuthUsername,
          basicAuthPassword: next.basicAuthPassword,
        })
        .then(() => refresh())
        .catch((e: unknown) => {
          console.warn('[byo-providers] configureProvider failed:', e);
        });
    },
    [entries, refresh],
  );

  // Option-A key write: debounce, and SKIP an empty value (an empty key field on
  // save must NOT call setProviderKey — that would clear the stored key on an
  // unrelated edit). A non-empty value writes through the one-way relay.
  const onWriteKey = React_.useCallback(
    (id: WebSearchProviderId, apiKey: string) => {
      const timers = keyTimers.current;
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);
      if (apiKey.trim().length === 0) {
        // Empty draft → leave the stored key untouched (no write).
        return;
      }
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          void searchConfigClient
            .setProviderKey(id, apiKey)
            .then(() => refresh())
            .catch((e: unknown) => {
              console.warn('[byo-providers] setProviderKey failed:', e);
            });
        }, KEY_WRITE_DEBOUNCE_MS),
      );
    },
    [refresh],
  );

  const onValidate = React_.useCallback(
    (id: WebSearchProviderId) => searchConfigClient.validate(id),
    [],
  );

  return (
    <>
      <React.Suspense fallback={null}>
        <MigrationPackDialogs />
      </React.Suspense>
      <div
        data-testid="byo-search-layout"
        className="flex gap-6 h-[calc(100vh-200px)] min-h-[400px]"
      >
        <div
          data-testid="byo-search-sidebar"
          className="w-[220px] shrink-0 rounded-lg border border-border/50 bg-surface-1/50 wallpaper-blur p-3 overflow-y-auto"
        >
          <SearchProviderSidebar
            providerIds={providerIds}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isEnabled={(id) => entries[id]?.enabled ?? true}
          />
        </div>

        <div
          data-testid="byo-search-content"
          className="flex-1 min-w-0 overflow-y-auto rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4 md:p-5"
        >
          <ProviderPanel
            providerId={selectedId}
            provider={selectedProvider}
            configured={isConfigured(selectedId)}
            onUpdate={onUpdate}
            onWriteKey={onWriteKey}
            onValidate={onValidate}
          />
        </div>
      </div>
    </>
  );
}

export default SearchProviderSettings;
