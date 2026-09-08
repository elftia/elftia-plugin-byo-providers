/**
 * subscriptionAuthClient — typed renderer wrappers over the main-half `subAuth.*`
 * relay (P2e `byo-p2-subscription`).
 *
 * `host.services.subscriptionAuth` is MAIN-side; the renderer reaches it only
 * through `host.ipc.invoke` → the plugin's main relay.
 *
 * ── TOKEN-NEVER-CROSSES (the crux) ──
 * OAuth init returns ONLY `{ authUrl, state }` — the PKCE `code_verifier` STAYS
 * host-side (retained keyed by `state`); the plugin NEVER holds or relays it. At
 * exchange time the plugin relays back ONLY `{ authorizationCode, state, label? }`
 * (NO `codeVerifier` — the masked port forbids it). Reads return sanitized
 * `has*Token` descriptors; exchange/refresh/mutate + manual-token verbs return
 * status only. Manual-token + OpenCodeGo-key inputs cross INWARD only.
 *
 * @module byo-providers/renderer/subscriptionAuthClient
 */
import type {
  HostAccountTokensSanitized,
  HostDeviceFlowView,
  HostKimiDeviceFlowView,
  HostOAuthExchangeRequest,
  HostOAuthInitParams,
  HostSubscriptionAccountSanitized,
  HostSubscriptionEntry,
  HostSubscriptionOpResult,
  HostAccountAllowanceSnapshot,
  HostSubscriptionRefreshResult,
  HostSubscriptionModelInfo,
  HostSubscriptionModelsView,
} from '@byo/domain/plugin-types';

import { getHost } from './host/hostBridge';

function invoke<T>(method: string, payload?: unknown): Promise<T> {
  return getHost().ipc.invoke<T>(method, payload);
}

/**
 * The main relay's older-host degradation for the v1.70 model verbs (the host
 * port lacks both verbs): an EXPLICIT marker, never a fabricated empty view —
 * the renderer hides the model sections on it.
 */
export interface HostSubscriptionModelsUnsupported {
  readonly error: 'unsupported';
}

/** A v1.70 model-verb result: the real view, or the older-host marker. */
export type HostSubscriptionModelsResult =
  | HostSubscriptionModelsView
  | HostSubscriptionModelsUnsupported;

/** Narrow a v1.70 relay result: `true` = older host, the section must hide. */
export function isSubscriptionModelsUnsupported(
  result: HostSubscriptionModelsResult,
): result is HostSubscriptionModelsUnsupported {
  return (
    typeof result === 'object' &&
    result !== null &&
    (result as HostSubscriptionModelsUnsupported).error === 'unsupported'
  );
}

/**
 * The masked-port subscription-auth client. Every verb is a thin typed `invoke`
 * over the main relay; NO return carries a token / verifier / api key.
 */
export const subscriptionAuthClient = {
  // ── OAuth init (returns ONLY `{ authUrl, state }` — no verifier) ─────────────
  getClaudeAuthParams(): Promise<HostOAuthInitParams> {
    return invoke('subAuth.getClaudeAuthParams');
  },
  getClaudeSetupAuthParams(): Promise<HostOAuthInitParams> {
    return invoke('subAuth.getClaudeSetupAuthParams');
  },
  getCodexAuthParams(): Promise<HostOAuthInitParams> {
    return invoke('subAuth.getCodexAuthParams');
  },
  getGeminiAuthParams(): Promise<HostOAuthInitParams> {
    return invoke('subAuth.getGeminiAuthParams');
  },
  // ── OAuth exchange (payload has NO codeVerifier — host looks it up by state) ──
  exchangeClaudeToken(request: HostOAuthExchangeRequest): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.exchangeClaudeToken', request);
  },
  exchangeClaudeSetupToken(request: HostOAuthExchangeRequest): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.exchangeClaudeSetupToken', request);
  },
  exchangeCodexToken(request: HostOAuthExchangeRequest): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.exchangeCodexToken', request);
  },
  exchangeGeminiToken(request: HostOAuthExchangeRequest): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.exchangeGeminiToken', request);
  },
  // ── Kimi device flow (v1.63; display-only views, never deviceCode/tokens) ────
  startKimiDeviceFlow(): Promise<HostKimiDeviceFlowView> {
    return invoke('subAuth.startKimiDeviceFlow');
  },
  pollKimiDeviceFlow(sessionId: string): Promise<HostKimiDeviceFlowView> {
    return invoke('subAuth.pollKimiDeviceFlow', { sessionId });
  },
  cancelKimiDeviceFlow(sessionId: string): Promise<void> {
    return invoke('subAuth.cancelKimiDeviceFlow', { sessionId });
  },
  // ── Grok / Copilot device flows (v1.65; same token-free boundary) ───────────
  startGrokDeviceFlow(): Promise<HostDeviceFlowView> {
    return invoke('subAuth.startGrokDeviceFlow');
  },
  pollGrokDeviceFlow(sessionId: string): Promise<HostDeviceFlowView> {
    return invoke('subAuth.pollGrokDeviceFlow', { sessionId });
  },
  cancelGrokDeviceFlow(sessionId: string): Promise<void> {
    return invoke('subAuth.cancelGrokDeviceFlow', { sessionId });
  },
  startCopilotDeviceFlow(enterpriseUrl?: string): Promise<HostDeviceFlowView> {
    return invoke('subAuth.startCopilotDeviceFlow', { enterpriseUrl });
  },
  pollCopilotDeviceFlow(sessionId: string): Promise<HostDeviceFlowView> {
    return invoke('subAuth.pollCopilotDeviceFlow', { sessionId });
  },
  cancelCopilotDeviceFlow(sessionId: string): Promise<void> {
    return invoke('subAuth.cancelCopilotDeviceFlow', { sessionId });
  },
  // ── Codex loopback sign-in (v1.67; auto-complete, never a token) ────────────
  startCodexLoopbackLogin(): Promise<
    | { ok: true; authUrl: string; sessionId: string }
    | { ok: false; error: string }
  > {
    return invoke('subAuth.startCodexLoopbackLogin');
  },
  pollCodexLoopbackLogin(sessionId: string): Promise<{
    sessionId: string;
    state: 'pending' | 'done' | 'error';
    error?: string;
  }> {
    return invoke('subAuth.pollCodexLoopbackLogin', { sessionId });
  },
  cancelCodexLoopbackLogin(sessionId: string): Promise<void> {
    return invoke('subAuth.cancelCodexLoopbackLogin', { sessionId });
  },
  // ── Account management (descriptors only) ────────────────────────────────────
  getSanitized(): Promise<HostAccountTokensSanitized> {
    return invoke('subAuth.getSanitized');
  },
  listAccounts(provider: string): Promise<HostSubscriptionAccountSanitized[]> {
    return invoke('subAuth.listAccounts', { provider });
  },
  setActiveAccount(provider: string, id: string): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.setActiveAccount', { provider, id });
  },
  removeAccount(provider: string, id: string): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.removeAccount', { provider, id });
  },
  updateAccountLabel(provider: string, id: string, label: string): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.updateAccountLabel', { provider, id, label });
  },
  refreshAccount(provider: string, id: string): Promise<boolean> {
    return invoke('subAuth.refreshAccount', { provider, id });
  },
  getAccountAllowance(
    provider: string,
    id: string,
    force?: boolean,
  ): Promise<HostAccountAllowanceSnapshot> {
    return invoke('subAuth.getAccountAllowance', { provider, id, force });
  },
  // ── Subscription models (v1.70; defaults + user extras; feature-detected) ───
  getSubscriptionModels(): Promise<HostSubscriptionModelsResult> {
    return invoke('subAuth.getSubscriptionModels');
  },
  setSubscriptionExtraModels(
    providerId: string,
    models: HostSubscriptionModelInfo[],
  ): Promise<HostSubscriptionModelsResult> {
    return invoke('subAuth.setSubscriptionExtraModels', { providerId, models });
  },
  setSubscriptionModelEnabled(
    providerId: string,
    modelId: string,
    enabled: boolean,
  ): Promise<HostSubscriptionModelsResult> {
    return invoke('subAuth.setSubscriptionModelEnabled', { providerId, modelId, enabled });
  },
  clearConfig(platform: string): Promise<{ success: boolean }> {
    return invoke('subAuth.clearConfig', { platform });
  },
  // ── Subscription / OpenCodeGo (inbound key consumed host-side) ───────────────
  listSubscriptions(): Promise<HostSubscriptionEntry[]> {
    return invoke('subAuth.listSubscriptions');
  },
  subscriptionStatus(providerId: string): Promise<HostSubscriptionEntry> {
    return invoke('subAuth.subscriptionStatus', { providerId });
  },
  setOpenCodeGoConfig(request: Record<string, unknown>): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.setOpenCodeGoConfig', { request });
  },
  addOpenCodeGoAccount(request: Record<string, unknown>): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.addOpenCodeGoAccount', { request });
  },
  clearOpenCodeGo(): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.clearOpenCodeGo');
  },
  refreshCredential(providerId: string): Promise<HostSubscriptionRefreshResult> {
    return invoke('subAuth.refreshCredential', { providerId });
  },
  // ── Manual-token paste (INWARD-only; status-only return). v1.72 adds the
  // OPTIONAL verify option (probe-before-persist; a refusal returns the
  // secret-free `verifyFailure` and persists nothing) + the support probe so
  // the renderer only offers verification on hosts that honor it.
  manualTokenVerifySupported(): Promise<boolean> {
    return invoke('subAuth.manualTokenVerifySupported').then(
      (result) => (result as { supported?: boolean } | null)?.supported === true,
    );
  },
  setClaudeManualToken(
    accessToken: string,
    subscriptionLevel?: string,
    label?: string,
    options?: { verify?: boolean },
  ): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.setClaudeManualToken', {
      accessToken,
      subscriptionLevel,
      label,
      verify: options?.verify,
    });
  },
  setCodexManualToken(
    accessToken: string,
    label?: string,
    options?: { verify?: boolean },
  ): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.setCodexManualToken', {
      accessToken,
      label,
      verify: options?.verify,
    });
  },
  setGeminiManualToken(
    accessToken: string,
    refreshToken?: string,
    options?: { verify?: boolean },
  ): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.setGeminiManualToken', {
      accessToken,
      refreshToken,
      verify: options?.verify,
    });
  },
  updateClaudeSubscriptionLevel(level: string): Promise<HostSubscriptionOpResult> {
    return invoke('subAuth.updateClaudeSubscriptionLevel', { level });
  },
};

export type SubscriptionAuthClient = typeof subscriptionAuthClient;
