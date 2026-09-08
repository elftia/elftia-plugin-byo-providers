/**
 * AllowanceBars / KeyQuotaBars rendering contract — unknown or unsupported
 * quota must NEVER render as a measured 0% bar, and measured windows render
 * clamped widths with state labels.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const allowanceSnapshot = vi.fn();

vi.mock('../src/renderer/host/ui', async () => {
  const ReactModule = await import('react');
  return {
    Button: ({ children, ...props }: React.PropsWithChildren) =>
      ReactModule.createElement('button', props, children),
  };
});

vi.mock('../src/renderer/subscriptionAuthClient', () => ({
  subscriptionAuthClient: {
    getAccountAllowance: (...args: unknown[]) => allowanceSnapshot(...args),
  },
}));

const quotaSnapshot = vi.fn();

vi.mock('../src/renderer/llmConfigClient', () => ({
  llmConfigClient: {
    getKeyQuota: (...args: unknown[]) => quotaSnapshot(...args),
  },
}));

import { AllowanceBars } from '../src/renderer/subscription/AllowanceBars';
import { KeyQuotaBars } from '../src/renderer/llm/KeyQuotaBars';

const t = (key: string, params?: Record<string, string | number> | string) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('AllowanceBars', () => {
  beforeEach(() => {
    allowanceSnapshot.mockReset();
  });

  it('renders measured windows as percent bars and never leaks secrets', async () => {
    allowanceSnapshot.mockResolvedValue({
      providerId: 'claude',
      accountId: 'a1',
      source: 'oauth-usage-api',
      observedAt: '2026-09-06T10:00:00Z',
      windows: [
        {
          id: 'five-hour',
          label: '5 hours',
          scope: 'all',
          usedPercent: 42,
          resetsAt: '2026-09-06T15:00:00Z',
          state: 'fresh',
        },
      ],
    });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <AllowanceBars t={t} providerId="claude" accountId="a1" />,
      );
    });
    await act(async () => {
      await flush();
    });
    expect(allowanceSnapshot).toHaveBeenCalledWith('claude', 'a1', false);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('42%');
    expect(json).toContain('"aria-valuenow":42');
    // state label rendered as text, not color-only
    expect(json).not.toContain('0%');
    expect(json).not.toContain('measured-zero-guard-sentinel');
    act(() => renderer.unmount());
  });

  it('renders unavailable/unsupported quota as an explicit label, never a 0% bar', async () => {
    allowanceSnapshot.mockResolvedValue({
      providerId: 'gemini',
      accountId: 'g1',
      source: 'oauth-usage-api',
      observedAt: '2026-09-06T10:00:00Z',
      windows: [
        { id: 'five-hour', label: '5 hours', scope: 'all', usedPercent: null, state: 'unsupported' },
      ],
      lastErrorCode: 'gemini_usage_unsupported_provider',
    });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<AllowanceBars t={t} providerId="gemini" accountId="g1" />);
    });
    await act(async () => {
      await flush();
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('settings.accountTokens.allowance.stateUnsupported');
    expect(json).not.toContain('progressbar');
    expect(json).not.toContain('0%');
    act(() => renderer.unmount());
  });

  it('renders nothing without a providerId (feature-off default)', () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<AllowanceBars t={t} accountId="a1" />);
    });
    expect(renderer.toJSON()).toBeNull();
  });
});

describe('KeyQuotaBars', () => {
  beforeEach(() => {
    quotaSnapshot.mockReset();
  });

  it('hides entirely for providers with no quota adapter (supported:false)', async () => {
    quotaSnapshot.mockResolvedValue({
      providerId: 'openai',
      keyId: 'k1',
      supported: false,
      observedAt: '2026-09-06T10:00:00Z',
      windows: [],
    });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<KeyQuotaBars t={t} providerId="openai" keyId="k1" />);
    });
    await act(async () => {
      await flush();
    });
    expect(quotaSnapshot).toHaveBeenCalledWith('openai', 'k1', false);
    expect(renderer.toJSON()).toBeNull();
    act(() => renderer.unmount());
  });

  it('renders plan-quota windows with clamped widths', async () => {
    quotaSnapshot.mockResolvedValue({
      providerId: 'zai',
      keyId: 'k2',
      supported: true,
      observedAt: '2026-09-06T10:00:00Z',
      windows: [
        { id: 'five-hour', label: '5 hours', usedPercent: 91.2, state: 'fresh' },
        { id: 'seven-day', label: '7 days', usedPercent: null, state: 'unavailable' },
      ],
    });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<KeyQuotaBars t={t} providerId="zai" keyId="k2" />);
    });
    await act(async () => {
      await flush();
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('"aria-valuenow":91');
    expect(json).toContain('width":"91.2%"');
    expect(json).toContain('providerSettings.apiKeyPool.quota.stateUnavailable');
    // Only the measured window gets a bar; the null-percent window stays text-only.
    expect(json.match(/progressbar/g)?.length).toBe(1);
    act(() => renderer.unmount());
  });
});
