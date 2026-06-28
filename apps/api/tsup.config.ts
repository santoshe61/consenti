import { defineConfig } from 'tsup'

const NODE_BUILTINS = [
  'node:crypto', 'node:path', 'node:fs', 'node:fs/promises',
  'node:events', 'node:url', 'node:http', 'node:https', 'node:stream',
  'node:buffer', 'node:util', 'node:os', 'node:net', 'node:tls',
  'node:child_process', 'node:worker_threads', 'node:module',
]

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.js' : '.cjs' }),
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  target: 'node20',
  platform: 'node',
  external: NODE_BUILTINS,
  shims: true,
})
