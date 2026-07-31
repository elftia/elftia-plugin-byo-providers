import { Check, Plus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import type { PresetProviderTemplate } from '@byo/domain/provider-presets';

import { Badge, Button } from '../host/ui';
import { cn } from '../host/vendored/cn';
import { useTranslation } from '../host/vendored/useTranslation';
import { llmConfigClient } from '../llmConfigClient';

import { getProviderIcon } from './utils';

interface PresetProviderGridProps {
  /** Set of preset `id` values already added (use preset.id, not presetId — the
   *  same presetId may appear on multiple variants like Xiaomi MiMo OpenAI/Anthropic). */
  addedPresetIds: Set<string>;
  /** Called with the preset's unique `id` (not `presetId`). The backend's
   *  `addFromPreset` accepts either, but `id` disambiguates variants. */
  onSelectPreset: (presetId: string) => void;
}

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

export function PresetProviderGrid({ addedPresetIds, onSelectPreset }: PresetProviderGridProps) {
  const t = useTranslation();
  const [presets, setPresets] = useState<PresetProviderTemplate[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);

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

  return (
    <div className="space-y-4" aria-busy={loadState === 'loading'}>
      <h3 className="text-sm font-semibold text-foreground">
        {t('providerSettings.presets.title')}
      </h3>
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((preset) => (
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
  );
}
