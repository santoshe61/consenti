import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Serve from dev/ so index.html lives there, keeping it out of src/
  root: 'dev',

  resolve: {
    alias: {
      // @consenti/types ships only .d.ts — point Vite at the TS source directly
      '@consenti/types': fileURLToPath(new URL('../../packages/types/src/index.ts', import.meta.url)),
    },
  },

  server: {
    port: 5174,
    open: true,
  },

  // scss is already in devDependencies; Vite picks it up automatically
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
})
