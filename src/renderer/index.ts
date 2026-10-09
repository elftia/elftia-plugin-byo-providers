/**
 * byo-providers — RENDERER half (`app-extension` plugin, P2b LLM + P2c media UI).
 *
 * `activate(host)` installs the host singleton (the bridge layer reads it),
 * registers the plugin-owned `byo-providers` i18n namespace (LLM ⊕ media ⊕
 * subscription ⊕ model-services seeds, merged), and mounts the relocated
 * provider settings UI as settings sections:
 *   - ONE unified "Model Services" (模型服务) section (`ModelServicesPage`,
 *     omnicross UpstreamsPage shape) — subscription account pools + BYO
 *     providers in ONE sidebar, replacing the former separate `llm-providers`
 *     and `subscriptions` sections, AND
 *   - FIVE media sections — Image / Video / Music / TTS / ASR Providers (P2c) —
 *     each rendering `MediaProviderSettings` with its `mediaType`, wrapped in the
 *     vendored `ImperativeConfirmProvider` (the panels use the host uiStore's
 *     imperative `useConfirmDialog()`, which the host exposes only as a
 *     `ConfirmDialog` component), AND
 *   - ONE "Search Providers" section (`SearchProviderSettings`, P2d) — a
 *     self-contained api-only `{ sidebar + ProviderPanel }` mini-tab over the
 *     masked `search.*` relay (the host web-search tab's API-provider half).
 *
 * Every primitive renders through the `host/` bridge (`host.react` / `host.ui` /
 * vendored wrappers / `host.i18n`); the data round-trips through the main `llm.*`
 * / `media.*` relays. NO host `@/...` module is imported at runtime.
 *
 * The heavy section bodies (the unified page + the 5 media panels + their
 * dialogs) are loaded via `React.lazy` so the `activate` critical path stays
 * tiny — only the section registers + thin Suspense shells are eager.
 *
 * @module byo-providers/renderer/index
 */
import type { AgentUiHostApi } from '@byo/domain/plugin-types';

import { setHost } from './host/hostBridge';
import { ImperativeConfirmProvider } from './host/vendored/useImperativeConfirm';
import { readLocale, registerLlmI18n, useTranslation } from './host/vendored/useTranslation';

const SECTION_ID = 'model-services';

/** The 5 media types in nav order, each its own section after the LLM section. */
const MEDIA_TYPES = ['image', 'video', 'music', 'tts', 'asr'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

/**
 * The plugin's renderer `activate` entry. The loader calls it once with a
 * freshly constructed {@link AgentUiHostApi}.
 */
export function activate(host: AgentUiHostApi): void {
  setHost(host);
  registerLlmI18n();

  const React = host.react.instance;
  const h = React.createElement;

  // The shared "提供商" (Providers) collapsible-parent descriptor
  // (`settings-section-groups`, host-API v1.28). Attached to the 8 provider-config
  // sections (LLM + 5 media + Search + Object Storage) under ONE parent;
  // `order: 0` slots the parent at the very top of the pinned block. The label is
  // a thunk resolved per render from the plugin's OWN i18n (locale-following).
  // The sibling `opaqueFrame.label` is its data-only projection for the
  // compartment host's synchronous navigation surface. No `defaultExpanded` ⇒ defaults expanded (the
  // pre-split `modelSelection: true` behavior). No `icon` (label-only parent —
  // keeps the diff small).
  const providersGroup = {
    id: 'model-providers',
    label: () => readProvidersGroupLabel(),
    opaqueFrame: {
      label: {
        kind: 'plugin-i18n',
        namespace: 'byo-providers',
        key: 'navigation.providersGroup',
        fallback: 'Model Services',
      },
    },
    order: 0,
  } as const;

  // The unified model-services page is lazy so the activate path stays small
  // (DS precedent) — the provider tree + subscription cards split off `activate`.
  const LazyModelServicesPage = React.lazy(() =>
    import('./llm/ModelServicesPage').then((m) => ({ default: m.ModelServicesPage })),
  );

  // The media dispatch container (renders the per-type panel) is lazy too; each
  // panel + its model dialogs split into their own chunks behind it.
  const LazyMediaProviderSettings = React.lazy(() => import('./media/MediaProviderSettings'));

  // The search api-provider mini-tab (sidebar + ProviderPanel) is lazy too (P2d).
  const LazySearchProviderSettings = React.lazy(() => import('./search/SearchProviderSettings'));
  const LazyObjectStorageSettings = React.lazy(() => import('./storage/ObjectStorageSettings'));

  // P2e (`byo-p2-subscription`) — the Code CLI runtime tab, lazy (the heavy
  // card tree splits off `activate`). The subscription/OAuth UI itself moved
  // INTO the unified model-services section above.
  const LazyCodeCliTab = React.lazy(() =>
    import('./cli/CodeCliTab').then((m) => ({ default: m.CodeCliTab })),
  );

  function ModelServicesSection() {
    return h(
      React.Suspense,
      { fallback: h('div', { className: 'p-4 text-sm text-muted-foreground' }, '…') },
      h(LazyModelServicesPage),
    );
  }

  host.settings.registerSection({
    id: SECTION_ID,
    // Locale-resolved label from the plugin's own i18n bundle (never an i18n key).
    label: readModelServicesSectionLabel(),
    order: 100,
    group: providersGroup,
    pinToTop: true,
    render: () =>
      h(
        'div',
        {
          className: 'h-full',
          'data-testid': 'byo-providers-model-services-section',
        },
        h(ModelServicesSection),
      ),
  });

  // ── Five media sections (P2c), ordered AFTER the LLM section ───────────────
  MEDIA_TYPES.forEach((mediaType, idx) => {
    host.settings.registerSection({
      id: `media-${mediaType}`,
      label: readMediaSectionLabel(mediaType),
      order: 110 + idx,
      group: providersGroup,
      pinToTop: true,
      render: () =>
        h(
          'div',
          {
            className: 'h-full',
            'data-testid': `byo-providers-media-${mediaType}-section`,
          },
          h(
            React.Suspense,
            { fallback: h('div', { className: 'p-4 text-sm text-muted-foreground' }, '…') },
            // Mount the imperative-confirm provider at the section root so the
            // panel's `useConfirmDialog()` resolves (delete-provider flow).
            h(
              ImperativeConfirmProvider,
              null,
              h(LazyMediaProviderSettings, { mediaType }),
            ),
          ),
        ),
    });
  });

  // ── ONE search-providers section (P2d), ordered AFTER the media sections ───
  // The api-key web-search providers are ONE flat list (one sidebar), unlike
  // media's 5 independent types — so one section with an internal provider
  // selector (matching the host UX), not 7 per-provider sections.
  host.settings.registerSection({
    id: 'search-providers',
    label: readSearchSectionLabel(),
    order: 120,
    group: providersGroup,
    pinToTop: true,
    render: () =>
      h(
        'div',
        {
          className: 'h-full',
          'data-testid': 'byo-providers-search-section',
        },
        h(
          React.Suspense,
          { fallback: h('div', { className: 'p-4 text-sm text-muted-foreground' }, '…') },
          h(LazySearchProviderSettings),
        ),
      ),
  });

  // Object storage is a file-delivery provider and lives beside the model,
  // media, and search providers in the shared provider group.
  host.settings.registerSection({
    id: 'object-storage',
    label: readObjectStorageSectionLabel(),
    order: 125,
    group: providersGroup,
    pinToTop: true,
    render: () =>
      h(
        'div',
        { className: 'h-full', 'data-testid': 'byo-providers-object-storage-section' },
        h(
          React.Suspense,
          { fallback: h('div', { className: 'p-4 text-sm text-muted-foreground' }, '…') },
          h(LazyObjectStorageSettings),
        ),
      ),
  });

  // ── P2e: Code CLI runtime section ──
  // Consumes `t` from the plugin's own i18n bundle (a thin wrapper resolves
  // it per render so the panel follows locale changes). Ordered after search.
  // The former standalone `subscriptions` section was folded INTO the unified
  // model-services section (omnicross parity) — no separate registration.
  function CodeCliSectionPanel() {
    const t = useTranslation();
    return h(LazyCodeCliTab, { t });
  }

  host.settings.registerSection({
    // sectionId `code-cli` — the host AgentBackendSection gates the `cli` engine
    // option on THIS section's presence (OQ3). Do NOT rename without updating
    // `CLI_PLUGIN_SECTION_ID` in the host AgentBackendSection.
    id: 'code-cli',
    label: readCodeCliSectionLabel(),
    order: 131,
    // Grouped at the BOTTOM of the model-services group (below Language Models
    // and the media/search/storage sections) per owner direction.
    group: providersGroup,
    pinToTop: true,
    render: () =>
      h(
        'div',
        { className: 'h-full', 'data-testid': 'byo-providers-code-cli-section' },
        h(
          React.Suspense,
          { fallback: h('div', { className: 'p-4 text-sm text-muted-foreground' }, '…') },
          h(CodeCliSectionPanel),
        ),
      ),
  });
}

/**
 * The "Model Services" (模型服务) section label, localized to the host's active
 * locale. Uses the shared `readLocale()` (JSON-parses the host's persisted
 * `locale`, maps the tag to a seed base). Inlined like the sibling section-label
 * helpers (the nav label is a thunk, never an i18n key).
 */
function readModelServicesSectionLabel(): string {
  switch (readLocale()) {
    case 'zh':
      return '大语言模型';
    case 'ja':
      return '大規模言語モデル';
    default:
      return 'Language Models';
  }
}

/**
 * The "模型服务" (Model Services) collapsible-PARENT label, localized to the
 * host's active locale via the plugin's own `readLocale()` (NEVER a renderer
 * i18n key). Inlined like the sibling section-label helpers — the three strings
 * have no single-word seed key. Resolved per render through the `group.label`
 * thunk so the parent label follows locale changes.
 */
function readProvidersGroupLabel(): string {
  switch (readLocale()) {
    case 'zh':
      return '模型服务';
    case 'ja':
      return 'モデルサービス';
    default:
      return 'Model Services';
  }
}

/** Per-mediaType section nav labels (localized), inlined like the LLM label. */
const MEDIA_SECTION_LABELS: Record<MediaType, Record<'en' | 'zh' | 'ja', string>> = {
  image: { en: 'Image Models', zh: '图像模型', ja: '画像モデル' },
  video: { en: 'Video Models', zh: '视频模型', ja: '動画モデル' },
  music: { en: 'Music Models', zh: '音乐模型', ja: '音楽モデル' },
  tts: { en: 'TTS Models', zh: '语音合成模型', ja: '音声合成モデル' },
  asr: { en: 'ASR Models', zh: '语音识别模型', ja: '音声認識モデル' },
};

function readMediaSectionLabel(mediaType: MediaType): string {
  const locale = readLocale();
  const labels = MEDIA_SECTION_LABELS[mediaType];
  return labels[(locale as 'en' | 'zh' | 'ja') in labels ? (locale as 'en' | 'zh' | 'ja') : 'en'];
}

/** The "Search Services" section label (localized), inlined like the others. */
function readSearchSectionLabel(): string {
  switch (readLocale()) {
    case 'zh':
      return '搜索服务';
    case 'ja':
      return '検索サービス';
    default:
      return 'Search Services';
  }
}

function readObjectStorageSectionLabel(): string {
  switch (readLocale()) {
    case 'zh':
      return '对象存储服务';
    case 'ja':
      return 'オブジェクトストレージサービス';
    default:
      return 'Object Storage Services';
  }
}

/** The "Code CLI" section label (localized), inlined like the others. */
function readCodeCliSectionLabel(): string {
  switch (readLocale()) {
    case 'zh':
      return 'Code CLI';
    case 'ja':
      return 'Code CLI';
    default:
      return 'Code CLI';
  }
}

/**
 * Optional renderer-side teardown. The host revokes the registered sections +
 * i18n namespace on disable; this releases the plugin's OWN side effects (none).
 * Kept for the hot-toggle reentrancy contract.
 */
export function deactivate(): void {
  // No plugin-owned side effects to release.
}

export default { activate, deactivate };
