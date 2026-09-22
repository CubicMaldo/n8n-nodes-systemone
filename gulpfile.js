const esbuild = require('esbuild');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { src, dest } = require('gulp');

/**
 * Step 1: Run tsc to generate .d.ts declaration files only.
 * We skip JS emit since esbuild will handle the bundling.
 */
function emitDeclarations(cb) {
  execSync('npx tsc --emitDeclarationOnly', { stdio: 'inherit' });
  cb();
}

/**
 * Step 2: Bundle each entry point with esbuild.
 * - Inlines @cubicmaldo/vaelis (zero runtime deps)
 * - Externalizes n8n-workflow (provided by n8n at runtime)
 */
async function bundle() {
  const entryPoints = [
    'index.ts',
    'credentials/SystemOneApi.credentials.ts',
    'credentials/VaelisApi.credentials.ts',
    'credentials/index.ts',
    'nodes/SystemOne/SystemOne.node.ts',
    'nodes/SystemOne/actions/index.ts',
    'nodes/SystemOne/actions/evaluateState.operation.ts',
    'nodes/SystemOne/actions/interceptToolCall.operation.ts',
    'nodes/SystemOne/descriptions/index.ts',
    'nodes/SystemOne/descriptions/evaluateState.description.ts',
    'nodes/SystemOne/descriptions/interceptToolCall.description.ts',
    'nodes/SystemOne/utils/clientFactory.ts',
    'nodes/SystemOne/utils/stateEngine.ts',
    'nodes/SystemOne/utils/thresholds.ts',
  ];

  await esbuild.build({
    entryPoints,
    outdir: 'dist',
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    sourcemap: true,
    // Keep n8n-workflow external (provided by n8n at runtime)
    external: ['n8n-workflow'],
    // Preserve the directory structure in dist/
    outbase: '.',
  });
}

/**
 * Step 3: Copy icons and JSON metadata to dist/
 */
function copyAssets() {
  return src(['nodes/**/*.{svg,png,json}']).pipe(dest('dist/nodes'));
}

// Legacy alias
exports['copy:icons'] = copyAssets;

// Main build: declarations → bundle → assets
exports.build = async function build(cb) {
  emitDeclarations(cb === undefined ? () => {} : cb);
  await bundle();
  // copyAssets returns a stream, need to wrap
  return copyAssets();
};

exports.default = exports.build;
