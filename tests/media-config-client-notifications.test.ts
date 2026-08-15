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
  invoke.mockReset().mockImplementation(async (method: string) => {
    if (method === 'media.updateProvider' || method === 'media.createCustomProvider') {
      return { success: true, provider: { id: 'provider' } };
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
