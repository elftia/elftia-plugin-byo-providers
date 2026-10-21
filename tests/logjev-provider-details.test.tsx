import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LLMProvider } from '../src/domain/llm';

const { save, toggle } = vi.hoisted(() => ({ save: vi.fn(), toggle: vi.fn() }));
vi.mock('../src/renderer/llmConfigClient', () => ({
  llmConfigClient: { updateProvider: save, toggleProvider: toggle },
}));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  useTranslation: () => (key: string) => key,
}));
vi.mock('../src/renderer/host/vendored/form-field', () => ({
  FormField: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('../src/renderer/host/ui', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Select: (props: Record<string, unknown>) => <select {...props} />,
  Switch: (props: Record<string, unknown>) => <input {...props} />,
}));

import { LogJevProviderDetails } from '../src/renderer/llm/LogJevProviderDetails';

const row = (id: string, extra: Partial<LLMProvider> = {}): LLMProvider => ({
  id, name: id, enabled: true, api_key: '', api_base_url: '', models: [], ...extra,
});
const reader = row('logjev', { category: 'other', logjev: { kind: 'chat' } });
const providers = [
  row('alpha', { models: ['a1', 'a2'] }),
  row('beta', { models: ['b1'] }),
  row('empty'),
  row('disabled', { enabled: false }),
  row('decision', { category: 'other' }),
  row('anthropic', { apiFormat: 'anthropic' }),
];
beforeEach(() => {
  save.mockReset().mockResolvedValue({ success: true });
  toggle.mockReset().mockResolvedValue({ success: true });
});

async function render(provider = reader) {
  let renderer!: ReactTestRenderer;
  const refresh = vi.fn(async () => {});
  const onDelete = vi.fn();
  const panel = (value: LLMProvider) => <LogJevProviderDetails provider={value}
    providers={providers} refresh={refresh} onDelete={onDelete} />;
  await act(async () => { renderer = create(panel(provider)); });
  return { renderer, refresh, field: (id: string) => renderer.root.findByProps({ id }),
    updateProvider: (value: LLMProvider) => renderer.update(panel(value)),
    switchControl: () => renderer.root.find(node => node.type === 'input' && typeof node.props.onCheckedChange === 'function'),
  };
}

describe('LogJev provider and model references', () => {
  it('filters candidates, resets the model on provider switch and saves only the reference', async () => {
    const { renderer, refresh, field } = await render();
    const candidateOptions = field('logjev-upstream-provider').props.options;
    expect(candidateOptions.map((o: { value: string }) => o.value)).toEqual(['', 'alpha', 'beta', 'empty']);
    await act(async () => field('logjev-upstream-provider').props.onChange('alpha'));
    expect(field('logjev-upstream-model').props.value).toBe('a1');
    await act(async () => field('logjev-upstream-model').props.onChange('a2'));
    await act(async () => field('logjev-upstream-provider').props.onChange('beta'));
    expect(field('logjev-upstream-model').props.value).toBe('b1');
    await act(async () => renderer.root.findByProps({ 'data-testid': 'logjev-save' }).props.onClick());
    expect(save).toHaveBeenCalledWith({ id: 'logjev', name: 'logjev',
      logjev: { kind: 'chat', upstream: { kind: 'provider', id: 'beta', model: 'b1' } } });
    expect(refresh).toHaveBeenCalledOnce();
    expect(renderer.root.findByProps({ role: 'status' }).children).toEqual(['logjev.saved']);
    await act(async () => renderer.unmount());
  });

  it('persists the first toggle without saving or selecting an upstream and follows refreshed state', async () => {
    const disabled = { ...reader, enabled: false };
    const { renderer, refresh, switchControl, updateProvider } = await render(disabled);
    refresh.mockImplementation(async () => updateProvider({ ...disabled, enabled: toggle.mock.calls.at(-1)![1] }));
    expect(switchControl().props.checked).toBe(false);
    await act(async () => switchControl().props.onCheckedChange(true));
    expect(toggle).toHaveBeenNthCalledWith(1, 'logjev', true);
    expect(refresh).toHaveBeenCalledOnce();
    expect(switchControl().props.checked).toBe(true);
    expect(save).not.toHaveBeenCalled();
    await act(async () => switchControl().props.onCheckedChange(false));
    expect(toggle).toHaveBeenNthCalledWith(2, 'logjev', false);
    expect(switchControl().props.checked).toBe(false);
    await act(async () => updateProvider({ ...disabled, enabled: true }));
    expect(switchControl().props.checked).toBe(true);
    await act(async () => renderer.unmount());
  });

  it.each(['rejected', 'unsuccessful'])('retains the persisted state and reports a %s toggle', async failure => {
    const { renderer, refresh, switchControl } = await render({ ...reader, enabled: false });
    if (failure === 'rejected') toggle.mockRejectedValueOnce(new Error('unavailable'));
    else toggle.mockResolvedValueOnce({ success: false });
    await act(async () => switchControl().props.onCheckedChange(true));
    expect(switchControl().props.checked).toBe(false);
    expect(switchControl().props.disabled).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ role: 'alert' }).children).toEqual(['providerSettings.errors.saveFailed']);
    await act(async () => renderer.unmount());
  });

  it('keeps draft settings through a toggle and prevents overlapping writes', async () => {
    const disabled = { ...reader, enabled: false };
    const { renderer, refresh, field, switchControl, updateProvider } = await render(disabled);
    await act(async () => field('logjev-upstream-provider').props.onChange('beta'));
    let finish!: (result: { success: boolean }) => void;
    toggle.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    refresh.mockImplementation(async () => updateProvider({ ...disabled, enabled: true }));
    let pending!: Promise<void>;
    await act(async () => {
      const change = switchControl().props.onCheckedChange;
      pending = change(true);
      await change(false);
    });
    expect(toggle).toHaveBeenCalledOnce();
    expect(switchControl().props.disabled).toBe(true);
    expect(renderer.root.findByProps({ 'data-testid': 'logjev-save' }).props.disabled).toBe(true);
    await act(async () => { finish({ success: true }); await pending; });
    expect(field('logjev-upstream-provider').props.value).toBe('beta');
    expect(field('logjev-upstream-model').props.value).toBe('b1');
    await act(async () => renderer.root.findByProps({ 'data-testid': 'logjev-save' }).props.onClick());
    expect(save).toHaveBeenCalledWith({ id: 'logjev', name: 'logjev',
      logjev: { kind: 'chat', upstream: { kind: 'provider', id: 'beta', model: 'b1' } } });
    expect(switchControl().props.checked).toBe(true);
    await act(async () => renderer.unmount());
  });

  it('restores a saved custom model and rejects an unavailable provider', async () => {
    const { renderer, field } = await render(row('saved', { category: 'other', logjev: {
      kind: 'chat', upstream: { kind: 'provider', id: 'alpha', model: 'custom' },
    } }));
    expect(field('logjev-upstream-model').props.value).toBe('custom');
    expect(field('logjev-upstream-model').props.options[0].value).toBe('custom');
    await act(async () => renderer.unmount());
    const unavailable = await render(row('saved', { category: 'other', logjev: {
      kind: 'chat', upstream: { kind: 'provider', id: 'disabled', model: 'old' },
    } }));
    expect(unavailable.field('logjev-upstream-provider').props.value).toBe('disabled');
    expect(unavailable.renderer.root.findByProps({ 'data-testid': 'logjev-save' }).props.disabled).toBe(true);
    await act(async () => unavailable.renderer.unmount());
  });

  it('requires a model for empty model lists and reports persistence failures', async () => {
    const { renderer, field } = await render();
    await act(async () => field('logjev-upstream-provider').props.onChange('empty'));
    expect(renderer.root.findByProps({ 'data-testid': 'logjev-save' }).props.disabled).toBe(true);
    await act(async () => field('logjev-upstream-model').props.onChange({ target: { value: 'custom' } }));
    save.mockResolvedValue({ success: false });
    await act(async () => renderer.root.findByProps({ 'data-testid': 'logjev-save' }).props.onClick());
    expect(renderer.root.findByProps({ role: 'alert' }).children).toEqual(['providerSettings.errors.saveFailed']);
    await act(async () => renderer.unmount());
  });
});
