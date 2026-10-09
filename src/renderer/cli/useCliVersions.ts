/**
 * useCliVersions — the Code CLI version probe hook (omnicross CliCard parity).
 *
 * Fetches `{ backendId → { installed?, latest? } }` once per mount via the
 * masked `cliRuntimeClient.getVersions` relay (host runs `<bin> --version` +
 * `npm view <pkg> version`); `refresh` re-probes (the section refresh button
 * calls it so a completed install/upgrade immediately shows its new version).
 *
 * @module byo-providers/renderer/cli/useCliVersions
 */
import { useCallback, useEffect, useState } from 'react';

import { cliRuntimeClient } from '../cliRuntimeClient';

export interface CliVersionStatus {
  readonly installed?: string;
  readonly latest?: string;
}

export function useCliVersions(): {
  versions: Record<string, CliVersionStatus>;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [versions, setVersions] = useState<Record<string, CliVersionStatus>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // The port returns `[{ backendId, installed?, latest? }]`; the hook
      // re-keys it per backendId (codex/codex-cli alias handled at read).
      // A port failure (older host without the relay) leaves versions empty —
      // the section degrades to its pre-probe rendering, never blocks.
      const rows = (await cliRuntimeClient.getVersions()) as Array<
        CliVersionStatus & { backendId: string }
      >;
      const map: Record<string, CliVersionStatus> = {};
      for (const row of rows ?? []) map[row.backendId] = row;
      setVersions(map);
    } catch {
      setVersions({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { versions, loading, refresh };
}
