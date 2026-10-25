/** API search settings belong to the BYO producer; execution stays on the host. */
export type WebSearchProviderId =
  | 'tavily' | 'jina' | 'searxng' | 'zhipu' | 'z.ai' | 'deepseek'
  | 'exa' | 'parallel' | 'firecrawl' | 'brave' | 'kagi' | 'kimi'
  | 'synthetic' | 'ollama' | 'tinyfish' | 'perplexity' | 'bocha' | 'claude';

export type WebSearchProviderType = 'api';

export interface WebSearchProvider {
  id: WebSearchProviderId;
  name: string;
  type: WebSearchProviderType;
  enabled: boolean;
  apiHost?: string;
  authMode?: 'public' | 'api';
  model?: string;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
}

export interface WebSearchProviderMeta {
  id: WebSearchProviderId;
  name: string;
  type: WebSearchProviderType;
  icon: string;
  website?: string;
  requiresApiKey: boolean;
  supportsPublic?: boolean;
  modelPlaceholder?: string;
}

function api(
  id: WebSearchProviderId,
  name: string,
  website: string,
  options: Partial<WebSearchProviderMeta> = {},
): WebSearchProviderMeta {
  return { id, name, website, type: 'api', icon: 'Search', requiresApiKey: true, ...options };
}

export const WEB_SEARCH_PROVIDER_META: Record<WebSearchProviderId, WebSearchProviderMeta> = {
  tavily: api('tavily', 'Tavily', 'https://tavily.com'),
  jina: api('jina', 'Jina', 'https://jina.ai'),
  searxng: api('searxng', 'SearXNG', 'https://docs.searxng.org', { requiresApiKey: false, icon: 'Server' }),
  zhipu: api('zhipu', 'Zhipu', 'https://open.bigmodel.cn'),
  'z.ai': api('z.ai', 'Z.ai', 'https://z.ai'),
  deepseek: api('deepseek', 'DeepSeek', 'https://platform.deepseek.com'),
  exa: api('exa', 'Exa', 'https://exa.ai', { supportsPublic: true }),
  parallel: api('parallel', 'Parallel', 'https://parallel.ai', { supportsPublic: true }),
  firecrawl: api('firecrawl', 'Firecrawl', 'https://firecrawl.dev', { supportsPublic: true }),
  brave: api('brave', 'Brave', 'https://brave.com/search/api/'),
  kagi: api('kagi', 'Kagi', 'https://kagi.com'),
  kimi: api('kimi', 'Kimi', 'https://platform.moonshot.ai'),
  synthetic: api('synthetic', 'Synthetic', 'https://synthetic.new'),
  ollama: api('ollama', 'Ollama', 'https://ollama.com'),
  tinyfish: api('tinyfish', 'TinyFish', 'https://tinyfish.ai'),
  perplexity: api('perplexity', 'Perplexity', 'https://docs.perplexity.ai'),
  bocha: api('bocha', 'Bocha', 'https://open.bochaai.com'),
  claude: api('claude', 'Claude', 'https://console.anthropic.com', { modelPlaceholder: 'claude-opus-5-5' }),
};

export const getApiProviders = (): WebSearchProviderId[] =>
  Object.values(WEB_SEARCH_PROVIDER_META).map((provider) => provider.id);
