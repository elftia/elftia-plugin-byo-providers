import { useMemo, useState } from 'react';

import { useLlmProviders } from '../../useLlmProviders';

import { useCatalogBrowser } from './useCatalogBrowser';
import { useModelManagement } from './useModelManagement';
import { useProviderForm } from './useProviderForm';

/**
 * Composition hook that assembles provider form, model management, and catalog browser.
 */
export function useProviderSettings(category: 'chat' | 'decision' = 'chat') {
  const {
    providers: allProviders,
    loading: providersLoading,
    error: providersError,
    refresh: refreshProviders,
    updateProvider: updateProviderInCache,
  } = useLlmProviders();

  const providers = useMemo(
    () => allProviders.filter(provider =>
      category === 'decision' ? provider.category === 'other' : provider.category !== 'other',
    ),
    [allProviders, category],
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Auto-select first provider when none is explicitly selected
  const effectiveSelectedProviderId = providers.some(provider => provider.id === selectedProviderId)
    ? selectedProviderId
    : providers[0]?.id ?? null;

  const selectedProvider = useMemo(() => {
    return providers.find(p => p.id === effectiveSelectedProviderId) || null;
  }, [providers, effectiveSelectedProviderId]);

  // Secret re-entry signal (provider-storage-overlay): enabled providers that
  // report no stored key (`hasKey === false`) — e.g. after a machine/profile
  // change where the machine-local secrets did not travel. A `$VAR` env ref is
  // NOT a missing key (it round-trips as a non-empty api_key + hasKey true).
  const missingKeyProviderIds = useMemo(
    () => providers.filter(p => p.enabled && p.hasKey === false).map(p => p.id),
    [providers],
  );

  // ── Sub-hooks ───────────────────────────────────────────────────
  const form = useProviderForm(
    providers, effectiveSelectedProviderId, setSelectedProviderId,
    selectedProvider, refreshProviders, updateProviderInCache,
  );

  const models = useModelManagement(selectedProvider, updateProviderInCache);

  const catalog = useCatalogBrowser(
    selectedProvider, models.discoveryModels, models.showManageModels,
  );

  return {
    allProviders,
    refreshProviders,
    providers,
    providersLoading,
    providersError,
    searchTerm,
    setSearchTerm,
    selectedProviderId: effectiveSelectedProviderId,
    selectedProvider,
    missingKeyProviderIds,
    missingKeyCount: missingKeyProviderIds.length,
    ...form,
    ...models,
    ...catalog,
  };
}
