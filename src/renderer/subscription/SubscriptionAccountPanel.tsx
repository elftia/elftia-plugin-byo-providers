/**
 * SubscriptionAccountPanel — the account half of the model-services right
 * panel: ONE provider's config card (OAuth / manual-token / device-flow entry +
 * account list), wired from the SAME `useSubscriptionAccounts` bag the unified
 * sidebar reads, so a completed login lands in the sidebar without a manual
 * refresh (both render from one hook instance held by `ModelServicesPage`).
 *
 * The card + its props are lifted verbatim from the former
 * `SubscriptionAccountsTab` full-list rendering — masked-port data behavior
 * unchanged (verifier stays host-side; only code + state cross).
 */
import type { TranslateFn } from '../host/vendored/useTranslation';

import type { TokenPlatform } from '@byo/domain/subscription';

import { ClaudeConfigCard } from './ClaudeConfigCard';
import { CodexConfigCard } from './CodexConfigCard';
import { CopilotConfigCard } from './CopilotConfigCard';
import { GeminiConfigCard } from './GeminiConfigCard';
import { GrokConfigCard } from './GrokConfigCard';
import { KimiConfigCard } from './KimiConfigCard';
import { OpenCodeGoConfigCard } from './OpenCodeGoConfigCard';
import { SubscriptionModelList } from './SubscriptionModelList';
import type { useSubscriptionAccounts } from './useSubscriptionAccounts';
import { useSubscriptionModels } from './useSubscriptionModels';

export type SubscriptionAccountsBag = ReturnType<typeof useSubscriptionAccounts>;

export interface SubscriptionAccountPanelProps {
  t: TranslateFn;
  platform: TokenPlatform;
  accounts: SubscriptionAccountsBag;
}

export function SubscriptionAccountPanel({ t, platform, accounts }: SubscriptionAccountPanelProps) {
  const {
    config,
    clearConfig,
    startClaudeOAuth,
    exchangeClaudeToken,
    startClaudeSetupToken,
    exchangeClaudeSetupToken,
    setClaudeManualToken,
    updateClaudeSubscriptionLevel,
    setActiveClaudeAccount,
    updateClaudeAccountLabel,
    removeClaudeAccount,
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
    startKimiLogin,
    pollKimiFlow,
    cancelKimiFlow,
    setActiveKimiAccount,
    removeKimiAccount,
    updateKimiAccountLabel,
    startGrokLogin,
    pollGrokFlow,
    cancelGrokFlow,
    setActiveGrokAccount,
    removeGrokAccount,
    updateGrokAccountLabel,
    startCopilotLogin,
    pollCopilotFlow,
    cancelCopilotFlow,
    setActiveCopilotAccount,
    removeCopilotAccount,
    updateCopilotAccountLabel,
    startCodexLoopbackLogin,
    pollCodexLoopbackFlow,
    cancelCodexLoopbackFlow,
    refreshToken,
  } = accounts;

  // v1.70 subscription model view — fetched ONCE per panel mount; on an older
  // host `supported` stays false and the card's model section stays hidden.
  const {
    supported: modelsSupported,
    view: modelsView,
    setExtras: setModelExtras,
    setEnabled: setModelEnabled,
    toggleSupported,
  } = useSubscriptionModels();

  /** The card's model section (mounted through the card's children slot). */
  const modelSection =
    modelsSupported ? (
      <SubscriptionModelList
        t={t}
        providerId={platform}
        models={modelsView?.[platform]}
        onSetExtras={setModelExtras}
        onSetEnabled={setModelEnabled}
        toggleSupported={toggleSupported}
      />
    ) : undefined;

  switch (platform) {
    case 'claude':
      return (
        <ClaudeConfigCard
          t={t}
          config={config?.claude}
          accounts={config?.claudeAccounts}
          onSetActiveAccount={(id) => setActiveClaudeAccount(id)}
          onUpdateAccountLabel={(id, label) => updateClaudeAccountLabel(id, label)}
          onRemoveAccount={(id) => removeClaudeAccount(id)}
          onStartOAuth={startClaudeOAuth}
          onExchangeOAuthToken={async (code, state, label) => {
            // Relay ONLY code + state (+ label). The host looks the retained PKCE
            // verifier up by `state` — the verifier never crosses to the plugin.
            await exchangeClaudeToken(code, state, label);
          }}
          onStartSetupToken={startClaudeSetupToken}
          onExchangeSetupToken={async (code, state, label) => {
            await exchangeClaudeSetupToken(code, state, label);
          }}
          onSetManualToken={async (accessToken, subscriptionLevel, label) => {
            await setClaudeManualToken(accessToken, subscriptionLevel, label);
          }}
          onUpdateSubscriptionLevel={async (level) => {
            await updateClaudeSubscriptionLevel(level);
          }}
          onClear={() => clearConfig('claude')}
          onRefresh={() => refreshToken('claude')}
        >
          {modelSection}
        </ClaudeConfigCard>
      );
    case 'codex':
      return (
        <CodexConfigCard
          t={t}
          config={config?.codex}
          accounts={config?.codexAccounts}
          onSetActiveAccount={(id) => setActiveCodexAccount(id)}
          onUpdateAccountLabel={(id, label) => updateCodexAccountLabel(id, label)}
          onRemoveAccount={(id) => removeCodexAccount(id)}
          onStartOAuth={startCodexOAuth}
          onExchangeToken={async (code, state, label) => {
            // Relay code + the REAL init `state` (+ label). The host looks the
            // retained verifier up by `state` — the verifier never crosses here.
            await exchangeCodexToken(code, state, label);
          }}
          onStartLoopbackLogin={startCodexLoopbackLogin}
          onPollLoopbackFlow={pollCodexLoopbackFlow}
          onCancelLoopbackFlow={cancelCodexLoopbackFlow}
          onSetManualToken={async (accessToken, label) => {
            await setCodexManualToken(accessToken, label);
          }}
          onClear={() => clearConfig('codex')}
          onRefresh={() => refreshToken('codex')}
        >
          {modelSection}
        </CodexConfigCard>
      );
    case 'gemini':
      return (
        <GeminiConfigCard
          t={t}
          config={config?.gemini}
          onStartOAuth={startGeminiOAuth}
          onExchangeToken={async (code, state) => {
            // Relay code + the REAL init `state`. The host looks the retained
            // verifier up by `state` — the verifier never crosses here.
            await exchangeGeminiToken(code, state);
          }}
          onSetManualToken={async (accessToken, refreshTokenValue) => {
            await setGeminiManualToken(accessToken, refreshTokenValue);
          }}
          onClear={() => clearConfig('gemini')}
          onRefresh={() => refreshToken('gemini')}
        >
          {modelSection}
        </GeminiConfigCard>
      );
    case 'kimi':
      return (
        <KimiConfigCard
          t={t}
          config={config?.kimi}
          accounts={config?.kimiAccounts}
          onStartLogin={startKimiLogin}
          onPollFlow={pollKimiFlow}
          onCancelFlow={cancelKimiFlow}
          onSetActiveAccount={(id) => setActiveKimiAccount(id)}
          onUpdateAccountLabel={(id, label) => updateKimiAccountLabel(id, label)}
          onRemoveAccount={(id) => removeKimiAccount(id)}
          onClear={() => clearConfig('kimi')}
          onRefresh={() => refreshToken('kimi')}
        >
          {modelSection}
        </KimiConfigCard>
      );
    case 'grok':
      return (
        <GrokConfigCard
          t={t}
          config={config?.grok}
          accounts={config?.grokAccounts}
          onStartLogin={startGrokLogin}
          onPollFlow={pollGrokFlow}
          onCancelFlow={cancelGrokFlow}
          onSetActiveAccount={(id) => setActiveGrokAccount(id)}
          onUpdateAccountLabel={(id, label) => updateGrokAccountLabel(id, label)}
          onRemoveAccount={(id) => removeGrokAccount(id)}
          onClear={() => clearConfig('grok')}
          onRefresh={() => refreshToken('grok')}
        >
          {modelSection}
        </GrokConfigCard>
      );
    case 'copilot':
      return (
        <CopilotConfigCard
          t={t}
          config={config?.copilot}
          accounts={config?.copilotAccounts}
          onStartLogin={startCopilotLogin}
          onPollFlow={pollCopilotFlow}
          onCancelFlow={cancelCopilotFlow}
          onSetActiveAccount={(id) => setActiveCopilotAccount(id)}
          onUpdateAccountLabel={(id, label) => updateCopilotAccountLabel(id, label)}
          onRemoveAccount={(id) => removeCopilotAccount(id)}
          onClear={() => clearConfig('copilot')}
          onRefresh={() => refreshToken('copilot')}
        >
          {modelSection}
        </CopilotConfigCard>
      );
    case 'opencodego':
      return (
        <OpenCodeGoConfigCard
          t={t}
          config={config?.opencodego}
          accounts={config?.opencodegoAccounts}
          onAddAccount={(input) => addOpenCodeGoAccount(input)}
          onSetActiveAccount={(id) => setActiveOpenCodeGoAccount(id)}
          onUpdateAccountLabel={(id, label) => updateOpenCodeGoAccountLabel(id, label)}
          onRemoveAccount={(id) => removeOpenCodeGoAccount(id)}
        >
          {modelSection}
        </OpenCodeGoConfigCard>
      );
    default:
      return null;
  }
}

export default SubscriptionAccountPanel;
