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
        description: 'Evaluate plain text or an n8n expression',
      },
      {
        name: 'Whole Input Item',
        value: 'inputItem',
        description: 'Use the complete JSON object from the incoming item as state',
      },
      {
        name: 'Custom JSON',
        value: 'json',
        description: 'Provide a structured JSON object or array',
      },
    ],
    default: 'text',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
      },
    },
    description: 'Source of state data to feed into the System 1 evaluation',
  },
  {
    displayName: 'State Text',
    name: 'stateText',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    default: '',
    placeholder: 'e.g. Please cancel my subscription immediately due to recurring failures.',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
        stateSource: ['text'],
      },
    },
    description: 'Unstructured text or context to evaluate',
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
    description: 'JSON object or array to evaluate',
  },
  {
    displayName: 'Question Mode',
    name: 'questionMode',
    type: 'options',
    options: [
      {
        name: 'Structured (Visual)',
        value: 'structured',
        description: 'Configure questions interactively using the n8n interface',
      },
      {
        name: 'Using JSON',
        value: 'json',
        description: 'Provide a questions dictionary directly in TypeSafe/Vaelis format',
      },
    ],
    default: 'structured',
    displayOptions: {
      show: {
        operation: ['evaluateState'],
      },
    },
    description: 'How to define the decision questions',
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
    description: 'Questions dictionary in official TypeSafe System 1 format',
  },
  {
    displayName: 'Decision Rules',
    name: 'rules',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    placeholder: 'Add Decision Rule',
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
            description: 'Unique rule identifier (e.g. department, is_urgent, risk_score)',
          },
          {
            displayName: 'Decision Kind',
            name: 'kind',
            type: 'options',
            options: [
              {
                name: 'Noul (Boolean Probability)',
                value: 'noul',
                description: 'Binary decision with calibrated probability 0.0 - 1.0',
              },
              {
                name: 'Choice (Categorical)',
                value: 'choice',
                description: 'Select one category from multiple options',
              },
              {
                name: 'Score (Continuous 0.0 - 1.0)',
                value: 'score',
                description: 'Continuous quantitative score between 0.0 and 1.0',
              },
            ],
            default: 'noul',
            description: 'Required probabilistic output type',
          },
          {
            displayName: 'Question / Criteria',
            name: 'question',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'e.g. Does this request involve financial transactions or refunds?',
            description: 'Natural language criteria for the deterministic evaluation',
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
            description: 'Comma-separated categorical options',
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
            description: 'Minimum mathematical confidence to accept this rule\'s decision',
          },
          {
            displayName: 'Description',
            name: 'description',
            type: 'string',
            default: '',
            description: 'Internal description or audit metadata',
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
    description: 'Minimum aggregate confidence threshold to route execution to Port 0',
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
    description: 'Uncertainty threshold below which execution routes to Port 2',
  },
];

