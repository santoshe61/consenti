import { type ConsentiServerConfig, createConsenti } from '@consenti/api'

type ConsentReturnType = ReturnType<typeof createConsenti>

const g = global as typeof globalThis & {
  _consenti?: ConsentReturnType | null
  _consentiError?: string
}

const config: ConsentiServerConfig = {
  basePath: '/consenti',
  dashboard: true,
  storage: {
    driver: 'json',
    path: 'db/consenti-data.json',
  },
  auth: {
    mode: 'local',
    jwtSecret: process.env.CONSENTI_JWT_SECRET ?? 'consenti-docs-dev-secret-2024',
    adminEmail: 'user@consenti.dev',
    adminPassword: 'Consenti@123',
  },
  compliance: { gdpr: true, ccpa: true, gpc: true },
  rateLimit: { enabled: true, windowMs: 60_000, maxRequests: 120 },
  dataRetention: { purgeAfterDays: 7 },
}

export async function getConsenti(): Promise<ConsentReturnType | null> {
  if (g._consenti !== undefined) return g._consenti
  try {
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
