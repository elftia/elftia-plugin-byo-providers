import { useCallback, useEffect, useRef, useState } from 'react';

import type { LLMProvider, ProviderTemplate } from '@byo/domain/llm';

import { useTranslation } from '../../host/vendored/useTranslation';
import { llmConfigClient } from '../../llmConfigClient';
import { cancelKeyViewing, onKeyViewingBlur } from '../../shared/keyViewingRequest';
import { emptyFormData } from '../constants';
import type { ProviderFormData } from '../types';
import { getProviderDisplayName } from '../utils';

/**
 * Manages provider form state, inline editing, and provider CRUD operations.
 */
export function useProviderForm(
  providers: LLMProvider[],
  selectedProviderId: string | null,
  setSelectedProviderId: (id: string | null) => void,
  selectedProvider: LLMProvider | null,
  refreshProviders: () => Promise<void>,
  updateProviderInCache: (p: LLMProvider) => void
) {
  const t = useTranslation();

  // ── Form state ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<ProviderFormData>(emptyFormData);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Inline edit state ───────────────────────────────────────────
  const [inlineName, setInlineName] = useState(() =>
    selectedProvider ? getProviderDisplayName(t, selectedProvider) : ''
  );
  const [inlineModelsEndpoint, setInlineModelsEndpoint] = useState(
    selectedProvider?.modelsEndpoint || ''
  );
  const [inlineApiKey, setInlineApiKey] = useState(selectedProvider?.api_key || '');
  const [inlineApiUrl, setInlineApiUrl] = useState(selectedProvider?.api_base_url || '');
  const [inlineMaxConcurrency, setInlineMaxConcurrency] = useState(
    selectedProvider?.maxConcurrency != null ? String(selectedProvider.maxConcurrency) : ''
  );

  // ── provider-key-reveal: DISPLAY-ONLY fetched key ────────────────
  // The explicit `revealProviderKey` verb (host-API v1.50) fetches the stored
  // key for the eye icon. The value NEVER enters `inlineApiKey` (blur
  // persistence + the leave-unchanged-on-empty guard stay untouched); it is
  // shown read-only and dropped on hide/edit/provider-switch.
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);
  /** Live selected-provider id for stale-reveal guards. */
  const selectedIdRef = useRef(selectedProviderId);
  selectedIdRef.current = selectedProviderId;
  // Invalidate pending reveals on hide/edit/switch, including A → B → A.
  const revealRequestRef = useRef(0);

  useEffect(() => {
    const hide = () => {
      revealRequestRef.current += 1;
      setShowApiKey(false);
      setRevealedApiKey(null);
    };
    const unsubscribe = onKeyViewingBlur(hide);
    return () => {
      unsubscribe();
      cancelKeyViewing();
    };
  }, [selectedProviderId]);
  useEffect(() => {
    if (revealedApiKey === null) return;
    const timer = setTimeout(() => {
      revealRequestRef.current += 1;
      setShowApiKey(false);
      setRevealedApiKey(null);
    }, 30_000);
    return () => clearTimeout(timer);
  }, [revealedApiKey]);

  const handleToggleShowApiKey = useCallback(
    (next: boolean | undefined) => {
      const shown = typeof next === 'boolean' ? next : !showApiKey;
      const request = ++revealRequestRef.current;
      setShowApiKey(shown);
      if (!shown) {
        setRevealedApiKey(null);
        return;
      }
      // The host is authoritative even if hasKey metadata is missing/stale.
      // Always use the protected read for an empty draft so first-time setup
      // is not silently skipped. `$ENV` refs and new drafts need no fetch.
      if (revealedApiKey === null && inlineApiKey.length === 0 && selectedProviderId) {
        const pid = selectedProviderId;
        llmConfigClient
          .revealProviderKey?.(pid)
          .then((r) => {
            // Stale-guard: a provider switch must drop the resolved value.
            if (selectedIdRef.current !== pid || revealRequestRef.current !== request) return;
            if (r.success && typeof r.value === 'string' && r.value.length > 0) {
              setRevealedApiKey(r.value);
            } else setShowApiKey(false);
          })
          .catch(() => {
            if (selectedIdRef.current === pid && revealRequestRef.current === request)
              setShowApiKey(false);
          });
      }
    },
    [showApiKey, revealedApiKey, inlineApiKey, selectedProviderId]
  );

  /** Clear the display-only reveal (called when the user starts editing). */
  const handleApiKeyInputChange = useCallback(
    (value: string) => {
      revealRequestRef.current += 1;
      setRevealedApiKey(null);
      setInlineApiKey(value);
    },
    [setInlineApiKey]
  );

  const updateProviderState = useCallback(
    (updated: LLMProvider) => {
      updateProviderInCache(updated);
    },
    [updateProviderInCache]
  );

  // ── Sync inline fields when selected provider changes ──
  const [prevSelectedId, setPrevSelectedId] = useState(selectedProvider?.id);
  if (prevSelectedId !== selectedProvider?.id) {
    setPrevSelectedId(selectedProvider?.id);
    revealRequestRef.current += 1;
    setShowApiKey(false);
    setRevealedApiKey(null);
    if (selectedProvider) {
      // The masked plugin port BLANKS `api_key` (it never returns a stored
      // plaintext key), so for a configured provider this resolves to '' — the
      // field starts EMPTY and the "已配置/configured" placeholder (driven by
      // `hasKey`) signals a stored key. The eye fetches the stored key through
      // the explicit reveal verb (v1.50); empty on blur = leave the stored key
      // unchanged (Option-A). A `$ENV` ref is preserved verbatim by the mask
      // (not a secret) and prefills.
      setInlineApiKey(selectedProvider.api_key || '');
      setInlineApiUrl(selectedProvider.api_base_url || '');
      setInlineName(getProviderDisplayName(t, selectedProvider));
      setInlineModelsEndpoint(selectedProvider.modelsEndpoint || '');
      setInlineMaxConcurrency(
        selectedProvider.maxConcurrency != null ? String(selectedProvider.maxConcurrency) : ''
      );
    } else {
      setInlineApiKey('');
      setInlineApiUrl('');
      setInlineName('');
      setInlineModelsEndpoint('');
      setInlineMaxConcurrency('');
    }
  }

  // ── Handlers ────────────────────────────────────────────────────
  const handleSelectProvider = (providerId: string) => {
    setSelectedProviderId(providerId);
    setIsEditing(false);
    setIsAddingNew(false);
    setFormError(null);
  };

  const handleAddProvider = () => {
    setFormData(emptyFormData);
    setIsAddingNew(true);
    setIsEditing(false);
    setSelectedProviderId(null);
    setShowApiKey(false);
    setFormError(null);
  };

  /**
   * Create a provider from a catalog preset through the host `addFromPreset`
   * port (template-picker path). Returns the host result so the caller can
   * react to success (close the picker, select the new row); `null` on a
   * transport failure.
   */
  const handleAddFromPreset = async (presetId: string) => {
    try {
      const result = await llmConfigClient.addFromPreset?.({ presetId, apiKey: '' });
      if (result?.provider) {
        setSelectedProviderId(result.provider.id);
        await refreshProviders();
        setFormData({
          name: result.provider.name,
          apiFormat: result.provider.apiFormat || 'openai',
          chatApiFormat: result.provider.chatApiFormat,
          apiType: result.provider.apiType,
          api_base_url: result.provider.api_base_url,
          // Key is never echoed back from main (provider-storage-secrets); the
          // user types it fresh if they want one.
          api_key: result.provider.api_key?.startsWith('$') ? result.provider.api_key : '',
          models: result.provider.models || [],
          modelConfigs: result.provider.modelConfigs,
          modelGroups: result.provider.modelGroups,
          modelsEndpoint: result.provider.modelsEndpoint,
          enabled: result.provider.enabled,
          icon: result.provider.icon,
          transformer: result.provider.transformer,
          apiVersion: result.provider.apiVersion,
          maxConcurrency: result.provider.maxConcurrency,
          codingPlan: result.provider.codingPlan,
          presetId: result.provider.presetId,
        });
        setIsEditing(true);
        setIsAddingNew(false);
        setShowApiKey(false);
        setFormError(null);
      }
      return result ?? null;
    } catch (error) {
      console.error('Error adding from preset:', error);
      return null;
    }
  };

  const handleUseTemplate = (template: ProviderTemplate) => {
    setFormData({
      name: template.name,
      apiFormat: template.apiFormat || 'openai',
      chatApiFormat: template.chatApiFormat || template.apiFormat || 'openai',
      apiType: template.apiType,
      api_base_url: template.api_base_url,
      api_key: '',
      models: [...template.models],
      modelConfigs: template.modelConfigs ? [...template.modelConfigs] : [],
      modelGroups: template.modelGroups ? [...template.modelGroups] : [],
      modelsEndpoint: template.modelsEndpoint,
      enabled: true,
      icon: template.icon,
      transformer: template.transformer,
      apiVersion: template.apiVersion,
      maxConcurrency: template.maxConcurrency,
    });
  };

  const handleEditProvider = () => {
    if (!selectedProvider) return;
    setFormData({
      name: selectedProvider.name,
      apiFormat: selectedProvider.apiFormat || 'openai',
      chatApiFormat: selectedProvider.chatApiFormat || selectedProvider.apiFormat || 'openai',
      apiType: selectedProvider.apiType || 'openai',
      api_base_url: selectedProvider.api_base_url || '',
      // The masked plugin port BLANKS `api_key`, so this resolves to '' for a
      // configured provider — the field starts EMPTY and the `hasKey`-driven
      // "已配置/configured" placeholder signals a stored key. Empty on save =
      // leave the stored key unchanged (Option-A). A `$ENV` ref prefills verbatim.
      api_key: selectedProvider.api_key || '',
      models: selectedProvider.models || [],
      modelConfigs: selectedProvider.modelConfigs || [],
      modelGroups: selectedProvider.modelGroups || [],
      modelsEndpoint: selectedProvider.modelsEndpoint || '',
      enabled: selectedProvider.enabled,
      icon: selectedProvider.icon,
      transformer: selectedProvider.transformer,
      apiVersion: selectedProvider.apiVersion,
      isOfficial: selectedProvider.isOfficial,
      maxConcurrency: selectedProvider.maxConcurrency,
    });
    setIsEditing(true);
    setIsAddingNew(false);
    setShowApiKey(false);
    setFormError(null);
  };

  const handleSaveProvider = async () => {
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError(t('providerSettings.errors.nameRequired'));
      return;
    }
    if (!formData.api_base_url.trim()) {
      setFormError(t('providerSettings.errors.urlRequired'));
      return;
    }
    // Validate URL format
    try {
      new URL(formData.api_base_url.trim());
    } catch {
      setFormError(t('providerSettings.errors.urlInvalid'));
      return;
    }

    try {
      if (isEditing && selectedProviderId) {
        // provider-storage-secrets leave-unchanged-on-empty: only send `api_key`
        // when the user actually typed a replacement; an empty field preserves
        // the stored (encrypted) key rather than wiping it.
        const keyEdited = formData.api_key.trim().length > 0;
        const result = await llmConfigClient.updateProvider({
          id: selectedProviderId,
          name: formData.name,
          apiFormat: formData.apiFormat,
          chatApiFormat: formData.chatApiFormat,
          apiType: formData.apiType,
          api_base_url: formData.api_base_url,
          ...(keyEdited ? { api_key: formData.api_key } : {}),
          models: formData.models,
          modelConfigs: formData.modelConfigs,
          modelGroups: formData.modelGroups,
          modelsEndpoint: formData.modelsEndpoint,
          enabled: formData.enabled,
          icon: formData.icon,
          transformer: formData.transformer,
          apiVersion: formData.apiVersion,
          isOfficial: formData.isOfficial,
          maxConcurrency: formData.maxConcurrency,
          codingPlan: formData.codingPlan,
          presetId: formData.presetId,
        });
        if (!result.success) {
          setFormError(result.message || t('providerSettings.errors.saveFailed'));
          return;
        }
      } else {
        const result = await llmConfigClient.addProvider({
          name: formData.name,
          apiFormat: formData.apiFormat,
          chatApiFormat: formData.chatApiFormat,
          apiType: formData.apiType,
          api_base_url: formData.api_base_url,
          api_key: formData.api_key,
          models: formData.models,
          modelConfigs: formData.modelConfigs,
          modelGroups: formData.modelGroups,
          modelsEndpoint: formData.modelsEndpoint,
          enabled: formData.enabled,
          icon: formData.icon,
          transformer: formData.transformer,
          apiVersion: formData.apiVersion,
          isOfficial: formData.isOfficial,
          maxConcurrency: formData.maxConcurrency,
          codingPlan: formData.codingPlan,
          presetId: formData.presetId,
        });
        if (result.provider) {
          setSelectedProviderId(result.provider.id);
        } else if (result.message) {
          setFormError(result.message);
          return;
        }
      }
      setIsEditing(false);
      setIsAddingNew(false);
      await refreshProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      setFormError(t('providerSettings.errors.saveFailed'));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsAddingNew(false);
    setFormError(null);
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  };

  const handleInlineUpdate = async (
    field: string,
    value: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!selectedProviderId || !selectedProvider) {
      return { success: false, message: t('providerSettings.errors.saveFailed') };
    }
    // provider-storage-secrets leave-unchanged-on-empty: an empty inline key
    // edit must NOT wipe the stored (encrypted) key — treat it as a no-op.
    if (field === 'api_key' && value.trim().length === 0) {
      return { success: false, message: t('providerSettings.errors.saveFailed') };
    }
    try {
      const parsedValue: unknown =
        field === 'maxConcurrency' ? (value ? parseInt(value, 10) || null : null) : value;
      const result = await llmConfigClient.updateProvider({
        id: selectedProviderId,
        [field]: parsedValue,
      });
      if (!result.success) {
        console.error('Failed to update provider:', result.message);
        return { success: false, message: result.message };
      }
      if (result.provider) {
        updateProviderState(result.provider);
      } else if (field === 'api_key') {
        // Never copy the plaintext replacement back into the renderer cache.
        updateProviderState({ ...selectedProvider, api_key: '', hasKey: true });
      } else {
        updateProviderState({ ...selectedProvider, [field]: parsedValue } as LLMProvider);
      }
      if (field === 'api_key') setInlineApiKey('');
      await refreshProviders();
      return { success: true };
    } catch (error) {
      console.error('Error updating provider:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : t('providerSettings.errors.saveFailed'),
      };
    }
  };

  /**
   * Switch the selected API mode for the currently-selected provider.
   *
   * If the user has customized `api_base_url` or `api_key` away from any
   * mode's default, ask for confirmation before overwriting. The actual
   * confirm dialog is owned by ProviderDetails — this hook only computes
   * whether a confirmation is needed and exposes a "force" path.
   *
   * Returns `true` when the switch was applied, `false` when blocked
   * pending confirmation.
   */
  const handleSelectApiMode = async (modeId: string, opts?: { keepCustomizations?: boolean }) => {
    if (!selectedProviderId || !selectedProvider) return false;
    const modes = selectedProvider.apiModes;
    if (!modes || modes.length === 0) return false;
    const next = modes.find((m) => m.id === modeId);
    if (!next) return false;

    const updates: Record<string, unknown> = { selectedApiModeId: modeId };
    if (!opts?.keepCustomizations) {
      // Default behavior: overwrite URL/key with mode defaults so runtime
      // and UI stay in sync. The caller can pass `keepCustomizations: true`
      // to switch the mode id without touching the URL/key fields.
      updates.api_base_url = next.baseUrl;
      if (next.apiKey) updates.api_key = next.apiKey;
    }
    try {
      const result = await llmConfigClient.updateProvider({ id: selectedProviderId, ...updates });
      if (!result.success) {
        console.error('Failed to switch api mode:', result.message);
        return false;
      }
      // Sync inline edit state to the values we just wrote. Without this:
      //   1. The Input field keeps showing the previous mode's URL/key
      //      because inline-state resync only fires on `provider.id` change.
      //   2. When the user later blurs the URL input, the stale inlineApiUrl
      //      gets written back to DB via onInlineUpdate (because it differs
      //      from the new selectedProvider.api_base_url) — silently undoing
      //      the mode switch and corrupting the mode↔URL pairing, which then
      //      triggers a false-positive "you customized URL" dialog on the
      //      next switch click.
      if (!opts?.keepCustomizations) {
        setInlineApiUrl(next.baseUrl);
        if (next.apiKey) setInlineApiKey(next.apiKey);
      }
      // Update the in-memory provider cache so the Switch and dependent UI
      // reflect the new mode immediately, without waiting for refreshProviders.
      updateProviderState({
        ...selectedProvider,
        selectedApiModeId: modeId,
        ...(opts?.keepCustomizations
          ? {}
          : {
              api_base_url: next.baseUrl,
              ...(next.apiKey ? { api_key: next.apiKey } : {}),
            }),
      } as LLMProvider);
      await refreshProviders();
      return true;
    } catch (error) {
      console.error('Error switching api mode:', error);
      return false;
    }
  };

  const handleReorderProviders = async (orderedIds: string[]) => {
    try {
      const result = await llmConfigClient.reorderProviders?.(orderedIds);
      if (result && !result.success) {
        console.error('Failed to reorder providers:', result.message);
      }
      await refreshProviders();
    } catch (error) {
      console.error('Error reordering providers:', error);
    }
  };

  const handleToggleProvider = async (enabled: boolean) => {
    if (!selectedProviderId) return;
    try {
      await llmConfigClient.toggleProvider(selectedProviderId, enabled);
      await refreshProviders();
    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  };

  const handleToggleOfficial = async (isOfficial: boolean) => {
    if (!selectedProviderId || !selectedProvider) return;
    try {
      const result = await llmConfigClient.updateProvider({
        id: selectedProviderId,
        isOfficial,
      });
      if (!result.success) {
        console.error('Failed to update isOfficial:', result.message);
        return;
      }
      updateProviderState({ ...selectedProvider, isOfficial } as LLMProvider);
      await refreshProviders();
    } catch (error) {
      console.error('Error toggling isOfficial:', error);
    }
  };

  /**
   * Reset a provider to catalog defaults (provider-storage-overlay): clears the
   * row's `userOverrides` so previously-overridden fields track the live catalog
   * again. Preserves the stored key + sessions. Re-reads through the effective
   * path via `refreshProviders()`.
   */
  const handleResetProvider = async (id?: string) => {
    const targetId = id ?? selectedProviderId;
    if (!targetId) return;
    try {
      const result = await llmConfigClient.resetProvider?.(targetId);
      if (result && !result.success) {
        console.error('Failed to reset provider:', result.message);
        return;
      }
      await refreshProviders();
    } catch (error) {
      console.error('Error resetting provider:', error);
    }
  };

  const handleDeleteProvider = async () => {
    if (!selectedProviderId || !selectedProvider) return;
    if (selectedProvider.isSystem) {
      console.warn('Cannot delete system provider');
      return;
    }
    try {
      const result = await llmConfigClient.deleteProvider(selectedProviderId);
      if (result.success) {
        setSelectedProviderId(null);
        await refreshProviders();
      } else {
        console.error('Failed to delete provider:', result.message);
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  return {
    isEditing,
    isAddingNew,
    formData,
    setFormData,
    formError,
    showApiKey,
    setShowApiKey,
    // provider-key-reveal: prefer the toggle handler (fetch + display-only
    // override); `setShowApiKey` stays exported for the legacy direct setters.
    handleToggleShowApiKey,
    revealedApiKey,
    handleApiKeyInputChange,
    inlineName,
    setInlineName,
    inlineModelsEndpoint,
    setInlineModelsEndpoint,
    inlineApiKey,
    setInlineApiKey,
    inlineApiUrl,
    setInlineApiUrl,
    inlineMaxConcurrency,
    setInlineMaxConcurrency,
    handleSelectProvider,
    handleAddProvider,
    handleAddFromPreset,
    handleUseTemplate,
    handleEditProvider,
    handleSaveProvider,
    handleCancelEdit,
    handleInlineUpdate,
    handleReorderProviders,
    handleSelectApiMode,
    handleToggleProvider,
    handleToggleOfficial,
    handleDeleteProvider,
    handleResetProvider,
  };
}
