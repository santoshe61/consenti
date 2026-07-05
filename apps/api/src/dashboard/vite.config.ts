import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Resolve @consenti/ui workspace root to reach source files not exposed by its
// "exports" field. The relative path works because this is a monorepo.
const uiRoot = join(__dirname, '../../../ui')

// When running `dev:dashboard`, proxy API/admin calls to the backend server.
// Defaults to the standalone dev-server (localhost:3001).
// Set CONSENTI_API_URL=http://localhost:3000 to proxy to the Next.js demo instead.
const BACKEND = process.env['CONSENTI_API_URL'] ?? 'http://localhost:3001'

export default defineConfig(({ command }) => ({
  root: __dirname,
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      // Allow internal imports from @consenti/ui source that aren't exposed via
      // the package "exports" field (e.g. src/styles/consenti-css.ts).
      '@consenti/ui/src': join(uiRoot, 'src'),
    },
  },
  build: {
    outDir: join(__dirname, '../../dist/dashboard'),
    emptyOutDir: true,
  },
  // In build mode the SPA is served from /consenti/ inside the demo.
  // In dev mode use / so the dashboard is simply at localhost:<port>/.
  base: command === 'build' ? '/consenti/' : '/',
  server: {
    proxy: {
      '/consenti/admin': { target: BACKEND, changeOrigin: true },
      '/consenti/api': { target: BACKEND, changeOrigin: true },
    },
  },
}))
