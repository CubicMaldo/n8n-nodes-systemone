const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Vaelis } = require('../dist/nodes/Vaelis/Vaelis.node');
const { VaelisApi } = require('../dist/credentials/VaelisApi.credentials');
const {
  determineRoutingPort,
  PORT_HIGH,
  PORT_MEDIUM,
  PORT_ESCALATE,
} = require('../dist/nodes/Vaelis/utils/thresholds');
const {
  sanitizeAndTruncateState,
  normalizeStatePayload,
} = require('../dist/nodes/Vaelis/utils/stateEngine');
const { getVaelisGateway } = require('../dist/nodes/Vaelis/utils/clientFactory');
const { executeInterceptToolCall } = require('../dist/nodes/Vaelis/actions/interceptToolCall.operation');

describe('Vaelis Gateway n8n Community Package', () => {
  describe('Node Structure & Metadata', () => {
    it('debe declarar exactamente 3 puertos físicos de salida con etiquetas descriptivas', () => {
      const node = new Vaelis();
      assert.strictEqual(node.description.name, 'vaelis');
      assert.strictEqual(node.description.displayName, 'Vaelis Gateway');
      assert.strictEqual(node.description.usableAsTool, true);
      assert.deepStrictEqual(node.description.outputs, ['main', 'main', 'main']);
      assert.deepStrictEqual(node.description.outputNames, [
        'High (Deterministic)',
        'Medium (System 2 Ambiguity)',
        'Escalate (HITL / Block)',
      ]);
    });

    it('debe requerir la credencial vaelisApi', () => {
      const node = new Vaelis();
      assert.deepStrictEqual(node.description.credentials, [
        { name: 'vaelisApi', required: true },
      ]);
    });

    it('debe exponer las operaciones interceptToolCall y evaluateState', () => {
      const node = new Vaelis();
      const opProp = node.description.properties.find((p) => p.name === 'operation');
      assert.ok(opProp);
      const opValues = opProp.options.map((o) => o.value);
      assert.ok(opValues.includes('interceptToolCall'));
      assert.ok(opValues.includes('evaluateState'));
    });

    it('debe validar la estructura de VaelisApi credentials con Universal LLM Fallback', () => {
      const creds = new VaelisApi();
      assert.strictEqual(creds.name, 'vaelisApi');
      const propNames = creds.properties.map((p) => p.name);
      assert.ok(propNames.includes('provider'));
      assert.ok(propNames.includes('apiKey'));
      assert.ok(propNames.includes('endpoint'));
      assert.ok(propNames.includes('fallbackStrategy'));
      assert.ok(propNames.includes('geminiApiKey'));
      assert.ok(propNames.includes('fallbackProvider'));
      assert.ok(propNames.includes('fallbackApiKey'));
      assert.ok(propNames.includes('fallbackModel'));
      assert.ok(propNames.includes('fallbackBaseUrl'));
    });
  });

  describe('Motor de Umbrales y Enrutamiento Determinista (System 1 Axiom)', () => {
    it('debe enrutar al Puerto 0 (High) cuando es seguro y la confianza >= 0.90', () => {
      const port = determineRoutingPort({
        allowed: true,
        minConfidence: 0.95,
        highThreshold: 0.90,
        ambiguityThreshold: 0.65,
        routing: 'HIGH_CONFIDENCE',
      });
      assert.strictEqual(port, PORT_HIGH);
    });

    it('debe enrutar al Puerto 1 (Medium / Ambiguity) cuando la confianza está entre 0.65 y 0.89', () => {
      const port = determineRoutingPort({
        allowed: true,
        minConfidence: 0.78,
        highThreshold: 0.90,
        ambiguityThreshold: 0.65,
        routing: 'MEDIUM_CONFIDENCE',
      });
      assert.strictEqual(port, PORT_MEDIUM);
    });

    it('debe enrutar al Puerto 2 (Escalate) en bloqueos estáticos o fallos de seguridad', () => {
      const port = determineRoutingPort({
        allowed: false,
        minConfidence: 1.0,
        highThreshold: 0.90,
        ambiguityThreshold: 0.65,
        routing: 'STATIC_GUARDRAIL_BLOCK',
      });
      assert.strictEqual(port, PORT_ESCALATE);
    });

    it('debe enrutar al Puerto 2 (Escalate) cuando la confianza es baja (< 0.65)', () => {
      const port = determineRoutingPort({
        allowed: true,
        minConfidence: 0.52,
        highThreshold: 0.90,
        ambiguityThreshold: 0.65,
        routing: 'LOW_CONFIDENCE',
      });
      assert.strictEqual(port, PORT_ESCALATE);
    });

    it('debe enrutar al Puerto 2 (Escalate) en disonancia cruzada o inyección adversarial', () => {
      assert.strictEqual(
        determineRoutingPort({
          allowed: false,
          minConfidence: 0.5,
          routing: 'CROSS_CHECK_DISSONANCE',
        }),
        PORT_ESCALATE,
      );

      assert.strictEqual(
        determineRoutingPort({
          allowed: false,
          minConfidence: 0.95,
          routing: 'ADVERSARIAL_FREEZE',
        }),
        PORT_ESCALATE,
      );
    });
  });

  describe('Sanitización y Límites de Estado (stateEngine)', () => {
    it('debe añadir timestamp y respetar el límite de 32k caracteres', () => {
      const output = sanitizeAndTruncateState({
        command: 'echo "hello"',
        context: 'test prompt',
        environment: { isProduction: true, role: 'admin' },
      });

      const parsed = JSON.parse(output);
      assert.strictEqual(parsed.command, 'echo "hello"');
      assert.ok(parsed._timestamp);
      assert.ok(output.length <= 32000);
    });

    it('debe truncar estados gigantescos a exactamente maxChars', () => {
      const hugeInput = 'A'.repeat(50000);
      const output = normalizeStatePayload(hugeInput, 32000);
      assert.strictEqual(output.length, 32000);
    });
  });

  describe('Client Factory & Universal LLM Fallback (Vaelis 1.1.2+)', () => {
    it('debe configurar gateway con Universal LLM Fallback (Groq/OpenAI)', () => {
      const gateway = getVaelisGateway({
        provider: 'typesafe',
        fallbackStrategy: 'llm',
        fallbackProvider: 'groq',
        fallbackApiKey: 'gsk_mock_12345',
        fallbackModel: 'llama-3.3-70b-versatile',
      });
      assert.ok(gateway);
    });

    it('debe reutilizar instancias del pool para credenciales equivalentes', () => {
      const g1 = getVaelisGateway({ provider: 'gemini-flash', apiKey: 'test-123' });
      const g2 = getVaelisGateway({ provider: 'gemini-flash', apiKey: 'test-123' });
      assert.strictEqual(g1, g2);
    });
  });

  describe('Operación interceptToolCall', () => {
    it('debe interceptar comando letal "rm -rf /" en <10 ms y enrutar al Puerto 2 (Escalate)', async () => {
      const gateway = getVaelisGateway({ provider: 'typesafe' });

      const mockExecuteFunctions = {
        getNodeParameter(paramName, itemIndex, defaultValue) {
          const params = {
            command: 'rm -rf /',
            context: 'clean up system',
            isProduction: true,
            role: 'admin',
            highThreshold: 0.90,
            ambiguityThreshold: 0.65,
            options: { includeInputFields: true, outputField: 'vaelis' },
          };
          return params[paramName] !== undefined ? params[paramName] : defaultValue;
        },
      };

      const start = performance.now();
      const outcome = await executeInterceptToolCall.call(
        mockExecuteFunctions,
        gateway,
        0,
        { json: { id: 1, originalData: 'foo' } },
      );
      const durationMs = performance.now() - start;

      assert.ok(durationMs < 15, `Duración esperada < 15 ms, obtenida: ${durationMs} ms`);
      assert.strictEqual(outcome.destinationPort, PORT_ESCALATE);
      assert.strictEqual(outcome.resultItem.json.vaelis.allowed, false);
      assert.strictEqual(outcome.resultItem.json.vaelis.routing, 'STATIC_GUARDRAIL_BLOCK');
      assert.strictEqual(outcome.resultItem.pairedItem.item, 0);
      assert.strictEqual(outcome.resultItem.json.originalData, 'foo');
    });

    it('debe interceptar comando letal "DROP TABLE users" en <10 ms y enrutar al Puerto 2 (Escalate)', async () => {
      const gateway = getVaelisGateway({ provider: 'typesafe' });

      const mockExecuteFunctions = {
        getNodeParameter(paramName, itemIndex, defaultValue) {
          const params = {
            command: 'DROP TABLE users;',
            context: 'schema cleanup',
            isProduction: true,
            role: 'dba',
            highThreshold: 0.90,
            ambiguityThreshold: 0.65,
            options: { includeInputFields: true, outputField: 'vaelis' },
          };
          return params[paramName] !== undefined ? params[paramName] : defaultValue;
        },
      };

      const start = performance.now();
      const outcome = await executeInterceptToolCall.call(
        mockExecuteFunctions,
        gateway,
        0,
        { json: { request: 'drop db' } },
      );
      const durationMs = performance.now() - start;

      assert.ok(durationMs < 15, `Duración esperada < 15 ms, obtenida: ${durationMs} ms`);
      assert.strictEqual(outcome.destinationPort, PORT_ESCALATE);
      assert.strictEqual(outcome.resultItem.json.vaelis.allowed, false);
    });
  });

  describe('Operación evaluateState', () => {
    it('debe transformar reglas estructuradas y enrutar correctamente', async () => {
      const { executeEvaluateState } = require('../dist/nodes/Vaelis/actions/evaluateState.operation');
      const gateway = getVaelisGateway({ provider: 'typesafe' });

      const mockExecuteFunctions = {
        getNodeParameter(paramName, itemIndex, defaultValue) {
          const params = {
            stateSource: 'text',
            stateText: 'Quiero solicitar una demo del producto y conocer los precios.',
            questionMode: 'structured',
            'rules.rule': [
              {
                id: 'is_urgent',
                kind: 'noul',
                question: 'Is this message urgent?',
                minConfidence: 0.90,
              },
            ],
            highThreshold: 0.90,
            ambiguityThreshold: 0.65,
            options: { includeInputFields: true, outputField: 'vaelis' },
          };
          return params[paramName] !== undefined ? params[paramName] : defaultValue;
        },
      };

      const outcome = await executeEvaluateState.call(
        mockExecuteFunctions,
        gateway,
        0,
        { json: { emailId: 'msg_123' } },
      );

      assert.ok([PORT_HIGH, PORT_MEDIUM, PORT_ESCALATE].includes(outcome.destinationPort));
      assert.strictEqual(outcome.resultItem.json.emailId, 'msg_123');
      assert.ok(outcome.resultItem.json.vaelis);
      assert.ok(outcome.resultItem.json.vaelis.decisions.is_urgent);
      assert.strictEqual(outcome.resultItem.pairedItem.item, 0);
    });

    it('debe procesar modo questionsJson correctamente', async () => {
      const { executeEvaluateState } = require('../dist/nodes/Vaelis/actions/evaluateState.operation');
      const gateway = getVaelisGateway({ provider: 'typesafe' });

      const mockExecuteFunctions = {
        getNodeParameter(paramName, itemIndex, defaultValue) {
          const params = {
            stateSource: 'text',
            stateText: 'Necesito cancelar mi cuenta y solicitar un reembolso inmediato por fraude.',
            questionMode: 'json',
            questionsJson: JSON.stringify({
              reason: {
                type: 'choice',
                instructions: 'What is the user reason?',
                criteria: ['refund', 'cancel', 'support'],
              },
            }),
            highThreshold: 0.90,
            ambiguityThreshold: 0.65,
            options: { includeInputFields: false, outputField: 'vaelis' },
          };
          return params[paramName] !== undefined ? params[paramName] : defaultValue;
        },
      };

      const outcome = await executeEvaluateState.call(
        mockExecuteFunctions,
        gateway,
        0,
        { json: { id: 456 } },
      );

      assert.ok(outcome.resultItem.json.vaelis);
      assert.ok(outcome.resultItem.json.vaelis.decisions.reason);
      assert.strictEqual(outcome.resultItem.json.id, undefined); // includeInputFields: false
    });
  });

  describe('Ejecución Integral del Nodo Vaelis (execute router)', () => {
    it('debe distribuir múltiples ítems en los 3 arreglos de salida según sus veredictos', async () => {
      const node = new Vaelis();

      const items = [
        { json: { cmd: 'rm -rf /' } },
        { json: { cmd: 'DROP TABLE accounts;' } },
      ];

      const mockContext = {
        getInputData() {
          return items;
        },
        async getCredentials() {
          return { provider: 'typesafe' };
        },
        getNodeParameter(paramName, itemIndex, defaultValue) {
          const item = items[itemIndex];
          if (paramName === 'operation') return 'interceptToolCall';
          if (paramName === 'command') return item.json.cmd;
          if (paramName === 'context') return 'automated cleanup';
          if (paramName === 'isProduction') return false;
          if (paramName === 'role') return 'automation';
          if (paramName === 'highThreshold') return 0.90;
          if (paramName === 'ambiguityThreshold') return 0.65;
          if (paramName === 'options') return { includeInputFields: true, outputField: 'vaelis' };
          return defaultValue;
        },
        continueOnFail() {
          return false;
        },
        getNode() {
          return { name: 'Vaelis Gateway' };
        },
      };

      const result = await node.execute.call(mockContext);

      assert.strictEqual(result.length, 3);
      const [highBranch, mediumBranch, escalateBranch] = result;

      assert.strictEqual(highBranch.length, 0);
      assert.strictEqual(mediumBranch.length, 0);
      assert.strictEqual(escalateBranch.length, 2);

      assert.strictEqual(escalateBranch[0].json.vaelis.allowed, false);
      assert.strictEqual(escalateBranch[1].json.vaelis.allowed, false);
    });
  });
});
