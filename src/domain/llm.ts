import type {
  ApiFormat,
  ChatApiFormat,
  CompletionSettings,
  LLMProvider,
  ModelConfig,
  ModelGroup,
  OpenRouterDataCollection,
  OpenRouterMaxPrice,
  OpenRouterProviderRouting,
  OpenRouterProviderSort,
  OpenRouterQuantization,
  ProviderApiType,
  ProviderTemplate,
  TransformerConfig,
  TransformerEntry,
} from '@omnicross/contracts/llm-config';
import type {
  CodingPlanConfig,
  PresetProviderTemplate,
} from '@omnicross/contracts/provider-presets';

export type {
  ApiFormat,
  ChatApiFormat,
  CodingPlanConfig,
  CompletionSettings,
  LLMProvider,
  ModelConfig,
  ModelGroup,
  OpenRouterDataCollection,
  OpenRouterMaxPrice,
  OpenRouterProviderRouting,
  OpenRouterProviderSort,
  OpenRouterQuantization,
  PresetProviderTemplate,
  ProviderApiType,
  ProviderTemplate,
  TransformerConfig,
  TransformerEntry,
};

export { resolveModelCapabilities } from '@omnicross/contracts/canonical-models';

export interface TransformerInfo {
  name: string;
  endpoint?: string | null;
  description?: string;
  hasOptions?: boolean;
  optionSchema?: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'object';
      description?: string;
      default?: unknown;
    }
  >;
}

export interface ProviderModelDiscoveryEntry {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  maxTokens?: number;
  category?: string;
  group?: string;
  capabilities?: string[];
}

export interface ProviderModelDiscoveryResult {
  success: boolean;
  source: 'cache' | 'network';
  endpoint: string;
  fetchedAt?: string;
  models: ProviderModelDiscoveryEntry[];
  raw?: unknown;
  error?: string;
}

export interface ApiKeyEntry {
  id: string;
  providerId: string;
  label: string;
  apiKey: string;
  hasKey?: boolean;
  keyHint?: string;
  enabled: boolean;
  weight: number;
  disabledReason?: string | null;
  lastErrorStatus?: number | null;
  lastErrorAt?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiKeyEntryInput {
  providerId: string;
  label?: string;
  apiKey: string;
  enabled?: boolean;
  weight?: number;
}

export interface KeyHealth {
  until: number;
  lastStatus?: number;
}

export type KeyHealthMap = Record<string, KeyHealth>;

export interface RouterConfig {
  default?: string;
  [key: string]: unknown;
}

/** Minimal plugin-owned format fallbacks used only by the manual provider form. */
export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiFormat: 'openai',
    apiType: 'openai',
    api_base_url: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-4o', 'gpt-4o-mini'],
    icon: 'openai',
    website: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/docs',
    defaultSettings: { temperature: 0.7, maxTokens: 4096 },
    isSystem: true,
    maxConcurrency: 8,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    apiFormat: 'google',
    apiType: 'google',
    api_base_url: 'https://generativelanguage.googleapis.com/v1beta/models/',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: ['gemini-3-flash', 'gemini-3.1-pro'],
    transformer: { use: ['gemini'] },
    icon: 'gemini',
    website: 'https://ai.google.dev',
    docsUrl: 'https://ai.google.dev/docs',
    defaultSettings: { temperature: 0.7, topP: 0.95, maxTokens: 65536 },
    isSystem: true,
    maxConcurrency: 5,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    apiFormat: 'anthropic',
    apiType: 'anthropic',
    api_base_url: 'https://api.anthropic.com/v1/messages',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
    transformer: { use: ['anthropic'] },
    icon: 'anthropic',
    website: 'https://anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
    defaultSettings: { temperature: 0.7, maxTokens: 65536 },
    isSystem: true,
    isOfficial: true,
    maxConcurrency: 10,
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    apiFormat: 'azure-openai',
    api_base_url: '',
    apiVersion: '2024-08-01-preview',
    models: [],
    icon: 'azure-openai',
    website: 'https://azure.microsoft.com/products/ai-services/openai-service',
    docsUrl: 'https://learn.microsoft.com/azure/ai-services/openai/',
    defaultSettings: { temperature: 0.7, maxTokens: 4096 },
    isSystem: false,
  },
  {
    id: 'openai-response',
    name: 'OpenAI (Responses API)',
    apiFormat: 'openai-response',
    api_base_url: 'https://api.openai.com',
    models: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex', 'o3', 'o4-mini'],
    transformer: { use: ['openai-response'] },
    icon: 'openai',
    website: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/docs/api-reference/responses',
    defaultSettings: { temperature: 0.7, maxTokens: 4096 },
    isSystem: false,
  },
];

/** Plugin-owned transformer display catalog; execution remains host-owned. */
export const BUILTIN_TRANSFORMERS: TransformerInfo[] = [
  { name: 'anthropic', description: 'Preserve original Anthropic request/response format' },
  { name: 'deepseek', description: 'Adapt for DeepSeek API format' },
  { name: 'gemini', description: 'Adapt for Google Gemini API format' },
  { name: 'openai-response', description: 'Adapt for OpenAI Responses API' },
  { name: 'openrouter', description: 'OpenRouter provider routing', hasOptions: true },
  { name: 'groq', description: 'Adapt for Groq API format' },
  { name: 'openai', description: 'Standard OpenAI chat completions format' },
  {
    name: 'maxtoken',
    description: 'Set a max_tokens value',
    hasOptions: true,
    optionSchema: {
      max_tokens: {
        type: 'number',
        description: 'Maximum tokens for completion',
        default: 4096,
      },
    },
  },
  { name: 'tooluse', description: 'Optimize tool usage' },
  { name: 'reasoning', description: 'Process reasoning content' },
  { name: 'sampling', description: 'Process sampling parameters' },
  { name: 'enhancetool', description: 'Add tolerance to tool-call arguments' },
  { name: 'cleancache', description: 'Clear cache_control fields' },
  { name: 'vertex-gemini', description: 'Handle Gemini through Vertex' },
  { name: 'vertex-claude', description: 'Handle Claude through Vertex' },
  { name: 'cerebras', description: 'Adapt for Cerebras API format' },
  { name: 'vercel', description: 'Adapt for Vercel AI SDK format' },
  { name: 'forcereasoning', description: 'Force reasoning mode' },
  { name: 'maxcompletiontokens', description: 'Use max_completion_tokens' },
  { name: 'streamoptions', description: 'Configure streaming options' },
  { name: 'customparams', description: 'Add custom request parameters' },
];
