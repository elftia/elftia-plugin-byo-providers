import { describe, expect, it } from 'vitest';

import { BUILTIN_TRANSFORMERS, PROVIDER_TEMPLATES } from '../src/domain/llm';

describe('plugin-owned fallback catalogs', () => {
  it('keeps the extracted manual-provider format baseline stable', () => {
    expect(
      PROVIDER_TEMPLATES.map(({ id, apiFormat, api_base_url }) => ({
        id,
        apiFormat,
        api_base_url,
      })),
    ).toEqual([
      {
        id: 'openai',
        apiFormat: 'openai',
        api_base_url: 'https://api.openai.com/v1/chat/completions',
      },
      {
        id: 'gemini',
        apiFormat: 'google',
        api_base_url: 'https://generativelanguage.googleapis.com/v1beta/models/',
      },
      {
        id: 'anthropic',
        apiFormat: 'anthropic',
        api_base_url: 'https://api.anthropic.com/v1/messages',
      },
      { id: 'azure-openai', apiFormat: 'azure-openai', api_base_url: '' },
      {
        id: 'openai-response',
        apiFormat: 'openai-response',
        api_base_url: 'https://api.openai.com',
      },
    ]);
  });

  it('keeps the transformer fallback names stable and unique', () => {
    const names = BUILTIN_TRANSFORMERS.map(({ name }) => name);
    expect(names).toEqual([
      'anthropic',
      'deepseek',
      'gemini',
      'openai-response',
      'openrouter',
      'groq',
      'openai',
      'maxtoken',
      'tooluse',
      'reasoning',
      'sampling',
      'enhancetool',
      'cleancache',
      'vertex-gemini',
      'vertex-claude',
      'cerebras',
      'vercel',
      'forcereasoning',
      'maxcompletiontokens',
      'streamoptions',
      'customparams',
    ]);
    expect(new Set(names).size).toBe(names.length);
  });
});
