/**
 * useTranslation — vendored i18n hook over the plugin-owned `byo-providers`
 * `host.i18n` namespace (design D1, vendor list; recovered DS pattern).
 *
 * The plugin contributes its OWN locale bundle (the LLM i18n subtree it reads —
 * `providerSettings`/`apiMode`/`presetName`/`common`/`mediaSettings`) under a
 * `pluginId`-prefixed namespace via `host.i18n.registerNamespace('byo-providers',
 * seed)` at `activate`, and this hook resolves keys from that registered bundle
 * for the active locale, with `{{param}}` substitution and a graceful key
 * fallback (matching the host `t` semantics). It replaces the 17
 * `@/shared/state/LocaleContext` imports in the relocated files.
 *
 * @module byo-providers/renderer/host/vendored/useTranslation
 */
import { getHost, getHostOrNull } from '../hostBridge';

import { cliI18nSeed } from './cliI18nSeed';
import { llmI18nSeed } from './llmI18nSeed';
import { mediaI18nSeed } from './mediaI18nSeed';
import { modelServicesI18nSeed } from './modelServicesI18nSeed';
import { navigationI18nSeed } from './navigationI18nSeed';
import { searchI18nSeed } from './searchI18nSeed';
import { subscriptionI18nSeed } from './subscriptionI18nSeed';

/** A plain (non-array) object. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Recursively DEEP-merge two i18n trees (right wins on a leaf conflict). Unlike a
 * shallow `{ ...a, ...b }`, a root present in BOTH trees has its NESTED keys
 * merged rather than the whole subtree replaced — so neither seed's sub-keys are
 * dropped if the LLM/media seeds later share a root (e.g. both touch `common.*`
 * or `settings.*`). String leaves on a true overlap take the right (media) value;
 * today the roots happen to be disjoint, but this no longer DEPENDS on that.
 */
function deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, bv] of Object.entries(b)) {
    const av = out[k];
    out[k] = isPlainObject(av) && isPlainObject(bv) ? deepMerge(av, bv) : bv;
  }
  return out;
}

/**
 * The merged plugin i18n seed — LLM (`providerSettings`/`apiMode`/`presetName`/
 * `common`) ⊕ media (`mediaSettings` + the `settings.status` slice) ⊕ search
 * (`settings.webSearch.*`, P2d). DEEP-merged per locale so a shared root never
 * drops a half's sub-keys — search SHARES the `settings` root with media's
 * `settings.status`, so the recursive merge is LOAD-BEARING here (a shallow
 * spread would drop one of them). Built per-locale so each language's three
 * halves combine.
 */
function buildMergedSeed(): Record<string, Record<string, unknown>> {
  const merged: Record<string, Record<string, unknown>> = {};
  const langs = new Set([
    ...Object.keys(llmI18nSeed),
    ...Object.keys(mediaI18nSeed),
    ...Object.keys(searchI18nSeed),
    ...Object.keys(subscriptionI18nSeed),
    ...Object.keys(cliI18nSeed),
    ...Object.keys(navigationI18nSeed),
    ...Object.keys(modelServicesI18nSeed),
  ]);
  for (const lang of langs) {
    // All five halves SHARE the `settings` root (media `settings.status`, search
    // `settings.webSearch`, subscription `settings.accountTokens`, cli
    // `settings.codeCli`), so the recursive deep-merge is LOAD-BEARING — a shallow
    // spread would drop a half's `settings.*` subtree.
    let acc = deepMerge(llmI18nSeed[lang] ?? {}, mediaI18nSeed[lang] ?? {});
    acc = deepMerge(acc, searchI18nSeed[lang] ?? {});
    acc = deepMerge(acc, subscriptionI18nSeed[lang] ?? {});
    acc = deepMerge(acc, cliI18nSeed[lang] ?? {});
    acc = deepMerge(acc, navigationI18nSeed[lang] ?? {});
    acc = deepMerge(acc, modelServicesI18nSeed[lang] ?? {});
    merged[lang] = acc;
  }
  return merged;
}

/** The plugin's full i18n seed (LLM ⊕ media ⊕ search), the default register payload. */
export const byoProvidersI18nSeed: Record<string, Record<string, unknown>> =
  buildMergedSeed();

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number> | string,
) => string;

/** The locale bases the harvested seed actually contains. */
const SEED_LOCALES = ['en', 'zh', 'ja'] as const;

/**
 * The active locale, read from the host's persisted `locale` key, mapped to a
 * seed base.
 *
 * The host writes `locale` via `usePersistentSetting` with the DEFAULT serializer
 * (`JSON.stringify`), so the stored value is a JSON string — `"zh"` WITH literal
 * quotes, NOT the bare `zh`. We `JSON.parse` it (with a bare-string fallback for
 * any legacy unquoted value), then map the full locale TAG (`zh`, `zh-TW`,
 * `ja-JP`, …) down to the base the seed has (`en`/`zh`/`ja`) — e.g. `zh-TW` → `zh`.
 * Falls back to `en` only when no seed base matches.
 *
 * (The earlier bug: a strict `stored === 'zh'` check against the JSON-quoted
 * `"zh"` never matched → the plugin always rendered English under a zh app.)
 */
export function readLocale(): string {
  try {
    const raw = window.localStorage?.getItem('locale');
    if (!raw) return 'en';
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      value = raw; // legacy unquoted value
    }
    if (typeof value !== 'string') return 'en';
    // Exact seed match, then base-tag match (`zh-TW` → `zh`, `ja-JP` → `ja`).
    if ((SEED_LOCALES as readonly string[]).includes(value)) return value;
    const base = value.split('-')[0].toLowerCase();
    if ((SEED_LOCALES as readonly string[]).includes(base)) return base;
  } catch {
    /* ignore */
  }
  return 'en';
}

// The registered plugin bundle: locale → nested key map. Seeded from the
// harvested host strings; also pushed into `host.i18n` so a section label
// (host-resolved) follows locale changes.
let registeredResources: Record<string, Record<string, unknown>> = {};

/**
 * Register the plugin locale resources (LLM ⊕ media, merged) under the SINGLE
 * `byo-providers` namespace and keep a local copy for the vendored resolver.
 * Idempotent; call once at `activate`. The default payload is the merged seed
 * (P2c added the media subtree; the LLM-only name is kept for the existing
 * `index.ts` call site).
 */
export function registerLlmI18n(
  resources: Record<string, Record<string, unknown>> = byoProvidersI18nSeed,
): void {
  registeredResources = resources;
  try {
    getHost().i18n.registerNamespace('byo-providers', resources);
  } catch {
    // No host yet (very early) — the local copy still serves the resolver.
  }
}

function getNested(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

function resolve(
  locale: string,
  key: string,
  params?: Record<string, string | number> | string,
): string {
  let text =
    getNested(registeredResources[locale], key) ??
    (locale !== 'en' ? getNested(registeredResources.en, key) : undefined);
  if (text === undefined) return key;
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return text;
}

/**
 * The translation hook — reactive to `locale-changed` / `storage` events.
 *
 * Returns the `t` function DIRECTLY (matching the host's `useTranslation`
 * convenience hook semantics: `const t = useTranslation()`).
 */
export function useTranslation(): TranslateFn {
  const host = getHostOrNull();
  const React = host?.react.instance ?? getHost().react.instance;
  const [locale, setLocale] = React.useState<string>(readLocale);

  React.useEffect(() => {
    const onChange = () => setLocale(readLocale());
    window.addEventListener('locale-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('locale-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return React.useCallback<TranslateFn>(
    (key, params) => resolve(locale, key, params),
    [locale],
  );
}
