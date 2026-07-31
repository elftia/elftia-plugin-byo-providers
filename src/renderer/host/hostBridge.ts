/**
 * hostBridge — the package-internal holder for the injected `AgentUiHostApi`.
 *
 * The byo-providers renderer bundle loads over `plugin://` and CANNOT statically
 * import any host `@/...` module at runtime. The relocated LLM UI therefore reads
 * the host (React instance, UI primitives, scoped IPC, i18n) through THIS module
 * instead — `setHost(host)` is called once from `activate(host)`, and every
 * bridge/vendored module reads it via `getHost()`.
 *
 * This is the recovered Design Studio pattern (git `e0dbd83a^`
 * `packages/agent-design-studio/src/renderer/host/hostBridge.ts`), kept reusable
 * so the later media/search children mount on the same bridge.
 *
 * @module byo-providers/renderer/host/hostBridge
 */
import type { AgentUiHostApi } from '@byo/domain/plugin-types';

let injectedHost: AgentUiHostApi | null = null;

/** Install the loader-injected host (called once from `activate(host)`). */
export function setHost(host: AgentUiHostApi): void {
  injectedHost = host;
}

/** The injected host, or null before `activate` ran (boot-order safety). */
export function getHostOrNull(): AgentUiHostApi | null {
  return injectedHost;
}

/**
 * The injected host. Throws a clear error if read before `activate(host)` ran —
 * a programming error (a render path reached the host before registration).
 */
export function getHost(): AgentUiHostApi {
  if (!injectedHost) {
    throw new Error(
      '[byo-providers] host accessed before activate(host) ran — the plugin ' +
        'host is only available after the loader installs it.',
    );
  }
  return injectedHost;
}

/** Test/teardown reset (hot-toggle reentrancy). */
export function __resetHost(): void {
  injectedHost = null;
}
