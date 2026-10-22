import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetHost, setHost } from '../src/renderer/host/hostBridge';
import { mediaConfigClient } from '../src/renderer/mediaConfigClient';

const invoke = vi.fn();
const received: string[] = [];
const onChanged = (event: Event) => {
  received.push((event as CustomEvent<{ mediaType: string }>).detail.mediaType);
};

beforeEach(() => {
  vi.stubGlobal('window', new EventTarget());
  received.length = 0;
  invoke.mockReset().mockImplementation(async (method: string, payload: { id?: string }) => {
    if (method === 'media.updateProvider' || method === 'media.createCustomProvider') {
      return { success: true, provider: { id: payload.id ?? 'provider' } };
    }
    return { success: true, provider: { id: 'provider' } };
  });
  setHost({ ipc: { invoke } } as never);
  window.addEventListener('media-provider-config-changed', onChanged);
});

afterEach(() => {
  window.removeEventListener('media-provider-config-changed', onChanged);
  vi.unstubAllGlobals();
  __resetHost();
});

describe('mediaConfigClient host cache notifications', () => {
  it.each(['image', 'video', 'music', 'tts', 'asr'] as const)(
    'rejects failed %s saves without notifying the host',
    async (mediaType) => {
      invoke.mockResolvedValueOnce({ success: false, message: 'Preference write failed' });
      await expect(mediaConfigClient[mediaType].update('official', { enabled: false }))
        .rejects.toThrow('Preference write failed');
      expect(received).toEqual([]);
    },
  );

  it.each([undefined, null, { success: true }, { success: true, provider: { id: 'codex' } }])(
    'rejects an invalid saved provider: %j',
    async (result) => {
      invoke.mockResolvedValueOnce(result);
      await expect(mediaConfigClient.image.update('official', { enabled: false })).rejects.toThrow();
      expect(received).toEqual([]);
    },
  );

  it('accepts a bare provider returned by a compatible host facade', async () => {
    invoke.mockResolvedValueOnce({ id: 'official', enabled: false });
    expect(await mediaConfigClient.image.update('official', { enabled: false }))
      .toEqual({ id: 'official', enabled: false });
    expect(received).toEqual(['image']);
  });

  it('notifies the host after successful provider updates for all media types', async () => {
    await mediaConfigClient.image.update('image', { enabled: true });
    await mediaConfigClient.video.update('video', { enabled: true });
    await mediaConfigClient.music.update('music', { enabled: true });
    await mediaConfigClient.tts.update('tts', { enabled: true });
    await mediaConfigClient.asr.update('asr', { enabled: true });

    expect(received).toEqual(['image', 'video', 'music', 'tts', 'asr']);
  });

  it('notifies after create, delete, upstream refresh, secret writes, and image reset', async () => {
    await mediaConfigClient.image.createCustom({ baseProviderId: 'base', name: 'custom' });
    await mediaConfigClient.image.deleteCustom('custom');
    await mediaConfigClient.image.refreshUpstreamModels('image');
    await mediaConfigClient.image.setProviderKey('image', 'secret');
    await mediaConfigClient.video.setProviderSecret?.(
      'video-seedance-vod',
      'byteplusAk',
      'AKLT-secret',
    );
    await mediaConfigClient.resetImageProviderToDefaults('image');

    expect(received).toEqual(['image', 'image', 'image', 'image', 'video', 'image']);
  });
});
