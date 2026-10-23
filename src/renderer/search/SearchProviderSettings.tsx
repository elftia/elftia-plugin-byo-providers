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
 *   - `onWriteKey` → debounced `setProviderKey` + pending config save + refetch
 *   - `onValidate` → `validate`
 *
 * @module byo-providers/renderer/search/SearchProviderSettings
 */
import * as React from 'react';

import { getHost } from '../host/hostBridge';
import { useTranslation } from '../host/vendored/useTranslation';
import { searchConfigClient } from '../searchConfigClient';
import { useSearchProviders } from '../useSearchProviders';

import type { WebSearchProvider, WebSearchProviderId } from './meta';
import { WEB_SEARCH_PROVIDER_META } from './meta';
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
    enabled: typeof config?.enabled === 'boolean' ? config.enabled : enabled,
    apiHost: str(config?.apiHost),
    basicAuthUsername: str(config?.basicAuthUsername),
    authMode: WEB_SEARCH_PROVIDER_META[id].supportsPublic
      ? config?.authMode === 'api' || (config?.authMode !== 'public' && config?.hasApiKey === true)
        ? 'api' : 'public' : undefined,
    model: id === 'claude' ? str(config?.model) : undefined,
  };
}

function configureForm(provider: WebSearchProvider, basicAuthPassword?: string) {
  return searchConfigClient.configureProvider({
    id: provider.id,
    enabled: provider.enabled,
    apiHost: provider.apiHost,
    authMode: provider.authMode,
    ...(provider.id === 'claude' ? { model: provider.model } : {}),
    basicAuthUsername: provider.id === 'searxng' ? provider.basicAuthUsername : undefined,
    ...(basicAuthPassword !== undefined ? { basicAuthPassword } : {}),
  });
}

export function SearchProviderSettings() {
  const React_ = getHost().react.instance;
  const t = useTranslation();
  const saveFailed = t('settings.webSearch.saveFailed');
  const { providerIds, entries, loading, error, refresh, isConfigured } = useSearchProviders();
  const [selectedId, setSelectedId] = React_.useState<WebSearchProviderId>(providerIds[0] ?? 'tavily');
  const [drafts, setDrafts] = React_.useState<Partial<Record<WebSearchProviderId, WebSearchProvider>>>({});
  const draftsRef = React_.useRef(drafts);
  const [saveErrors, setSaveErrors] = React_.useState<Partial<Record<WebSearchProviderId, string>>>({});
  const writes = React_.useRef(new Map<WebSearchProviderId, Promise<void>>());
  const keyTimers = React_.useRef(new Map<WebSearchProviderId, ReturnType<typeof setTimeout>>());
  const pendingKeys = React_.useRef(new Map<WebSearchProviderId, string>());

  const enqueue = React_.useCallback((id: WebSearchProviderId, write: () => Promise<{ success: boolean; error?: string }>) => {
    const previous = writes.current.get(id) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(async () => {
      const result = await write();
      if (!result.success) throw new Error(result.error ?? saveFailed);
      await refresh();
      setSaveErrors((current) => ({ ...current, [id]: undefined }));
    });
    writes.current.set(id, next);
    void next.catch((caught: unknown) => setSaveErrors((current) => ({
      ...current, [id]: caught instanceof Error ? caught.message : String(caught),
    })));
    return next;
  }, [refresh, saveFailed]);

  const flushKey = React_.useCallback((id: WebSearchProviderId) => {
    clearTimeout(keyTimers.current.get(id));
    keyTimers.current.delete(id);
    const key = pendingKeys.current.get(id);
    if (key === undefined) return false;
    pendingKeys.current.delete(id);
    void enqueue(id, async () => {
      const result = await searchConfigClient.setProviderKey(id, key);
      if (!result.success) return result;
      const draft = draftsRef.current[id];
      return draft ? configureForm(draft) : result;
    });
    return true;
  }, [enqueue]);

  React_.useEffect(() => () => {
    for (const id of pendingKeys.current.keys()) flushKey(id);
  }, [flushKey]);

  const onUpdate = React_.useCallback((id: WebSearchProviderId, updates: Partial<WebSearchProvider>) => {
    const entry = entries[id];
    if (!entry) return;
    const current = draftsRef.current[id] ?? toFormProvider(
      id, entry.config, entry.enabled,
    );
    const { basicAuthPassword, ...nonSecretUpdates } = updates;
    const next = { ...current, ...nonSecretUpdates };
    draftsRef.current = { ...draftsRef.current, [id]: next };
    setDrafts(draftsRef.current);
    // A newly entered credential must land before an API-mode configuration.
    const keyFlushed = flushKey(id);
    if (!keyFlushed || basicAuthPassword !== undefined) {
      void enqueue(id, () => configureForm(next, basicAuthPassword));
    }
  }, [entries, enqueue, flushKey]);

  const onWriteKey = React_.useCallback((id: WebSearchProviderId, apiKey: string) => {
    clearTimeout(keyTimers.current.get(id));
    keyTimers.current.delete(id);
    pendingKeys.current.delete(id);
    // Empty draft never deletes a stored credential. Clearing is explicit.
    if (!apiKey.trim()) return;
    pendingKeys.current.set(id, apiKey);
    keyTimers.current.set(id, setTimeout(() => flushKey(id), KEY_WRITE_DEBOUNCE_MS));
  }, [flushKey]);

  const onValidate = React_.useCallback(async (id: WebSearchProviderId) => {
    // Validation must observe the just-entered key/mode/endpoint, not stale state.
    flushKey(id);
    await writes.current.get(id);
    return searchConfigClient.validate(id);
  }, [flushKey]);

  const onClearKey = React_.useCallback((id: WebSearchProviderId) => {
    clearTimeout(keyTimers.current.get(id));
    keyTimers.current.delete(id);
    pendingKeys.current.delete(id);
    void enqueue(id, () => searchConfigClient.setProviderKey(id, ''));
  }, [enqueue]);

  const selectedEntry = entries[selectedId];
  const selectedProvider = drafts[selectedId] ?? toFormProvider(
    selectedId, selectedEntry?.config ?? null,
    selectedEntry?.enabled ?? false,
  );
  const saveError = saveErrors[selectedId];

  return (
    <>
      <React.Suspense fallback={null}><MigrationPackDialogs /></React.Suspense>
      {saveError || error ? <p role="alert" className="text-sm text-destructive">{saveError ?? error}</p> : null}
      <div data-testid="byo-search-layout" className="flex gap-6 h-[calc(100vh-200px)] min-h-[400px]">
        <div data-testid="byo-search-sidebar"
          className="w-[220px] shrink-0 rounded-lg border border-border/50 bg-surface-1/50 wallpaper-blur p-3 overflow-y-auto">
          <SearchProviderSidebar providerIds={providerIds} selectedId={selectedId} onSelect={setSelectedId}
            isEnabled={(id) => drafts[id]?.enabled ?? (entries[id]?.config?.enabled === true)} />
        </div>
        <div data-testid="byo-search-content"
          className="flex-1 min-w-0 overflow-y-auto rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4 md:p-5">
          {selectedEntry ? (
            <ProviderPanel providerId={selectedId} provider={selectedProvider}
              configured={selectedProvider.authMode === 'api' && selectedEntry.config?.authMode !== 'api'
                ? selectedEntry.config?.hasApiKey === true : isConfigured(selectedId)}
              onUpdate={onUpdate} onWriteKey={onWriteKey} onClearKey={onClearKey} onValidate={onValidate} />
          ) : loading ? <span role="status" aria-busy="true">…</span> : null}
        </div>
      </div>
    </>
  );
}

export default SearchProviderSettings;
