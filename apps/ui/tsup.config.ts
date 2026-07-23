import { defineConfig } from 'tsup'

// `dist/` is cleaned once in the `build` npm script before tsup runs, not via a per-entry
// `clean: true` here — tsup builds every entry in this array concurrently, so a `clean: true`
// on one of them races the others' writes and can delete freshly-built output (`react.js`,
// `vue.js`, etc.) out from under them nondeterministically.
const PACKAGE_VERSION = process.env.npm_package_version ?? '0.0.0'
const versionDefine = { __CONSENTI_VERSION__: JSON.stringify(PACKAGE_VERSION) }

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    dts: { resolve: true },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    platform: 'browser',
    define: versionDefine,
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Consenti',
    outExtension: () => ({ js: '.umd.js' }),
    sourcemap: true,
    minify: true,
    target: 'es2020',
    platform: 'browser',
    define: versionDefine,
  },
  {
    entry: { react: 'src/react.ts' },
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
    dts: { resolve: true },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    platform: 'browser',
    external: ['react'],
  },
  {
    entry: { vue: 'src/vue.ts' },
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
    dts: { resolve: true },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    platform: 'browser',
    external: ['vue'],
  },
  {
    entry: { angular: 'src/angular.ts' },
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
    dts: { resolve: true },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    platform: 'browser',
  },
  {
    entry: { testing: 'src/testing.ts' },
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
    dts: { resolve: true },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    // Neutral platform — testing utilities run in both browser and Node/jsdom.
    platform: 'neutral',
  },
])
