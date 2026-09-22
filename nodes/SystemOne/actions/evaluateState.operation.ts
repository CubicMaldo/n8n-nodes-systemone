import { IExecuteFunctions, INodeExecutionData, jsonParse, NodeOperationError } from 'n8n-workflow';
import { VaelisGateway, DecisionRule } from '@cubicmaldo/vaelis';
import { normalizeStatePayload } from '../utils/stateEngine';
import { determineRoutingPort, RoutingPort } from '../utils/thresholds';

interface RuleFormValue {
  id: string;
  kind: 'noul' | 'choice' | 'score';
  question: string;
  options?: string;
  minConfidence?: number;
  description?: string;
}

export async function executeEvaluateState(
  this: IExecuteFunctions,
  gateway: VaelisGateway,
  itemIndex: number,
  item: INodeExecutionData,
): Promise<{ destinationPort: RoutingPort; resultItem: INodeExecutionData }> {
  const highThreshold = this.getNodeParameter('highThreshold', itemIndex, 0.90) as number;
  const ambiguityThreshold = this.getNodeParameter('ambiguityThreshold', itemIndex, 0.65) as number;
  const options = this.getNodeParameter('options', itemIndex, {}) as {
    includeInputFields?: boolean;
    outputField?: string;
  };

  // 1. Resolver el estado a evaluar
  const stateSource = this.getNodeParameter('stateSource', itemIndex, 'text') as string;
  let rawState: unknown;

  if (stateSource === 'inputItem') {
    rawState = item.json;
  } else if (stateSource === 'json') {
    const jsonParam = this.getNodeParameter('stateJson', itemIndex, '{}');
    if (typeof jsonParam === 'string') {
      try {
        rawState = jsonParse(jsonParam);
      } catch {
        throw new NodeOperationError(this.getNode(), 'The State (JSON) parameter is not valid JSON', {
          itemIndex,
        });
      }
    } else {
      rawState = jsonParam;
    }
  } else {
    rawState = this.getNodeParameter('stateText', itemIndex, '') as unknown;
  }

  const stateString = normalizeStatePayload(rawState, 32000);

  // 2. Resolver las reglas de decisión
  const questionMode = this.getNodeParameter('questionMode', itemIndex, 'structured') as string;
  let rules: DecisionRule[] = [];

  if (questionMode === 'json') {
    const rawQuestionsJson = this.getNodeParameter('questionsJson', itemIndex, '{}');
    let questionsMap: Record<string, any>;
    if (typeof rawQuestionsJson === 'string') {
      try {
        questionsMap = jsonParse(rawQuestionsJson);
      } catch {
        throw new NodeOperationError(
          this.getNode(),
          'The Questions (JSON) parameter is not valid JSON',
          { itemIndex },
        );
      }
    } else {
      questionsMap = rawQuestionsJson as Record<string, any>;
    }

    rules = Object.entries(questionsMap).map(([id, q]: [string, any]) => {
      const kind = q.type === 'noul' ? 'boolean' : q.type === 'choice' ? 'choice' : 'score';
      const ruleOptions = Array.isArray(q.criteria)
        ? q.criteria
        : q.criteria && typeof q.criteria === 'object'
          ? Object.keys(q.criteria)
          : undefined;

      return {
        id,
        kind,
        question: q.instructions || q.question || '',
        options: ruleOptions,
        minConfidence: q.minConfidence ?? highThreshold,
        description: q.description,
      };
    });
  } else {
    const formRules = this.getNodeParameter('rules.rule', itemIndex, []) as RuleFormValue[];
    if (!formRules.length) {
      throw new NodeOperationError(this.getNode(), 'You must define at least one decision rule', {
        itemIndex,
      });
    }

    rules = formRules.map((r) => {
      let optionsList: string[] | undefined;
      if (r.kind === 'choice' && r.options) {
        optionsList = r.options
          .split(',')
          .map((opt) => opt.trim())
          .filter(Boolean);
      }

      return {
        id: r.id.trim(),
        kind: r.kind === 'noul' ? 'boolean' : r.kind,
        question: r.question,
        options: optionsList,
        minConfidence: r.minConfidence ?? highThreshold,
        description: r.description,
      };
    });
  }

  // 3. Evaluar mediante VaelisGateway
  const result = await gateway.evaluate(stateString, rules, {
    highConfidenceThreshold: highThreshold,
    mediumConfidenceThreshold: ambiguityThreshold,
  });

  // 4. Enrutamiento a 3 puertos según confianza calibrada y banderas de seguridad
  const isAllowed = !result.escalatedToHuman && result.routing !== 'STATIC_GUARDRAIL_BLOCK';
  const destinationPort = determineRoutingPort({
    allowed: isAllowed,
    minConfidence: result.minConfidence,
    highThreshold,
    ambiguityThreshold,
    routing: result.routing,
    escalatedToHuman: result.escalatedToHuman,
  });

  const outputField = options.outputField?.trim() || 'vaelis';
  const includeInput = options.includeInputFields !== false;

  const vaelisOutput = {
    routing: result.routing,
    minConfidence: result.minConfidence,
    avgConfidence: result.avgConfidence,
    decisions: result.decisions,
    latencyMs: result.latencyMs,
    httpLatencyMs: result.httpLatencyMs,
    tokenSavingsPercent: result.tokenSavingsPercent,
    costSavingsEstimateUsd: result.costSavingsEstimateUsd,
    actionTaken: result.actionTaken,
    escalatedToHuman: result.escalatedToHuman,
    provider: result.provider,
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

