/**
 * ProviderTemplatePicker — step 1 of the add-provider flow on the unified
 * model-services page (omnicross `ProviderTemplatePicker` shape, reworked from
 * the formerly-orphaned `PresetProviderGrid`).
 *
 * The host preset catalog is the common case, so the picker leads with it: a
 * searchable grid of preset cards (icon, name, description, feature tags) that
 * creates the provider through `addFromPreset` on click. Presets already added
 * are shown disabled + badged rather than hidden, so the catalog reads as a
 * stable, complete list — `commandcode` and its wire variants flow through here
 * like every other preset (the host filters `category: 'other'` upstream).
 *
 * Above the grid sits the escape hatch: pick a bare API type and go straight to
 * the BLANK provider form prefilled from the plugin's `PROVIDER_TEMPLATES`
 * wire defaults. Nothing here writes — preset adds go through the host
 * `addFromPreset` port; the custom path hands off to `ProviderForm`.
 */
import { Check, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import type { ApiFormat, PresetProviderTemplate } from '@byo/domain/llm';

import { Badge, Button, Input } from '../host/ui';
import { cn } from '../host/vendored/cn';
import { useTranslation } from '../host/vendored/useTranslation';
import { llmConfigClient } from '../llmConfigClient';

import { getProviderIcon } from './utils';

interface ProviderTemplatePickerProps {
  /** Set of preset `id` values already added (use preset.id, not presetId — the
   *  same presetId may appear on multiple variants like Xiaomi MiMo OpenAI/Anthropic). */
  addedPresetIds: Set<string>;
  /** Called with the preset's unique `id` (not `presetId`). The backend's
   *  `addFromPreset` accepts either, but `id` disambiguates variants. */
  onSelectPreset: (presetId: string) => void;
  /** Escape hatch: start the blank provider form from a bare API type. */
  onStartCustom: (apiFormat: ApiFormat) => void;
}

/** The API types a hand-rolled provider can start from (no template needed). */
const CUSTOM_TYPE_OPTIONS: Array<{ apiFormat: ApiFormat; label: string }> = [
  { apiFormat: 'openai', label: 'OpenAI' },
  { apiFormat: 'anthropic', label: 'Anthropic' },
  { apiFormat: 'google', label: 'Google Gemini' },
  { apiFormat: 'openai-response', label: 'OpenAI Responses' },
  { apiFormat: 'azure-openai', label: 'Azure OpenAI' },
];

const FEATURE_KEYS: Record<string, string> = {
  search: 'providerSettings.presets.features.search',
  'mcp-search': 'providerSettings.presets.features.search',
  vision: 'providerSettings.presets.features.vision',
  'mcp-vision': 'providerSettings.presets.features.vision',
  mcp: 'providerSettings.presets.features.mcp',
  'coding-plan': 'providerSettings.presets.features.codingPlan',
};

function dedupeFeatureLabels(features: string[], t: (key: string) => string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const feat of features) {
    const key = FEATURE_KEYS[feat];
    if (!key) continue;
    const label = t(key);
    if (seen.has(label)) continue;
    seen.add(label);
    result.push(label);
  }
  return result;
}

function PresetCard({
  preset,
  isAdded,
  onSelect,
  t,
}: {
  preset: PresetProviderTemplate;
  isAdded: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}) {
  const featureLabels = useMemo(
    () => dedupeFeatureLabels(preset.features ?? [], t),
    [preset.features, t],
  );

  return (
    <div
      data-testid={`preset-card-${preset.id}`}
      className={cn(
        'rounded-xl border border-border/30 dark:border-border/50 bg-surface-1 wallpaper-blur p-4 flex flex-col gap-3 transition-colors',
        isAdded
          ? 'opacity-60'
          : 'hover:border-primary/40 hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:hover:shadow-none dark:hover:bg-surface-2/60',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {getProviderIcon(preset.icon)}
        <span className="font-medium text-sm text-foreground truncate min-w-0 flex-1">
          {preset.name}
        </span>
        {isAdded ? (
          <Badge variant="success" className="flex-shrink-0">
            <Check className="h-3 w-3" />
            {t('providerSettings.presets.added')}
          </Badge>
        ) : null}
      </div>

      {/* Feature tags */}
      {featureLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {featureLabels.map((label) => (
            <Badge key={label} variant="secondary" className="text-[10px]">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Description */}
      {preset.description ? (
        <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
      ) : null}

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-auto"
        disabled={isAdded}
        onClick={onSelect}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('providerSettings.presets.add')}
      </Button>
    </div>
  );
}

export function ProviderTemplatePicker({
  addedPresetIds,
  onSelectPreset,
  onStartCustom,
}: ProviderTemplatePickerProps) {
  const t = useTranslation();
  const [presets, setPresets] = useState<PresetProviderTemplate[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    setLoadState('loading');
    const load = async () => {
      try {
        const value = await llmConfigClient.getProviderPresets();
        if (!active) return;
        setPresets(Array.isArray(value) ? (value as PresetProviderTemplate[]) : []);
        setLoadState('ready');
      } catch {
        if (!active) return;
        setPresets([]);
        setLoadState('error');
      }
    };
    void load();

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const visiblePresets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return presets;
    return presets.filter((preset) => {
      const haystack = [
        preset.name,
        preset.id,
        preset.presetId,
        preset.description ?? '',
        preset.api_base_url,
        (preset.models ?? []).join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [presets, query]);

  return (
    <div className="space-y-5 p-4" aria-busy={loadState === 'loading'} data-testid="provider-template-picker">
      {/* Start from an API type — the no-template path, kept above the fold. */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('modelServices.presets.customTitle')}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('modelServices.presets.customDescription')}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {CUSTOM_TYPE_OPTIONS.map((option) => (
            <button
              key={option.apiFormat}
              type="button"
              data-testid={`custom-type-${option.apiFormat}`}
              className="rounded-lg border border-border/60 bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onStartCustom(option.apiFormat)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Host preset catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t('providerSettings.presets.title')}
          </h3>
          <div className="relative w-56 max-w-[60%]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-8"
              placeholder={t('modelServices.presets.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t('modelServices.presets.searchPlaceholder')}
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
        </div>

        {loadState === 'error' ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground"
          >
            <p>{t('providerSettings.presets.loadFailed')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              aria-label={t('providerSettings.presets.retry')}
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            >
              {t('providerSettings.presets.retry')}
            </Button>
          </div>
        ) : loadState === 'loading' ? (
          <p className="py-8 text-center text-sm text-muted-foreground">…</p>
        ) : visiblePresets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {presets.length === 0
              ? t('providerSettings.presets.loadFailed')
              : t('modelServices.presets.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {visiblePresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isAdded={addedPresetIds.has(preset.id)}
                onSelect={() => onSelectPreset(preset.id)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderTemplatePicker;
