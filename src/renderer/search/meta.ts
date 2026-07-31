/**
 * meta.ts — API-key web-search provider metadata (the `type:'api'` SUBSET copied
 * from the host `web-search-tab/meta.ts`, P2d design D1/D6).
 *
 * Plugin-local UI metadata for the API-key web-search providers
 * (tavily/jina/zhipu/grok/exa/bocha/searxng). The host's `local-*` +
 * `native` entries are DELIBERATELY NOT copied — those providers stay host-only
 * (they are not on the searchConfig port). `WebSearchProviderId` is therefore
 * narrowed to the api ids only; `WebSearchProvider` carries the form-state shape
 * the relocated `ProviderPanel` reads.
 *
 * @module byo-providers/renderer/search/meta
 */

/** The API-key search provider ids the plugin section configures. */
export type WebSearchProviderId =
  | 'jina'
  | 'zhipu'
  | 'tavily'
  | 'exa'
  | 'searxng'
  | 'bocha'
  | 'grok';

/** Provider type classification (api-only in the plugin). */
export type WebSearchProviderType = 'api';

/** Renderer-local provider config (settings form state). */
export interface WebSearchProvider {
  id: WebSearchProviderId;
  name: string;
  type: WebSearchProviderType;
  enabled: boolean;
  apiKey?: string;
  apiHost?: string;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
}

/** Provider metadata for UI display. */
export interface WebSearchProviderMeta {
  id: WebSearchProviderId;
  name: string;
  type: WebSearchProviderType;
  icon: string;
  description: string;
  website?: string;
  requiresApiKey: boolean;
}

/**
 * Provider metadata registry — UI display data only, the `type:'api'` subset of
 * the host registry (copied verbatim for these ids).
 */
export const WEB_SEARCH_PROVIDER_META: Record<WebSearchProviderId, WebSearchProviderMeta> = {
  jina: {
    id: 'jina',
    name: 'Jina',
    type: 'api',
    icon: 'Search',
    description: 'AI-powered web search API',
    website: 'https://jina.ai',
    requiresApiKey: true,
  },
  zhipu: {
    id: 'zhipu',
    name: 'Zhipu',
    type: 'api',
    icon: 'Brain',
    description: 'Zhipu AI search service',
    website: 'https://zhipuai.cn',
    requiresApiKey: true,
  },
  tavily: {
    id: 'tavily',
    name: 'Tavily',
    type: 'api',
    icon: 'Search',
    description: 'AI-optimized search API',
    website: 'https://tavily.com',
    requiresApiKey: true,
  },
  exa: {
    id: 'exa',
    name: 'Exa',
    type: 'api',
    icon: 'Sparkles',
    description: 'Neural search engine',
    website: 'https://exa.ai',
    requiresApiKey: true,
  },
  searxng: {
    id: 'searxng',
    name: 'Searxng',
    type: 'api',
    icon: 'Server',
    description: 'Self-hosted search aggregator',
    website: 'https://docs.searxng.org',
    requiresApiKey: false,
  },
  bocha: {
    id: 'bocha',
    name: 'Bocha',
    type: 'api',
    icon: 'Search',
    description: 'Chinese search API',
    requiresApiKey: true,
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    type: 'api',
    icon: 'Zap',
    description: 'xAI Grok web search',
    website: 'https://x.ai',
    requiresApiKey: true,
  },
};

/** Get all API providers (meta order). */
export const getApiProviders = (): WebSearchProviderId[] =>
  Object.values(WEB_SEARCH_PROVIDER_META)
    .filter((p) => p.type === 'api')
    .map((p) => p.id);
