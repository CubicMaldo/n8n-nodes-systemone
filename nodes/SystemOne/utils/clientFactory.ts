import {
  VaelisClient,
  VaelisGateway,
  SystemOneProvider,
  LLMFallbackConfig,
  SupportedLLMProvider,
  EvaluatorConfig,
} from '@cubicmaldo/vaelis';

export interface VaelisCredentialsData {
  provider?: string;
  apiKey?: string;
  endpoint?: string;
  fallbackStrategy?: 'gemini-flash' | 'llm' | 'deterministic';
  geminiApiKey?: string;
  fallbackProvider?: string;
  fallbackApiKey?: string;
  fallbackModel?: string;
  fallbackBaseUrl?: string;
}

interface CachedGatewayEntry {
  client: VaelisClient;
  gateway: VaelisGateway;
}

const gatewayPool = new Map<string, CachedGatewayEntry>();

function computeCacheKey(credentials: VaelisCredentialsData): string {
  const provider = credentials.provider || 'typesafe';
  const apiKey = credentials.apiKey ? credentials.apiKey.slice(-6) : 'none';
  const endpoint = credentials.endpoint || 'default';
  const strategy = credentials.fallbackStrategy || 'auto';
  const geminiKey = credentials.geminiApiKey ? credentials.geminiApiKey.slice(-6) : 'none';
  const fallbackProv = credentials.fallbackProvider || 'none';
  const fallbackKey = credentials.fallbackApiKey ? credentials.fallbackApiKey.slice(-6) : 'none';
  return `${provider}::${endpoint}::${apiKey}::${strategy}::${geminiKey}::${fallbackProv}::${fallbackKey}`;
}

/**
 * Obtiene o inicializa del pool una instancia de VaelisGateway y VaelisClient
 * configurada con las credenciales del nodo y las capacidades de Vaelis 1.1.2+.
 */
export function getVaelisGateway(credentials: VaelisCredentialsData): VaelisGateway {
  const cacheKey = computeCacheKey(credentials);

  const existing = gatewayPool.get(cacheKey);
  if (existing) {
    return existing.gateway;
  }

  const provider = (credentials.provider || 'typesafe') as SystemOneProvider;
  const apiKey = credentials.apiKey?.trim();
  const endpoint = credentials.endpoint?.trim() || 'https://api.typesafe.ai';
  const geminiApiKey = credentials.geminiApiKey?.trim();
  const fallbackStrategy = credentials.fallbackStrategy;

  let fallback: EvaluatorConfig['fallback'] = 'deterministic';
  let llmFallback: LLMFallbackConfig | undefined;

  if (fallbackStrategy === 'llm' && (credentials.fallbackApiKey || credentials.fallbackProvider === 'ollama')) {
    fallback = 'llm';
    llmFallback = {
      provider: (credentials.fallbackProvider || 'groq') as SupportedLLMProvider,
      apiKey: credentials.fallbackApiKey?.trim(),
      model: credentials.fallbackModel?.trim() || undefined,
      baseUrl: credentials.fallbackBaseUrl?.trim() || undefined,
    };
  } else if (fallbackStrategy === 'gemini-flash' || (!fallbackStrategy && geminiApiKey)) {
    fallback = 'gemini-flash';
  } else if (fallbackStrategy === 'deterministic') {
    fallback = 'deterministic';
  } else if (geminiApiKey) {
    fallback = 'gemini-flash';
  }

  const client = new VaelisClient({
    provider,
    apiKey,
    endpoint,
    geminiApiKey,
    fallback,
    llmFallback,
    fallbackOnAuthError: true,
  });

  const gateway = new VaelisGateway(client);

  gatewayPool.set(cacheKey, { client, gateway });
  return gateway;
}

/**
 * Limpia el pool de conexiones en memoria (útil en tests o reset de credenciales).
 */
export function clearGatewayPool(): void {
  gatewayPool.clear();
}
