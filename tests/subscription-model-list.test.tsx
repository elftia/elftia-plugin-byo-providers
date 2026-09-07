/**
 * SubscriptionModelList + useSubscriptionModels contract (host-API v1.70) —
 * default models render the 默认 badge and are NOT removable, extras carry a
 * remove (×) that REPLACES the whole extras list; the inline add form rejects
 * empty/duplicate ids with a gentle message; and on an older host (relay
 * resolves `{ error: 'unsupported' }`) the hook stays `supported: false` so the
 * tab hides every model section — never a fabricated empty view.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/renderer/host/ui', async () => {
  const ReactModule = await import('react');
  return {
    Button: ({ children, ...props }: React.PropsWithChildren) =>
      ReactModule.createElement('button', props, children),
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
      ReactModule.createElement('input', props),
  };
});

const getModels = vi.fn();
const setModels = vi.fn();

vi.mock('../src/renderer/subscriptionAuthClient', () => ({
  subscriptionAuthClient: {
    getSubscriptionModels: (...args: unknown[]) => getModels(...args),
    setSubscriptionExtraModels: (...args: unknown[]) => setModels(...args),
  },
  isSubscriptionModelsUnsupported: (result: unknown) =>
    typeof result === 'object' &&
    result !== null &&
    (result as { error?: unknown }).error === 'unsupported',
}));

import { SubscriptionModelList } from '../src/renderer/subscription/SubscriptionModelList';
import { useSubscriptionModels } from '../src/renderer/subscription/useSubscriptionModels';

const t = (key: string) => key;

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

const chatDefault = { id: 'claude-opus-4-6', kind: 'chat' as const };
const imageDefault = { id: 'gpt-image-1', kind: 'image' as const };
const extraModel = { id: 'custom-chat', kind: 'chat' as const };

const models = {
  defaults: [chatDefault, imageDefault],
  extras: [extraModel],
  effective: [chatDefault, imageDefault, extraModel],
};

function listProps(overrides: Partial<Parameters<typeof SubscriptionModelList>[0]> = {}) {
  return {
    t,
    providerId: 'claude',
    models,
    onSetExtras: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('SubscriptionModelList', () => {
  it('labels defaults (默认, not removable) and image models (画图), extras removable', async () => {
    const props = listProps();
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<SubscriptionModelList {...props} />);
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('claude-opus-4-6');
    expect(json).toContain('gpt-image-1');
    expect(json).toContain('settings.accountTokens.models.defaultBadge');
    expect(json).toContain('settings.accountTokens.models.kindImage');
    const removes = renderer.root.findAllByProps({
      'data-testid': 'settings-subscription-models-remove-btn',
    });
    expect(removes).toHaveLength(1);
    expect(removes[0].props['data-model-id']).toBe('custom-chat');
    act(() => renderer.unmount());
  });

  it('removes an extra by REPLACING the whole extras list without the id', async () => {
    const props = listProps();
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<SubscriptionModelList {...props} />);
    });
    await act(async () => {
      await renderer.root
        .findByProps({ 'data-testid': 'settings-subscription-models-remove-btn' })
        .props.onClick();
    });
    expect(props.onSetExtras).toHaveBeenCalledWith('claude', []);
    act(() => renderer.unmount());
  });

  it('adds a model with the chosen kind and rejects empty/duplicate ids inline', async () => {
    const props = listProps();
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<SubscriptionModelList {...props} />);
    });
    await act(async () => {
      await renderer.root
        .findByProps({ 'data-testid': 'settings-subscription-models-add-btn' })
        .props.onClick();
    });
    const input = () =>
      renderer.root.findByProps({ 'data-testid': 'settings-subscription-models-input' });
    const save = () =>
      renderer.root.findByProps({ 'data-testid': 'settings-subscription-models-save-btn' });

    // Empty id → gentle inline message, no verb call.
    await act(async () => {
      await save().props.onClick();
    });
    expect(JSON.stringify(renderer.toJSON())).toContain(
      'settings.accountTokens.models.errorEmpty',
    );
    // Duplicate id (against effective, whitespace-trimmed) → still no call.
    await act(async () => {
      input().props.onChange({ target: { value: '  claude-opus-4-6  ' } });
    });
    await act(async () => {
      await save().props.onClick();
    });
    expect(JSON.stringify(renderer.toJSON())).toContain(
      'settings.accountTokens.models.errorDuplicate',
    );
    expect(props.onSetExtras).not.toHaveBeenCalled();

    // Valid id + image kind → the FULL next extras list is threaded; form closes.
    await act(async () => {
      input().props.onChange({ target: { value: '  custom-image  ' } });
    });
    await act(async () => {
      renderer.root
        .findByProps({ 'data-testid': 'settings-subscription-models-kind-image' })
        .props.onClick();
    });
    await act(async () => {
      await save().props.onClick();
    });
    expect(props.onSetExtras).toHaveBeenCalledWith('claude', [
      { id: 'custom-chat', kind: 'chat' },
      { id: 'custom-image', kind: 'image' },
    ]);
    expect(
      renderer.root.findAllByProps({ 'data-testid': 'settings-subscription-models-form' }),
    ).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('surfaces a save failure inline and keeps the form open', async () => {
    const props = listProps({
      onSetExtras: vi.fn(async () => {
        throw new Error('host-write-failed');
      }),
    });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<SubscriptionModelList {...props} />);
    });
    await act(async () => {
      await renderer.root
        .findByProps({ 'data-testid': 'settings-subscription-models-add-btn' })
        .props.onClick();
    });
    await act(async () => {
      renderer.root
        .findByProps({ 'data-testid': 'settings-subscription-models-input' })
        .props.onChange({ target: { value: 'custom-2' } });
    });
    await act(async () => {
      await renderer.root
        .findByProps({ 'data-testid': 'settings-subscription-models-save-btn' })
        .props.onClick();
    });
    expect(JSON.stringify(renderer.toJSON())).toContain('host-write-failed');
    expect(
      renderer.root.findAllByProps({ 'data-testid': 'settings-subscription-models-form' }),
    ).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it('still renders the section (add button only) for a provider with no models', async () => {
    const props = listProps({ models: undefined });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<SubscriptionModelList {...props} />);
    });
    expect(
      renderer.root.findAllByProps({ 'data-testid': 'settings-subscription-models-chip' }),
    ).toHaveLength(0);
    // (A Button-wrapped testid matches BOTH the function component and the host
    // button in findAllByProps — assert presence through the rendered JSON.)
    expect(JSON.stringify(renderer.toJSON())).toContain(
      'settings-subscription-models-add-btn',
    );
    expect(JSON.stringify(renderer.toJSON())).toContain('settings.accountTokens.models.add');
    act(() => renderer.unmount());
  });
});

describe('useSubscriptionModels', () => {
  let hook: ReturnType<typeof useSubscriptionModels> | null = null;

  function HookProbe() {
    hook = useSubscriptionModels();
    return null;
  }

  beforeEach(() => {
    hook = null;
    getModels.mockReset();
    setModels.mockReset();
  });

  it('stays unsupported on an older host (explicit marker, never an empty view)', async () => {
    getModels.mockResolvedValue({ error: 'unsupported' });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<HookProbe />);
    });
    await act(async () => {
      await flush();
    });
    expect(getModels).toHaveBeenCalledOnce();
    expect(hook?.supported).toBe(false);
    expect(hook?.view).toBeNull();
    act(() => renderer.unmount());
  });

  it('loads the view once and reconciles setExtras with the host-returned view', async () => {
    const first = {
      claude: { defaults: [chatDefault], extras: [], effective: [chatDefault] },
    };
    const second = {
      claude: { defaults: [chatDefault], extras: [extraModel], effective: [chatDefault, extraModel] },
    };
    getModels.mockResolvedValue(first);
    setModels.mockResolvedValue(second);
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<HookProbe />);
    });
    await act(async () => {
      await flush();
    });
    expect(hook?.supported).toBe(true);
    expect(hook?.view).toEqual(first);
    await act(async () => {
      await hook?.setExtras('claude', [extraModel]);
    });
    expect(setModels).toHaveBeenCalledWith('claude', [extraModel]);
    expect(hook?.view).toEqual(second);
    act(() => renderer.unmount());
  });

  it('throws when an older host rejects an extras write', async () => {
    getModels.mockResolvedValue({ claude: { defaults: [], extras: [], effective: [] } });
    setModels.mockResolvedValue({ error: 'unsupported' });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<HookProbe />);
    });
    await act(async () => {
      await flush();
    });
    await act(async () => {
      await expect(hook?.setExtras('claude', [])).rejects.toThrow(
        'subscription-models-unsupported',
      );
    });
    act(() => renderer.unmount());
  });
});
