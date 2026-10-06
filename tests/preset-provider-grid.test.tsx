import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getProviderPresets } = vi.hoisted(() => ({
  getProviderPresets: vi.fn(),
}));

vi.mock('../src/renderer/llmConfigClient', () => ({
  llmConfigClient: { getProviderPresets },
}));

vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  readLocale: () => 'en',
  registerLlmI18n: () => undefined,
  useTranslation: () => (key: string) =>
    ({
      'providerSettings.presets.title': 'Quick Add Provider',
      'providerSettings.presets.loadFailed': 'Unable to load provider presets.',
      'providerSettings.presets.retry': 'Retry',
      'providerSettings.presets.add': 'Add',
      'providerSettings.presets.added': 'Added',
      'modelServices.presets.customTitle': 'Start from an API type',
      'modelServices.presets.customDescription': 'No template needed.',
      'modelServices.presets.searchPlaceholder': 'Search presets…',
      'modelServices.presets.empty': 'No presets match your search.',
    })[key] ?? key,
}));

vi.mock('../src/renderer/host/ui', async () => {
  const ReactModule = await import('react');
  return {
    Badge: ({ children }: React.PropsWithChildren) =>
      ReactModule.createElement('span', null, children),
    Button: ({
      children,
      variant: _variant,
      size: _size,
      ...props
    }: React.PropsWithChildren<
      React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: string;
        size?: string;
      }
    >) => ReactModule.createElement('button', props, children),
    Input: ({
      value,
      onChange,
      placeholder,
      ...props
    }: React.PropsWithChildren<
      React.InputHTMLAttributes<HTMLInputElement> & { density?: string }
    >) =>
      ReactModule.createElement('input', {
        ...props,
        value: value ?? '',
        placeholder,
        onChange,
      }),
  };
});

vi.mock('../src/renderer/llm/utils', () => ({
  getProviderIcon: () => null,
}));

import { ProviderTemplatePicker } from '../src/renderer/llm/PresetProviderGrid';

/** A catalog preset shaped like the host `getProviderPresets` port output. */
function preset(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    presetId: id,
    name: id === 'commandcode' ? 'Command Code' : id,
    apiFormat: 'openai',
    api_base_url: `https://${id}.example.invalid/v1`,
    models: [`${id}-model-a`],
    ...overrides,
  };
}

function renderPicker(
  addedPresetIds: Set<string> = new Set(),
  handlers: {
    onSelectPreset?: (id: string) => void;
    onStartCustom?: (apiFormat: string) => void;
  } = {},
): React.ReactElement {
  return (
    <ProviderTemplatePicker
      addedPresetIds={addedPresetIds}
      onSelectPreset={handlers.onSelectPreset ?? vi.fn()}
      onStartCustom={handlers.onStartCustom ?? vi.fn()}
    />
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  getProviderPresets.mockReset();
});

describe('ProviderTemplatePicker catalog', () => {
  it('renders presets returned by the host port, including commandcode', async () => {
    getProviderPresets.mockResolvedValueOnce([
      preset('openai'),
      preset('commandcode', {
        apiFormat: 'openai',
        features: ['coding-plan'],
        formatVariants: { anthropic: 'anthropic', 'openai-response': 'openai-response' },
      }),
    ]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPicker());
    });

    // The multi-wire commandcode preset (openai primary + anthropic /
    // openai-response variants) renders as ONE addable card keyed by its id.
    expect(renderer.root.findByProps({ 'data-testid': 'preset-card-commandcode' })).toBeDefined();
    expect(renderer.root.findByProps({ 'aria-busy': false })).toBeDefined();
  });

  it('badges added presets and disables their Add button', async () => {
    getProviderPresets.mockResolvedValueOnce([preset('kimi'), preset('openai')]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPicker(new Set(['kimi'])));
    });

    const kimiCard = renderer.root.findByProps({ 'data-testid': 'preset-card-kimi' });
    expect(JSON.stringify(renderer.toJSON())).toContain('Added');
    // The disabled Add button: find buttons inside the kimi card with disabled.
    const kimiButtons = kimiCard.findAllByType('button');
    // PresetCard's Add is the only button in the card.
    expect(kimiButtons.length).toBe(1);
    expect(kimiButtons[0]?.props.disabled).toBe(true);

    // A NOT-added preset's Add button stays enabled and fires onSelectPreset
    // with the preset's unique `id` (variant disambiguation).
    const onSelectPreset = vi.fn();
    await act(async () => {
      renderer.update(renderPicker(new Set(['kimi']), { onSelectPreset }));
    });
    const openaiButtons = renderer.root
      .findByProps({ 'data-testid': 'preset-card-openai' })
      .findAllByType('button');
    expect(openaiButtons[0]?.props.disabled).toBe(false);
    await act(async () => {
      openaiButtons[0]?.props.onClick();
    });
    expect(onSelectPreset).toHaveBeenCalledWith('openai');
  });

  it('narrows the grid to presets matching the search query', async () => {
    getProviderPresets.mockResolvedValueOnce([
      preset('openai', { description: 'The OpenAI API' }),
      preset('commandcode'),
    ]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPicker());
    });

    const search = renderer.root.findByProps({
      placeholder: 'Search presets…',
    });
    expect(search).toBeDefined();

    await act(async () => {
      search.props.onChange({ target: { value: 'command' } });
    });

    expect(renderer.root.findByProps({ 'data-testid': 'preset-card-commandcode' })).toBeDefined();
    expect(renderer.root.findAllByProps({ 'data-testid': 'preset-card-openai' })).toHaveLength(0);
  });

  it('offers the API-type escape hatch, wired to onStartCustom', async () => {
    getProviderPresets.mockResolvedValueOnce([preset('openai')]);
    const onStartCustom = vi.fn();
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPicker(new Set(), { onStartCustom }));
    });

    // All five wire formats render as chips.
    for (const apiFormat of [
      'openai',
      'anthropic',
      'google',
      'openai-response',
      'azure-openai',
    ]) {
      expect(
        renderer.root.findByProps({ 'data-testid': `custom-type-${apiFormat}` }),
      ).toBeDefined();
    }

    await act(async () => {
      renderer.root.findByProps({ 'data-testid': 'custom-type-anthropic' }).props.onClick();
    });
    expect(onStartCustom).toHaveBeenCalledWith('anthropic');
  });

  it('shows a recoverable error and retries the host request', async () => {
    getProviderPresets
      .mockRejectedValueOnce(new Error('temporarily unavailable'))
      .mockResolvedValueOnce([preset('retry-provider')]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPicker());
    });

    expect(renderer.root.findByProps({ role: 'alert' })).toBeDefined();
    const retry = renderer.root.findByProps({ 'aria-label': 'Retry' });

    await act(async () => {
      retry.props.onClick();
    });

    expect(getProviderPresets).toHaveBeenCalledTimes(2);
    expect(
      renderer.root.findByProps({ 'data-testid': 'preset-card-retry-provider' }),
    ).toBeDefined();
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  });

  it('does not publish state when unmounted before the request resolves', async () => {
    const pending = deferred<unknown>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getProviderPresets.mockReturnValueOnce(pending.promise);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPicker());
    });
    await act(async () => {
      renderer.unmount();
    });
    await act(async () => {
      pending.resolve([]);
      await pending.promise;
    });

    expect(getProviderPresets).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
