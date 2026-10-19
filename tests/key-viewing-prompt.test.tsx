import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/renderer/host/ui', () => ({
  Button: 'button',
  Input: 'input',
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? children : null,
  DialogContent: 'div',
  DialogTitle: 'h2',
}));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  useTranslation: () => (key: string) => key,
}));
const writeText = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('../src/renderer/host/hostBridge', () => ({
  getHost: () => ({ clipboard: { writeText } }),
}));

import { KeyViewingPrompt } from '../src/renderer/shared/KeyViewingPrompt';
import { cancelKeyViewing, requestKeyViewing } from '../src/renderer/shared/keyViewingRequest';
import { copySavedKey } from '../src/renderer/shared/KeyCopyButton';

describe('per-operation viewing verification', () => {
  let renderer: ReactTestRenderer;
  const control = (id: string) => renderer.root.findByProps({ 'data-testid': id });
  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget());
    writeText.mockClear();
    act(() => {
      renderer = create(<KeyViewingPrompt />);
    });
  });
  afterEach(() => {
    act(() => renderer.unmount());
    vi.unstubAllGlobals();
  });
  const submit = async (password: string) => {
    act(() =>
      control('dialog-input-key-viewing-password').props.onChange({ target: { value: password } })
    );
    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  };
  const submitSetup = async (password: string, confirmation = password) => {
    act(() =>
      control('dialog-input-key-viewing-password').props.onChange({ target: { value: password } })
    );
    act(() =>
      control('dialog-input-key-viewing-confirmation').props.onChange({
        target: { value: confirmation },
      })
    );
    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  };

  it('sets a 4–8 character password on first reveal and continues the same read', async () => {
    const read = vi.fn(async (password?: string) =>
      password === '1234'
        ? { success: true, value: 'fixture-key' }
        : { success: false, error: 'view-password-not-set' }
    );
    let result!: ReturnType<typeof requestKeyViewing>;
    await act(async () => {
      result = requestKeyViewing(read);
    });
    expect(renderer.root.findByType('h2').children).toContain('keyViewing.setTitle');
    expect(control('dialog-input-key-viewing-password').props.maxLength).toBe(8);
    await submitSetup('1234');
    expect(await result).toEqual({ success: true, value: 'fixture-key' });
    expect(read.mock.calls.map(([password]) => password)).toEqual([undefined, '1234']);
    expect(renderer.root.findAllByType('form')).toHaveLength(0);
  });

  it('validates setup length and confirmation before calling the protected read', async () => {
    const read = vi.fn(async () => ({ success: false, error: 'view-password-not-set' }));
    let result!: ReturnType<typeof requestKeyViewing>;
    await act(async () => {
      result = requestKeyViewing(read);
    });
    await submitSetup('123');
    expect(renderer.root.findByProps({ role: 'alert' }).children).toContain('keyViewing.length');
    await submitSetup('1234', '5678');
    expect(renderer.root.findByProps({ role: 'alert' }).children).toContain('keyViewing.mismatch');
    expect(read).toHaveBeenCalledTimes(1);
    act(() => control('dialog-button-key-viewing-cancel').props.onClick());
    expect((await result).success).toBe(false);
  });

  it('shows errors, forgets entered passwords, and prompts again for the next operation', async () => {
    const read = vi.fn(async (password?: string) =>
      !password
        ? { success: false, error: 'view-password-required' }
        : password === 'correct'
          ? { success: true, value: 'fixture-key' }
          : { success: false, error: 'view-password-invalid' }
    );
    let result!: ReturnType<typeof requestKeyViewing>;
    await act(async () => {
      result = requestKeyViewing(read);
    });
    await submit('wrong');
    expect(control('dialog-input-key-viewing-password').props.value).toBe('');
    expect(renderer.root.findByProps({ role: 'alert' }).children).toContain('keyViewing.invalid');
    await submit('correct');
    expect(await result).toEqual({ success: true, value: 'fixture-key' });
    await act(async () => {
      result = requestKeyViewing(read);
    });
    expect(control('dialog-input-key-viewing-password').props.value).toBe('');
    act(() => control('dialog-button-key-viewing-cancel').props.onClick());
    expect((await result).success).toBe(false);
    expect(read.mock.calls.map(([password]) => password)).toEqual([
      undefined,
      'wrong',
      'correct',
      undefined,
    ]);
  });

  it('cancels pending authentication on provider switch or app-window blur', async () => {
    const read = vi.fn(async () => ({ success: false, error: 'view-password-required' }));
    for (const cancel of [
      cancelKeyViewing,
      () => window.dispatchEvent(new Event('elftia-host-window-blur')),
    ]) {
      let result!: ReturnType<typeof requestKeyViewing>;
      await act(async () => {
        result = requestKeyViewing(read);
      });
      act(() => {
        cancel();
      });
      expect((await result).success).toBe(false);
      expect(renderer.root.findAllByType('input')).toHaveLength(0);
    }
  });

  it('writes a saved key to the clipboard only after a fresh backend-authorized read', async () => {
    const read = vi.fn(async (password?: string) =>
      password === 'correct'
        ? { success: true, value: 'copy-fixture-key' }
        : { success: false, error: 'view-password-required' }
    );
    let result!: Promise<boolean>;
    await act(async () => {
      result = copySavedKey(() => requestKeyViewing(read));
    });
    expect(writeText).not.toHaveBeenCalled();
    await submit('correct');
    expect(await result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('copy-fixture-key');
  });
});
