import { INodeProperties } from 'n8n-workflow';
import { interceptToolCallDescription } from './interceptToolCall.description';
import { evaluateStateDescription } from './evaluateState.description';

export const commonOptionsDescription: INodeProperties[] = [
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    options: [
      {
        displayName: 'Include Input Fields',
        name: 'includeInputFields',
        type: 'boolean',
        default: true,
        description: 'Whether to preserve incoming item data alongside Vaelis evaluation outputs',
      },
      {
        displayName: 'Output Property Name',
        name: 'outputField',
        type: 'string',
        default: 'vaelis',
        description: 'Name of the JSON field where the verdict or result will be stored',
      },
    ],
  },
];

export { interceptToolCallDescription, evaluateStateDescription };

