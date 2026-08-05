import { defineConfig } from 'tsup'

// `@consenti/browser-engine` and `@consenti/utils` are private, unpublished workspace packages
// (see their own package.json) — bundling them here is what makes `@consenti/scanner` runnable
// via `npx` outside this monorepo. `playwright` stays external: it ships native browser
// binaries via its own postinstall step, so bundling its JS wouldn't help and would still
// require `npx playwright install chromium` (surfaced here as the `install-browsers` script)
// on the consumer's machine regardless.
//
// `src/cli.ts` carries its own literal `#!/usr/bin/env node` first line — esbuild (tsup's
// bundler) preserves a source shebang as-is, so no separate banner config is needed here.
export default defineConfig([
  {
    entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
    format: ['esm'],
    dts: { resolve: true },
    sourcemap: true,
    minify: false,
    target: 'es2020',
    platform: 'node',
    external: ['playwright'],
  },
])
