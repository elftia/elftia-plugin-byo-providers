import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  HostSubscriptionModelInfo,
  HostSubscriptionModelsView,
} from '@byo/domain/plugin-types';

import {
  type HostSubscriptionModelsResult,
  isSubscriptionModelsUnsupported,
  subscriptionAuthClient,
} from '../subscriptionAuthClient';

export function useSubscriptionModels() {
  const [view, setView] = useState<HostSubscriptionModelsView | null>(null);
  const [supported, setSupported] = useState(false);
  const [toggleSupported, setToggleSupported] = useState(true);
  const mounted = useRef(true);
  const mutations = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
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
      mounted.current = false;
    };
  }, []);

  // Responses contain the whole catalog, so serialize writes across cards to
  // prevent an older response from undoing a newer provider's confirmed state.
  const mutate = useCallback((write: () => Promise<HostSubscriptionModelsResult>) => {
    const next = mutations.current.then(async () => {
      const result = await write();
      if (isSubscriptionModelsUnsupported(result)) {
        throw new Error('subscription-models-unsupported');
      }
      if (mounted.current) setView(result);
    });
    mutations.current = next.catch(() => {});
    return next;
  }, []);

  const setExtras = useCallback(
    (providerId: string, extras: HostSubscriptionModelInfo[]): Promise<void> =>
      mutate(() => subscriptionAuthClient.setSubscriptionExtraModels(providerId, extras)),
    [mutate],
  );

  const setEnabled = useCallback(
    (providerId: string, modelId: string, enabled: boolean): Promise<void> =>
      mutate(async () => {
        const result = await subscriptionAuthClient.setSubscriptionModelEnabled(providerId, modelId, enabled);
        if (isSubscriptionModelsUnsupported(result) && mounted.current) setToggleSupported(false);
        return result;
      }),
    [mutate],
  );

  return { supported, toggleSupported, view, setExtras, setEnabled };
}
