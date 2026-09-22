export const PORT_HIGH = 0;
export const PORT_MEDIUM = 1;
export const PORT_ESCALATE = 2;

export type RoutingPort = 0 | 1 | 2;

export interface RoutingEvaluationParams {
  allowed: boolean;
  minConfidence: number;
  highThreshold?: number;
  ambiguityThreshold?: number;
  routing?: string;
  escalatedToHuman?: boolean;
}

/**
 * Calcula de manera determinista el puerto físico de salida en n8n
 * basándose en el axioma System 1 y los umbrales probabilísticos calibrados.
 */
export function determineRoutingPort(params: RoutingEvaluationParams): RoutingPort {
  const highThreshold = params.highThreshold ?? 0.90;
  const ambiguityThreshold = params.ambiguityThreshold ?? 0.65;
  const routing = params.routing || '';

  // Verificación de bloqueos de seguridad y escalación crítica
  const isSecurityOrPolicyBlock =
    !params.allowed ||
    params.escalatedToHuman === true ||
    routing.includes('BLOCK') ||
    routing.includes('DISSONANCE') ||
    routing.includes('FREEZE') ||
    routing === 'LOW_CONFIDENCE';

  if (isSecurityOrPolicyBlock || params.minConfidence < ambiguityThreshold) {
    return PORT_ESCALATE;
  }

  // Si está autorizado y supera el umbral de alta confianza -> Puerto 0
  if (params.allowed && params.minConfidence >= highThreshold) {
    return PORT_HIGH;
  }

  // Si está en la zona de incertidumbre / ambigüedad moderada -> Puerto 1
  return PORT_MEDIUM;
}

