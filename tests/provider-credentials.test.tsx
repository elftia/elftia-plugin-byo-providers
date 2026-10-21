import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LLMProvider } from '../src/domain/llm';

const client = vi.hoisted(() => ({
  revealProviderKey: vi.fn(),
  updateProvider: vi.fn(),
}));

vi.mock('../src/renderer/llmConfigClient', () => ({ llmConfigClient: client }));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  useTranslation: () => (key: string) => key,
}));

import { useProviderForm } from '../src/renderer/llm/hooks/useProviderForm';

function provider(id: string, overrides: Partial<LLMProvider> = {}): LLMProvider {
  return {
    id,
    name: id,
    apiFormat: 'openai',
    api_base_url: `https://${id}.example/v1`,
    api_key: '',
    hasKey: true,
    models: [],
    enabled: true,
    ...overrides,
  };
}

function deferredReveal() {
  let resolve!: (value: { success: boolean; value: string }) => void;
  const promise = new Promise<{ success: boolean; value: string }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('provider credential selection', () => {
  let renderer: ReactTestRenderer;
  let form: ReturnType<typeof useProviderForm>;
  const refresh = vi.fn(async () => undefined);
  const updateCache = vi.fn();
  const providers = [provider('alpha'), provider('beta', { api_key: '$BETA_KEY' })];

  function Harness({ selected }: { selected: LLMProvider | null }) {
    form = useProviderForm(
      providers,
      selected?.id ?? null,
      vi.fn(),
      selected,
      refresh,
      updateCache
    );
    return null;
  }

  function select(selected: LLMProvider | null) {
    act(() => renderer.update(<Harness selected={selected} />));
  }

  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget());
    vi.resetAllMocks();
    client.revealProviderKey.mockResolvedValue({
      success: true,
      value: 'stored-alpha',
    });
    client.updateProvider.mockResolvedValue({ success: true });
    act(() => {
      renderer = create(<Harness selected={providers[0]} />);
    });
  });

  afterEach(() => {
    act(() => renderer.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('automatically hides and drops the saved key after 30 seconds', async () => {
    vi.useFakeTimers();
    await act(async () => {
      form.handleToggleShowApiKey(true);
    });
    expect(form.revealedApiKey).toBe('stored-alpha');
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(form.revealedApiKey).toBeNull();
    expect(form.showApiKey).toBe(false);
    expect(client.updateProvider).not.toHaveBeenCalled();
  });

  it.each(['blur', 'elftia-host-window-blur'])(
    'drops visible and pending secrets on %s',
    async (event) => {
      await act(async () => {
        form.handleToggleShowApiKey(true);
      });
      act(() => {
        window.dispatchEvent(new Event(event));
      });
      expect(form.revealedApiKey).toBeNull();
      expect(form.showApiKey).toBe(false);
      const pending = deferredReveal();
      client.revealProviderKey.mockReturnValueOnce(pending.promise);
      act(() => {
        form.handleToggleShowApiKey(true);
      });
      act(() => {
        window.dispatchEvent(new Event(event));
      });
      await act(async () => {
        pending.resolve({ success: true, value: 'stale-key' });
      });
      expect(form.revealedApiKey).toBeNull();
      expect(form.showApiKey).toBe(false);
    }
  );

  it('initializes fields for an already-selected provider', () => {
    expect(form.inlineName).toBe('alpha');
    expect(form.inlineApiUrl).toBe('https://alpha.example/v1');
    expect(form.showApiKey).toBe(false);
  });

  it('requests protected viewing even when stored-key metadata is missing', async () => {
    select(provider('legacy', { hasKey: false }));

    await act(async () => {
      form.handleToggleShowApiKey(true);
    });

    expect(client.revealProviderKey).toHaveBeenCalledWith('legacy');
    expect(form.revealedApiKey).toBe('stored-alpha');
    expect(client.updateProvider).not.toHaveBeenCalled();
  });

  it('resets the draft and visibility when switching providers and switching back', () => {
    act(() => {
      form.handleApiKeyInputChange('replacement-alpha');
      form.handleToggleShowApiKey(true);
    });
    select(providers[1]);
    expect(form.inlineApiKey).toBe('$BETA_KEY');
    expect(form.revealedApiKey).toBeNull();
    expect(form.showApiKey).toBe(false);
    select(providers[0]);
    expect(form.inlineApiKey).toBe('');
    expect(form.showApiKey).toBe(false);
    expect(client.updateProvider).not.toHaveBeenCalled();
  });

  it('drops a revealed key on switch and reveals only the newly-selected key', async () => {
    await act(async () => {
      form.handleToggleShowApiKey(true);
    });
    expect(form.revealedApiKey).toBe('stored-alpha');
    expect(form.inlineApiKey).toBe('');
    select(provider('gamma'));
    expect(form.revealedApiKey).toBeNull();
    expect(form.showApiKey).toBe(false);
    client.revealProviderKey.mockResolvedValue({
      success: true,
      value: 'stored-gamma',
    });
    await act(async () => {
      form.handleToggleShowApiKey(true);
    });
    expect(client.revealProviderKey).toHaveBeenLastCalledWith('gamma');
    expect(form.revealedApiKey).toBe('stored-gamma');
    expect(client.updateProvider).not.toHaveBeenCalled();
  });

  it('clears credentials when the selected provider disappears', () => {
    act(() => {
      form.handleApiKeyInputChange('replacement-alpha');
      form.handleToggleShowApiKey(true);
    });
    select(null);
    expect(form.inlineApiKey).toBe('');
    expect(form.revealedApiKey).toBeNull();
    expect(form.showApiKey).toBe(false);
  });

  it.each(['switch', 'switch-back', 'hide', 'edit'] as const)(
    'ignores a pending key reveal after %s',
    async (action) => {
      const pending = deferredReveal();
      client.revealProviderKey.mockReturnValueOnce(pending.promise);
      act(() => {
        form.handleToggleShowApiKey(true);
      });
      if (action === 'switch' || action === 'switch-back') {
        select(providers[1]);
        if (action === 'switch-back') select(providers[0]);
      } else {
        act(() => {
          if (action === 'hide') form.handleToggleShowApiKey(false);
          else form.handleApiKeyInputChange('replacement-alpha');
        });
      }
      await act(async () => {
        pending.resolve({ success: true, value: 'stale-alpha' });
      });
      expect(form.revealedApiKey).toBeNull();
      if (action === 'edit') expect(form.inlineApiKey).toBe('replacement-alpha');
    }
  );

  it('keeps an empty replacement from overwriting a stored key', async () => {
    await act(async () => {
      await form.handleInlineUpdate('api_key', '');
    });
    expect(client.updateProvider).not.toHaveBeenCalled();
    await act(async () => {
      const result = await form.handleInlineUpdate('api_key', 'replacement-alpha');
      expect(result).toEqual({ success: true });
    });
    expect(client.updateProvider).toHaveBeenCalledWith({
      id: 'alpha',
      api_key: 'replacement-alpha',
    });
    expect(form.inlineApiKey).toBe('');
    expect(updateCache).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'alpha', api_key: '', hasKey: true })
    );
    expect(JSON.stringify(updateCache.mock.calls)).not.toContain('replacement-alpha');
  });

  it('surfaces an inline key write failure and keeps the draft for retry', async () => {
    client.updateProvider.mockResolvedValueOnce({ success: false, message: 'write failed' });
    act(() => form.handleApiKeyInputChange('replacement-alpha'));
    let result!: Awaited<ReturnType<typeof form.handleInlineUpdate>>;
    await act(async () => {
      result = await form.handleInlineUpdate('api_key', 'replacement-alpha');
    });
    expect(result).toEqual({ success: false, message: 'write failed' });
    expect(form.inlineApiKey).toBe('replacement-alpha');
    expect(updateCache).not.toHaveBeenCalled();
  });

  it('does not report a failed full-form update as saved', async () => {
    client.updateProvider.mockResolvedValueOnce({ success: false, message: 'write failed' });
    act(() => form.handleEditProvider());
    act(() => form.setFormData((current) => ({ ...current, api_key: 'replacement-alpha' })));
    await act(async () => {
      await form.handleSaveProvider();
    });
    expect(client.updateProvider).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'alpha', api_key: 'replacement-alpha' })
    );
    expect(form.isEditing).toBe(true);
    expect(form.formError).toBe('write failed');
  });
});
