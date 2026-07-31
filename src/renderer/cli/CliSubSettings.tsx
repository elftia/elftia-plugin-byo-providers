/**
 * CliSubSettings (plugin) — the cli sub-settings panel migrated from the host
 * `AgentBackendSection`'s `agentBackend==='cli'` block (`byo-p2-subscription`).
 *
 * Configures `cliBackendId` / `cliTimeout` / `cliPtyMode` / `cliPtyCols` /
 * `cliPtyRows` over the masked `agentConfigClient` (via `useCliBackendConfig`).
 * The GENERAL engine selector (claude-sdk/tinyelf/cli) is NOT here — it stays in
 * the host (the port does NOT expose `agentBackend`).
 *
 * @module byo-providers/renderer/cli/CliSubSettings
 */
import type { CliAuthStatus } from '@byo/domain/cli-types';

import { Select, Switch } from '../host/ui';
import type { TranslateFn } from '../host/vendored/useTranslation';

import { useCliBackendConfig } from './useCliBackendConfig';

type CliBackendId = 'claude-code' | 'codex-cli' | 'gemini-cli';

interface CliSubSettingsProps {
  t: TranslateFn;
  /** CLI auth statuses (shared from CodeCliTab's useCliAvailability). */
  statuses: CliAuthStatus[];
}

export function CliSubSettings({ t, statuses }: CliSubSettingsProps) {
  const {
    cliBackendId,
    cliTimeout,
    cliPtyMode,
    cliPtyCols,
    cliPtyRows,
    loading,
    update,
  } = useCliBackendConfig();

  // Auth-status suffix for a Code CLI backend (handles the codex/codex-cli alias).
  const getCliStatusLabel = (backendId: CliBackendId): string => {
    const status = statuses.find(
      (s) => s.backendId === backendId || (backendId === 'codex-cli' && s.backendId === 'codex'),
    );
    if (!status) return '';
    if (!status.installed) return ` (${t('settings.codeCli.agentBackend.cliNotInstalled')})`;
    if (!status.authenticated) return ` (${t('settings.codeCli.agentBackend.cliNotAuthenticated')})`;
    return ' ✓';
  };

  if (loading) return null;

  const cliBackendOptions = [
    { value: 'claude-code', label: 'Claude Code' + getCliStatusLabel('claude-code') },
    { value: 'codex-cli', label: 'Codex CLI' + getCliStatusLabel('codex-cli') },
    { value: 'gemini-cli', label: 'Gemini CLI' + getCliStatusLabel('gemini-cli') },
  ];

  return (
    <section className="rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4 space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground">
          {t('settings.codeCli.agentBackend.cliBackendLabel')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('settings.codeCli.agentBackend.cliBackendHint')}
        </p>
        <Select
          value={cliBackendId}
          onChange={(value) => void update({ cliBackendId: value as CliBackendId })}
          options={cliBackendOptions}
          size="sm"
        />
      </div>
      <div className="space-y-1">
        <span className="text-xs font-medium text-foreground">
          {t('settings.codeCli.agentBackend.cliTimeoutLabel')}
        </span>
        <p className="text-xs text-muted-foreground">
          {t('settings.codeCli.agentBackend.cliTimeoutHint')}
        </p>
        <input
          type="number"
          min={30}
          max={3600}
          value={cliTimeout}
          onChange={(e) =>
            void update({ cliTimeout: Math.max(30, Math.min(3600, parseInt(e.target.value, 10) || 300)) })
          }
          className="w-24 rounded-md bg-surface-2 border border-border/40 px-2 py-1 text-sm text-foreground"
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-foreground">
              {t('settings.codeCli.agentBackend.cliPtyMode')}
            </span>
            <p className="text-xs text-muted-foreground">
              {t('settings.codeCli.agentBackend.cliPtyModeHint')}
            </p>
          </div>
          <Switch checked={cliPtyMode} onCheckedChange={(checked) => void update({ cliPtyMode: checked })} />
        </div>
      </div>
      {cliPtyMode ? (
        <div className="flex gap-3">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">
              {t('settings.codeCli.agentBackend.cliPtyCols')}
            </span>
            <input
              type="number"
              min={40}
              max={500}
              value={cliPtyCols}
              onChange={(e) =>
                void update({ cliPtyCols: Math.max(40, Math.min(500, parseInt(e.target.value, 10) || 120)) })
              }
              className="w-20 rounded-md bg-surface-2 border border-border/40 px-2 py-1 text-sm text-foreground"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">
              {t('settings.codeCli.agentBackend.cliPtyRows')}
            </span>
            <input
              type="number"
              min={10}
              max={200}
              value={cliPtyRows}
              onChange={(e) =>
                void update({ cliPtyRows: Math.max(10, Math.min(200, parseInt(e.target.value, 10) || 40)) })
              }
              className="w-20 rounded-md bg-surface-2 border border-border/40 px-2 py-1 text-sm text-foreground"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
