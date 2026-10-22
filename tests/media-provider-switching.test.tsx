import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { t, refresh } = vi.hoisted(() => ({
  t: (key: string) => key,
  refresh: vi.fn(async () => undefined),
}));

vi.mock('../src/renderer/host/ui', () => ({ Button: 'button', Input: 'input', Select: 'select' }));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({ useTranslation: () => t }));
vi.mock('../src/renderer/host/vendored/useImperativeConfirm', () => ({ useConfirmDialog: () => vi.fn() }));
vi.mock('../src/renderer/useMediaProviders', () => ({ useMediaProviders: () => ({ refresh }) }));
vi.mock('../src/renderer/media/components', () => ({
  AddModelDialog: () => null,
  EditModelDialog: () => null,
  ManageModelsModal: () => null,
  ModelGroupList: () => null,
  ProviderSidebar: ({ providers, onSelectProvider }: {
    providers: { id: string }[];
    onSelectProvider: (id: string) => void;
  }) => <>{providers.map(({ id }) => <button key={id} id={id} onClick={() => onSelectProvider(id)} />)}</>,
}));
vi.mock('../src/renderer/media/shared/ProviderDetailsPanel', () => ({
  // Model a host control with a pending local value. Changing providers must
  // create a fresh control even when the previous save has not completed.
  ProviderDetailsPanel: ({ enabled, onToggleEnabled, errorMessage }: {
    enabled: boolean;
    onToggleEnabled: (value: boolean) => Promise<void>;
    errorMessage?: string;
  }) => {
    const [checked, setChecked] = React.useState(enabled);
    return <>
      <button id="switch" aria-checked={checked} onClick={() => {
        setChecked(!checked);
        return onToggleEnabled(!checked);
      }} />
      <span id="error">{errorMessage}</span>
    </>;
  },
}));

import { __resetHost, setHost } from '../src/renderer/host/hostBridge';
import { ImageProviderSettingsPanel } from '../src/renderer/media/ImageProviderSettingsPanel';

const invoke = vi.fn();
let renderer: ReactTestRenderer;
const provider = (id: string) => ({
  id, name: id, enabled: true, config: {}, models: [], credentialFields: [],
});

beforeEach(async () => {
  vi.stubGlobal('window', new EventTarget());
  invoke.mockReset().mockResolvedValue([provider('official'), provider('codex')]);
  setHost({ ipc: { invoke } } as never);
  await act(async () => { renderer = create(<ImageProviderSettingsPanel />); });
});

afterEach(() => {
  act(() => renderer.unmount());
  __resetHost();
  vi.unstubAllGlobals();
});

it('keeps a pending official toggle isolated when selecting Codex', async () => {
  let finish!: (result: unknown) => void;
  invoke.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  let pending!: Promise<void>;
  act(() => { pending = renderer.root.findByProps({ id: 'switch' }).props.onClick(); });
  expect(renderer.root.findByProps({ id: 'switch' }).props['aria-checked']).toBe(false);
  act(() => renderer.root.findByProps({ id: 'codex' }).props.onClick());
  expect(renderer.root.findByProps({ id: 'switch' }).props['aria-checked']).toBe(true);
  await act(async () => {
    finish({ success: true, provider: { ...provider('official'), enabled: false } });
    await pending;
  });
  expect(invoke).toHaveBeenLastCalledWith('media.updateProvider', {
    mediaType: 'image', id: 'official', patch: { enabled: false },
  });
  expect(renderer.root.findByProps({ id: 'switch' }).props['aria-checked']).toBe(true);
  act(() => renderer.root.findByProps({ id: 'official' }).props.onClick());
  expect(renderer.root.findByProps({ id: 'switch' }).props['aria-checked']).toBe(false);
});

it('shows the host save failure instead of treating it as provider data', async () => {
  invoke.mockResolvedValueOnce({ success: false, message: 'Preference write failed' });
  await act(async () => { await renderer.root.findByProps({ id: 'switch' }).props.onClick(); });
  expect(renderer.root.findByProps({ id: 'error' }).children).toEqual(['Preference write failed']);
  act(() => renderer.root.findByProps({ id: 'codex' }).props.onClick());
  expect(renderer.root.findByProps({ id: 'switch' }).props['aria-checked']).toBe(true);
  act(() => renderer.root.findByProps({ id: 'official' }).props.onClick());
  expect(renderer.root.findByProps({ id: 'switch' }).props['aria-checked']).toBe(true);
});
