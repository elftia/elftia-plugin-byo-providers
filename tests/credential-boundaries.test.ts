import { describe, expect, it, vi } from 'vitest';

import { activate } from '../src/main';

type IpcHandler = (payload?: unknown) => Promise<unknown>;

function methodsFor(services: Record<string, unknown>): Record<string, IpcHandler> {
  let methods: Record<string, IpcHandler> = {};
  activate({
    services,
    registerIpcMethods(value: Record<string, IpcHandler>) {
      methods = value;
    },
  } as never);
  return methods;
}

function expectNotReturned(value: unknown, ...sentinels: string[]): void {
  const serialized = JSON.stringify(value);
  for (const sentinel of sentinels) {
    expect(serialized).not.toContain(sentinel);
  }
  expect(serialized).not.toContain('encryptedBlob');
}

describe('credential boundaries', () => {
  it('keeps LLM/media/search credentials inward-only', async () => {
    const llmKey = 'SENTINEL_LLM_KEY';
    const mediaKey = 'SENTINEL_MEDIA_KEY';
    const searchKey = 'SENTINEL_SEARCH_KEY';
    const llmAdd = vi.fn(async () => ({ success: true, provider: { id: 'p', api_key: '', hasKey: true } }));
    const mediaWrite = vi.fn(async () => ({ success: true, hasKey: true }));
    const searchWrite = vi.fn(async () => ({ success: true }));
    const methods = methodsFor({
      llmConfig: { addProvider: llmAdd },
      mediaConfig: { setProviderKey: mediaWrite },
      searchConfig: { setProviderKey: searchWrite },
    });

    const llmResult = await methods['llm.addProvider']({ id: 'p', api_key: llmKey });
    const mediaResult = await methods['media.setProviderKey']({
      mediaType: 'video',
      id: 'v',
      apiKey: mediaKey,
    });
    const searchResult = await methods['search.setProviderKey']({
      providerId: 'tavily',
      apiKey: searchKey,
    });

    expect(llmAdd).toHaveBeenCalledWith(expect.objectContaining({ api_key: llmKey }));
    expect(mediaWrite).toHaveBeenCalledWith('video', 'v', mediaKey);
    expect(searchWrite).toHaveBeenCalledWith('tavily', searchKey);
    expectNotReturned(llmResult, llmKey);
    expectNotReturned(mediaResult, mediaKey);
    expectNotReturned(searchResult, searchKey);
  });

  it('keeps OAuth verifiers/manual tokens inward-only and CLI reads descriptor-only', async () => {
    const verifier = 'SENTINEL_OAUTH_VERIFIER';
    const token = 'SENTINEL_MANUAL_TOKEN';
    const exchange = vi.fn(async () => ({ success: true }));
    const manual = vi.fn(async () => ({ success: true }));
    const cliStatus = vi.fn(async () => [
      {
        backendId: 'codex-cli',
        displayName: 'Codex CLI',
        installed: true,
        authenticated: true,
        enabled: true,
      },
    ]);
    const methods = methodsFor({
      subscriptionAuth: {
        exchangeClaudeToken: exchange,
        setClaudeManualToken: manual,
      },
      cliRuntime: { getAuthStatus: cliStatus },
    });

    const exchangeResult = await methods['subAuth.exchangeClaudeToken']({
      authorizationCode: 'public-code',
      codeVerifier: verifier,
      state: 'public-state',
    });
    const manualResult = await methods['subAuth.setClaudeManualToken']({
      accessToken: token,
      subscriptionLevel: 'Pro',
    });
    const cliResult = await methods['cliRt.getAuthStatus']({});

    expect(exchange).toHaveBeenCalledWith(expect.objectContaining({ codeVerifier: verifier }));
    expect(manual).toHaveBeenCalledWith(token, 'Pro', undefined);
    expectNotReturned(exchangeResult, verifier);
    expectNotReturned(manualResult, token);
    expectNotReturned(cliResult, verifier, token);
  });

  it('passes only the secrets-pack passphrase inward and returns no passphrase/blob', async () => {
    const passphrase = 'SENTINEL_PACK_PASSPHRASE';
    const exportPack = vi.fn(async () => ({ success: true, path: 'C:/safe/export.epack' }));
    const importPack = vi.fn(async () => ({
      success: true,
      imported: {
        providerKeys: 1,
        poolKeys: 2,
        tokenSets: 3,
        mediaKeys: 4,
        searchKeys: 5,
        duplicatePoolKeys: 0,
        skipped: [],
      },
    }));
    const methods = methodsFor({ secretsPack: { export: exportPack, import: importPack } });

    const exportResult = await methods['secretsPack.export']({ passphrase });
    const importResult = await methods['secretsPack.import']({ passphrase });

    expect(exportPack).toHaveBeenCalledWith({ passphrase });
    expect(importPack).toHaveBeenCalledWith({ passphrase });
    expectNotReturned(exportResult, passphrase);
    expectNotReturned(importResult, passphrase);
  });
});
