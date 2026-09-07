/**
 * useSubscriptionModels — the per-tab subscription model view (host-API v1.70).
 *
 * Fetches `getSubscriptionModels()` ONCE when the tab mounts and keeps the
 * whole provider-keyed view as tab state (each card reads its own slice).
 * `setExtras(providerId, models)` replaces the view only after the host
 * confirms persistence, so failed writes leave the displayed list unchanged.
 *
 * Feature-detect (the `getAccountAllowance` precedent): on an older host the
 * relay resolves the explicit `{ error: 'unsupported' }` marker — `supported`
 * stays `false` and the tab renders NO model sections at all. An older host
 * must never be drawn as "provider has zero models".
 *
 * @module byo-providers/renderer/subscription/useSubscriptionModels
 */
import { useCallback, useEffect, useState } from 'react';

import type {
  HostSubscriptionModelInfo,
  HostSubscriptionModelsView,
} from '@byo/domain/plugin-types';

import {
  isSubscriptionModelsUnsupported,
  subscriptionAuthClient,
} from '../subscriptionAuthClient';

export function useSubscriptionModels() {
  const [view, setView] = useState<HostSubscriptionModelsView | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await subscriptionAuthClient.getSubscriptionModels();
        if (cancelled || isSubscriptionModelsUnsupported(result)) return;
        setView(result);
        setSupported(true);
      } catch (err) {
        console.error('[byo-providers] Failed to load subscription models:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setExtras = useCallback(
    async (providerId: string, extras: HostSubscriptionModelInfo[]): Promise<void> => {
      const result = await subscriptionAuthClient.setSubscriptionExtraModels(providerId, extras);
      if (isSubscriptionModelsUnsupported(result)) {
        throw new Error('subscription-models-unsupported');
      }
      setView(result);
    },
    [],
  );

  return { supported, view, setExtras };
}
