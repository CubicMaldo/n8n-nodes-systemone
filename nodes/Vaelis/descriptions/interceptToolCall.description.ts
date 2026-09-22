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
    description: 'El comando, script bash, sentencia SQL o payload de tool a evaluar perimetralmente',
  },
  {
    displayName: 'Context / Intent',
    name: 'context',
    type: 'string',
    typeOptions: {
      rows: 3,
    },
    default: '',
    placeholder: 'Usuario solicita lectura de registros activos para reporte mensual',
    displayOptions: {
      show: {
        operation: ['interceptToolCall'],
      },
    },
    description: 'Contexto de ejecución, prompt del usuario o intención del agente autónomo',
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
    description: 'Rol o nivel de privilegios del agente que solicita la ejecución',
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
    description: 'Umbral mínimo de confianza para dirigir la ejecución al Puerto 0 (High Confidence / Deterministic)',
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
    description: 'Umbral de incertidumbre por debajo del cual se escala directamente al Puerto 2 (Escalate / HITL)',
  },
];
