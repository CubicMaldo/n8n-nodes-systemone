import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class SystemOneApi implements ICredentialType {
  name = 'systemOneApi';
  displayName = 'System 1 (TypeSafe Jev & Fallback) API';
  documentationUrl = 'https://github.com/CubicMaldo/n8n-nodes-systemone';
  properties: INodeProperties[] = [
    {
      displayName: 'Primary Engine Provider',
      name: 'provider',
      type: 'options',
      options: [
        { name: 'TypeSafe AI (Jev Cloud - Default)', value: 'typesafe' },
        { name: 'Google Gemini Flash', value: 'gemini-flash' },
        { name: 'Groq (Ultra-fast Llama 3.3)', value: 'groq' },
        { name: 'OpenAI (gpt-4o-mini)', value: 'openai' },
        { name: 'DeepSeek (DeepSeek V3)', value: 'deepseek' },
        { name: 'Anthropic (Claude 3.5 Haiku)', value: 'anthropic' },
        { name: 'Ollama (Local / Edge)', value: 'ollama' },
      ],
      default: 'typesafe',
      description: 'Primary inference engine for System 1 evaluation',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        hide: {
          provider: ['ollama'],
        },
      },
      description: 'API Key to authenticate with the primary provider',
    },
    {
      displayName: 'Custom Endpoint',
      name: 'endpoint',
      type: 'string',
      default: 'https://api.typesafe.ai',
      displayOptions: {
        show: {
          provider: ['typesafe', 'ollama'],
        },
      },
      description: 'Base HTTP endpoint (compatible with proxies or local deployments)',
    },
    {
      displayName: 'Fallback Strategy',
      name: 'fallbackStrategy',
      type: 'options',
      options: [
        { name: 'Universal LLM Fallback (Gemini, Groq, OpenAI, Claude, DeepSeek)', value: 'llm' },
        { name: 'Deterministic Heuristics (Offline, 0 Tokens, 0 Cost)', value: 'deterministic' },
      ],
      default: 'llm',
      description: 'Resilience strategy for network errors or rate limits (429)',
    },
    {
      displayName: 'Fallback LLM Provider',
      name: 'fallbackProvider',
      type: 'options',
      options: [
        { name: 'Google Gemini Flash (Recommended)', value: 'gemini' },
        { name: 'Groq (Llama 3.3 70B)', value: 'groq' },
        { name: 'OpenAI (gpt-4o-mini)', value: 'openai' },
        { name: 'Anthropic (Claude 3.5 Haiku)', value: 'anthropic' },
        { name: 'DeepSeek (DeepSeek-Chat)', value: 'deepseek' },
        { name: 'Mistral (Mistral Small)', value: 'mistral' },
        { name: 'OpenRouter', value: 'openrouter' },
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'Custom OpenAI-Compatible Endpoint', value: 'custom' },
      ],
      default: 'gemini',
      displayOptions: {
        show: {
          fallbackStrategy: ['llm'],
        },
      },
      description: 'Secondary LLM provider for universal fallback',
    },
    {
      displayName: 'Fallback API Key',
      name: 'fallbackApiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        show: {
          fallbackStrategy: ['llm'],
        },
        hide: {
          fallbackProvider: ['ollama'],
        },
      },
      description: 'API key for the universal fallback provider',
    },
    {
      displayName: 'Fallback Model Name',
      name: 'fallbackModel',
      type: 'string',
      default: '',
      placeholder: 'e.g. gemini-2.5-flash, llama-3.3-70b-versatile, gpt-4o-mini',
      displayOptions: {
        show: {
          fallbackStrategy: ['llm'],
        },
      },
      description: 'Fallback model identifier (optional, uses the provider default if empty)',
    },
    {
      displayName: 'Fallback Base URL',
      name: 'fallbackBaseUrl',
      type: 'string',
      default: '',
      placeholder: 'e.g. https://api.groq.com/openai/v1 or http://localhost:11434/v1',
      displayOptions: {
        show: {
          fallbackStrategy: ['llm'],
        },
      },
      description: 'Custom base URL for the fallback provider',
    },
  ];
}

/**
 * Backwards compatibility alias.
 */
export const VaelisApi = SystemOneApi;
