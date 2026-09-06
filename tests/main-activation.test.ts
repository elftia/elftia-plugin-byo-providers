import { describe, expect, it } from 'vitest';

import { activate } from '../src/main';

type IpcHandler = (payload?: unknown) => Promise<unknown>;

interface RelayCase {
  ipc: string;
  service: string;
  method: string;
  payload?: unknown;
  args: unknown[];
}

const RELAY_CASES: RelayCase[] = [
  { ipc: 'llm.getProviders', service: 'llmConfig', method: 'getProviders', args: [] },
  {
    ipc: 'llm.getProvider',
    service: 'llmConfig',
    method: 'getProvider',
    payload: { id: 101 },
    args: ['101'],
  },
  {
    ipc: 'llm.addProvider',
    service: 'llmConfig',
    method: 'addProvider',
    payload: { name: 'new-provider', enabled: true },
    args: [{ name: 'new-provider', enabled: true }],
  },
  {
    ipc: 'llm.updateProvider',
    service: 'llmConfig',
    method: 'updateProvider',
    payload: { id: 'provider-a', name: 'updated' },
    args: [{ id: 'provider-a', name: 'updated' }],
  },
  {
    ipc: 'llm.deleteProvider',
    service: 'llmConfig',
    method: 'deleteProvider',
    payload: { id: 102 },
    args: ['102'],
  },
  {
    ipc: 'llm.toggleProvider',
    service: 'llmConfig',
    method: 'toggleProvider',
    payload: { id: 103, enabled: 1 },
    args: ['103', true],
  },
  {
    ipc: 'llm.reorderProviders',
    service: 'llmConfig',
    method: 'reorderProviders',
    payload: { orderedIds: ['provider-b', 'provider-a'] },
    args: [['provider-b', 'provider-a']],
  },
  {
    ipc: 'llm.resetProvider',
    service: 'llmConfig',
    method: 'resetProvider',
    payload: { id: 104 },
    args: ['104'],
  },
  {
    ipc: 'llm.discoverModels',
    service: 'llmConfig',
    method: 'discoverModels',
    payload: { id: 105, options: { forceRefresh: true } },
    args: ['105', { forceRefresh: true }],
  },
  {
    ipc: 'llm.testModel',
    service: 'llmConfig',
    method: 'testModel',
    payload: { providerId: 106, modelId: 107 },
    args: ['106', '107'],
  },
  {
    ipc: 'llm.revealProviderKey',
    service: 'llmConfig',
    method: 'revealProviderKey',
    payload: { id: 111 },
    args: ['111'],
  },
  {
    ipc: 'llm.getProviderPresets',
    service: 'llmConfig',
    method: 'getProviderPresets',
    args: [],
  },
  {
    ipc: 'llm.addFromPreset',
    service: 'llmConfig',
    method: 'addFromPreset',
    payload: { presetId: 108, apiKey: 'inward-key' },
    args: ['108', 'inward-key'],
  },
  {
    ipc: 'llm.getApiKeys',
    service: 'llmConfig',
    method: 'getApiKeys',
    payload: { providerId: 109 },
    args: ['109'],
  },
  {
    ipc: 'llm.addApiKey',
    service: 'llmConfig',
    method: 'addApiKey',
    payload: { providerId: 'provider-a', apiKey: 'inward-key', label: 'primary' },
    args: [{ providerId: 'provider-a', apiKey: 'inward-key', label: 'primary' }],
  },
  {
    ipc: 'llm.updateApiKey',
    service: 'llmConfig',
    method: 'updateApiKey',
    payload: { id: 'key-a', weight: 2 },
    args: [{ id: 'key-a', weight: 2 }],
  },
  {
    ipc: 'llm.deleteApiKey',
    service: 'llmConfig',
    method: 'deleteApiKey',
    payload: { id: 110 },
    args: ['110'],
  },
  {
    ipc: 'llm.toggleApiKey',
    service: 'llmConfig',
    method: 'toggleApiKey',
    payload: { id: 'key-a', enabled: false },
    args: [{ id: 'key-a', enabled: false }],
  },
  {
    ipc: 'llm.getKeyHealth',
    service: 'llmConfig',
    method: 'getKeyHealth',
    payload: { providerId: 111 },
    args: ['111'],
  },
  {
    ipc: 'llm.getRouterConfig',
    service: 'llmConfig',
    method: 'getRouterConfig',
    args: [],
  },
  {
    ipc: 'llm.setRouterConfig',
    service: 'llmConfig',
    method: 'setRouterConfig',
    payload: { providerId: 'router-a', modelId: 'model-a' },
    args: [{ providerId: 'router-a', modelId: 'model-a' }],
  },

  {
    ipc: 'media.listProviders',
    service: 'mediaConfig',
    method: 'listProviders',
    payload: { mediaType: 201 },
    args: ['201'],
  },
  {
    ipc: 'media.getProvider',
    service: 'mediaConfig',
    method: 'getProvider',
    payload: { mediaType: 'video', id: 202 },
    args: ['video', '202'],
  },
  {
    ipc: 'media.updateProvider',
    service: 'mediaConfig',
    method: 'updateProvider',
    payload: { mediaType: 'music', id: 203, patch: { name: 'updated' } },
    args: ['music', '203', { name: 'updated' }],
  },
  {
    ipc: 'media.toggleProvider',
    service: 'mediaConfig',
    method: 'toggleProvider',
    payload: { mediaType: 'tts', id: 204, enabled: 0 },
    args: ['tts', '204', false],
  },
  {
    ipc: 'media.createCustomProvider',
    service: 'mediaConfig',
    method: 'createCustomProvider',
    payload: { mediaType: 'asr', input: { baseProviderId: 'base-a', name: 'custom' } },
    args: ['asr', { baseProviderId: 'base-a', name: 'custom' }],
  },
  {
    ipc: 'media.deleteProvider',
    service: 'mediaConfig',
    method: 'deleteProvider',
    payload: { mediaType: 'image', id: 205 },
    args: ['image', '205'],
  },
  {
    ipc: 'media.getGlobalSettings',
    service: 'mediaConfig',
    method: 'getGlobalSettings',
    payload: { mediaType: 206 },
    args: ['206'],
  },
  {
    ipc: 'media.setGlobalSettings',
    service: 'mediaConfig',
    method: 'setGlobalSettings',
    payload: { mediaType: 'video', settings: { concurrency: 3 } },
    args: ['video', { concurrency: 3 }],
  },
  {
    ipc: 'media.refreshUpstreamModels',
    service: 'mediaConfig',
    method: 'refreshUpstreamModels',
    payload: { mediaType: 'music', id: 207 },
    args: ['music', '207'],
  },
  {
    ipc: 'media.resetProviderToDefaults',
    service: 'mediaConfig',
    method: 'resetProviderToDefaults',
    payload: { id: 208 },
    args: ['208'],
  },
  {
    ipc: 'media.setProviderKey',
    service: 'mediaConfig',
    method: 'setProviderKey',
    payload: { mediaType: 'tts', id: 209, apiKey: 'inward-media-key' },
    args: ['tts', '209', 'inward-media-key'],
  },
  {
    ipc: 'media.setProviderSecret',
    service: 'mediaConfig',
    method: 'setProviderSecret',
    payload: {
      mediaType: 'video',
      id: 'video-seedance-vod',
      field: 'byteplusAk',
      value: 'AKLT-inward',
    },
    args: ['video', 'video-seedance-vod', 'byteplusAk', 'AKLT-inward'],
  },
  {
    ipc: 'media.revealProviderKey',
    service: 'mediaConfig',
    method: 'revealProviderKey',
    payload: { mediaType: 'image', id: 210 },
    args: ['image', '210'],
  },
  {
    ipc: 'media.revealProviderSecret',
    service: 'mediaConfig',
    method: 'revealProviderSecret',
    payload: {
      mediaType: 'video',
      id: 'video-seedance-vod',
      field: 'byteplusSk',
    },
    args: ['video', 'video-seedance-vod', 'byteplusSk'],
  },

  {
    ipc: 'search.getProviders',
    service: 'searchConfig',
    method: 'getProviders',
    args: [],
  },
  {
    ipc: 'search.getProviderConfig',
    service: 'searchConfig',
    method: 'getProviderConfig',
    payload: { providerId: 301 },
    args: ['301'],
  },
  {
    ipc: 'search.configureProvider',
    service: 'searchConfig',
    method: 'configureProvider',
    payload: { config: { id: 'tavily', enabled: true } },
    args: [{ id: 'tavily', enabled: true }],
  },
  {
    ipc: 'search.configureProviders',
    service: 'searchConfig',
    method: 'configureProviders',
    payload: { configs: [{ id: 'jina', enabled: false }] },
    args: [[{ id: 'jina', enabled: false }]],
  },
  {
    ipc: 'search.isProviderEnabled',
    service: 'searchConfig',
    method: 'isProviderEnabled',
    payload: { providerId: 302 },
    args: ['302'],
  },
  {
    ipc: 'search.validate',
    service: 'searchConfig',
    method: 'validate',
    payload: { providerId: 303 },
    args: ['303'],
  },
  {
    ipc: 'search.setProviderKey',
    service: 'searchConfig',
    method: 'setProviderKey',
    payload: { providerId: 304, apiKey: 'inward-search-key' },
    args: ['304', 'inward-search-key'],
  },

  {
    ipc: 'subAuth.getClaudeAuthParams',
    service: 'subscriptionAuth',
    method: 'getClaudeAuthParams',
    args: [],
  },
  {
    ipc: 'subAuth.getClaudeSetupAuthParams',
    service: 'subscriptionAuth',
    method: 'getClaudeSetupAuthParams',
    args: [],
  },
  {
    ipc: 'subAuth.getCodexAuthParams',
    service: 'subscriptionAuth',
    method: 'getCodexAuthParams',
    args: [],
  },
  {
    ipc: 'subAuth.getGeminiAuthParams',
    service: 'subscriptionAuth',
    method: 'getGeminiAuthParams',
    args: [],
  },
  {
    ipc: 'subAuth.exchangeClaudeToken',
    service: 'subscriptionAuth',
    method: 'exchangeClaudeToken',
    payload: { authorizationCode: 'code-c', state: 'state-c', label: 'Claude' },
    args: [{ authorizationCode: 'code-c', state: 'state-c', label: 'Claude' }],
  },
  {
    ipc: 'subAuth.exchangeClaudeSetupToken',
    service: 'subscriptionAuth',
    method: 'exchangeClaudeSetupToken',
    payload: { authorizationCode: 'code-s', state: 'state-s' },
    args: [{ authorizationCode: 'code-s', state: 'state-s' }],
  },
  {
    ipc: 'subAuth.exchangeCodexToken',
    service: 'subscriptionAuth',
    method: 'exchangeCodexToken',
    payload: { authorizationCode: 'code-x', state: 'state-x' },
    args: [{ authorizationCode: 'code-x', state: 'state-x' }],
  },
  {
    ipc: 'subAuth.exchangeGeminiToken',
    service: 'subscriptionAuth',
    method: 'exchangeGeminiToken',
    payload: { authorizationCode: 'code-g', state: 'state-g' },
    args: [{ authorizationCode: 'code-g', state: 'state-g' }],
  },
  {
    ipc: 'subAuth.getSanitized',
    service: 'subscriptionAuth',
    method: 'getSanitized',
    args: [],
  },
  {
    ipc: 'subAuth.listAccounts',
    service: 'subscriptionAuth',
    method: 'listAccounts',
    payload: { provider: 404 },
    args: ['404'],
  },
  {
    ipc: 'subAuth.setActiveAccount',
    service: 'subscriptionAuth',
    method: 'setActiveAccount',
    payload: { provider: 405, id: 406 },
    args: ['405', '406'],
  },
  {
    ipc: 'subAuth.removeAccount',
    service: 'subscriptionAuth',
    method: 'removeAccount',
    payload: { provider: 407, id: 408 },
    args: ['407', '408'],
  },
  {
    ipc: 'subAuth.updateAccountLabel',
    service: 'subscriptionAuth',
    method: 'updateAccountLabel',
    payload: { provider: 409, id: 410, label: 411 },
    args: ['409', '410', '411'],
  },
  {
    ipc: 'subAuth.refreshAccount',
    service: 'subscriptionAuth',
    method: 'refreshAccount',
    payload: { provider: 414, id: 415 },
    args: ['414', '415'],
  },
  {
    ipc: 'subAuth.clearConfig',
    service: 'subscriptionAuth',
    method: 'clearConfig',
    payload: { platform: 416 },
    args: ['416'],
  },
  {
    ipc: 'subAuth.listSubscriptions',
    service: 'subscriptionAuth',
    method: 'listSubscriptions',
    args: [],
  },
  {
    ipc: 'subAuth.subscriptionStatus',
    service: 'subscriptionAuth',
    method: 'subscriptionStatus',
    payload: { providerId: 417 },
    args: ['417'],
  },
  {
    ipc: 'subAuth.setOpenCodeGoConfig',
    service: 'subscriptionAuth',
    method: 'setOpenCodeGoConfig',
    payload: { request: { enabled: true, apiKey: 'inward-opencode-key' } },
    args: [{ enabled: true, apiKey: 'inward-opencode-key' }],
  },
  {
    ipc: 'subAuth.addOpenCodeGoAccount',
    service: 'subscriptionAuth',
    method: 'addOpenCodeGoAccount',
    payload: { request: { label: 'OpenCode', apiKey: 'inward-opencode-key' } },
    args: [{ label: 'OpenCode', apiKey: 'inward-opencode-key' }],
  },
  {
    ipc: 'subAuth.clearOpenCodeGo',
    service: 'subscriptionAuth',
    method: 'clearOpenCodeGo',
    args: [],
  },
  {
    ipc: 'subAuth.refreshCredential',
    service: 'subscriptionAuth',
    method: 'refreshCredential',
    payload: { providerId: 418 },
    args: ['418'],
  },
  {
    ipc: 'subAuth.setClaudeManualToken',
    service: 'subscriptionAuth',
    method: 'setClaudeManualToken',
    payload: { accessToken: 419, subscriptionLevel: 'max', label: 'Claude manual' },
    args: ['419', 'max', 'Claude manual'],
  },
  {
    ipc: 'subAuth.setCodexManualToken',
    service: 'subscriptionAuth',
    method: 'setCodexManualToken',
    payload: { accessToken: 420, label: 'Codex manual' },
    args: ['420', 'Codex manual'],
  },
  {
    ipc: 'subAuth.setGeminiManualToken',
    service: 'subscriptionAuth',
    method: 'setGeminiManualToken',
    payload: { accessToken: 421, refreshToken: 'refresh-inward' },
    args: ['421', 'refresh-inward'],
  },
  {
    ipc: 'subAuth.updateClaudeSubscriptionLevel',
    service: 'subscriptionAuth',
    method: 'updateClaudeSubscriptionLevel',
    payload: { level: 422 },
    args: ['422'],
  },

  {
    ipc: 'agentCfg.getCliBackendConfig',
    service: 'agentConfig',
    method: 'getCliBackendConfig',
    args: [],
  },
  {
    ipc: 'agentCfg.setCliBackendConfig',
    service: 'agentConfig',
    method: 'setCliBackendConfig',
    payload: { codexEnabled: true, claudeEnabled: false },
    args: [{ codexEnabled: true, claudeEnabled: false }],
  },

  {
    ipc: 'cliRt.getAuthStatus',
    service: 'cliRuntime',
    method: 'getAuthStatus',
    payload: { force: true },
    args: [{ force: true }],
  },
  {
    ipc: 'cliRt.setEnabled',
    service: 'cliRuntime',
    method: 'setEnabled',
    payload: { backendId: 501, enabled: 0 },
    args: ['501', false],
  },
  {
    ipc: 'cliRt.install',
    service: 'cliRuntime',
    method: 'install',
    payload: { backendId: 502 },
    args: ['502'],
  },
  {
    ipc: 'cliRt.launchTerminal',
    service: 'cliRuntime',
    method: 'launchTerminal',
    payload: { backendId: 'codex', cwd: 'workspace', command: 'status' },
    args: [{ backendId: 'codex', cwd: 'workspace', command: 'status' }],
  },
  {
    ipc: 'cliRt.listBackends',
    service: 'cliRuntime',
    method: 'listBackends',
    args: [],
  },

  {
    ipc: 'storage.listProviders',
    service: 'objectStorageConfig',
    method: 'listProviders',
    args: [],
  },
  {
    ipc: 'storage.updateProvider',
    service: 'objectStorageConfig',
    method: 'updateProvider',
    payload: { id: 601, patch: { bucket: 'media' } },
    args: ['601', { bucket: 'media' }],
  },
  {
    ipc: 'storage.setCredentials',
    service: 'objectStorageConfig',
    method: 'setCredentials',
    payload: { id: 'aws-s3', credentials: { accessKeyId: 'inward-ak' } },
    args: ['aws-s3', { accessKeyId: 'inward-ak' }],
  },
  {
    ipc: 'storage.clearCredentials',
    service: 'objectStorageConfig',
    method: 'clearCredentials',
    payload: { id: 602 },
    args: ['602'],
  },
  {
    ipc: 'storage.setDefaultProvider',
    service: 'objectStorageConfig',
    method: 'setDefaultProvider',
    payload: { id: 'cloudflare-r2' },
    args: ['cloudflare-r2'],
  },

  {
    ipc: 'secretsPack.export',
    service: 'secretsPack',
    method: 'export',
    payload: { passphrase: 601 },
    args: [{ passphrase: '601' }],
  },
  {
    ipc: 'secretsPack.import',
    service: 'secretsPack',
    method: 'import',
    payload: { passphrase: 602 },
    args: [{ passphrase: '602' }],
  },
];

const SERVICE_NAMES = [
  'llmConfig',
  'mediaConfig',
  'searchConfig',
  'subscriptionAuth',
  'agentConfig',
  'cliRuntime',
  'objectStorageConfig',
  'secretsPack',
] as const;

function captureMethods(services: Record<string, unknown>): Record<string, IpcHandler> {
  let methods: Record<string, IpcHandler> = {};
  activate({
    services,
    registerIpcMethods(value: Record<string, IpcHandler>) {
      methods = value;
    },
  } as never);
  return methods;
}

function captureCalls() {
  const calls: Array<{ service: string; method: string; args: unknown[] }> = [];
  const services = Object.fromEntries(
    SERVICE_NAMES.map((service) => [
      service,
      new Proxy(
        {},
        {
          get: (_target, method) =>
            async (...args: unknown[]) => {
              calls.push({ service, method: String(method), args });
              return { success: true, ok: true };
            },
        },
      ),
    ]),
  );
  return { calls, methods: captureMethods(services) };
}

async function expectRelay(
  methods: Record<string, IpcHandler>,
  calls: Array<{ service: string; method: string; args: unknown[] }>,
  relay: RelayCase,
) {
  calls.length = 0;
  await methods[relay.ipc]?.(relay.payload);
  expect(calls, relay.ipc).toEqual([
    {
      service: relay.service,
      method: relay.method,
      args: relay.args,
    },
  ]);
}

describe('main activation', () => {
  it('registers the complete current IPC method set in canonical order', () => {
    const methods = captureMethods({});
    const expectedMethods = RELAY_CASES.map(({ ipc }) => ipc);

    expect(expectedMethods).toHaveLength(81);
    expect(new Set(expectedMethods).size).toBe(expectedMethods.length);
    expect(Object.keys(methods)).toEqual(expectedMethods);
  });

  it('delegates every relay to the exact service method and transformed argument tuple', async () => {
    const { calls, methods } = captureCalls();

    for (const relay of RELAY_CASES) {
      await expectRelay(methods, calls, relay);
    }
  });

  it('preserves focused coercion and default behavior at IPC boundaries', async () => {
    const { calls, methods } = captureCalls();
    const boundaryCases: RelayCase[] = [
      {
        ipc: 'llm.reorderProviders',
        service: 'llmConfig',
        method: 'reorderProviders',
        args: [[]],
      },
      {
        ipc: 'media.updateProvider',
        service: 'mediaConfig',
        method: 'updateProvider',
        payload: { mediaType: 701, id: null, patch: null },
        args: ['701', 'null', {}],
      },
      {
        ipc: 'media.setProviderKey',
        service: 'mediaConfig',
        method: 'setProviderKey',
        payload: { mediaType: 'image', id: 702 },
        args: ['image', '702', ''],
      },
      {
        ipc: 'search.configureProviders',
        service: 'searchConfig',
        method: 'configureProviders',
        args: [[]],
      },
      {
        ipc: 'subAuth.setClaudeManualToken',
        service: 'subscriptionAuth',
        method: 'setClaudeManualToken',
        args: ['', undefined, undefined],
      },
      {
        ipc: 'secretsPack.export',
        service: 'secretsPack',
        method: 'export',
        args: [{ passphrase: '' }],
      },
    ];

    for (const relay of boundaryCases) {
      await expectRelay(methods, calls, relay);
    }
  });

  it('fails every invocation explicitly when its required host service is missing', async () => {
    const methods = captureMethods({});
    for (const [name, handler] of Object.entries(methods)) {
      await expect(handler({}), name).rejects.toThrow('host.services.');
    }
  });
});
