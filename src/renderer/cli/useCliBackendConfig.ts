/**
 * useCliBackendConfig — plugin-local cli sub-settings hook over the masked
 * `agentConfigClient` (`byo-p2-subscription`). Reads/writes ONLY the 5 cli keys
 * (`cliBackendId`/`cliTimeout`/`cliPtyMode`/`cliPtyCols`/`cliPtyRows`); the general
 * `agentBackend` engine field is host-owned and NOT touched here.
 *
 * @module byo-providers/renderer/cli/useCliBackendConfig
 */
import type { HostCliBackendConfig, HostCliBackendId } from '@byo/domain/plugin-types';
import { useCallback, useEffect, useState } from 'react';

import { agentConfigClient } from '../agentConfigClient';

export function useCliBackendConfig() {
  const [cliBackendId, setCliBackendId] = useState<HostCliBackendId>('claude-code');
  const [cliTimeout, setCliTimeout] = useState(300);
  const [cliPtyMode, setCliPtyMode] = useState(false);
  const [cliPtyCols, setCliPtyCols] = useState(120);
  const [cliPtyRows, setCliPtyRows] = useState(40);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const cfg = await agentConfigClient.getCliBackendConfig();
      if (cfg.cliBackendId) setCliBackendId(cfg.cliBackendId);
      if (cfg.cliTimeout) setCliTimeout(cfg.cliTimeout);
      if (cfg.cliPtyMode != null) setCliPtyMode(cfg.cliPtyMode);
      if (cfg.cliPtyCols) setCliPtyCols(cfg.cliPtyCols);
      if (cfg.cliPtyRows) setCliPtyRows(cfg.cliPtyRows);
    } catch (err) {
      console.error('[byo-providers] Failed to load cli sub-settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Patch one or more cli sub-settings (optimistic local + persist host-side). */
  const update = useCallback(
    async (patch: HostCliBackendConfig) => {
      if (patch.cliBackendId !== undefined) setCliBackendId(patch.cliBackendId);
      if (patch.cliTimeout !== undefined) setCliTimeout(patch.cliTimeout);
      if (patch.cliPtyMode !== undefined) setCliPtyMode(patch.cliPtyMode);
      if (patch.cliPtyCols !== undefined) setCliPtyCols(patch.cliPtyCols);
      if (patch.cliPtyRows !== undefined) setCliPtyRows(patch.cliPtyRows);
      try {
        await agentConfigClient.setCliBackendConfig(patch);
      } catch (err) {
        console.error('[byo-providers] Failed to persist cli sub-settings:', err);
        await load();
      }
    },
    [load],
  );

  return {
    cliBackendId,
    cliTimeout,
    cliPtyMode,
    cliPtyCols,
    cliPtyRows,
    loading,
    update,
  };
}
