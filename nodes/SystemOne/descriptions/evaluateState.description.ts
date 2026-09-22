import { INodeProperties } from 'n8n-workflow';

export const evaluateStateDescription: INodeProperties[] = [
  {
    displayName: 'State Source',
    name: 'stateSource',
    type: 'options',
    options: [
      {
        name: 'Text or Expression',
        value: 'text',
        description: 'Evalúa un texto sin formato o una expresión de n8n',
      },
      {
        name: 'Whole Input Item',
        value: 'inputItem',
        description: 'Usa el objeto JSON completo del ítem entrante como estado',
      },
      {
        name: 'Custom JSON',
        value: 'json',
        description: 'Provee un objeto o array JSON estructurado',
      },
    ],
    default: 'text',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
      },
    },
    description: 'Origen de los datos de estado para alimentar la evaluación System 1',
  },
  {
    displayName: 'State Text',
    name: 'stateText',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    default: '',
    placeholder: 'e.g. Por favor cancelar mi suscripción inmediatamente debido a fallos recurrentes.',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
        stateSource: ['text'],
      },
    },
    description: 'Texto o contexto no estructurado a evaluar',
  },
  {
    displayName: 'State (JSON)',
    name: 'stateJson',
    type: 'json',
    typeOptions: {
      rows: 4,
    },
    default: '{}',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
        stateSource: ['json'],
      },
    },
    description: 'Objeto o array JSON a evaluar',
  },
  {
    displayName: 'Question Mode',
    name: 'questionMode',
    type: 'options',
    options: [
      {
        name: 'Structured (Visual)',
        value: 'structured',
        description: 'Configura preguntas interactivamente usando la interfaz de n8n',
      },
      {
        name: 'Using JSON',
        value: 'json',
        description: 'Provee un diccionario de preguntas directamente en formato TypeSafe/Vaelis',
      },
    ],
    default: 'structured',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
      },
    },
    description: 'Modo de definición de las preguntas de decisión',
  },
  {
    displayName: 'Questions (JSON)',
    name: 'questionsJson',
    type: 'json',
    typeOptions: {
      rows: 5,
    },
    default: '{\n  "is_urgent": {\n    "type": "noul",\n    "instructions": "Is this inquiry urgent?"\n  }\n}',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
        questionMode: ['json'],
      },
    },
    description: 'Diccionario de preguntas en formato oficial TypeSafe System 1',
  },
  {
    displayName: 'Decision Rules',
    name: 'rules',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    placeholder: 'Agregar Regla de Decisión',
    default: {
      rule: [
        {
          id: 'is_urgent',
          kind: 'noul',
          question: 'Is this message expressing urgency or requesting immediate action?',
          minConfidence: 0.90,
        },
      ],
    },
    displayOptions: {
      show: {
        operation: ['evaluateState'],
        questionMode: ['structured'],
      },
    },
    options: [
      {
        name: 'rule',
        displayName: 'Rule',
        values: [
          {
            displayName: 'Rule ID',
            name: 'id',
            type: 'string',
            required: true,
            default: 'rule_1',
            description: 'Identificador único de la regla (ej. department, is_urgent, risk_score)',
          },
          {
            displayName: 'Decision Kind',
            name: 'kind',
            type: 'options',
            options: [
              {
                name: 'Noul (Boolean Probability)',
                value: 'noul',
                description: 'Decisión binaria con probabilidad calibrada 0.0 - 1.0',
              },
              {
                name: 'Choice (Categorical)',
                value: 'choice',
                description: 'Selección de una categoría entre varias opciones',
              },
              {
                name: 'Score (Continuous 0.0 - 1.0)',
                value: 'score',
                description: 'Calificación cuantitativa continua entre 0.0 y 1.0',
              },
            ],
            default: 'noul',
            description: 'Tipo de salida probabilística requerida',
          },
          {
            displayName: 'Question / Criteria',
            name: 'question',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'e.g. Does this request involve financial transactions or refunds?',
            description: 'Criterio en lenguaje natural para la evaluación determinista',
          },
          {
            displayName: 'Options (Comma-separated)',
            name: 'options',
            type: 'string',
            default: 'billing, technical, sales, other',
            displayOptions: {
              show: {
                kind: ['choice'],
              },
            },
            description: 'Opciones categóricas separadas por comas',
          },
          {
            displayName: 'Min Confidence',
            name: 'minConfidence',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberPrecision: 2,
            },
            default: 0.90,
            description: 'Confianza matemática mínima para aceptar la decisión de esta regla',
          },
          {
            displayName: 'Description',
            name: 'description',
            type: 'string',
            default: '',
            description: 'Descripción interna o metadatos de auditoría',
          },
        ],
      },
    ],
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
        operation: ['evaluateState'],
      },
    },
    description: 'Umbral mínimo de confianza agregada para dirigir la ejecución al Puerto 0',
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
        operation: ['evaluateState'],
      },
    },
    description: 'Umbral de incertidumbre por debajo del cual se bifurca al Puerto 2',
  },
];

