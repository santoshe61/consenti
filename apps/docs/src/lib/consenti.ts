import { type ConsentiServerConfig, createConsenti } from '@consenti/api'
import path from "node:path"

type ConsentReturnType = ReturnType<typeof createConsenti>

const g = global as typeof globalThis & {
  _consenti?: ConsentReturnType | null
  _consentiError?: string
  _consentiReady?: Promise<ConsentReturnType | null>
}

// In development, reset the singleton whenever this module is re-evaluated (Next.js hot reload).
// This ensures branding / config edits take effect without a full server restart.
if (process.env.NODE_ENV !== 'production') {
  g._consenti = undefined
  g._consentiReady = undefined
  g._consentiError = undefined
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
  branding: {
    appName: "Consenti Ji",
    appLogoPath: path.resolve(path.dirname(process.cwd()), "/logo.svg")
  }
}

export async function getConsenti(): Promise<ConsentReturnType | null> {
  // Fast path: already initialized
  if (g._consenti !== undefined) return g._consenti

  // Shared init promise so concurrent cold-start requests don't race
  if (!g._consentiReady) {
    g._consentiReady = (async () => {
      try {
        const instance = createConsenti(config)
        // Wait for storage to connect and the admin user to be bootstrapped —
        // without this, login requests that arrive before connect() resolves get
        // "Invalid credentials" because the users table is still empty.
        await instance.ready
        g._consenti = instance
        return instance
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        g._consenti = null
        g._consentiError = msg
        console.warn('[consenti] Backend unavailable:', msg)
        return null
      }
    })()
  }

  return g._consentiReady
}

export function getConsentiError(): string | undefined {
  return g._consentiError
}
