/**
 * Regression armor for the codex loopback poll loop (0.2.19).
 *
 * The first cut scheduled ONE `setTimeout` per effect run and updated no state
 * while the polled view was `pending` — so after the first tick the effect
 * never re-ran, exactly one poll ever fired, and the panel waited forever even
 * after the host settled the flow done/error (the user's "Login complete." in
 * the browser never reached the card). These tests pin the Kimi-card pattern:
 * every pending tick re-arms the next poll, and a settle clears the panel or
 * surfaces the host's error.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/renderer/host/ui', async () => {
  const ReactModule = await import('react');
  return {
    Button: ({ children, ...props }: React.PropsWithChildren) =>
      ReactModule.createElement('button', props, children),
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
      ReactModule.createElement('input', props),
    Select: () => null,
  };
});
vi.mock('../src/renderer/subscription/ManualInputModal', () => ({
  ManualInputModal: () => null,
}));
vi.mock('../src/renderer/subscription/OAuthFlow', () => ({
  OAuthFlow: () => null,
}));
vi.mock('../src/renderer/externalLinksClient', () => ({
  openExternal: vi.fn(async () => undefined),
}));

import { CodexConfigCard } from '../src/renderer/subscription/CodexConfigCard';

const t = (key: string) => key;

type LoopbackView = {
  sessionId: string;
  state: 'pending' | 'done' | 'error';
  error?: string;
};

function loopbackProps(poll: (sessionId: string) => Promise<LoopbackView>) {
  return {
    t,
    accounts: [],
    onStartOAuth: vi.fn(async () => ({
      authUrl: 'https://example.invalid/auth',
      state: 's',
      codeVerifier: '',
    })),
    onExchangeToken: vi.fn(async () => undefined),
    onStartLoopbackLogin: vi.fn(async () => ({
      ok: true as const,
      authUrl: 'https://auth.example.invalid/authorize?state=abc',
      sessionId: 'cxlb-1',
    })),
    onPollLoopbackFlow: poll,
    onCancelLoopbackFlow: vi.fn(async () => undefined),
    onSetManualToken: vi.fn(async () => undefined),
    onClear: vi.fn(async () => undefined),
    onRefresh: vi.fn(async () => false),
  };
}

async function startLoopback(renderer: ReactTestRenderer): Promise<void> {
  await act(async () => {
    await renderer.root.findByProps({ 'data-testid': 'settings-codex-account-add-btn' }).props.onClick();
  });
}

describe('CodexConfigCard loopback poll loop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('re-arms while pending and clears the panel when the host settles done', async () => {
    const views = [
      { sessionId: 'cxlb-1', state: 'pending' as const },
      { sessionId: 'cxlb-1', state: 'pending' as const },
      { sessionId: 'cxlb-1', state: 'done' as const },
    ];
    const poll: ((sessionId: string) => Promise<LoopbackView>) = vi.fn(async () =>
      views.length
        ? (views.shift() as (typeof views)[number])
        : { sessionId: 'cxlb-1', state: 'done' as const },
    );
    const props = loopbackProps(poll);
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<CodexConfigCard {...props} />);
    });

    await startLoopback(renderer);
    // The waiting panel is up; the first poll is one interval out.
    expect(renderer.root.findByProps({ 'data-testid': 'settings-codex-loopback-panel' })).toBeDefined();
    expect(poll).not.toHaveBeenCalled();

    // First tick: pending — the regression is here (polling must NOT stop).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(poll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(poll).toHaveBeenCalledTimes(2);

    // Third tick settles done → the panel is gone.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(poll).toHaveBeenCalledTimes(3);
    expect(() =>
      renderer.root.findByProps({ 'data-testid': 'settings-codex-loopback-panel' }),
    ).toThrow();
    act(() => renderer.unmount());
  });

  it('surfaces the host error when the flow settles error', async () => {
    const poll: ((sessionId: string) => Promise<LoopbackView>) = vi.fn(async () => ({
      sessionId: 'cxlb-1',
      state: 'error' as const,
      error: 'country-region-blocked',
    }));
    const props = loopbackProps(poll);
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<CodexConfigCard {...props} />);
    });

    await startLoopback(renderer);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(poll).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(renderer.toJSON())).toContain('country-region-blocked');
    expect(() =>
      renderer.root.findByProps({ 'data-testid': 'settings-codex-loopback-panel' }),
    ).toThrow();
    act(() => renderer.unmount());
  });
});
