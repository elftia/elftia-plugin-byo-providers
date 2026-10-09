/**
 * CodeCliTab (plugin) — the relocated Code CLI RUNTIME UI (`byo-p2-subscription`).
 *
 * The host CodeCliTab BODY minus the general engine selector: CLI availability
 * badges, install buttons, terminal-launch dialog, AND the cli sub-settings
 * (cliBackendId/timeout/pty) — over the masked `cliRuntimeClient` (availability/
 * install/launch) + `agentConfigClient` (cli sub-settings, via `useCliBackendConfig`).
 *
 * The GENERAL engine selector (claude-sdk/tinyelf/cli → `MagiConfig.agentBackend`)
 * is DELIBERATELY NOT here — it stays in the host (engine selection is an
 * execution concern present in all builds; the host gates the `cli` OPTION on this
 * section's presence). This section provides the cli DETAIL the host surfaces when
 * `cli` is chosen.
 *
 * NO-CREDENTIAL-ON-RETURN: `cliRuntimeClient.getAuthStatus` returns descriptors
 * only; install/launch are host-run actions returning `{ ok, error? }`.
 *
 * @module byo-providers/renderer/cli/CodeCliTab
 */
import { CheckCircle2, Download, Loader2, Play, RefreshCw, Terminal } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { CliAuthStatus } from '@byo/domain/cli-types';

import { cliRuntimeClient } from '../cliRuntimeClient';
import { Button } from '../host/ui';
import {
  ByoPortalRoot,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../host/vendored/dialog';
import type { TranslateFn } from '../host/vendored/useTranslation';

import { CliAvailabilityBadge } from './CliAvailabilityBadge';
import { CliSubSettings } from './CliSubSettings';
import { useCliAvailability } from './useCliAvailability';

interface CodeCliTabProps {
  t: TranslateFn;
}

function CliConnectedPanel({ status, t }: { status: CliAuthStatus; t: TranslateFn }) {
  return (
    <div className="space-y-1 rounded-md border border-primary/20 bg-primary/10 px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {t('settings.codeCli.connectedViaCli')}
      </div>
      {status.email ? <p className="pl-6 text-xs text-text-muted">{status.email}</p> : null}
      {status.authMethod ? (
        <p className="pl-6 text-xs text-text-muted">
          {t('settings.codeCli.authMethodLabel')}: {status.authMethod}
        </p>
      ) : null}
    </div>
  );
}

const PROVIDER_ENV_INJECTION_BACKENDS = new Set([
  'claude-code',
  'codex',
  'codex-cli',
  'gemini-cli',
  'opencode',
  'qwen',
  'copilot',
]);

function InstallButton({
  backendId,
  onInstalled,
  t,
}: {
  backendId: string;
  onInstalled: () => void;
  t: TranslateFn;
}) {
  const [state, setState] = useState<'idle' | 'installing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleInstall = async () => {
    setState('installing');
    setErrorMsg('');
    try {
      const result = await cliRuntimeClient.install(backendId);
      if (result.ok) {
        setState('idle');
        onInstalled();
        return;
      }
      setErrorMsg(result.error ?? 'Install failed');
      setState('error');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Install failed');
      setState('error');
    }
  };

  return (
    <div className="space-y-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleInstall()}
        disabled={state === 'installing'}
        className="gap-2"
      >
        {state === 'installing' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {state === 'installing'
          ? t('settings.codeCli.installing')
          : t('settings.codeCli.installButton')}
      </Button>
      {state === 'error' ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
    </div>
  );
}

function LaunchButton({
  backendId,
  title,
  t,
}: {
  backendId: string;
  title: string;
  t: TranslateFn;
}) {
  const [open, setOpen] = useState(false);
  const [cwd, setCwd] = useState('');
  const [injectProviderEnv, setInjectProviderEnv] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const supportsProviderEnv = PROVIDER_ENV_INJECTION_BACKENDS.has(backendId);

  const handleLaunch = async () => {
    setLaunching(true);
    setErrorMsg('');
    try {
      const result = await cliRuntimeClient.launchTerminal({
        backendId,
        cwd: cwd.trim() || undefined,
        injectProviderEnv: supportsProviderEnv ? injectProviderEnv : false,
      });
      if (result.ok) {
        setOpen(false);
        return;
      }
      setErrorMsg(result.error ?? t('settings.codeCli.launch.error'));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('settings.codeCli.launch.error'));
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Play className="h-3.5 w-3.5" />
        {t('settings.codeCli.launch.button')}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.codeCli.launch.title', { name: title })}</DialogTitle>
          <DialogDescription>{t('settings.codeCli.launch.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="space-y-1.5 text-sm font-medium text-foreground">
            <span>{t('settings.codeCli.launch.pathLabel')}</span>
            <input
              value={cwd}
              onChange={(event) => setCwd(event.target.value)}
              placeholder={t('settings.codeCli.launch.pathPlaceholder')}
              className="w-full rounded-md bg-surface-2 border border-border/40 px-2 py-1 text-sm text-foreground"
            />
          </label>
          {supportsProviderEnv ? (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={injectProviderEnv}
                onChange={(event) => setInjectProviderEnv(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {t('settings.codeCli.launch.injectLabel')}
            </label>
          ) : null}
          {errorMsg ? <p className="text-xs text-destructive">{errorMsg}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={() => void handleLaunch()} disabled={launching} className="gap-2">
            {launching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {t('settings.codeCli.launch.startButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getStatusHint(status: CliAuthStatus | undefined, t: TranslateFn) {
  if (!status) return t('settings.codeCli.genericNotInstalledHint');
  if (status.installable === false) return t('settings.codeCli.manualInstallHint');
  if (status.authenticated) return t('settings.codeCli.genericInstalledHint');
  return status.installed
    ? t('settings.codeCli.genericInstalledHint')
    : t('settings.codeCli.genericNotInstalledHint');
}

function CodeCliSection({
  title,
  backendId,
  status,
  loading,
  onRefresh,
  t,
}: {
  title: string;
  backendId: string;
  status: CliAuthStatus | undefined;
  loading: boolean;
  onRefresh: () => void;
  t: TranslateFn;
}) {
  const showInstallButton =
    status?.installed === false && status?.installable !== false && !status.authenticated;
  const showLaunchButton = status?.installed === true;

  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          <CliAvailabilityBadge status={status} loading={loading} t={t} />
          {showLaunchButton ? <LaunchButton backendId={backendId} title={title} t={t} /> : null}
          {showInstallButton ? (
            <InstallButton backendId={backendId} onInstalled={onRefresh} t={t} />
          ) : null}
        </div>
      </div>
      {status?.authenticated ? (
        <CliConnectedPanel status={status} t={t} />
      ) : (
        <p className="text-xs text-text-muted">{getStatusHint(status, t)}</p>
      )}
    </section>
  );
}

export function CodeCliTab({ t }: CodeCliTabProps) {
  const { statuses, loading: cliLoading, refresh: refreshCli } = useCliAvailability();
  const handleRefreshCli = useCallback(() => void refreshCli(), [refreshCli]);

  const claudeStatus = statuses.find((status) => status.backendId === 'claude-code');
  const codexStatus = statuses.find(
    (status) => status.backendId === 'codex' || status.backendId === 'codex-cli',
  );
  const geminiStatus = statuses.find((status) => status.backendId === 'gemini-cli');

  const knownHandTuned = new Set(['claude-code', 'codex', 'codex-cli', 'gemini-cli']);
  const otherStatuses = statuses.filter((status) => !knownHandTuned.has(status.backendId));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Terminal className="h-5 w-5" />
              {t('settings.codeCli.info.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('settings.codeCli.info.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshCli}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label={t('settings.codeCli.refreshButton')}
          >
            <RefreshCw className={`h-4 w-4 ${cliLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* The cli sub-settings (migrated from the host AgentBackendSection — the
          GENERAL engine selector stays host). */}
      <CliSubSettings t={t} statuses={statuses} />

      <div className="space-y-4">
        <CodeCliSection
          title="Claude Code"
          backendId="claude-code"
          status={claudeStatus}
          loading={cliLoading}
          onRefresh={handleRefreshCli}
          t={t}
        />
        <CodeCliSection
          title="Codex CLI"
          backendId="codex"
          status={codexStatus}
          loading={cliLoading}
          onRefresh={handleRefreshCli}
          t={t}
        />
        <CodeCliSection
          title="Gemini CLI"
          backendId="gemini-cli"
          status={geminiStatus}
          loading={cliLoading}
          onRefresh={handleRefreshCli}
          t={t}
        />
        {otherStatuses.map((status) => {
          const isAcp = status.protocol === 'acp';
          const showInstallButton = status.installed === false && status.installable !== false;
          const showLaunchButton = status.installed === true;
          return (
            <section
              key={status.backendId}
              className="space-y-3 rounded-xl border border-border/70 bg-surface-1/60 wallpaper-blur p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{status.displayName}</h3>
                  {isAcp ? (
                    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                      ACP
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <CliAvailabilityBadge status={status} loading={cliLoading} t={t} />
                  {showLaunchButton ? (
                    <LaunchButton backendId={status.backendId} title={status.displayName} t={t} />
                  ) : null}
                  {showInstallButton ? (
                    <InstallButton
                      backendId={status.backendId}
                      onInstalled={handleRefreshCli}
                      t={t}
                    />
                  ) : null}
                </div>
              </div>
              {status.authenticated ? (
                <CliConnectedPanel status={status} t={t} />
              ) : (
                <p className="text-xs text-text-muted">{getStatusHint(status, t)}</p>
              )}
              {isAcp ? (
                <p className="text-[11px] text-text-muted/80">
                  {t('settings.codeCli.acpProtocolHint')}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
      {/* In-tree portal target (see host/vendored/dialog.tsx). */}
      <ByoPortalRoot />
    </div>
  );
}
