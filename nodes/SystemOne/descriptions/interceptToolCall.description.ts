import { INodeProperties } from 'n8n-workflow';

export const interceptToolCallDescription: INodeProperties[] = [
  {
    displayName: 'Command / Action Payload',
    name: 'command',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'SELECT * FROM users WHERE active = true;',
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'The command, bash script, SQL statement, or tool payload to evaluate at the perimeter',
  },
  {
    displayName: 'Context / Intent',
    name: 'context',
    type: 'string',
    typeOptions: {
      rows: 3,
    },
    default: '',
    placeholder: 'User requests reading active records for monthly report',
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'Execution context, user prompt, or autonomous agent intent',
  },
  {
    displayName: 'Is Production?',
    name: 'isProduction',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'Whether this execution targets a critical production environment',
  },
  {
    displayName: 'Execution Role',
    name: 'role',
    type: 'string',
    default: 'automation',
    placeholder: 'automation',
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'Role or privilege level of the agent requesting execution',
  },
  {
    displayName: 'High Confidence Threshold',
    name: 'highThreshold',
    type: 'number',
    typeOptions: {
      minValue: 0,
      maxValue: 1,
      numberPrecision: 2,
    },
    default: 0.90,
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'Minimum confidence threshold to route execution to Port 0 (High Confidence / Deterministic)',
  },
  {
    displayName: 'Ambiguity Threshold',
    name: 'ambiguityThreshold',
    type: 'number',
    typeOptions: {
      minValue: 0,
      maxValue: 1,
      numberPrecision: 2,
    },
    default: 0.65,
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'Uncertainty threshold below which execution escalates directly to Port 2 (Escalate / HITL)',
  },
];

