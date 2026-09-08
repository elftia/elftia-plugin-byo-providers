/**
 * externalLinksClient — typed renderer wrapper over the main-half
 * `nativeOps.openExternal` relay (host-API v1.66).
 *
 * WHY THIS EXISTS: the plugin renderer frame is sandboxed
 * (`sandbox="allow-scripts"`, opaque origin) — `window.open` inside it is a
 * GUARANTEED silent no-op (no `allow-popups`). Every "open in browser"
 * affordance (OAuth authorization pages, device-flow verification pages,
 * provider website links) must ride the HOST's `shell.openExternal` through
 * this client instead. Callers should render the URL as selectable text
 * alongside the button so the flow stays usable when the port is absent
 * (older host) or rejects the URL.
 *
 * @module byo-providers/renderer/externalLinksClient
 */
import { getHost } from './host/hostBridge';

/** The result of an external-open attempt (`ok:false` ⇒ surface the raw URL). */
export interface OpenExternalResult {
  ok: boolean;
  error?: string;
}

export async function openExternal(url: string): Promise<OpenExternalResult> {
  try {
    return await getHost().ipc.invoke<OpenExternalResult>('nativeOps.openExternal', { url });
  } catch {
    return { ok: false, error: 'relay-failed' };
  }
}
