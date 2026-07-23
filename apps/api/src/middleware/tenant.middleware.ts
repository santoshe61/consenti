import { createHash } from 'node:crypto'
import type { StorageAdapter } from '@consenti/types'

export async function resolveTenant(
  req: Request,
  storage: StorageAdapter,
  defaultTenantId: string,
): Promise<string> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ck_')) return defaultTenantId

  const rawKey = auth.slice(7)
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const apiKey = await storage.getApiKeyByHash(keyHash)
  if (!apiKey || !apiKey.isActive) return defaultTenantId

  if (apiKey.expireBy && new Date(apiKey.expireBy) <= new Date()) {
    // Lazy expiration: no background sweep — the first request (or dashboard list load) to
    // notice an expired key flips it, so it reads correctly from then on.
    await storage.revokeApiKey(apiKey.id).catch(() => {})
    return defaultTenantId
  }

  return apiKey.tenantId
}
