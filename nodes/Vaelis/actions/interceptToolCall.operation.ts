import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { VaelisGateway, SecurityVerdict } from '@cubicmaldo/vaelis';
import { sanitizeAndTruncateState } from '../utils/stateEngine';
import { determineRoutingPort, RoutingPort } from '../utils/thresholds';

export async function executeInterceptToolCall(
  this: IExecuteFunctions,
  gateway: VaelisGateway,
  itemIndex: number,
  item: INodeExecutionData,
): Promise<{ destinationPort: RoutingPort; resultItem: INodeExecutionData }> {
  const command = (this.getNodeParameter('command', itemIndex, '') as string) || '';
  const context = (this.getNodeParameter('context', itemIndex, '') as string) || '';
  const isProduction = this.getNodeParameter('isProduction', itemIndex, false) as boolean;
  const role = (this.getNodeParameter('role', itemIndex, 'automation') as string) || 'automation';
  const highThreshold = this.getNodeParameter('highThreshold', itemIndex, 0.90) as number;
  const ambiguityThreshold = this.getNodeParameter('ambiguityThreshold', itemIndex, 0.65) as number;
  const options = this.getNodeParameter('options', itemIndex, {}) as {
    includeInputFields?: boolean;
    outputField?: string;
  };

  // 1. Pre-guardrail estático determinista previo (<1 ms) para comandos letales
  const staticLethalRegex = /\b(DROP\s+TABLE|rm\s+-rf|TRUNCATE|FORMAT|DROP\s+DATABASE|mkfs|chmod\s+-R\s+777)\b/i;

  let verdict: SecurityVerdict;
  const startTime = Date.now();

  if (staticLethalRegex.test(command)) {
    verdict = {
      allowed: false,
      routing: 'STATIC_GUARDRAIL_BLOCK',
      minConfidence: 1.0,
      latencyMs: Math.max(1, Date.now() - startTime),
      actionTaken: 'STATIC_GUARDRAIL_TRIGGERED_LETHAL_COMMAND_PREVENTED',
      decisions: {
        is_destructive: {
          ruleId: 'is_destructive',
          value: true,
          confidence: 1.0,
          accepted: false,
        },
      },
    };
  } else {
    // 2. Sanitización estricta de estado a límite de 32k
    const stateString = sanitizeAndTruncateState({
      command,
      context,
      environment: { isProduction, role },
    });

    // 3. Inspección perimetral con VaelisGateway
    verdict = await gateway.interceptToolCall({
      command,
      context: stateString,
      environment: { isProduction, role },
    });
  }

  // 4. Enrutamiento determinista a los 3 puertos físicos
  const destinationPort = determineRoutingPort({
    allowed: verdict.allowed,
    minConfidence: verdict.minConfidence,
    highThreshold,
    ambiguityThreshold,
    routing: verdict.routing,
  });

  const outputField = options.outputField?.trim() || 'vaelis';
  const includeInput = options.includeInputFields !== false;

  const vaelisOutput = {
    allowed: verdict.allowed,
    routing: verdict.routing,
    minConfidence: verdict.minConfidence,
    latencyMs: verdict.latencyMs,
    actionTaken: verdict.actionTaken,
    decisions: verdict.decisions,
    evaluatedAt: new Date().toISOString(),
  };

  const outputJson = includeInput
    ? { ...item.json, [outputField]: vaelisOutput }
    : { [outputField]: vaelisOutput };

  const resultItem: INodeExecutionData = {
    json: outputJson,
    pairedItem: { item: itemIndex },
  };

  return { destinationPort, resultItem };
}
