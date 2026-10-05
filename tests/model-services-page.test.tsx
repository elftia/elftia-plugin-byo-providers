/**
 * ModelServicesPage composition tests — the unified model-services section
 * (omnicross UpstreamsPage shape over elftia data).
 *
 * The data hooks + heavy child panels are stubbed: these tests pin the
 * COMPOSITION (one sidebar tree over accounts + providers, filters, selection
 * swapping the right panel, the guided empty state), not the child surfaces
 * (covered by their own suites) nor the masked-port data paths.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const accountsState = vi.hoisted(() => ({
  config: null as Record<string, unknown> | null,
}));

vi.mock('../src/renderer/subscription/useSubscriptionAccounts', () => ({
  useSubscriptionAccounts: () => ({
    config: accountsState.config,
    loading: false,
    error: null,
    refresh: vi.fn(async () => undefined),
  }),
}));

const settingsState = vi.hoisted(() => ({
  providers: [] as Array<Record<string, unknown>>,
  selectedProviderId: null as string | null,
  isAddingNew: false,
  isEditing: false,
}));

vi.mock('../src/renderer/llm/hooks/useProviderSettings', () => ({
  useProviderSettings: () => ({
    providers: settingsState.providers,
    providersLoading: false,
    selectedProviderId: settingsState.selectedProviderId,
    selectedProvider: null,
    isAddingNew: settingsState.isAddingNew,
    isEditing: settingsState.isEditing,
    missingKeyCount: 0,
    handleSelectProvider: vi.fn(),
    handleAddProvider: vi.fn(),
    handleAddFromPreset: vi.fn(async () => null),
    handleUseTemplate: vi.fn(),
    handleCancelEdit: vi.fn(),
  }),
}));

// Child surfaces are stubbed so selection swaps are observable by testid.
vi.mock('../src/renderer/llm/ProviderDetailPanel', () => ({
  ProviderDetailPanel: () =>
    React.createElement('div', { 'data-testid': 'provider-detail-panel' }),
}));
vi.mock('../src/renderer/subscription/SubscriptionAccountPanel', () => ({
  SubscriptionAccountPanel: ({ platform }: { platform: string }) =>
    React.createElement('div', { 'data-testid': `account-panel-${platform}` }),
}));
vi.mock('../src/renderer/llm/PresetProviderGrid', () => ({
  ProviderTemplatePicker: () =>
    React.createElement('div', { 'data-testid': 'provider-template-picker' }),
}));

vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  readLocale: () => 'en',
  registerLlmI18n: () => undefined,
  useTranslation: () => (key: string, params?: Record<string, string | number>) => {
    const strings: Record<string, string> = {
      'modelServices.title': 'Model Services',
      'modelServices.addAccount': 'Add Account',
      'modelServices.addProvider': 'Add Provider',
      'modelServices.searchPlaceholder': 'Search accounts and providers…',
      'modelServices.filter.all': 'All',
      'modelServices.filter.account': 'Accounts',
      'modelServices.filter.provider': 'Providers',
      'modelServices.kind.accountPool': 'Accounts',
      'modelServices.kind.provider': 'Provider',
      'modelServices.status.ready': 'Ready',
      'modelServices.status.disabled': 'Disabled',
      'modelServices.status.needsKey': 'Needs key',
      'modelServices.accountCount': '{{count}} account(s)',
      'modelServices.modelCount': '{{count}} model(s)',
      'modelServices.empty.providers': 'No providers yet.',
      'modelServices.empty.providersCta': 'Add one from a template',
      'modelServices.empty.accounts': 'No subscription accounts yet.',
      'modelServices.empty.none': 'Select an account or provider to manage it.',
      'modelServices.empty.filtered': 'Nothing matches this filter.',
      'settings.accountTokens.claude.title': 'Claude (Anthropic)',
      'settings.accountTokens.openCodeGo.title': 'OpenCode',
      'settings.accountTokens.status.authorized': 'Authorized',
    };
    let text = strings[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{{${name}}}`, String(value));
      }
    }
    return text;
  },
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
      React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }
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

vi.mock('../src/renderer/host/vendored/dialog', async () => {
  const ReactModule = await import('react');
  const passthrough = (testid: string) => ({
    children,
    open: _open,
  }: React.PropsWithChildren<{ open?: boolean }>) =>
    ReactModule.createElement('div', { 'data-testid': testid }, children);
  return {
    Dialog: ({ children, open }: React.PropsWithChildren<{ open?: boolean }>) =>
      open ? ReactModule.createElement('div', null, children) : null,
    DialogContent: passthrough('dialog-content'),
    DialogDescription: passthrough('dialog-description'),
    DialogHeader: passthrough('dialog-header'),
    DialogTitle: passthrough('dialog-title'),
  };
});

vi.mock('../src/renderer/host/vendored/scroll-area', async () => {
  const ReactModule = await import('react');
  return {
    ScrollArea: ({ children }: React.PropsWithChildren) =>
      ReactModule.createElement('div', null, children),
  };
});

import { ModelServicesPage } from '../src/renderer/llm/ModelServicesPage';

function renderPage(): React.ReactElement {
  return <ModelServicesPage />;
}

function accountRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    label: id,
    enabled: true,
    group: 'claude',
    tags: [],
    status: 'authorized',
    hasAccessToken: true,
    isActive: false,
    schedulable: true,
    ...overrides,
  };
}

beforeEach(() => {
  accountsState.config = null;
  settingsState.providers = [];
  settingsState.selectedProviderId = null;
  settingsState.isAddingNew = false;
  settingsState.isEditing = false;
});

describe('ModelServicesPage sidebar composition', () => {
  it('lists account pools (with accounts) and provider rows in one tree', async () => {
    accountsState.config = {
      claude: { status: 'authorized' },
      claudeAccounts: [accountRow('acct-1')],
    };
    settingsState.providers = [
      { id: 'kimi', name: 'Kimi', enabled: true, hasKey: true, models: ['k1'] },
      { id: 'grok', name: 'Grok', enabled: false, hasKey: false, models: [] },
    ];
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPage());
    });

    // Account pool above the divider, provider rows below — one sidebar.
    expect(renderer.root.findByProps({ 'data-testid': 'account-pool-claude' })).toBeDefined();
    expect(renderer.root.findByProps({ 'data-testid': 'provider-row-kimi' })).toBeDefined();
    expect(renderer.root.findByProps({ 'data-testid': 'provider-row-grok' })).toBeDefined();
    // Unconfigured platforms stay out of the sidebar (add-account dialog owns them).
    expect(renderer.root.findAllByProps({ 'data-testid': 'account-pool-kimi' })).toHaveLength(0);

    // Provider status taxonomy: enabled+key → Ready, disabled → Disabled.
    const tree = JSON.stringify(renderer.toJSON());
    expect(tree).toContain('Ready');
    expect(tree).toContain('Disabled');
  });

  it('kind filter chips narrow the tree to one half', async () => {
    accountsState.config = { claudeAccounts: [accountRow('acct-1')] };
    settingsState.providers = [{ id: 'kimi', name: 'Kimi', enabled: true, models: [] }];
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPage());
    });

    await act(async () => {
      renderer.root.findByProps({ 'data-testid': 'kind-filter-provider' }).props.onClick();
    });
    expect(renderer.root.findAllByProps({ 'data-testid': 'account-pool-claude' })).toHaveLength(0);
    expect(renderer.root.findByProps({ 'data-testid': 'provider-row-kimi' })).toBeDefined();

    await act(async () => {
      renderer.root.findByProps({ 'data-testid': 'kind-filter-account' }).props.onClick();
    });
    expect(renderer.root.findByProps({ 'data-testid': 'account-pool-claude' })).toBeDefined();
    expect(renderer.root.findAllByProps({ 'data-testid': 'provider-row-kimi' })).toHaveLength(0);
  });

  it('search narrows providers and reveals matching accounts', async () => {
    accountsState.config = { claudeAccounts: [accountRow('acct-1'), accountRow('acct-2')] };
    settingsState.providers = [
      { id: 'kimi', name: 'Kimi', enabled: true, models: [] },
      { id: 'openai', name: 'OpenAI', enabled: true, models: [] },
    ];
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPage());
    });

    const search = renderer.root.findByProps({
      placeholder: 'Search accounts and providers…',
    });
    await act(async () => {
      search.props.onChange({ target: { value: 'kimi' } });
    });
    expect(renderer.root.findByProps({ 'data-testid': 'provider-row-kimi' })).toBeDefined();
    expect(renderer.root.findAllByProps({ 'data-testid': 'provider-row-openai' })).toHaveLength(0);

    await act(async () => {
      search.props.onChange({ target: { value: 'acct-2' } });
    });
    expect(renderer.root.findByProps({ 'data-testid': 'account-pool-claude' })).toBeDefined();
    expect(renderer.root.findAllByProps({ 'data-testid': 'provider-row-kimi' })).toHaveLength(0);
  });

  it('empty provider list shows the guided empty state, not a preset grid', async () => {
    accountsState.config = null;
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPage());
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('No providers yet.');
    // The CTA opens the template picker dialog.
    const ctaButton = renderer.root.findByProps({ 'data-testid': 'empty-providers-cta' });
    await act(async () => {
      ctaButton.props.onClick();
    });
    expect(renderer.root.findByProps({ 'data-testid': 'add-provider-dialog' })).toBeDefined();
    expect(renderer.root.findByProps({ 'data-testid': 'provider-template-picker' })).toBeDefined();
  });

  it('selection swaps the right panel between account and provider surfaces', async () => {
    accountsState.config = { claudeAccounts: [accountRow('acct-1')] };
    settingsState.providers = [{ id: 'kimi', name: 'Kimi', enabled: true, models: [] }];
    settingsState.selectedProviderId = 'kimi';
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(renderPage());
    });

    // Provider selected by default → provider detail panel.
    expect(renderer.root.findByProps({ 'data-testid': 'provider-detail-panel' })).toBeDefined();

    // Selecting an account pool swaps the panel to that platform's card.
    await act(async () => {
      renderer.root
        .findByProps({ 'data-testid': 'account-pool-claude' })
        .findByType('button')
        .props.onClick();
    });
    expect(renderer.root.findByProps({ 'data-testid': 'account-panel-claude' })).toBeDefined();
    expect(renderer.root.findAllByProps({ 'data-testid': 'provider-detail-panel' })).toHaveLength(0);

    // Selecting a provider row swaps back.
    await act(async () => {
      renderer.root.findByProps({ 'data-testid': 'provider-row-kimi' }).props.onClick();
    });
    expect(renderer.root.findByProps({ 'data-testid': 'provider-detail-panel' })).toBeDefined();
  });
});
