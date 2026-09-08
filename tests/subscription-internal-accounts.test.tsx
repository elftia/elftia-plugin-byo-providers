import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

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
  OAuthFlow: () => <div data-testid="oauth-flow" />,
}));

import { activate } from '../src/main';
import { AccountList } from '../src/renderer/subscription/AccountList';
import { ClaudeConfigCard } from '../src/renderer/subscription/ClaudeConfigCard';
import { CodexConfigCard } from '../src/renderer/subscription/CodexConfigCard';
import { subscriptionAuthClient } from '../src/renderer/subscriptionAuthClient';

const removedVerbs = [
  'importFromExternalCli',
  'getCliAutoImport',
  'setCliAutoImport',
  'applyAccountToCli',
];
const t = (key: string) => key;
const token = {
  authMethod: 'oauth' as const,
  status: 'expired' as const,
  hasAccessToken: true,
  hasRefreshToken: true,
  cliImportAvailable: true,
  cliFileForeignAccount: { label: 'Native CLI account' },
};
const activeAccount = {
  id: 'internal-account',
  provider: 'claude',
  label: 'Internal account',
  authMethod: 'oauth' as const,
  status: 'expired' as const,
  isActive: true,
  enabled: true,
  group: '',
  tags: [],
  schedulable: true,
  hasAccessToken: true,
  hasRefreshToken: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function cardProps() {
  return {
    t,
    config: token,
    accounts: [activeAccount],
    onStartOAuth: vi.fn(async () => ({ authUrl: 'https://example.invalid/auth', state: 'state', codeVerifier: '' })),
    onStartSetupToken: vi.fn(async () => ({ authUrl: 'https://example.invalid/setup', state: 'setup-state', codeVerifier: '' })),
    onExchangeOAuthToken: vi.fn(async () => undefined),
    onExchangeSetupToken: vi.fn(async () => undefined),
    onExchangeToken: vi.fn(async () => undefined),
    onSetManualToken: vi.fn(async () => undefined),
    onUpdateSubscriptionLevel: vi.fn(async () => undefined),
    onClear: vi.fn(async () => undefined),
    onRefresh: vi.fn(async () => false),
    onSetActiveAccount: vi.fn(async () => ({ success: true })),
    onRemoveAccount: vi.fn(async () => ({ success: true })),
    onImportFromCli: vi.fn(async () => ({ success: true })),
    onSetAutoImport: vi.fn(async () => undefined),
    onApplyAccountToCli: vi.fn(async () => ({ success: true })),
    autoImportEnabled: true,
    externalCliDetected: true,
  };
}

function expectNoCliControls(renderer: ReactTestRenderer) {
  const rendered = JSON.stringify(renderer.toJSON());
  expect(rendered).not.toMatch(/settings-cli-|apply-cli|external-sync|cliImport|importExternal/);
}

describe('internal subscription accounts', () => {
  it('does not register or expose native CLI credential verbs', () => {
    let methods: Record<string, unknown> = {};
    activate({
      services: {},
      registerIpcMethods: (value: Record<string, unknown>) => { methods = value; },
    } as never);
    for (const verb of removedVerbs) {
      expect(methods).not.toHaveProperty(`subAuth.${verb}`);
      expect(subscriptionAuthClient).not.toHaveProperty(verb);
    }
    expect(methods['subAuth.getClaudeAuthParams']).toBeTypeOf('function');
    expect(methods['subAuth.refreshAccount']).toBeTypeOf('function');
    expect(methods['cliRt.getAuthStatus']).toBeTypeOf('function');
  });

  for (const [provider, Card, addTestId] of [
    ['claude', ClaudeConfigCard, 'settings-account-add-btn'],
    ['codex', CodexConfigCard, 'settings-codex-account-add-btn'],
  ] as const) {
    it(`${provider} ignores stale import flags and keeps internal OAuth available`, async () => {
      const props = { ...cardProps(), accounts: [] };
      let renderer!: ReactTestRenderer;
      await act(async () => { renderer = create(<Card {...props} />); });
      expectNoCliControls(renderer);
      await act(async () => {
        await renderer.root.findByProps({ 'data-testid': addTestId }).props.onClick();
      });
      expect(props.onStartOAuth).toHaveBeenCalledOnce();
      expect(renderer.root.findByProps({ 'data-testid': 'oauth-flow' })).toBeDefined();
      expect(props.onImportFromCli).not.toHaveBeenCalled();
      act(() => renderer.unmount());
    });

    it(`${provider} reports refresh failure without importing native credentials`, async () => {
      const props = cardProps();
      let renderer!: ReactTestRenderer;
      await act(async () => { renderer = create(<Card {...props} />); });
      await act(async () => {
        await renderer.root.findByProps({ 'data-testid': 'settings-account-refresh-btn' }).props.onClick();
      });
      expect(props.onRefresh).toHaveBeenCalledOnce();
      expect(JSON.stringify(renderer.toJSON())).toContain('settings.accountTokens.errors.refreshFailed');
      expectNoCliControls(renderer);
      expect(props.onImportFromCli).not.toHaveBeenCalled();
      expect(props.onSetAutoImport).not.toHaveBeenCalled();
      expect(props.onApplyAccountToCli).not.toHaveBeenCalled();
      act(() => renderer.unmount());
    });
  }

  it('keeps internal account selection and removal without native writeback controls', async () => {
    const onSetActive = vi.fn(async () => ({ success: true }));
    const onRemove = vi.fn(async () => ({ success: true }));
    const legacyProps = { onApplyToCli: vi.fn(async () => ({ success: true })) };
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<AccountList t={t} accounts={[{ ...activeAccount, isActive: false }]}
        onSetActive={onSetActive} onRemove={onRemove} {...legacyProps} />);
    });
    expectNoCliControls(renderer);
    await act(async () => {
      await renderer.root.findByProps({ 'data-testid': 'settings-account-set-active-btn' }).props.onClick();
      await renderer.root.findByProps({ 'data-testid': 'settings-account-remove-btn' }).props.onClick();
    });
    expect(onSetActive).toHaveBeenCalledWith(activeAccount.id);
    expect(onRemove).toHaveBeenCalledWith(activeAccount.id);
    expect(legacyProps.onApplyToCli).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });
});
