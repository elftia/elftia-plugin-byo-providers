import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { __resetHost } from '../src/renderer/host/hostBridge';
import { activate } from '../src/renderer';

afterEach(() => {
  __resetHost();
});

describe('renderer activation', () => {
  it('registers an independent decision page alongside the language and media sections', () => {
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

    // The unified model-services section replaces the former separate
    // `llm-providers` + `subscriptions` sections (omnicross parity).
    expect(sections.map(({ id }) => id)).toEqual([
      'model-services',
      'decision-models',
      'media-image',
      'media-video',
      'media-music',
      'media-tts',
      'media-asr',
      'search-providers',
      'object-storage',
      'code-cli',
    ]);
    expect(sections.map(({ order }) => order)).toEqual([
      100, 105, 110, 111, 112, 113, 114, 120, 125, 131,
    ]);
    expect(sections.every(({ pinToTop }) => pinToTop === true)).toBe(true);

    // No standalone llm-providers / subscriptions registration remains.
    expect(sections.some(({ id }) => id === 'llm-providers')).toBe(false);
    expect(sections.some(({ id }) => id === 'subscriptions')).toBe(false);

    // The unified section keeps the former LLM section's slot: pinned, inside
    // the 提供商 group, order 100 — the media/search/storage siblings unchanged.
    for (const section of sections) {
      expect(section.group).toMatchObject({ id: 'model-providers', order: 0 });
    }
    const providersGroup = sections[0]?.group as {
      label: () => string;
      opaqueFrame?: {
        label?: Record<string, unknown>;
      };
    };
    expect(providersGroup.label()).toBe('Model Services');
    expect(providersGroup.opaqueFrame?.label).toEqual({
      kind: 'plugin-i18n',
      namespace: 'byo-providers',
      key: 'navigation.providersGroup',
      fallback: 'Model Services',
    });
    // code-cli joined the providers group (bottom slot, owner direction).
    expect(sections[9]?.group).toMatchObject({ id: 'model-providers', order: 0 });
    expect(sections[1]?.label).toBe('Decision Models');

    expect(registerNamespace).toHaveBeenCalledTimes(1);
    const [namespace, locales] = registerNamespace.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(namespace).toBe('byo-providers');
    expect(Object.keys(locales).sort()).toEqual(['en', 'ja', 'zh']);
    expect(locales).toMatchObject({
      en: { navigation: { providersGroup: 'Model Services' } },
      ja: { navigation: { providersGroup: 'モデルサービス' } },
      zh: { navigation: { providersGroup: '模型服务' } },
    });
    // The plugin-owned model-services copy is registered for every locale.
    expect(locales).toMatchObject({
      en: { modelServices: { title: 'Language Models' }, decisionModels: { title: 'Decision Models' } },
      ja: { modelServices: { title: '大規模言語モデル' }, decisionModels: { title: '意思決定モデル' } },
      zh: { modelServices: { title: '大语言模型' }, decisionModels: { title: '决策模型' } },
    });
  });

  it('localizes the unified section label per locale', () => {
    const sections: Array<Record<string, unknown>> = [];
    activate({
      react: { instance: React },
      settings: {
        registerSection(definition: Record<string, unknown>) {
          sections.push(definition);
          return () => undefined;
        },
      },
      i18n: { registerNamespace: vi.fn() },
    } as never);

    expect(sections[0]?.label).toBe('Language Models');
  });
});
