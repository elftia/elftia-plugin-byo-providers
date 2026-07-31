/**
 * useCliAvailability — plugin-local CLI availability hook over the masked
 * `cliRuntimeClient` (`byo-p2-subscription`). Mirrors the host
 * `@/shared/hooks/code/useCliAvailability` surface (`{ statuses, loading, refresh }`)
 * so the relocated CLI runtime UI consumes it unchanged.
 *
 * NO-CREDENTIAL-ON-RETURN: `getAuthStatus` returns availability descriptors only.
 *
 * @module byo-providers/renderer/cli/useCliAvailability
 */
import { useCallback, useEffect, useState } from 'react';

import type { CliAuthStatus } from '@byo/domain/cli-types';

import { cliRuntimeClient } from '../cliRuntimeClient';

export function useCliAvailability() {
  const [statuses, setStatuses] = useState<CliAuthStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cliRuntimeClient.getAuthStatus({ force: true });
      setStatuses(result as unknown as CliAuthStatus[]);
    } catch (err) {
      console.error('[byo-providers] Failed to load CLI availability:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const result = await cliRuntimeClient.getAuthStatus();
        setStatuses(result as unknown as CliAuthStatus[]);
      } catch (err) {
        console.error('[byo-providers] Failed to load CLI availability:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { statuses, loading, refresh };
}
