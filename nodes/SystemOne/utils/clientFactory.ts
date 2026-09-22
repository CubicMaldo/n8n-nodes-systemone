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
  fallbackStrategy?: 'llm' | 'deterministic';
  fallbackProvider?: string;
  fallbackApiKey?: string;
  fallbackModel?: string;
  fallbackBaseUrl?: string;
}

interface CachedGatewayEntry {
  client: VaelisClient;
  gateway: VaelisGateway;
}

const MAX_POOL_SIZE = 32;
const gatewayPool = new Map<string, CachedGatewayEntry>();

function computeCacheKey(credentials: VaelisCredentialsData): string {
  const provider = credentials.provider || 'typesafe';
  const apiKey = credentials.apiKey ? credentials.apiKey.slice(-6) : 'none';
  const endpoint = credentials.endpoint || 'default';
  const strategy = credentials.fallbackStrategy || 'deterministic';
  const fallbackProv = credentials.fallbackProvider || 'none';
  const fallbackKey = credentials.fallbackApiKey ? credentials.fallbackApiKey.slice(-6) : 'none';
  return `${provider}::${endpoint}::${apiKey}::${strategy}::${fallbackProv}::${fallbackKey}`;
}

/**
 * Gets or initializes from the pool a VaelisGateway and VaelisClient instance
 * configured with the node credentials and Vaelis 1.1.2+ capabilities.
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
  const fallbackStrategy = credentials.fallbackStrategy;

  let fallback: EvaluatorConfig['fallback'] = 'deterministic';
  let llmFallback: LLMFallbackConfig | undefined;

  if (fallbackStrategy === 'llm' && (credentials.fallbackApiKey || credentials.fallbackProvider === 'ollama')) {
    fallback = 'llm';
    llmFallback = {
      provider: (credentials.fallbackProvider || 'gemini') as SupportedLLMProvider,
      apiKey: credentials.fallbackApiKey?.trim(),
      model: credentials.fallbackModel?.trim() || undefined,
      baseUrl: credentials.fallbackBaseUrl?.trim() || undefined,
    };
  }

  const client = new VaelisClient({
    provider,
    apiKey,
    endpoint,
    fallback,
    llmFallback,
    fallbackOnAuthError: true,
  });

  const gateway = new VaelisGateway(client);

  // Evict oldest entry if pool exceeds max size
  if (gatewayPool.size >= MAX_POOL_SIZE) {
    const oldestKey = gatewayPool.keys().next().value;
    if (oldestKey !== undefined) {
      gatewayPool.delete(oldestKey);
    }
  }

  gatewayPool.set(cacheKey, { client, gateway });
  return gateway;
}

/**
 * Clears the in-memory connection pool (useful for tests or credential resets).
 */
export function clearGatewayPool(): void {
  gatewayPool.clear();
}
