import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import {
  interceptToolCallDescription,
  evaluateStateDescription,
  commonOptionsDescription,
} from './descriptions';
import { executeInterceptToolCall, executeEvaluateState } from './actions';
import { getVaelisGateway } from './utils/clientFactory';

export class Vaelis implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vaelis Gateway',
    name: 'vaelis',
    icon: 'file:vaelis.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Sub-100ms Fast-Path & Safety Gateway using System 1 Calibrated Decisions',
    defaults: {
      name: 'Vaelis Gateway',
    },
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main', 'main', 'main'],
    outputNames: ['High (Deterministic)', 'Medium (System 2 Ambiguity)', 'Escalate (HITL / Block)'],
    credentials: [
      {
        name: 'vaelisApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Intercept Tool Call',
            value: 'interceptToolCall',
            description: 'Auditar seguridad y guardrails de un comando antes de ejecutarlo',
            action: 'Intercept a tool call with fast-path guardrails',
          },
          {
            name: 'Evaluate State',
            value: 'evaluateState',
            description: 'Evaluar estado contra preguntas tipadas con confianza calibrada',
            action: 'Evaluate state against typed questions',
          },
        ],
        default: 'interceptToolCall',
      },
      ...interceptToolCallDescription,
      ...evaluateStateDescription,
      ...commonOptionsDescription,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const highBranch: INodeExecutionData[] = [];
    const mediumBranch: INodeExecutionData[] = [];
    const escalateBranch: INodeExecutionData[] = [];

    const credentials = await this.getCredentials('vaelisApi');
    const gateway = getVaelisGateway({
      provider: credentials.provider as string,
      apiKey: credentials.apiKey as string,
      endpoint: credentials.endpoint as string,
      geminiApiKey: credentials.geminiApiKey as string,
    });

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;

        let outcome: { destinationPort: 0 | 1 | 2; resultItem: INodeExecutionData };

        if (operation === 'interceptToolCall') {
          outcome = await executeInterceptToolCall.call(this, gateway, i, items[i]);
        } else if (operation === 'evaluateState') {
          outcome = await executeEvaluateState.call(this, gateway, i, items[i]);
        } else {
          throw new NodeOperationError(this.getNode(), `Operación no reconocida: ${operation}`, {
            itemIndex: i,
          });
        }

        if (outcome.destinationPort === 0) {
          highBranch.push(outcome.resultItem);
        } else if (outcome.destinationPort === 1) {
          mediumBranch.push(outcome.resultItem);
        } else {
          escalateBranch.push(outcome.resultItem);
        }
      } catch (error: any) {
        if (this.continueOnFail()) {
          escalateBranch.push({
            json: {
              ...items[i].json,
              error: error.message || 'Error occurred during Vaelis Gateway execution',
            },
            pairedItem: { item: i },
          });
        } else {
          throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
        }
      }
    }

    return [highBranch, mediumBranch, escalateBranch];
  }
}

