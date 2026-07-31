/**
 * agentConfigClient — typed renderer wrappers over the main-half `agentCfg.*`
 * relay (P2e `byo-p2-subscription`).
 *
 * `host.services.agentConfig` is MAIN-side; the renderer reaches it only through
 * `host.ipc.invoke` → the plugin's main relay. ONLY the 5 cli sub-settings cross
 * (`cliBackendId`/`cliTimeout`/`cliPtyMode`/`cliPtyCols`/`cliPtyRows`); the
 * general `agentBackend` engine field is NOT exposed (the port + adapter reject
 * it — engine selection stays host-owned).
 *
 * @module byo-providers/renderer/agentConfigClient
 */
import type { HostCliBackendConfig } from '@byo/domain/plugin-types';

import { getHost } from './host/hostBridge';

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/** The cli-sub-settings config client (NO general `agentBackend` field). */
export const agentConfigClient = {
  /** Read the current cli sub-settings (the 5 cli keys only). */
  getCliBackendConfig(): Promise<HostCliBackendConfig> {
    return invoke('agentCfg.getCliBackendConfig');
  },
  /** Patch one or more cli sub-settings; status only. */
  setCliBackendConfig(patch: HostCliBackendConfig): Promise<{ success: boolean; error?: string }> {
    return invoke('agentCfg.setCliBackendConfig', patch);
  },
};

export type AgentConfigClient = typeof agentConfigClient;
