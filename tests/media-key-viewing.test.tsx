import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/renderer/host/ui', () => ({
  Badge: 'span',
  Button: 'button',
  Input: 'input',
  Switch: 'button',
}));
vi.mock('../src/renderer/shared/KeyCopyButton', () => ({
  KeyCopyButton: () => null,
  copySavedKey: vi.fn(),
}));

import { ProviderDetailsPanel } from '../src/renderer/media/shared/ProviderDetailsPanel';

describe('media saved-key viewing', () => {
  let renderer: ReactTestRenderer;
  const reveal = vi.fn<(field: string) => Promise<string | null>>();
  const change = vi.fn();
  const element = (scope = 'alpha', sharedKey?: { shared: boolean; owner: boolean }) => (
    <ProviderDetailsPanel
      name={scope}
      type="video"
      typeBadge="video"
      enabled
      onToggleEnabled={() => undefined}
      credentialFields={[
        { key: 'apiKey', label: 'key', secret: true },
        { key: 'byteplusSk', label: 'sk', secret: true },
      ]}
      formValues={{}}
      onFieldChange={change}
      onRevealSecret={reveal}
      revealScopeKey={scope}
      hasStoredKey
      sharedKey={sharedKey}
      t={(key) => key}
    />
  );
  const input = (index: number) => renderer.root.findAllByType('input')[index];
  const toggle = async (index: number) => {
    await act(async () => input(index).parent!.findByType('button').props.onClick());
  };
  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget());
    vi.useFakeTimers();
    vi.clearAllMocks();
    reveal.mockImplementation(async (field) => `fixture-${field}`);
    act(() => {
      renderer = create(element());
    });
  });
  afterEach(() => {
    act(() => renderer.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('explains shared ownership without putting the key into the editable form', () => {
    act(() => renderer.update(element('alpha', { shared: true, owner: false })));
    expect(renderer.root.findByProps({ 'data-testid': 'shared-provider-key-note' }).children).toEqual(['sharedKeys.borrowed']);
    expect(input(0).props.value).toBe('');
    expect(reveal).not.toHaveBeenCalled();
    act(() => renderer.update(element('alpha', { shared: true, owner: true })));
    expect(renderer.root.findByProps({ 'data-testid': 'shared-provider-key-note' }).children).toEqual(['sharedKeys.owner']);
    act(() => renderer.update(element('beta')));
    expect(renderer.root.findAllByProps({ 'data-testid': 'shared-provider-key-note' })).toHaveLength(0);
  });

  it('expires each field independently without extending an earlier reveal', async () => {
    await toggle(0);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    await toggle(1);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(input(0).props.value).toBe('');
    expect(input(0).props.type).toBe('password');
    expect(input(1).props.value).toBe('fixture-byteplusSk');
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(input(1).props.value).toBe('');
    expect(change).not.toHaveBeenCalled();
  });

  it('drops visible and pending secrets on A → B → A switches', async () => {
    await toggle(1);
    let resolve!: (value: string) => void;
    reveal.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    await toggle(0);
    act(() => renderer.update(element('beta')));
    expect(input(1).props.value).toBe('');
    expect(input(1).props.type).toBe('password');
    act(() => renderer.update(element('alpha')));
    await act(async () => {
      resolve('late-fixture');
    });
    expect(input(0).props.value).toBe('');
    expect(input(0).props.type).toBe('password');
    expect(input(0).props.disabled).toBeFalsy();
  });

  it.each(['blur', 'elftia-host-window-blur'])(
    'hides and invalidates pending reads on %s',
    async (event) => {
      await toggle(1);
      let resolve!: (value: string) => void;
      reveal.mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          })
      );
      await toggle(0);
      act(() => {
        window.dispatchEvent(new Event(event));
      });
      await act(async () => {
        resolve('late-fixture');
      });
      for (const index of [0, 1]) {
        expect(input(index).props.value).toBe('');
        expect(input(index).props.type).toBe('password');
      }
    }
  );

  it('stays hidden after cancellation or transport failure', async () => {
    reveal.mockResolvedValueOnce(null);
    await toggle(0);
    expect(input(0).props.type).toBe('password');
    reveal.mockRejectedValueOnce(new Error('fixture transport unavailable'));
    await toggle(0);
    expect(input(0).props.type).toBe('password');
    expect(input(0).props.disabled).toBeFalsy();
  });
});
