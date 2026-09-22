import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VaelisApi implements ICredentialType {
  name = 'vaelisApi';
  displayName = 'Vaelis & TypeSafe API';
  documentationUrl = 'https://github.com/CubicMaldo/vaelis';
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
      description: 'Motor de inferencia primario para la evaluación System 1',
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
      description: 'API Key para autenticarse con el proveedor primario',
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
      description: 'Endpoint HTTP base (compatible con proxies o despliegues locales)',
    },
    {
      displayName: 'Fallback Strategy',
      name: 'fallbackStrategy',
      type: 'options',
      options: [
        { name: 'Google Gemini Flash (Zero-Friction Fallback)', value: 'gemini-flash' },
        { name: 'Universal LLM Fallback (Groq, OpenAI, Claude, DeepSeek)', value: 'llm' },
        { name: 'Deterministic Heuristics (Offline, 0 Tokens, 0 Cost)', value: 'deterministic' },
      ],
      default: 'gemini-flash',
      description: 'Estrategia de resiliencia ante errores de red o rate limits (429)',
    },
    {
      displayName: 'Gemini API Key (Fallback)',
      name: 'geminiApiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        show: {
          fallbackStrategy: ['gemini-flash'],
        },
      },
      description: 'API key de Google Gemini usada si el motor primario falla o supera cuotas',
    },
    {
      displayName: 'Fallback LLM Provider',
      name: 'fallbackProvider',
      type: 'options',
      options: [
        { name: 'Groq (Llama 3.3 70B)', value: 'groq' },
        { name: 'OpenAI (gpt-4o-mini)', value: 'openai' },
        { name: 'Anthropic (Claude 3.5 Haiku)', value: 'anthropic' },
        { name: 'DeepSeek (DeepSeek-Chat)', value: 'deepseek' },
        { name: 'Mistral (Mistral Small)', value: 'mistral' },
        { name: 'OpenRouter', value: 'openrouter' },
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'Custom OpenAI-Compatible Endpoint', value: 'custom' },
      ],
      default: 'groq',
      displayOptions: {
        show: {
          fallbackStrategy: ['llm'],
        },
      },
      description: 'Proveedor LLM secundario para fallback universal',
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
      description: 'API key para el proveedor de fallback universal',
    },
    {
      displayName: 'Fallback Model Name',
      name: 'fallbackModel',
      type: 'string',
      default: '',
      placeholder: 'e.g. llama-3.3-70b-versatile, gpt-4o-mini',
      displayOptions: {
        show: {
          fallbackStrategy: ['llm'],
        },
      },
      description: 'Identificador del modelo de fallback (opcional, usa el predeterminado del proveedor si está vacío)',
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
      description: 'URL base personalizada para el proveedor de fallback',
    },
  ];
}
