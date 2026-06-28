import { join } from 'node:path'
import type { ConsentiServerConfig } from '@consenti/api'

type ConsentiInstance = ReturnType<typeof import('@consenti/api').createConsenti>

const g = global as typeof globalThis & {
  _consenti?: ConsentiInstance | null
  _consentiError?: string
}

const config: ConsentiServerConfig = {
  basePath: "/consenti",
  dashboard: true,
  storage: {
    driver: "json",
    path: 'db/consenti-data.json'
  },
  compliance: { gdpr: true, ccpa: true, gpc: true },
  rateLimit: { enabled: true, windowMs: 60_000, maxRequests: 120 },
}

export async function getConsenti(): Promise<ConsentiInstance | null> {
  if (g._consenti !== undefined) return g._consenti
  try {
    const { createConsenti } = await import('@consenti/api')
    g._consenti = createConsenti(config)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    g._consenti = null
    g._consentiError = msg
    console.warn('[consenti] Backend unavailable:', msg)
  }
  return g._consenti ?? null
}

export function getConsentiError(): string | undefined {
  return g._consentiError
}
