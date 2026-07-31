/**
 * SearchProviderSidebar.tsx — minimal api-only sidebar (P2d design D1/D3, OQ2).
 *
 * A single flat list of the API-key search providers (tavily/jina/zhipu/grok/
 * exa/bocha/searxng), each row showing selected + ENABLED state. REBUILT in the
 * plugin rather than copying the host 3-group `Sidebar` — the host Sidebar
 * renders config + local-* groups the plugin can't service (those stay
 * host-only). The styling mirrors the host `SidebarGroup` + `SidebarItem`
 * (byte-identical class strings) so the section looks native.
 *
 * The status dot mirrors the sibling LLM/media provider sidebars (the app-wide
 * convention): it is ALWAYS rendered and reflects the provider's ENABLED state —
 * the accent `bg-primary` (orange) when enabled, a muted `bg-border` when
 * disabled. It is NOT keyed on "configured" (a configured-but-disabled provider
 * must not read as active), and it never uses a raw Tailwind palette color (the
 * design-system rule: semantic tokens only). The "配置有效"/key state is surfaced
 * in the right-hand panel, not the dot.
 *
 * @module byo-providers/renderer/search/SearchProviderSidebar
 */
import { CircleDot } from 'lucide-react';
import * as React from 'react';

import { cn } from '../host/vendored/cn';
import { useTranslation } from '../host/vendored/useTranslation';

import { WEB_SEARCH_PROVIDER_META, type WebSearchProviderId } from './meta';

interface SearchProviderSidebarProps {
  providerIds: WebSearchProviderId[];
  selectedId: WebSearchProviderId;
  onSelect: (id: WebSearchProviderId) => void;
  isEnabled: (id: WebSearchProviderId) => boolean;
}

export function SearchProviderSidebar({
  providerIds,
  selectedId,
  onSelect,
  isEnabled,
}: SearchProviderSidebarProps) {
  const t = useTranslation();
  const [enabledOnly, setEnabledOnly] = React.useState(false);

  const visibleIds = enabledOnly ? providerIds.filter(isEnabled) : providerIds;

  return (
    <nav className="space-y-1">
      <div className="flex items-center justify-between gap-2 px-3 py-1">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('settings.webSearch.apiProviders')}
        </h4>
        {/* "Enabled only" filter — reuses the generic `providerSettings.*` filter
            strings shared across every provider sidebar (LLM/media/search). */}
        <button
          type="button"
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded-md border transition-colors shrink-0',
            enabledOnly
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
          )}
          onClick={() => setEnabledOnly((prev) => !prev)}
          aria-pressed={enabledOnly}
          aria-label={enabledOnly ? t('providerSettings.showAll') : t('providerSettings.showEnabledOnly')}
          title={enabledOnly ? t('providerSettings.showAll') : t('providerSettings.showEnabledOnly')}
        >
          <CircleDot className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-0.5">
        {visibleIds.map((id) => {
          const meta = WEB_SEARCH_PROVIDER_META[id];
          const selected = id === selectedId;
          const enabled = isEnabled(id);
          return (
            <SearchSidebarItem
              key={id}
              id={id}
              label={meta.name}
              selected={selected}
              enabled={enabled}
              onClick={() => onSelect(id)}
            />
          );
        })}
      </div>
    </nav>
  );
}

interface SearchSidebarItemProps {
  id: string;
  label: string;
  selected: boolean;
  enabled: boolean;
  onClick: () => void;
}

function SearchSidebarItem({ id, label, selected, enabled, onClick }: SearchSidebarItemProps) {
  return (
    <button
      data-testid={`sidebar-item-${id}`}
      aria-pressed={selected}
      data-disabled={!enabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
        'hover:bg-surface-2/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
        selected && 'bg-primary/10 text-primary font-medium',
        !selected && 'text-foreground',
        !enabled && 'opacity-50',
      )}
    >
      <span className="truncate">{label}</span>
      {/* Enabled-state dot: accent `bg-primary` (orange) when on, muted
          `bg-border` when off — the LLM/media provider-sidebar convention. */}
      <span
        data-status={enabled ? 'enabled' : 'disabled'}
        className={cn(
          'h-2 w-2 rounded-full shrink-0 ml-2',
          enabled ? 'bg-primary' : 'bg-border',
        )}
      />
    </button>
  );
}
