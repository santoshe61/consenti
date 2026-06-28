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
  return apiKey?.tenantId ?? defaultTenantId
}
