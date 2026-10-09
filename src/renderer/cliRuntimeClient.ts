/**
 * cliRuntimeClient — typed renderer wrappers over the main-half `cliRt.*` relay
 * (P2e `byo-p2-subscription`).
 *
 * `host.services.cliRuntime` is MAIN-side; the renderer reaches it only through
 * `host.ipc.invoke` → the plugin's main relay. NO-CREDENTIAL-ON-RETURN:
 * `getAuthStatus` returns availability descriptors only (no token); install/launch
 * are host-run actions returning `{ ok, error? }`.
 *
 * @module byo-providers/renderer/cliRuntimeClient
 */
import type {
  HostCliAuthStatus,
  HostCliAuthStatusOptions,
  HostCliBackendInfo,
  HostCliLaunchTerminalInput,
  HostCliRuntimeResult,
} from '@byo/domain/plugin-types';

import { getHost } from './host/hostBridge';

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/** The Code CLI availability/install/launch client (no credential ever returned). */
export const cliRuntimeClient = {
  /** Per-backend availability/auth DESCRIPTORS (no token). `force` busts the cache. */
  getAuthStatus(options?: HostCliAuthStatusOptions): Promise<HostCliAuthStatus[]> {
    return invoke('cliRt.getAuthStatus', options ?? {});
  },
  /** Flip a backend's host-side enable toggle; status only. */
  setEnabled(backendId: string, enabled: boolean): Promise<HostCliRuntimeResult> {
    return invoke('cliRt.setEnabled', { backendId, enabled });
  },
  /** Install a CLI backend host-side; status only. */
  install(backendId: string): Promise<HostCliRuntimeResult> {
    return invoke('cliRt.install', { backendId });
  },
  /** Open a system terminal + start the CLI host-side; status only (no credential). */
  launchTerminal(input: HostCliLaunchTerminalInput): Promise<HostCliRuntimeResult> {
    return invoke('cliRt.launchTerminal', input);
  },
  /** List the registered CLI backends (display descriptors). */
  listBackends(): Promise<HostCliBackendInfo[]> {
    return invoke('cliRt.listBackends');
  },
  /** Version probe (omnicross parity): `{ backendId → { installed?, latest? } }`. */
  getVersions(): Promise<unknown> {
    return invoke('cliRt.getVersions');
  },
};

export type CliRuntimeClient = typeof cliRuntimeClient;
