/**
 * SubscriptionAccountsTab - subscription account management for Code CLI providers.
 *
 * Keeps OAuth/API-key account management separate from Code CLI installation and
 * detection. Claude/Codex accounts can still be applied to their native CLI
 * credential files per account row.
 */

import { RefreshCw, UserCircle } from 'lucide-react';

import type { TranslateFn } from '../host/vendored/useTranslation';

import { ClaudeConfigCard } from './ClaudeConfigCard';
import { CodexConfigCard } from './CodexConfigCard';
import { GeminiConfigCard } from './GeminiConfigCard';
import { OpenCodeGoConfigCard } from './OpenCodeGoConfigCard';
import { useSubscriptionAccounts } from './useSubscriptionAccounts';

interface SubscriptionAccountsTabProps {
  t: TranslateFn;
}

export function SubscriptionAccountsTab({ t }: SubscriptionAccountsTabProps) {
  const {
    config,
    loading,
    error,
    clearConfig,
    startClaudeOAuth,
    exchangeClaudeToken,
    startClaudeSetupToken,
    exchangeClaudeSetupToken,
    setClaudeManualToken,
    updateClaudeSubscriptionLevel,
    setActiveClaudeAccount,
    applyClaudeAccountToCli,
    updateClaudeAccountLabel,
    removeClaudeAccount,
    startCodexOAuth,
    exchangeCodexToken,
    setCodexManualToken,
    setActiveCodexAccount,
    applyCodexAccountToCli,
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
    importFromCli,
    setCliAutoImport,
  } = useSubscriptionAccounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
            <UserCircle className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t('settings.accountTokens.title')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {t('settings.accountTokens.description')}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <ClaudeConfigCard
          t={t}
          config={config?.claude}
          accounts={config?.claudeAccounts}
          onSetActiveAccount={(id) => setActiveClaudeAccount(id)}
          onApplyAccountToCli={(id) => applyClaudeAccountToCli(id)}
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
          onImportFromCli={() => importFromCli('claude')}
          autoImportEnabled={config?.cliAutoImport?.claude}
          onSetAutoImport={(enabled) => setCliAutoImport('claude', enabled)}
          externalCliDetected={config?.externalCliDetected?.claude}
        />

        <CodexConfigCard
          t={t}
          config={config?.codex}
          accounts={config?.codexAccounts}
          onSetActiveAccount={(id) => setActiveCodexAccount(id)}
          onApplyAccountToCli={(id) => applyCodexAccountToCli(id)}
          onUpdateAccountLabel={(id, label) => updateCodexAccountLabel(id, label)}
          onRemoveAccount={(id) => removeCodexAccount(id)}
          onStartOAuth={startCodexOAuth}
          onExchangeToken={async (code, state, label) => {
            // Relay code + the REAL init `state` (+ label). The host looks the
            // retained verifier up by `state` — the verifier never crosses here.
            await exchangeCodexToken(code, state, label);
          }}
          onSetManualToken={async (accessToken, label) => {
            await setCodexManualToken(accessToken, label);
          }}
          onClear={() => clearConfig('codex')}
          onRefresh={() => refreshToken('codex')}
          onImportFromCli={() => importFromCli('codex')}
          autoImportEnabled={config?.cliAutoImport?.codex}
          onSetAutoImport={(enabled) => setCliAutoImport('codex', enabled)}
          externalCliDetected={config?.externalCliDetected?.codex}
        />

        <GeminiConfigCard
          t={t}
          config={config?.gemini}
          onStartOAuth={startGeminiOAuth}
          onExchangeToken={async (code, state) => {
            // Relay code + the REAL init `state`. The host looks the retained
            // verifier up by `state` — the verifier never crosses here.
            await exchangeGeminiToken(code, state);
          }}
          onSetManualToken={async (accessToken, refreshToken) => {
            await setGeminiManualToken(accessToken, refreshToken);
          }}
          onClear={() => clearConfig('gemini')}
          onRefresh={() => refreshToken('gemini')}
        />

        <OpenCodeGoConfigCard
          t={t}
          config={config?.opencodego}
          accounts={config?.opencodegoAccounts}
          onAddAccount={(input) => addOpenCodeGoAccount(input)}
          onSetActiveAccount={(id) => setActiveOpenCodeGoAccount(id)}
          onUpdateAccountLabel={(id, label) => updateOpenCodeGoAccountLabel(id, label)}
          onRemoveAccount={(id) => removeOpenCodeGoAccount(id)}
        />
      </div>

      <section className="rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4 md:p-5">
        <h3 className="mb-2 text-base font-semibold text-foreground">
          {t('settings.accountTokens.info.title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.accountTokens.info.description')}
        </p>
      </section>
    </div>
  );
}
