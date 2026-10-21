import { Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

import type { LLMProvider } from '@byo/domain/llm';
import type { LogJevSettings } from '@omnicross/contracts/logjev';

import { Button, Input, Select, Switch } from '../host/ui';
import { FormField } from '../host/vendored/form-field';
import { useTranslation } from '../host/vendored/useTranslation';
import { llmConfigClient } from '../llmConfigClient';

export function isLogJevProvider(provider: LLMProvider): boolean {
  return provider.category === 'other' && (
    provider.logjev?.kind === 'chat' || provider.presetId === 'logjev' || provider.id === 'logjev'
  );
}

function modelIds(provider?: LLMProvider): string[] {
  return provider?.modelConfigs?.length
    ? provider.modelConfigs.filter(model => model.enabled !== false).map(model => model.id)
    : provider?.models ?? [];
}

/** Chat LogJev borrows an existing language provider; credentials stay host-owned. */
export function LogJevProviderDetails({ provider, providers, refresh, onDelete }: {
  provider: LLMProvider;
  providers: LLMProvider[];
  refresh: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const t = useTranslation();
  const [settings, setSettings] = useState<LogJevSettings>(provider.logjev ?? { kind: 'chat' });
  const [name, setName] = useState(provider.name);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const writing = useRef(false);
  const [status, setStatus] = useState<'saved' | 'error' | null>(null);
  const candidates = providers.filter(p => p.id !== provider.id && p.enabled !== false &&
    p.category !== 'other' && (p.apiFormat || 'openai') === 'openai');
  const upstream = settings.upstream?.kind === 'provider' ? settings.upstream : undefined;
  const selected = candidates.find(p => p.id === upstream?.id);
  const models = modelIds(selected);
  const update = (patch: Partial<LogJevSettings>) => {
    setSettings(previous => ({ ...previous, ...patch }));
    setStatus(null);
  };
  const ready = Boolean(selected && upstream?.model.trim() && name.trim());

  const toggle = async (enabled: boolean) => {
    if (writing.current) return;
    writing.current = true;
    setToggling(true);
    setStatus(null);
    try {
      const result = await llmConfigClient.toggleProvider(provider.id, enabled);
      if (!result.success) throw new Error('toggle failed');
      await refresh();
    } catch {
      setStatus('error');
    } finally {
      writing.current = false;
      setToggling(false);
    }
  };

  const save = async () => {
    if (!ready || writing.current) return;
    writing.current = true;
    setSaving(true);
    setStatus(null);
    try {
      const result = await llmConfigClient.updateProvider({
        id: provider.id, name: name.trim(),
        logjev: { ...settings, kind: 'chat', upstream: { ...upstream!, model: upstream!.model.trim() } },
      });
      if (!result.success) throw new Error('save failed');
      await refresh();
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      writing.current = false;
      setSaving(false);
    }
  };

  return <div className="space-y-5 p-4 md:p-6" data-testid="logjev-provider-details">
    <div className="flex items-center justify-between">
      <h2 className="h-9 text-lg font-semibold flex items-center">LogJev</h2>
      <div className="flex items-center gap-2">
        <Switch checked={provider.enabled} disabled={saving || toggling} onCheckedChange={toggle}
          aria-label={t('providerSettings.form.enabled')} data-testid="logjev-enabled" />
        {!provider.isSystem && <Button variant="ghost" size="sm" disabled={saving || toggling}
          className="text-destructive hover:text-destructive" onClick={() => void onDelete()}
          title={t('common.delete')} aria-label={t('common.delete')} data-testid="logjev-delete">
          <Trash2 className="h-4 w-4" />
        </Button>}
      </div>
    </div>
    <p className="text-sm text-muted-foreground">{t('logjev.upstreamNote')}</p>
    <FormField label={t('providerSettings.form.name')}>
      <Input value={name} disabled={saving} onChange={event => { setName(event.target.value); setStatus(null); }} />
    </FormField>
    <FormField label={t('logjev.upstream')}>
      <Select id="logjev-upstream-provider" value={upstream?.id ?? ''} disabled={saving}
        options={[
          { value: '', label: t('logjev.selectProvider') },
          ...(upstream && !selected ? [{ value: upstream.id, label: `${upstream.id} (${t('logjev.unavailable')})`, disabled: true }] : []),
          ...candidates.map(p => ({ value: p.id, label: p.name || p.id })),
        ]}
        onChange={id => update({ upstream: id ? { kind: 'provider', id, model: modelIds(candidates.find(p => p.id === id))[0] ?? '' } : undefined })}
      />
    </FormField>
    {candidates.length === 0 && <p role="status" className="text-sm text-muted-foreground">{t('logjev.noProviders')}</p>}
    <FormField label={t('logjev.upstreamModel')}>
      {models.length > 0 ? <Select id="logjev-upstream-model" value={upstream?.model ?? ''}
        disabled={saving || !selected}
        options={[
          ...(upstream?.model && !models.includes(upstream.model) ? [{ value: upstream.model, label: upstream.model }] : []),
          ...models.map(id => ({ value: id, label: id })),
        ]}
        onChange={model => upstream && update({ upstream: { ...upstream, model } })}
      /> : <Input id="logjev-upstream-model" value={upstream?.model ?? ''}
        disabled={saving || !selected} placeholder={t('logjev.modelPlaceholder')}
        onChange={event => upstream && update({ upstream: { ...upstream, model: event.target.value } })}
      />}
    </FormField>
    <FormField label={t('logjev.prompt')}>
      <Select value={settings.promptMode ?? 'full'} disabled={saving} options={[
        { value: 'full', label: t('logjev.full') }, { value: 'minimal', label: t('logjev.minimal') },
      ]} onChange={value => update({ promptMode: value === 'minimal' ? 'minimal' : 'full' })} />
    </FormField>
    <FormField label={t('logjev.topk')}>
      <Input type="number" min={1} max={100} value={settings.topk ?? 20} disabled={saving}
        onChange={event => {
          const value = Number(event.target.value);
          if (Number.isInteger(value) && value >= 1 && value <= 100) update({ topk: value });
        }} />
    </FormField>
    <div className="flex items-center gap-3">
      <Button disabled={!ready || saving || toggling} onClick={() => void save()} data-testid="logjev-save">{t('logjev.save')}</Button>
      {status && <span role={status === 'error' ? 'alert' : 'status'} className="text-sm">
        {t(status === 'error' ? 'providerSettings.errors.saveFailed' : 'logjev.saved')}
      </span>}
    </div>
  </div>;
}
