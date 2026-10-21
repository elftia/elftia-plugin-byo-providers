import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LLMProvider } from '../src/domain/llm';

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../src/renderer/llmConfigClient', () => ({ llmConfigClient: { updateProvider: save } }));
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
beforeEach(() => save.mockReset().mockResolvedValue({ success: true }));

async function render(provider = reader) {
  let renderer!: ReactTestRenderer;
  const refresh = vi.fn(async () => {});
  await act(async () => { renderer = create(<LogJevProviderDetails provider={provider}
    providers={providers} refresh={refresh} onDelete={vi.fn()} />); });
  return { renderer, refresh, field: (id: string) => renderer.root.findByProps({ id }) };
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
    expect(save).toHaveBeenCalledWith({ id: 'logjev', name: 'logjev', enabled: true,
      logjev: { kind: 'chat', upstream: { kind: 'provider', id: 'beta', model: 'b1' } } });
    expect(refresh).toHaveBeenCalledOnce();
    expect(renderer.root.findByProps({ role: 'status' }).children).toEqual(['logjev.saved']);
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
