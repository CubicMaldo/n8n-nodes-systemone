# Changelog

## 0.3.0 - Unreleased

### Breaking Changes

- **Unified Fallback System**: Removed the dedicated "Google Gemini Flash" fallback strategy and its separate `geminiApiKey` field. Gemini is now available as a provider within the unified "Universal LLM Fallback" dropdown (and is the default). Existing credentials using the old `gemini-flash` fallback strategy will need to be reconfigured.

### Improvements

- Translated all UI strings from Spanish to English
- Added `peerDependencies` for `n8n-workflow`
- Added `prepublishOnly` script to prevent accidental bad publishes
- Added `engines` field requiring Node.js >= 18
- Added `credentialDocumentation` to codex JSON for credential setup help links
- Added CI workflow for automated build/test/lint on push and PR
- Added gateway pool eviction (max 32 entries) to prevent memory leaks
- Included README.md, LICENSE, and examples/ in the npm tarball
- Removed duplicate VaelisApi credential from n8n registration
- Added `.nvmrc`, `.npmrc` for contributor consistency

## 0.2.0

### Operations

- **interceptToolCall**: Sub-1ms static guardrail for lethal commands (`rm -rf`, `DROP TABLE`, etc.), dual-vector security inspection, 3-port physical routing
- **evaluateState**: Calibrated classification against typed questions (choice, noul, score), structured and JSON question modes

### Features

- 3 physical output ports: High Confidence, Medium (System 2 Ambiguity), Escalate (HITL / Block)
- Zero-token deterministic fast-path for high-confidence decisions
- Universal LLM Fallback (Gemini, Groq, OpenAI, Anthropic, DeepSeek, Mistral, Ollama)
- Connection pooling with in-memory gateway cache
- `usableAsTool: true` for native AI Agent tool support
- Context window bounding (32k character sanitizer)
- Token and cost savings telemetry
- 3 pre-built example workflows

