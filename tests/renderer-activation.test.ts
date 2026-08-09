import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { __resetHost } from '../src/renderer/host/hostBridge';
import { activate } from '../src/renderer';

afterEach(() => {
  __resetHost();
});

describe('renderer activation', () => {
  it('registers ten canonical settings sections with preserved order/grouping/pinning', () => {
    const sections: Array<Record<string, unknown>> = [];
    const registerNamespace = vi.fn();

    activate({
      react: { instance: React },
      settings: {
        registerSection(definition: Record<string, unknown>) {
          sections.push(definition);
          return () => undefined;
        },
      },
      i18n: { registerNamespace },
    } as never);

    expect(sections.map(({ id }) => id)).toEqual([
      'llm-providers',
      'media-image',
      'media-video',
      'media-music',
      'media-tts',
      'media-asr',
      'search-providers',
      'object-storage',
      'subscriptions',
      'code-cli',
    ]);
    expect(sections.map(({ order }) => order)).toEqual([
      100, 110, 111, 112, 113, 114, 120, 125, 130, 131,
    ]);
    expect(sections.every(({ pinToTop }) => pinToTop === true)).toBe(true);

    for (const section of sections.slice(0, 7)) {
      expect(section.group).toMatchObject({ id: 'model-providers', order: 0 });
    }
    expect(sections[7]?.group).toBeUndefined();
    expect(sections[8]?.group).toBeUndefined();
    expect(sections[9]?.group).toBeUndefined();

    expect(registerNamespace).toHaveBeenCalledTimes(1);
    const [namespace, locales] = registerNamespace.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(namespace).toBe('byo-providers');
    expect(Object.keys(locales).sort()).toEqual(['en', 'ja', 'zh']);
  });
});
