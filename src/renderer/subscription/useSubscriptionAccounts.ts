/**
 * useSubscriptionAccounts — the plugin-local replacement for the host
 * `useAccountTokens` hook, over the MASKED `subscriptionAuthClient`
 * (`byo-p2-subscription`).
 *
 * Mirrors the host hook's surface 1:1 so the relocated `SubscriptionAccountsTab`
 * + config cards consume it UNCHANGED — EXCEPT the OAuth verifier-drop (the crux):
 *
 * ── VERIFIER NEVER CROSSES (the security crux, design D5) ──
 * `start*OAuth()` returns `{ authUrl, state }` from the masked port — the PKCE
 * `code_verifier` STAYS HOST-SIDE (retained keyed by `state`). The hook surfaces
 * the result as an `OAuthParams`-shaped value with `codeVerifier: ''` (the field
 * the cards' types expect is present but EMPTY — the plugin never holds the real
 * verifier). At exchange the hook IGNORES whatever `verifier` the card passes and
 * relays ONLY `{ authorizationCode, state, label? }` — the host looks the real
 * verifier up by `state`. So NO verifier/token crosses to the plugin.
 *
 * Account reads come from the masked `getSanitized()` descriptors (`has*Token`
 * booleans only). Manual-token + OpenCodeGo-key inputs cross INWARD only.
 *
 * @module byo-providers/renderer/subscription/useSubscriptionAccounts
 */
import { useCallback, useEffect, useState } from 'react';

import type {
  AccountTokensSanitized,
  OAuthParams,
  SubscriptionAccountSanitized,
  SubscriptionLevel,
  TokenExchangeResponse,
  TokenPlatform,
} from '@byo/domain/subscription';

import { getHost } from '../host/hostBridge';
import { subscriptionAuthClient } from '../subscriptionAuthClient';

const React = () => getHost().react.instance;
void React;

type AccountMutationResult = {
  success: boolean;
  error?: string;
};

interface AddOpenCodeGoAccountInput {
  apiKey: string;
  label?: string;
  baseUrl?: string;
  zenBaseUrl?: string;
}

/**
 * Surface a host op result as an `OAuthParams`-shaped value WITHOUT a real
 * verifier — the cards' types expect `codeVerifier: string`, so it is present but
 * EMPTY. The plugin never holds the PKCE secret.
 */
function toOAuthParams(init: { authUrl: string; state: string }): OAuthParams {
  return { authUrl: init.authUrl, state: init.state, codeVerifier: '' } as OAuthParams;
}

/** Throw on a `{ success: false }` op result so the card's try/catch surfaces it. */
function throwIfFailed(result: { success?: unknown; error?: unknown }): void {
  if (result?.success === false) {
    throw new Error(typeof result.error === 'string' && result.error ? result.error : 'Exchange failed');
  }
}

export function useSubscriptionAccounts() {
  const [config, setConfig] = useState<AccountTokensSanitized | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await subscriptionAuthClient.getSanitized();
      setConfig(data as unknown as AccountTokensSanitized);
    } catch (err) {
      console.error('[byo-providers] Failed to load subscription config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearConfig = useCallback(
    async (platform: TokenPlatform) => {
      await subscriptionAuthClient.clearConfig(platform);
      await refresh();
    },
    [refresh],
  );

  // ── Claude OAuth (verifier never crosses) ──────────────────────────────────
  const startClaudeOAuth = useCallback(
    async (): Promise<OAuthParams> => toOAuthParams(await subscriptionAuthClient.getClaudeAuthParams()),
    [],
  );
  const exchangeClaudeToken = useCallback(
    async (authorizationCode: string, state: string, label?: string): Promise<TokenExchangeResponse> => {
      // Relay ONLY code + state (+ label) — no verifier. The host looks the
      // retained PKCE verifier up by `state`.
      const result = await subscriptionAuthClient.exchangeClaudeToken({
        authorizationCode,
        state,
        ...(label !== undefined ? { label } : {}),
      });
      throwIfFailed(result);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );

  // ── Claude Setup Token ─────────────────────────────────────────────────────
  const startClaudeSetupToken = useCallback(
    async (): Promise<OAuthParams> =>
      toOAuthParams(await subscriptionAuthClient.getClaudeSetupAuthParams()),
    [],
  );
  const exchangeClaudeSetupToken = useCallback(
    async (authorizationCode: string, state: string, label?: string): Promise<TokenExchangeResponse> => {
      const result = await subscriptionAuthClient.exchangeClaudeSetupToken({
        authorizationCode,
        state,
        ...(label !== undefined ? { label } : {}),
      });
      throwIfFailed(result);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );

  // ── Claude Manual & Subscription (INWARD-only) ─────────────────────────────
  const setClaudeManualToken = useCallback(
    async (
      accessToken: string,
      subscriptionLevel?: SubscriptionLevel,
      label?: string,
    ): Promise<TokenExchangeResponse> => {
      const result = await subscriptionAuthClient.setClaudeManualToken(
        accessToken,
        subscriptionLevel as string | undefined,
        label,
      );
      throwIfFailed(result);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );
  const updateClaudeSubscriptionLevel = useCallback(
    async (level: SubscriptionLevel): Promise<TokenExchangeResponse> => {
      const result = await subscriptionAuthClient.updateClaudeSubscriptionLevel(level as string);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );

  // ── Multi-account (generic; per-provider wrappers) ─────────────────────────
  const mutate = useCallback(
    async (fn: () => Promise<{ success: boolean; error?: string }>): Promise<AccountMutationResult> => {
      const result = await fn();
      await refresh();
      return result as AccountMutationResult;
    },
    [refresh],
  );

  const listClaudeAccounts = useCallback(
    (): Promise<SubscriptionAccountSanitized[]> =>
      subscriptionAuthClient.listAccounts('claude') as unknown as Promise<SubscriptionAccountSanitized[]>,
    [],
  );
  const setActiveClaudeAccount = useCallback(
    (id: string) => mutate(() => subscriptionAuthClient.setActiveAccount('claude', id)),
    [mutate],
  );
  const removeClaudeAccount = useCallback(
    (id: string) => mutate(() => subscriptionAuthClient.removeAccount('claude', id)),
    [mutate],
  );
  const updateClaudeAccountLabel = useCallback(
    (id: string, label: string) =>
      mutate(() => subscriptionAuthClient.updateAccountLabel('claude', id, label)),
    [mutate],
  );

  // ── Codex OAuth & Manual ───────────────────────────────────────────────────
  const startCodexOAuth = useCallback(
    async (): Promise<OAuthParams> => toOAuthParams(await subscriptionAuthClient.getCodexAuthParams()),
    [],
  );
  const exchangeCodexToken = useCallback(
    async (authorizationCode: string, state: string, label?: string): Promise<TokenExchangeResponse> => {
      // Relay code + the REAL init `state` — the host looks the retained verifier
      // up by it (Codex does NOT round-trip state through the pasted code).
      const result = await subscriptionAuthClient.exchangeCodexToken({
        authorizationCode,
        state,
        ...(label !== undefined ? { label } : {}),
      });
      throwIfFailed(result);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );
  const setCodexManualToken = useCallback(
    async (accessToken: string, label?: string): Promise<TokenExchangeResponse> => {
      const result = await subscriptionAuthClient.setCodexManualToken(accessToken, label);
      throwIfFailed(result);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );
  const setActiveCodexAccount = useCallback(
    (id: string) => mutate(() => subscriptionAuthClient.setActiveAccount('codex', id)),
    [mutate],
  );
  const updateCodexAccountLabel = useCallback(
    (id: string, label: string) =>
      mutate(() => subscriptionAuthClient.updateAccountLabel('codex', id, label)),
    [mutate],
  );
  const removeCodexAccount = useCallback(
    (id: string) => mutate(() => subscriptionAuthClient.removeAccount('codex', id)),
    [mutate],
  );

  // ── OpenCodeGo multi-account (static-bearer key; inbound key consumed host-side) ─
  const addOpenCodeGoAccount = useCallback(
    (input: AddOpenCodeGoAccountInput) =>
      mutate(() => subscriptionAuthClient.addOpenCodeGoAccount(input as unknown as Record<string, unknown>)),
    [mutate],
  );
  const setActiveOpenCodeGoAccount = useCallback(
    (id: string) => mutate(() => subscriptionAuthClient.setActiveAccount('opencodego', id)),
    [mutate],
  );
  const updateOpenCodeGoAccountLabel = useCallback(
    (id: string, label: string) =>
      mutate(() => subscriptionAuthClient.updateAccountLabel('opencodego', id, label)),
    [mutate],
  );
  const removeOpenCodeGoAccount = useCallback(
    (id: string) => mutate(() => subscriptionAuthClient.removeAccount('opencodego', id)),
    [mutate],
  );

  // ── Gemini OAuth & Manual ──────────────────────────────────────────────────
  const startGeminiOAuth = useCallback(
    async (): Promise<OAuthParams> => toOAuthParams(await subscriptionAuthClient.getGeminiAuthParams()),
    [],
  );
  const exchangeGeminiToken = useCallback(
    async (authorizationCode: string, state: string): Promise<TokenExchangeResponse> => {
      // Relay code + the REAL init `state` (from `getGeminiAuthParams`) — the host
      // looks the retained PKCE verifier up by it. The verifier never crosses to
      // the plugin (no `takeMostRecent` fallback — the real state is threaded).
      const result = await subscriptionAuthClient.exchangeGeminiToken({
        authorizationCode,
        state,
      });
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );
  const setGeminiManualToken = useCallback(
    async (accessToken: string, refreshTokenValue?: string): Promise<TokenExchangeResponse> => {
      const result = await subscriptionAuthClient.setGeminiManualToken(accessToken, refreshTokenValue);
      await refresh();
      return result as unknown as TokenExchangeResponse;
    },
    [refresh],
  );

  // ── Token refresh ──────────────────────────────────────────────────────────
  const refreshToken = useCallback(
    async (platform: TokenPlatform): Promise<boolean> => {
      const success = await subscriptionAuthClient.refreshAccount(platform, '');
      if (success) await refresh();
      return success;
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    config,
    loading,
    error,
    refresh,
    clearConfig,
    startClaudeOAuth,
    exchangeClaudeToken,
    startClaudeSetupToken,
    exchangeClaudeSetupToken,
    setClaudeManualToken,
    updateClaudeSubscriptionLevel,
    listClaudeAccounts,
    setActiveClaudeAccount,
    removeClaudeAccount,
    updateClaudeAccountLabel,
    startCodexOAuth,
    exchangeCodexToken,
    setCodexManualToken,
    setActiveCodexAccount,
    updateCodexAccountLabel,
    removeCodexAccount,
    addOpenCodeGoAccount,
    setActiveOpenCodeGoAccount,
    updateOpenCodeGoAccountLabel,
    removeOpenCodeGoAccount,
    startGeminiOAuth,
    exchangeGeminiToken,
    setGeminiManualToken,
    refreshToken,
  };
}
