import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// When running `dev:dashboard`, proxy API/admin calls to the backend server.
// Defaults to the standalone dev-server (localhost:3001).
// Set CONSENTI_API_URL=http://localhost:3000 to proxy to the Next.js demo instead.
const BACKEND = process.env['CONSENTI_API_URL'] ?? 'http://localhost:3001'

export default defineConfig(({ command }) => ({
  root: __dirname,
  plugins: [preact()],
  // Inline PostCSS config with absolute path to tailwind.config.js so Tailwind
  // finds it regardless of the process cwd (which is apps/api, not src/dashboard).
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: join(__dirname, 'tailwind.config.js') }),
        autoprefixer(),
      ],
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
