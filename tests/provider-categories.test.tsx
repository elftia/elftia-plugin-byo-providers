import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  providers: [] as Array<Record<string, unknown>>,
  addFromPreset: vi.fn(),
}));
vi.mock('../src/renderer/useLlmProviders', () => ({
  useLlmProviders: () => ({
    providers: state.providers,
    loading: false,
    error: null,
  }),
}));
vi.mock('../src/renderer/llm/hooks/useProviderForm', () => ({
  useProviderForm: (_providers: unknown, _selected: unknown, select: (id: string) => void) => ({
    handleSelectProvider: select,
    handleAddFromPreset: state.addFromPreset,
    isAddingNew: false,
    isEditing: false,
  }),
}));
vi.mock('../src/renderer/llm/hooks/useModelManagement', () => ({
  useModelManagement: () => ({}),
}));
vi.mock('../src/renderer/llm/hooks/useCatalogBrowser', () => ({
  useCatalogBrowser: () => ({}),
}));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  useTranslation: () => (key: string) => key,
}));
vi.mock('../src/renderer/host/ui', () => ({
  Button: ({ children, onClick }: React.PropsWithChildren<{ onClick: () => void }>) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock('../src/renderer/host/vendored/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ByoPortalRoot: () => <div data-testid="portal-root" />,
}));
vi.mock('../src/renderer/llm/ProviderDetailPanel', () => ({
  ProviderDetailPanel: ({ s }: { s: { selectedProviderId: string } }) => (
    <div data-testid="details">{s.selectedProviderId}</div>
  ),
}));
vi.mock('../src/renderer/llm/ProviderList', () => ({
  ProviderList: ({
    providers,
    onAddProvider,
    onSelectProvider,
  }: {
    providers: Array<{ id: string }>;
    onAddProvider: () => void;
    onSelectProvider: (id: string) => void;
  }) => (
    <div data-testid="list">
      {providers.map((provider) => (
        <button key={provider.id} onClick={() => onSelectProvider(provider.id)}>
          {provider.id}
        </button>
      ))}
      <button data-testid="add" onClick={onAddProvider}>
        Add
      </button>
    </div>
  ),
}));
vi.mock('../src/renderer/llm/PresetProviderGrid', () => ({
  ProviderTemplatePicker: (props: { category: string; onSelectPreset: (id: string) => void }) => (
    <button
      data-testid="picker"
      data-category={props.category}
      onClick={() => props.onSelectPreset('openrouter-decisions')}
    >
      OpenRouter Decisions
    </button>
  ),
}));

import { DecisionModelsPage } from '../src/renderer/llm/DecisionModelsPage';
import { useProviderSettings } from '../src/renderer/llm/hooks/useProviderSettings';

let settings: ReturnType<typeof useProviderSettings>;
function Probe({ category }: { category?: 'chat' | 'decision' }) {
  settings = useProviderSettings(category);
  return null;
}

beforeEach(() => {
  state.providers = [
    { id: 'jev', category: 'other', enabled: true, hasKey: false },
    { id: 'openai', enabled: true, hasKey: true },
    { id: 'legacy-logjev', category: 'other', enabled: true, hasKey: true },
  ];
  state.addFromPreset.mockReset();
});

describe('independent provider pages', () => {
  it('keeps selection and missing-key counts inside each category, including after removal', async () => {
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<Probe />);
    });
    expect(settings.providers.map((provider) => provider.id)).toEqual(['openai']);
    expect(settings.selectedProviderId).toBe('openai');
    expect(settings.missingKeyCount).toBe(0);
    await act(async () => {
      renderer.update(<Probe category="decision" />);
    });
    expect(settings.providers.map((provider) => provider.id)).toEqual(['jev', 'legacy-logjev']);
    expect(settings.selectedProvider?.id).toBe('jev');
    expect(settings.missingKeyProviderIds).toEqual(['jev']);
    await act(async () => {
      settings.handleSelectProvider('legacy-logjev');
    });
    expect(settings.selectedProviderId).toBe('legacy-logjev');
    state.providers = state.providers.filter((provider) => provider.id !== 'legacy-logjev');
    await act(async () => {
      renderer.update(<Probe category="decision" />);
    });
    expect(settings.selectedProviderId).toBe('jev');
    state.providers = [{ id: 'openai' }];
    await act(async () => {
      renderer.update(<Probe category="decision" />);
    });
    expect(settings.selectedProvider).toBeNull();
    expect(settings.selectedProviderId).toBeNull();
    renderer.unmount();
  });

  it('opens a decision-only add flow, reports failure and closes after a successful add', async () => {
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<DecisionModelsPage />);
    });
    const list = renderer.root.findByProps({ 'data-testid': 'list' });
    expect(list.findAllByType('button').map((button) => button.children.join(''))).toEqual([
      'jev',
      'legacy-logjev',
      'Add',
    ]);
    expect(renderer.root.findByProps({ 'data-testid': 'details' }).children).toEqual(['jev']);
    expect(renderer.root.findByProps({ 'data-testid': 'portal-root' })).toBeDefined();
    await act(async () => {
      renderer.root.findByProps({ 'data-testid': 'add' }).props.onClick();
    });
    expect(renderer.root.findByProps({ 'data-testid': 'picker' }).props['data-category']).toBe(
      'decision'
    );
    state.addFromPreset.mockResolvedValueOnce({
      success: false,
      message: 'Could not add',
    });
    await act(async () => {
      await renderer.root.findByProps({ 'data-testid': 'picker' }).props.onClick();
    });
    expect(state.addFromPreset).toHaveBeenCalledWith('openrouter-decisions');
    expect(renderer.root.findByProps({ role: 'alert' }).children).toEqual(['Could not add']);
    state.addFromPreset.mockResolvedValueOnce({
      success: true,
      provider: { id: 'new-decision' },
    });
    await act(async () => {
      await renderer.root.findByProps({ 'data-testid': 'picker' }).props.onClick();
    });
    expect(renderer.root.findAllByProps({ 'data-testid': 'picker' })).toHaveLength(0);
    renderer.unmount();
  });
});
