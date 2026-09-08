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
    const byteplusSecret = 'SENTINEL_BYTEPLUS_SECRET';
    const searchKey = 'SENTINEL_SEARCH_KEY';
    const llmAdd = vi.fn(async () => ({ success: true, provider: { id: 'p', api_key: '', hasKey: true } }));
    const mediaWrite = vi.fn(async () => ({ success: true, hasKey: true }));
    const mediaSecretWrite = vi.fn(async () => ({ success: true }));
    const searchWrite = vi.fn(async () => ({ success: true }));
    const methods = methodsFor({
      llmConfig: { addProvider: llmAdd },
      mediaConfig: { setProviderKey: mediaWrite, setProviderSecret: mediaSecretWrite },
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
    const byteplusResult = await methods['media.setProviderSecret']({
      mediaType: 'video',
      id: 'video-seedance-vod',
      field: 'byteplusSk',
      value: byteplusSecret,
    });

    expect(llmAdd).toHaveBeenCalledWith(expect.objectContaining({ api_key: llmKey }));
    expect(mediaWrite).toHaveBeenCalledWith('video', 'v', mediaKey);
    expect(mediaSecretWrite).toHaveBeenCalledWith(
      'video',
      'video-seedance-vod',
      'byteplusSk',
      byteplusSecret,
    );
    expect(searchWrite).toHaveBeenCalledWith('tavily', searchKey);
    expectNotReturned(llmResult, llmKey);
    expectNotReturned(mediaResult, mediaKey);
    expectNotReturned(byteplusResult, byteplusSecret);
    expectNotReturned(searchResult, searchKey);
  });

  // provider-key-reveal (host-API v1.50): the three reveal verbs are the ONE
  // deliberate outward secret exception — they DO return the stored key, but
  // ONLY on their dedicated `{success, value?}` result (never embedded in a
  // provider row), and every OTHER verb stays inward-only.
  it('reveals stored keys ONLY through the dedicated reveal verbs', async () => {
    const storedLlmKey = 'SENTINEL_REVEALED_LLM_KEY';
    const storedMediaKey = 'SENTINEL_REVEALED_MEDIA_KEY';
    const storedByteplus = 'SENTINEL_REVEALED_BYTEPLUS';
    const llmGet = vi.fn(async () => ({
      id: 'p',
      api_key: '',
      hasKey: true,
      models: [],
    }));
    const mediaList = vi.fn(async () => [
      { id: 'p1', configured: true, hasKey: true, config: {}, models: [] },
    ]);
    const llmReveal = vi.fn(async () => ({ success: true, value: storedLlmKey }));
    const mediaReveal = vi.fn(async () => ({ success: true, value: storedMediaKey }));
    const mediaSecretReveal = vi.fn(async () => ({ success: true, value: storedByteplus }));
    const methods = methodsFor({
      llmConfig: { getProviders: llmGet, revealProviderKey: llmReveal },
      mediaConfig: {
        listProviders: mediaList,
        revealProviderKey: mediaReveal,
        revealProviderSecret: mediaSecretReveal,
      },
    });

    const llmRevealed = await methods['llm.revealProviderKey']({ id: 'p' });
    const mediaRevealed = await methods['media.revealProviderKey']({
      mediaType: 'image',
      id: 'p1',
    });
    const secretRevealed = await methods['media.revealProviderSecret']({
      mediaType: 'video',
      id: 'video-seedance-vod',
      field: 'byteplusAk',
    });

    expect(llmReveal).toHaveBeenCalledWith('p');
    expect(mediaReveal).toHaveBeenCalledWith('image', 'p1');
    expect(mediaSecretReveal).toHaveBeenCalledWith('video', 'video-seedance-vod', 'byteplusAk');
    // The reveal verbs carry the value OUT (the deliberate exception)...
    expect(llmRevealed).toEqual({ success: true, value: storedLlmKey });
    expect(mediaRevealed).toEqual({ success: true, value: storedMediaKey });
    expect(secretRevealed).toEqual({ success: true, value: storedByteplus });
    // ...but never as a provider row (dedicated result shape only).
    expect(JSON.stringify(llmRevealed)).not.toContain('"provider"');
    expect(JSON.stringify(mediaRevealed)).not.toContain('"provider"');
    // And the ordinary reads still carry NO key.
    expectNotReturned(await methods['llm.getProviders']({}), storedLlmKey, storedMediaKey);
    expectNotReturned(await methods['media.listProviders']({ mediaType: 'image' }), storedMediaKey);
  });

  it('keeps object storage credentials inward-only', async () => {
    const accessKeyId = 'SENTINEL_STORAGE_ACCESS_KEY';
    const secretAccessKey = 'SENTINEL_STORAGE_SECRET_KEY';
    const sessionToken = 'SENTINEL_STORAGE_SESSION_TOKEN';
    const write = vi.fn(async () => ({
      success: true,
      provider: { id: 'aws-s3', configured: true, ready: true },
    }));
    const methods = methodsFor({ objectStorageConfig: { setCredentials: write } });

    const result = await methods['storage.setCredentials']({
      id: 'aws-s3',
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    });

    expect(write).toHaveBeenCalledWith('aws-s3', {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    });
    expectNotReturned(result, accessKeyId, secretAccessKey, sessionToken);
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
    // v1.72: the trailing `undefined` is the absent verify option (the wire
    // payload carried no `verify`, so the legacy path is taken byte-identically).
    expect(manual).toHaveBeenCalledWith(token, 'Pro', undefined, undefined);
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
