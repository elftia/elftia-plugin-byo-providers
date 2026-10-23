import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  configs: {} as Record<string, Record<string, unknown>>,
  keys: {} as Record<string, string>,
  passwords: {} as Record<string, string>,
}));
vi.mock('../src/renderer/host/hostBridge', () => ({ getHost: () => ({ react: { instance: React } }) }));
vi.mock('../src/renderer/host/ui', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Select: (props: Record<string, unknown>) => <div {...props} />,
  Switch: (props: Record<string, unknown>) => <button {...props} />,
}));
vi.mock('../src/renderer/host/vendored/label', () => ({
  Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
}));
vi.mock('../src/renderer/host/vendored/revealable-input', () => ({
  RevealableInput: ({ revealed, onRevealedChange, ...props }: Record<string, unknown>) => <input {...props} />,
}));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({ useTranslation: () => (key: string) => key }));
vi.mock('../src/renderer/shared/MigrationPackDialogs', () => ({ MigrationPackDialogs: () => null }));
vi.mock('../src/renderer/searchConfigClient', () => {
  const publicIds: Record<string, true> = { exa: true, parallel: true, firecrawl: true };
  return { searchConfigClient: {
    getProviderConfig: vi.fn(async (id: string) => {
      const config = state.configs[id];
      const authMode = publicIds[id] ? config?.authMode ?? (state.keys[id] ? 'api' : 'public') : undefined;
      return {
        id, enabled: false, ...config, authMode,
        hasApiKey: Boolean(state.keys[id]),
        hasBasicAuthPassword: Boolean(state.passwords[id]),
        configured: id === 'searxng' ? Boolean(config?.apiHost)
          : authMode === 'public' || Boolean(state.keys[id]),
      };
    }),
    isProviderEnabled: vi.fn(async (id: string) => state.configs[id]?.enabled === true),
    configureProvider: vi.fn(async (config: { id: string; [key: string]: unknown }) => {
      if (publicIds[config.id] && config.authMode === 'api' && config.enabled === true && !state.keys[config.id]) {
        return { success: false, error: 'API key required' };
      }
      const { basicAuthPassword, ...nonSecret } = config;
      if (typeof basicAuthPassword === 'string') state.passwords[config.id] = basicAuthPassword;
      state.configs[config.id] = { ...state.configs[config.id], ...nonSecret };
      return { success: true };
    }),
    setProviderKey: vi.fn(async (id: string, key: string) => {
      state.keys[id] = key;
      return { success: true };
    }),
    validate: vi.fn(async (id: string) => ({
      valid: state.configs[id]?.authMode !== 'api' || Boolean(state.keys[id]),
      error: state.keys[id] ? undefined : 'API key required',
    })),
  } };
});

import { searchConfigClient } from '../src/renderer/searchConfigClient';
import { SearchProviderSettings } from '../src/renderer/search/SearchProviderSettings';

let renderer: ReactTestRenderer;
const find = (testId: string) => renderer.root.findByProps({ 'data-testid': testId });

beforeEach(() => {
  state.configs = {};
  state.keys = {};
  state.passwords = {};
  vi.clearAllMocks();
});
afterEach(() => act(() => renderer?.unmount()));

async function selectExa() {
  await act(async () => { renderer = create(<SearchProviderSettings />); });
  act(() => find('sidebar-item-exa').props.onClick());
}

describe('search provider settings interactions', () => {
  it('enables public search and validates with a blank key, without writing any secret', async () => {
    await selectExa();
    expect(find('settings-button-search-exa-toggle').props.checked).toBe(false);
    await act(async () => find('settings-button-search-exa-toggle').props.onCheckedChange(true));
    await act(async () => find('settings-button-search-validate').props.onClick());
    expect(state.configs.exa).toMatchObject({ enabled: true, authMode: 'public' });
    expect(searchConfigClient.setProviderKey).not.toHaveBeenCalled();
    expect(searchConfigClient.validate).toHaveBeenCalledWith('exa');
    expect(find('settings-container-search-validation').children).toContain('settings.webSearch.validationSuccess');
  });

  it('retains stored keys across mode changes and flushes a replacement before validation', async () => {
    state.keys.exa = 'original-key';
    await selectExa();
    expect(find('settings-input-search-api-key').props.value).toBe('');
    await act(async () => find('settings-input-search-auth-mode').props.onChange('api'));
    await act(async () => find('settings-input-search-auth-mode').props.onChange('public'));
    expect(state.keys.exa).toBe('original-key');
    expect(searchConfigClient.setProviderKey).not.toHaveBeenCalled();
    await act(async () => find('settings-input-search-auth-mode').props.onChange('api'));
    act(() => find('settings-input-search-api-key').props.onChange({ target: { value: 'replacement-key' } }));
    await act(async () => find('settings-button-search-validate').props.onClick());
    expect(searchConfigClient.setProviderKey).toHaveBeenCalledWith('exa', 'replacement-key');
    expect(vi.mocked(searchConfigClient.setProviderKey).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(searchConfigClient.validate).mock.invocationCallOrder[0]);
    for (const [config] of vi.mocked(searchConfigClient.configureProvider).mock.calls) {
      expect(config).not.toHaveProperty('apiKey');
    }
  });

  it('cannot enable or validate an API-mode draft without a key, then saves it after the key lands', async () => {
    await selectExa();
    await act(async () => find('settings-button-search-exa-toggle').props.onCheckedChange(true));
    await act(async () => find('settings-input-search-auth-mode').props.onChange('api'));
    expect(state.configs.exa?.authMode).not.toBe('api');
    expect(renderer.root.findByProps({ role: 'alert' }).children).toContain('API key required');
    act(() => find('sidebar-item-claude').props.onClick());
    await act(async () => find('settings-input-search-model').props.onChange({ target: { value: 'claude-custom-model' } }));
    act(() => find('sidebar-item-exa').props.onClick());
    expect(renderer.root.findByProps({ role: 'alert' }).children).toContain('API key required');
    await act(async () => find('settings-button-search-validate').props.onClick());
    expect(find('settings-container-search-validation').children).toContain('API key required');
    expect(searchConfigClient.validate).not.toHaveBeenCalled();
    await act(async () => find('settings-button-search-exa-toggle').props.onCheckedChange(false));
    expect(state.configs.exa).toMatchObject({ enabled: false, authMode: 'api' });
    await act(async () => find('settings-button-search-exa-toggle').props.onCheckedChange(true));
    expect(state.configs.exa?.enabled).toBe(false);
    act(() => find('settings-input-search-api-key').props.onChange({ target: { value: 'new-key' } }));
    await act(async () => find('settings-button-search-validate').props.onClick());
    expect(state.configs.exa?.authMode).toBe('api');
    expect(searchConfigClient.validate).toHaveBeenCalledWith('exa');
    expect(find('settings-container-search-validation').children).toContain('settings.webSearch.validationSuccess');
  });

  it('persists the Claude model override and offers no model override for direct Perplexity search', async () => {
    await selectExa();
    act(() => find('sidebar-item-claude').props.onClick());
    await act(async () => find('settings-input-search-model').props.onChange({ target: { value: 'claude-custom-model' } }));
    expect(state.configs.claude?.model).toBe('claude-custom-model');
    act(() => renderer.unmount());
    await act(async () => { renderer = create(<SearchProviderSettings />); });
    act(() => find('sidebar-item-claude').props.onClick());
    expect(find('settings-input-search-model').props.value).toBe('claude-custom-model');
    state.configs.perplexity = { model: 'obsolete-chat-model' };
    act(() => find('sidebar-item-perplexity').props.onClick());
    expect(renderer.root.findAllByProps({ 'data-testid': 'settings-input-search-model' })).toHaveLength(0);
    await act(async () => find('settings-input-search-api-host').props.onChange({ target: { value: 'https://api.perplexity.ai' } }));
    expect(vi.mocked(searchConfigClient.configureProvider).mock.calls.at(-1)?.[0]).not.toHaveProperty('model');
  });

  it.each(['exa', 'parallel', 'firecrawl'])('restores %s public mode and endpoint without echoing or deleting a retained key', async (id) => {
    state.keys[id] = 'retained-key';
    state.configs[id] = { enabled: true, authMode: 'public', apiHost: 'https://private.example' };
    await selectExa();
    act(() => find(`sidebar-item-${id}`).props.onClick());
    expect(find('settings-input-search-auth-mode').props.value).toBe('public');
    expect(find('settings-input-search-api-key').props.value).toBe('');
    expect(renderer.root.findAllByProps({ 'data-testid': 'settings-input-search-api-host' })).toHaveLength(0);
    act(() => find('settings-input-search-api-key').props.onChange({ target: { value: '' } }));
    await act(async () => find('settings-button-search-validate').props.onClick());
    expect(searchConfigClient.setProviderKey).not.toHaveBeenCalled();
    expect(state.configs[id]?.authMode).toBe('public');
    await act(async () => find('settings-input-search-auth-mode').props.onChange('api'));
    expect(find('settings-input-search-api-host').props.value).toBe('https://private.example');
    act(() => renderer.unmount());
    await act(async () => { renderer = create(<SearchProviderSettings />); });
    act(() => find(`sidebar-item-${id}`).props.onClick());
    expect(find('settings-input-search-auth-mode').props.value).toBe('api');
    expect(find(`settings-button-search-${id}-toggle`).props.checked).toBe(true);
    expect(find('settings-input-search-api-key').props.value).toBe('');
    expect(state.keys[id]).toBe('retained-key');
    await act(async () => find('settings-button-clear-search-key').props.onClick());
    expect(state.keys[id]).toBe('');
    expect(state.configs[id]?.authMode).toBe('api');
  });

  it('keeps SearXNG passwords write-only, preserves them on blank/unrelated edits, and clears explicitly', async () => {
    state.passwords.searxng = 'stored-password';
    state.configs.searxng = { enabled: true, apiHost: 'https://search.example' };
    await selectExa();
    act(() => find('sidebar-item-searxng').props.onClick());
    expect(find('settings-input-search-basic-password').props.value).toBe('');
    await act(async () => find('settings-input-search-basic-username').props.onChange({ target: { value: 'alice' } }));
    act(() => find('settings-input-search-basic-password').props.onChange({ target: { value: '' } }));
    expect(state.passwords.searxng).toBe('stored-password');
    expect(vi.mocked(searchConfigClient.configureProvider).mock.calls.at(-1)?.[0]).not.toHaveProperty('basicAuthPassword');
    await act(async () => find('settings-input-search-basic-password').props.onChange({ target: { value: 'replacement-password' } }));
    expect(state.passwords.searxng).toBe('replacement-password');
    await act(async () => find('settings-input-search-api-host').props.onChange({ target: { value: 'https://other.example' } }));
    expect(vi.mocked(searchConfigClient.configureProvider).mock.calls.at(-1)?.[0]).not.toHaveProperty('basicAuthPassword');
    await act(async () => find('settings-button-clear-search-password').props.onClick());
    expect(state.passwords.searxng).toBe('');
  });

  it.each([
    'tavily', 'jina', 'searxng', 'zhipu', 'z.ai', 'deepseek', 'exa', 'parallel', 'firecrawl',
    'brave', 'kagi', 'kimi', 'synthetic', 'ollama', 'tinyfish', 'perplexity', 'bocha', 'claude',
  ])('persists %s enablement and endpoint through a settings remount', async (id) => {
    state.keys[id] = 'stored-key';
    await selectExa();
    act(() => find(`sidebar-item-${id}`).props.onClick());
    expect(find(`settings-button-search-${id}-toggle`).props.checked).toBe(false);
    await act(async () => find('settings-input-search-api-host').props.onChange({ target: { value: 'https://custom.example' } }));
    await act(async () => find(`settings-button-search-${id}-toggle`).props.onCheckedChange(true));
    act(() => renderer.unmount());
    await act(async () => { renderer = create(<SearchProviderSettings />); });
    act(() => find(`sidebar-item-${id}`).props.onClick());
    expect(find(`settings-button-search-${id}-toggle`).props.checked).toBe(true);
    expect(find('settings-input-search-api-host').props.value).toBe('https://custom.example');
    expect(state.keys[id]).toBe('stored-key');
    for (const [config] of vi.mocked(searchConfigClient.configureProvider).mock.calls) {
      expect(config).not.toHaveProperty('apiKey');
    }
  });
});
