/** Subscription model settings must reflect confirmed host persistence, including switches. */
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
    Switch: ({ checked, onCheckedChange, ...props }: {
      checked?: boolean; onCheckedChange?: (enabled: boolean) => void;
    }) => ReactModule.createElement('button', {
      ...props, role: 'switch', 'aria-checked': checked,
      onClick: () => onCheckedChange?.(!checked),
    }),
  };
});

const getModels = vi.fn();
const setModels = vi.fn();
const setEnabled = vi.fn();

vi.mock('../src/renderer/subscriptionAuthClient', () => ({
  subscriptionAuthClient: {
    getSubscriptionModels: (...args: unknown[]) => getModels(...args),
    setSubscriptionExtraModels: (...args: unknown[]) => setModels(...args),
    setSubscriptionModelEnabled: (...args: unknown[]) => setEnabled(...args),
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
    onSetEnabled: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('SubscriptionModelList', () => {
  it('shows switches for all models without default badges and keeps image labels', async () => {
    const props = listProps();
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<SubscriptionModelList {...props} />);
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('claude-opus-4-6');
    expect(json).toContain('gpt-image-1');
    expect(json).not.toContain('settings.accountTokens.models.defaultBadge');
    const toggles = renderer.root.findAll((node) => node.type === 'button' && node.props.role === 'switch');
    expect(toggles).toHaveLength(3);
    expect(toggles.every((toggle) => toggle.props['aria-checked'] === true)).toBe(true);
    expect(json).toContain('settings.accountTokens.models.kindImage');
    const removes = renderer.root.findAllByProps({
      'data-testid': 'settings-subscription-models-remove-btn',
    });
    expect(removes).toHaveLength(1);
    expect(removes[0].props['data-model-id']).toBe('custom-chat');
    act(() => renderer.unmount());
  });

  it.each([chatDefault.id, extraModel.id])('can disable built-in or extra model %s', async (id) => {
    const props = listProps();
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<SubscriptionModelList {...props} />); });
    const toggle = renderer.root.find((node) =>
      node.type === 'button' && node.props.role === 'switch' && node.props['data-model-id'] === id);
    await act(async () => { toggle.props.onClick(); await flush(); });
    expect(props.onSetEnabled).toHaveBeenCalledWith('claude', id, false);
    expect(toggle.props['aria-checked']).toBe(true);
    act(() => renderer.unmount());
  });

  it('renders a disabled model switch and can re-enable it', async () => {
    const disabled = { ...chatDefault, enabled: false };
    const props = listProps({ models: { defaults: [disabled], extras: [], effective: [disabled] } });
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<SubscriptionModelList {...props} />); });
    const toggle = renderer.root.find((node) => node.type === 'button' && node.props.role === 'switch');
    expect(toggle.props['aria-checked']).toBe(false);
    await act(async () => { toggle.props.onClick(); await flush(); });
    expect(props.onSetEnabled).toHaveBeenCalledWith('claude', chatDefault.id, true);
    act(() => renderer.unmount());
  });

  it('keeps the switch unchanged and reports failed persistence', async () => {
    const props = listProps({ onSetEnabled: vi.fn(async () => { throw new Error('toggle-failed'); }) });
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<SubscriptionModelList {...props} />); });
    const toggle = renderer.root.find((node) => node.type === 'button' && node.props.role === 'switch' && node.props['data-model-id'] === chatDefault.id);
    await act(async () => { toggle.props.onClick(); await flush(); });
    expect(toggle.props['aria-checked']).toBe(true);
    expect(JSON.stringify(renderer.toJSON())).toContain('toggle-failed');
    act(() => renderer.unmount());
  });

  it('disables all actions during an in-flight model mutation', async () => {
    let finish!: () => void;
    const props = listProps({ onSetEnabled: vi.fn(() => new Promise<void>((resolve) => { finish = resolve; })) });
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<SubscriptionModelList {...props} />); });
    const toggles = () => renderer.root.findAll((node) => node.type === 'button' && node.props.role === 'switch');
    act(() => { toggles()[0].props.onClick(); toggles()[1].props.onClick(); });
    expect(props.onSetEnabled).toHaveBeenCalledOnce();
    expect(toggles().every((node) => node.props.disabled)).toBe(true);
    await act(async () => { finish(); await flush(); });
    expect(toggles().every((node) => !node.props.disabled)).toBe(true);
    act(() => renderer.unmount());
  });

  it('disables switches on hosts without the optional toggle verb', async () => {
    const props = listProps({ toggleSupported: false });
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<SubscriptionModelList {...props} />); });
    const toggles = renderer.root.findAll((node) => node.type === 'button' && node.props.role === 'switch');
    expect(toggles.every((node) => node.props.disabled)).toBe(true);
    await act(async () => { toggles[0].props.onClick(); await flush(); });
    expect(props.onSetEnabled).not.toHaveBeenCalled();
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
    expect(input().props.onKeyDown).toBeUndefined();
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
    setEnabled.mockReset();
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

  it.each([
    ['adding', [], [extraModel]],
    ['removing', [extraModel], []],
  ] as const)('keeps the original list when %s an extra fails', async (_operation, initialExtras, nextExtras) => {
    const initial = {
      claude: {
        defaults: [chatDefault],
        extras: [...initialExtras],
        effective: [chatDefault, ...initialExtras],
      },
    };
    getModels.mockResolvedValue(initial);
    setModels.mockRejectedValue(new Error('host-write-failed'));
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<HookProbe />);
      await flush();
    });
    await act(async () => {
      await expect(hook?.setExtras('claude', [...nextExtras])).rejects.toThrow('host-write-failed');
    });
    expect(hook?.view).toEqual(initial);
    act(() => renderer.unmount());
  });

  it('keeps the committed list until the host confirms the new list', async () => {
    const first = { claude: { defaults: [chatDefault], extras: [], effective: [chatDefault] } };
    const second = {
      claude: { defaults: [chatDefault], extras: [extraModel], effective: [chatDefault, extraModel] },
    };
    let resolveWrite!: (value: typeof second) => void;
    getModels.mockResolvedValue(first);
    setModels.mockReturnValue(new Promise((resolve) => { resolveWrite = resolve; }));
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<HookProbe />);
      await flush();
    });
    let pending!: Promise<void>;
    act(() => { pending = hook!.setExtras('claude', [extraModel]); });
    expect(hook?.view).toEqual(first);
    await act(async () => {
      resolveWrite(second);
      await pending;
    });
    expect(hook?.view).toEqual(second);
    act(() => renderer.unmount());
  });

  it('persists disable and enable transitions using the returned host view', async () => {
    const initial = { claude: { defaults: [chatDefault], extras: [], effective: [chatDefault] } };
    const disabled = { ...chatDefault, enabled: false };
    const afterDisable = { claude: { defaults: [disabled], extras: [], effective: [disabled] } };
    getModels.mockResolvedValue(initial);
    setEnabled.mockResolvedValueOnce(afterDisable).mockResolvedValueOnce(initial);
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<HookProbe />); await flush(); });
    await act(async () => { await hook!.setEnabled('claude', chatDefault.id, false); });
    expect(hook?.view).toEqual(afterDisable);
    expect(setEnabled).toHaveBeenNthCalledWith(1, 'claude', chatDefault.id, false);
    await act(async () => { await hook!.setEnabled('claude', chatDefault.id, true); });
    expect(hook?.view).toEqual(initial);
    expect(setEnabled).toHaveBeenNthCalledWith(2, 'claude', chatDefault.id, true);
    act(() => renderer.unmount());
  });

  it('keeps the original state on a failed toggle and can retry', async () => {
    const initial = { claude: { defaults: [chatDefault], extras: [], effective: [chatDefault] } };
    getModels.mockResolvedValue(initial);
    setEnabled.mockRejectedValueOnce(new Error('toggle-failed')).mockResolvedValueOnce(initial);
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<HookProbe />); await flush(); });
    await act(async () => { await expect(hook!.setEnabled('claude', chatDefault.id, false)).rejects.toThrow('toggle-failed'); });
    expect(hook?.view).toEqual(initial);
    await act(async () => { await hook!.setEnabled('claude', chatDefault.id, true); });
    expect(setEnabled).toHaveBeenCalledTimes(2);
    act(() => renderer.unmount());
  });

  it('remembers unsupported toggles without hiding the existing catalog', async () => {
    const initial = { claude: { defaults: [chatDefault], extras: [], effective: [chatDefault] } };
    getModels.mockResolvedValue(initial);
    setEnabled.mockResolvedValue({ error: 'unsupported' });
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<HookProbe />); await flush(); });
    await act(async () => { await expect(hook!.setEnabled('claude', chatDefault.id, false)).rejects.toThrow('subscription-models-unsupported'); });
    expect(hook?.toggleSupported).toBe(false);
    expect(hook?.supported).toBe(true);
    expect(hook?.view).toEqual(initial);
    act(() => renderer.unmount());
  });

  it('serializes writes across cards so full-view responses cannot overwrite a later mutation', async () => {
    const initial = { claude: { defaults: [chatDefault], extras: [], effective: [chatDefault] } };
    const last = { ...initial, codex: { defaults: [], extras: [extraModel], effective: [extraModel] } };
    getModels.mockResolvedValue(initial);
    let release!: (value: typeof initial) => void;
    setEnabled.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    setModels.mockResolvedValue(last);
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<HookProbe />); await flush(); });
    let one!: Promise<void>; let two!: Promise<void>;
    await act(async () => {
      one = hook!.setEnabled('claude', chatDefault.id, true);
      two = hook!.setExtras('codex', [extraModel]);
      await flush();
    });
    expect(setModels).not.toHaveBeenCalled();
    await act(async () => { release(initial); await Promise.all([one, two]); });
    expect(hook?.view).toEqual(last);
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
