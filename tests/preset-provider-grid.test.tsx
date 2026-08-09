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
  };
});

vi.mock('../src/renderer/llm/utils', () => ({
  getProviderIcon: () => null,
}));

import { PresetProviderGrid } from '../src/renderer/llm/PresetProviderGrid';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderGrid(): React.ReactElement {
  return (
    <PresetProviderGrid
      addedPresetIds={new Set()}
      onSelectPreset={vi.fn()}
    />
  );
}

beforeEach(() => {
  getProviderPresets.mockReset();
});

describe('PresetProviderGrid loading', () => {
  it('renders presets returned by the host port', async () => {
    getProviderPresets.mockResolvedValueOnce([
      {
        id: 'openai',
        presetId: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://example.invalid',
        models: [],
      },
    ]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderGrid());
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('OpenAI');
    expect(renderer.root.findByProps({ 'aria-busy': false })).toBeDefined();
  });

  it('shows a recoverable error and retries the host request', async () => {
    getProviderPresets
      .mockRejectedValueOnce(new Error('temporarily unavailable'))
      .mockResolvedValueOnce([
        {
          id: 'retry-provider',
          presetId: 'retry-provider',
          name: 'Recovered Provider',
          baseUrl: 'https://example.invalid',
          models: [],
        },
      ]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderGrid());
    });

    expect(renderer.root.findByProps({ role: 'alert' })).toBeDefined();
    const retry = renderer.root.findByProps({ 'aria-label': 'Retry' });

    await act(async () => {
      retry.props.onClick();
    });

    expect(getProviderPresets).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(renderer.toJSON())).toContain('Recovered Provider');
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  });

  it('does not publish state when unmounted before the request resolves', async () => {
    const pending = deferred<unknown>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getProviderPresets.mockReturnValueOnce(pending.promise);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderGrid());
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
