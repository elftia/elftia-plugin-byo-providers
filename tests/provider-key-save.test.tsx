import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LLMProvider } from '../src/domain/llm';

vi.mock('../src/renderer/host/ui', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  ConfirmDialog: () => null,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Switch: () => null,
}));
vi.mock('../src/renderer/host/vendored/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../src/renderer/host/vendored/form-field', () => ({
  FormField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../src/renderer/host/vendored/revealable-input', () => ({
  RevealableInput: ({ revealed, onRevealedChange, ...props }: Record<string, unknown>) => (
    <input {...props} data-testid="provider-inline-api-key" />
  ),
}));
vi.mock('../src/renderer/host/vendored/setting-row', () => ({
  SettingRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../src/renderer/host/vendored/useTranslation', () => ({
  useTranslation: () => (key: string) => key,
}));
vi.mock('../src/renderer/llm/ApiKeyPoolSection', () => ({ ApiKeyPoolSection: () => null }));
vi.mock('../src/renderer/llm/ModelTestDialog', () => ({ ModelTestDialog: () => null }));
vi.mock('../src/renderer/llmConfigClient', () => ({ llmConfigClient: {} }));

import { ProviderDetails } from '../src/renderer/llm/ProviderDetails';

const provider: LLMProvider = {
  id: 'alpha',
  name: 'Alpha',
  apiFormat: 'openai',
  api_base_url: 'https://alpha.example/v1',
  api_key: '',
  hasKey: false,
  models: [],
  enabled: true,
};

function Fixture({ onInlineUpdate }: { onInlineUpdate: (field: string, value: string) => Promise<{ success: boolean; message?: string }> }) {
  const [inlineApiKey, setInlineApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  return (
    <ProviderDetails
      selectedProvider={provider}
      visibleModelGroups={[]}
      inlineName="Alpha"
      setInlineName={() => undefined}
      inlineApiKey={inlineApiKey}
      setInlineApiKey={setInlineApiKey}
      inlineApiUrl="https://alpha.example/v1"
      setInlineApiUrl={() => undefined}
      inlineModelsEndpoint=""
      setInlineModelsEndpoint={() => undefined}
      showApiKey={showApiKey}
      setShowApiKey={setShowApiKey}
      modelStatus={null}
      modelSearch=""
      setModelSearch={() => undefined}
      collapsedGroups={{}}
      toggleGroupCollapse={() => undefined}
      editingModel={null}
      setEditingModel={() => undefined}
      inlineMaxConcurrency=""
      setInlineMaxConcurrency={() => undefined}
      onInlineUpdate={onInlineUpdate}
      onToggleProvider={async () => undefined}
      onToggleOfficial={async () => undefined}
      onDeleteProvider={async () => undefined}
      onShowManageModels={() => undefined}
      onShowAddModelDialog={() => undefined}
      onApplyModelEdit={async () => undefined}
      onToggleModelEnabled={async () => undefined}
      onRemoveModel={async () => undefined}
      onShowEditModelDialog={() => undefined}
    />
  );
}

describe('saved API key action', () => {
  let renderer: ReactTestRenderer;

  afterEach(() => act(() => renderer.unmount()));

  it('saves a typed replacement on explicit action and reports success', async () => {
    const onInlineUpdate = vi.fn(async () => ({ success: true }));
    act(() => {
      renderer = create(<Fixture onInlineUpdate={onInlineUpdate} />);
    });
    act(() => {
      renderer.root
        .findByProps({ 'data-testid': 'provider-inline-api-key' })
        .props.onChange({ target: { value: 'replacement-key' } });
    });
    await act(async () => {
      await renderer.root.findByProps({ 'data-testid': 'provider-save-api-key' }).props.onClick();
    });
    expect(onInlineUpdate).toHaveBeenCalledWith('api_key', 'replacement-key');
    expect(renderer.root.findByProps({ role: 'status' }).children).toContain(
      'providerSettings.form.apiKeySaved'
    );
    expect(renderer.root.findByProps({ 'data-testid': 'provider-inline-api-key' }).props.value).toBe(
      ''
    );
  });
});
