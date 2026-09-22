export interface EnrichedStateInput {
  command?: string;
  context?: string;
  environment?: Record<string, any>;
  customPayload?: Record<string, any>;
}

/**
 * Sanitiza y serializa el estado agregando metadatos temporales y truncando
 * estrictamente a un límite máximo de caracteres para preservar la ventana de contexto de 32k.
 */
export function sanitizeAndTruncateState(
  input: EnrichedStateInput,
  maxChars: number = 32000,
): string {
  const payload = {
    ...input,
    _timestamp: new Date().toISOString(),
  };

  const rawJson = JSON.stringify(payload);
  if (rawJson.length > maxChars) {
    return rawJson.slice(0, maxChars);
  }
  return rawJson;
}

/**
 * Normaliza cualquier entrada de texto o JSON a un string representativo
 * seguro que respeta el límite estricto de caracteres.
 */
export function normalizeStatePayload(input: unknown, maxChars: number = 32000): string {
  if (input === undefined || input === null) {
    return '';
  }

  let serialized: string;
  if (typeof input === 'object') {
    serialized = JSON.stringify(input);
  } else {
    serialized = String(input);
  }

  if (serialized.length > maxChars) {
    return serialized.slice(0, maxChars);
  }
  return serialized;
}
