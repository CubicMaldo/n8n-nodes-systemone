import { VaelisClient, VaelisGateway, SystemOneProvider } from '@cubicmaldo/vaelis';

export interface VaelisCredentialsData {
  provider?: string;
  apiKey?: string;
  endpoint?: string;
  geminiApiKey?: string;
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
  const geminiKey = credentials.geminiApiKey ? credentials.geminiApiKey.slice(-6) : 'none';
  return `${provider}::${endpoint}::${apiKey}::${geminiKey}`;
}

/**
 * Obtiene o inicializa del pool una instancia de VaelisGateway y VaelisClient
 * configurada con las credenciales del nodo.
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

  // Si se provee geminiApiKey, se usa como fallback; en caso contrario, fallback determinista
  const fallback = geminiApiKey ? 'gemini-flash' : 'deterministic';

  const client = new VaelisClient({
    provider,
    apiKey,
    endpoint,
    geminiApiKey,
    fallback,
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
