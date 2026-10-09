/**
 * ModelServicesPage — the unified account-services + BYO-provider settings
 * section (omnicross UpstreamsPage shape, elftia data).
 *
 * ONE sidebar tree: per-subscription-provider account pools (expandable →
 * accounts) above a divider, BYO provider rows below; search, all/accounts/
 * providers filter chips, and an enabled-only toggle narrow both kinds. The
 * right panel is selection-driven: an account pool renders that provider's
 * EXISTING config card (OAuth / manual-token entry — reused verbatim through
 * `SubscriptionAccountPanel`), a provider row renders the EXISTING
 * `ProviderDetailPanel` (details / form / model dialogs). 添加提供商 opens the
 * catalog template picker (`ProviderTemplatePicker`) — the host
 * `getProviderPresets` port feeds it, so `commandcode` and its wire variants
 * are addable like every other preset.
 *
 * Both data halves render from ONE hook instance each
 * (`useSubscriptionAccounts` / `useProviderSettings` held HERE), so a completed
 * login or template add lands in the sidebar without a manual refresh. No new
 * host ports — everything rides the existing masked relays.
 *
 * @module byo-providers/renderer/llm/ModelServicesPage
 */
import {
  Boxes,
  ChevronRight,
  CircleDot,
  Layers3,
  Plus,
  Search,
  Server,
  UserRound,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import type { ApiFormat, LLMProvider, ProviderTemplate } from '@byo/domain/llm';
import { PROVIDER_TEMPLATES } from '@byo/domain/llm';
import type { SubscriptionAccountSanitized, TokenPlatform } from '@byo/domain/subscription';

import { SubscriptionAccountPanel } from '../subscription/SubscriptionAccountPanel';
import { useSubscriptionAccounts } from '../subscription/useSubscriptionAccounts';
import { Badge, Button, Input } from '../host/ui';
import { cn } from '../host/vendored/cn';
import {
  ByoPortalRoot,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../host/vendored/dialog';
import { ScrollArea } from '../host/vendored/scroll-area';
import { useTranslation } from '../host/vendored/useTranslation';

import { ProviderTemplatePicker } from './PresetProviderGrid';
import { ProviderDetailPanel } from './ProviderDetailPanel';
import { useProviderSettings } from './hooks/useProviderSettings';
import { getProviderDisplayName } from './utils';

/** The subscription platforms in sidebar order (nav order of the former tab). */
const ACCOUNT_PLATFORMS: readonly TokenPlatform[] = [
  'claude',
  'codex',
  'gemini',
  'kimi',
  'grok',
  'copilot',
  'opencodego',
] as const;

/** The seed key for a platform's display name (opencodego is camelCased). */
function platformTitleKey(platform: TokenPlatform): string {
  return platform === 'opencodego'
    ? 'settings.accountTokens.openCodeGo.title'
    : `settings.accountTokens.${platform}.title`;
}

/** The plugin wire-default template for a bare API type (picker escape hatch). */
function templateByApiFormat(apiFormat: ApiFormat): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find((template) => template.apiFormat === apiFormat);
}

type KindFilter = 'all' | 'account' | 'provider';

interface AccountPoolBranch {
  platform: TokenPlatform;
  label: string;
  /** Configured (not just provisioned) — drives pool visibility. */
  configured: boolean;
  accounts: SubscriptionAccountSanitized[];
}

/** Provider sidebar status — ready / disabled / needs-key (omnicross taxonomy). */
function providerStatusKey(provider: LLMProvider): string {
  if (!provider.enabled) return 'modelServices.status.disabled';
  if (provider.hasKey === false) return 'modelServices.status.needsKey';
  return 'modelServices.status.ready';
}

export function ModelServicesPage() {
  const t = useTranslation();
  const accountsApi = useSubscriptionAccounts();
  const settings = useProviderSettings();

  // Sidebar browse state (view-only, component-local — the settings section has
  // no routing). Selection is split: account pools here, providers inside the
  // shared `useProviderSettings` bag so the detail panel follows the sidebar.
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [expandedPools, setExpandedPools] = useState<Set<string>>(() => new Set());
  const [selectedPlatform, setSelectedPlatform] = useState<TokenPlatform | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  const pools = useMemo<AccountPoolBranch[]>(() => {
    const config = accountsApi.config;
    return ACCOUNT_PLATFORMS.map((platform) => {
      const accounts =
        (config?.[`${platform}Accounts` as keyof typeof config] as
          | SubscriptionAccountSanitized[]
          | undefined) ?? [];
      const platformConfig = config?.[platform as keyof typeof config];
      const configured =
        accounts.length > 0 ||
        (Boolean(platformConfig) &&
          (platformConfig as { status?: string } | undefined)?.status !== 'unconfigured');
      return {
        platform,
        label: t(platformTitleKey(platform)),
        configured,
        accounts,
      };
    }).filter((pool) => pool.configured);
  }, [accountsApi.config, t]);

  const providers = settings.providers;

  const visiblePools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (kindFilter === 'provider') return [];
    return pools
      .filter((pool) => {
        if (!needle) return true;
        const poolMatches = `${pool.label} ${pool.platform}`.toLowerCase().includes(needle);
        const accountMatches = pool.accounts.some((account) =>
          `${account.label ?? ''} ${account.id}`.toLowerCase().includes(needle),
        );
        return poolMatches || accountMatches;
      })
      .map((pool) => {
        if (!needle) return pool;
        const poolMatches = `${pool.label} ${pool.platform}`.toLowerCase().includes(needle);
        // A matching pool reveals ALL its accounts (omnicross ancestor-keep
        // rule); otherwise only the matching accounts survive.
        const accounts = poolMatches
          ? pool.accounts
          : pool.accounts.filter((account) =>
              `${account.label ?? ''} ${account.id}`.toLowerCase().includes(needle),
            );
        return { ...pool, accounts };
      });
  }, [pools, kindFilter, query]);

  const visibleProviders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return providers
      .filter((provider) => kindFilter === 'all' || kindFilter === 'provider')
      .filter((provider) => !enabledOnly || provider.enabled)
      .filter((provider) => {
        if (!needle) return true;
        const haystack = `${provider.name} ${getProviderDisplayName(t, provider)} ${
          provider.apiFormat || provider.apiType || ''
        } ${(provider.models ?? []).join(' ')} ${provider.id}`.toLowerCase();
        return haystack.includes(needle);
      });
  }, [providers, kindFilter, enabledOnly, query, t]);

  const filterForcesExpanded = Boolean(query.trim()) || kindFilter === 'account';

  const togglePool = (platform: string) => {
    setExpandedPools((current) => {
      const next = new Set(current);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const selectAccountPool = (platform: TokenPlatform) => {
    setSelectedPlatform(platform);
    // Leaving the provider half — drop form/adding state so the panel swaps.
    settings.handleCancelEdit();
  };

  const selectProvider = (providerId: string) => {
    setSelectedPlatform(null);
    settings.handleSelectProvider(providerId);
  };

  /** 添加提供商 → template picker → host addFromPreset; select the new row. */
  const handleSelectPreset = async (presetId: string) => {
    const result = await settings.handleAddFromPreset(presetId);
    if (result?.provider) {
      setPickerOpen(false);
      setSelectedPlatform(null);
    }
  };

  /** API-type escape hatch → blank form prefilled with the wire defaults. */
  const handleStartCustom = (apiFormat: ApiFormat) => {
    setPickerOpen(false);
    setSelectedPlatform(null);
    // Blank form first (empty state + isAddingNew), then overwrite the form
    // data with that wire format's defaults — the same prefill the provider
    // form's API-type selector applies.
    settings.handleAddProvider();
    const template = templateByApiFormat(apiFormat);
    if (template) {
      settings.handleUseTemplate(template);
    }
  };

  const addedPresetIds = useMemo(() => {
    const ids = new Set<string>();
    for (const provider of providers) {
      const ref = (provider as LLMProvider & { presetRef?: string }).presetRef;
      if (ref) ids.add(ref);
      else if (provider.presetId) ids.add(provider.presetId);
      else ids.add(provider.id);
    }
    return ids;
  }, [providers]);

  const showProviderPanel = selectedPlatform === null;
  const noSelectionPrompt =
    selectedPlatform === null &&
    providers.length === 0 &&
    !settings.isAddingNew &&
    !settings.isEditing;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — section title + the two add actions (omnicross UpstreamsPage). */}
      <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface-1/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">{t('modelServices.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddAccountOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t('modelServices.addAccount')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPickerOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('modelServices.addProvider')}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden" data-testid="model-services-page">
        {/* Sidebar — account pools → accounts tree, divider, provider rows. */}
        <aside className="w-72 border-r border-border bg-surface-1/60 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-border/70 flex-shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('modelServices.searchPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-8 h-9"
                aria-label={t('modelServices.searchPlaceholder')}
              />
              {query ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 gap-1">
                {(['all', 'account', 'provider'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    data-testid={`kind-filter-${kind}`}
                    className={cn(
                      'shrink-0 rounded-md px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      kindFilter === kind
                        ? 'bg-primary/12 text-primary'
                        : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                    )}
                    onClick={() => setKindFilter(kind)}
                  >
                    {t(`modelServices.filter.${kind}`)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={cn(
                  'h-8 w-8 shrink-0 flex items-center justify-center rounded-md border transition-colors',
                  enabledOnly
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
                )}
                onClick={() => setEnabledOnly((prev) => !prev)}
                aria-pressed={enabledOnly}
                aria-label={enabledOnly ? t('providerSettings.showAll') : t('providerSettings.showEnabledOnly')}
                title={enabledOnly ? t('providerSettings.showAll') : t('providerSettings.showEnabledOnly')}
              >
                <CircleDot className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {visiblePools.map((pool) => {
                const expanded =
                  filterForcesExpanded || expandedPools.has(pool.platform);
                const hasChildren = pool.accounts.length > 0;
                const selected = selectedPlatform === pool.platform;
                return (
                  <div key={pool.platform} data-testid={`account-pool-${pool.platform}`}>
                    <button
                      type="button"
                      aria-expanded={hasChildren ? expanded : undefined}
                      className={cn(
                        'group w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                        selected
                          ? 'bg-primary/10 text-foreground'
                          : 'text-foreground hover:bg-surface-2/70',
                      )}
                      onClick={() => {
                        selectAccountPool(pool.platform);
                        if (hasChildren) togglePool(pool.platform);
                      }}
                    >
                      {hasChildren ? (
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                            expanded && 'rotate-90 text-foreground',
                          )}
                        />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                          selected
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-surface-0 text-muted-foreground',
                        )}
                      >
                        <Layers3 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{pool.label}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>{t('modelServices.kind.accountPool')}</span>
                          <span>·</span>
                          <span>
                            {t('modelServices.accountCount', { count: pool.accounts.length })}
                          </span>
                        </span>
                      </span>
                    </button>
                    {hasChildren && expanded ? (
                      <div className="ml-4 border-l border-border/70 pl-2">
                        {pool.accounts.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-foreground hover:bg-surface-2/70"
                            onClick={() => selectAccountPool(pool.platform)}
                          >
                            <span
                              className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                                selected
                                  ? 'border-primary/30 bg-primary/10 text-primary'
                                  : 'border-border bg-surface-0 text-muted-foreground',
                              )}
                            >
                              <UserRound className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm">
                                {account.label || account.id}
                              </span>
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {t(`settings.accountTokens.status.${account.status}`)}
                              </span>
                            </span>
                            {account.isActive ? (
                              <Badge variant="success" className="shrink-0 text-[9px]">
                                {t('modelServices.status.active')}
                              </Badge>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {/* Divider between the account half and the provider half. */}
              {visibleProviders.length > 0 && visiblePools.length > 0 ? (
                <div className="mx-2 mb-1 mt-3 border-t border-border/70 pt-3" />
              ) : null}

              {visibleProviders.map((provider) => {
                const selected =
                  showProviderPanel && settings.selectedProviderId === provider.id;
                const statusKey = providerStatusKey(provider);
                return (
                  <button
                    key={provider.id}
                    type="button"
                    data-testid={`provider-row-${provider.id}`}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                      selected
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-surface-2/70',
                    )}
                    onClick={() => selectProvider(provider.id)}
                  >
                    <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                        selected
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-surface-0 text-muted-foreground',
                      )}
                    >
                      <Server className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {getProviderDisplayName(t, provider)}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>{t('modelServices.kind.provider')}</span>
                        <span>·</span>
                        <span>{t(statusKey)}</span>
                        <span>·</span>
                        <span>
                          {provider.models?.length
                            ? t('modelServices.modelCount', { count: provider.models.length })
                            : t('providerSettings.noModels')}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        'h-5 w-0.5 shrink-0 rounded-full',
                        selected ? 'bg-primary' : 'bg-transparent',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}

              {/* Empty states. */}
              {visibleProviders.length === 0 && visiblePools.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  {query.trim() || kindFilter !== 'all' || enabledOnly ? (
                    t('modelServices.empty.filtered')
                  ) : (
                    <div className="space-y-3">
                      <p>{t('modelServices.empty.providers')}</p>
                      <Button
                        size="sm"
                        data-testid="empty-providers-cta"
                        onClick={() => setPickerOpen(true)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t('modelServices.empty.providersCta')}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
              {kindFilter !== 'provider' && visiblePools.length === 0 && visibleProviders.length > 0 && accountsApi.loading === false && pools.length === 0 ? (
                <p className="px-3 py-2 text-center text-[10px] text-muted-foreground">
                  {t('modelServices.empty.accounts')}
                </p>
              ) : null}
            </div>
          </ScrollArea>
        </aside>

        {/* Right panel — account config card OR provider details/form. */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-1/60 wallpaper-blur">
          {selectedPlatform !== null ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="max-w-3xl mx-auto p-4 md:p-6">
                {accountsApi.error ? (
                  <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {accountsApi.error}
                  </div>
                ) : null}
                <SubscriptionAccountPanel t={t} platform={selectedPlatform} accounts={accountsApi} />
              </div>
            </div>
          ) : noSelectionPrompt ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('modelServices.empty.none')}</p>
                <Button size="sm" data-testid="empty-panel-cta" onClick={() => setPickerOpen(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t('modelServices.empty.providersCta')}
                </Button>
              </div>
            </div>
          ) : (
            <ProviderDetailPanel s={settings} />
          )}
        </div>
      </div>

      {/* 添加提供商 — the catalog template picker dialog. Sized inline: the
          vendored DialogContent's tailwind classes (max-w-lg, grid) are
          generated from the HOST's stylesheet, where the plugin's override
          classes (flex, !max-w-4xl) don't exist — inline styles are the only
          reliable lever from plugin code. Height caps at the viewport with the
          preset grid scrolling inside. */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          className="p-0"
          style={{
            width: 'min(64rem, 92vw)',
            maxWidth: 'min(64rem, 92vw)',
            maxHeight: '85dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>{t('modelServices.addProvider')}</DialogTitle>
            <DialogDescription>{t('modelServices.addProviderDescription')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto" data-testid="add-provider-dialog">
            <ProviderTemplatePicker
              addedPresetIds={addedPresetIds}
              onSelectPreset={handleSelectPreset}
              onStartCustom={handleStartCustom}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加账号 — pick a subscription provider; its login card opens in the panel. */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="!max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('modelServices.addAccountTitle')}</DialogTitle>
            <DialogDescription>{t('modelServices.addAccountDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5" data-testid="add-account-dialog">
            {ACCOUNT_PLATFORMS.map((platform) => (
              <button
                key={platform}
                type="button"
                className="flex items-center gap-2.5 rounded-lg border border-border/50 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-surface-2"
                onClick={() => {
                  setSelectedPlatform(platform);
                  setAddAccountOpen(false);
                }}
              >
                <Layers3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                {t(platformTitleKey(platform))}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* In-tree portal target: dialogs portal here (not the frame's
          document.body) so they land inside the live host DOM and stay
          visible — see host/vendored/dialog.tsx. */}
      <ByoPortalRoot />
    </div>
  );
}

export default ModelServicesPage;
