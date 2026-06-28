import { randomBytes, createHash } from 'node:crypto'
import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

function generateApiKey(): { raw: string; hash: string } {
  const raw = `ck_live_${randomBytes(24).toString('hex')}`
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

export function buildAdminApiKeyRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, 'settings:update') }
  }

  return {
    'GET /apikeys': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const keys = await storage.getApiKeys('default')
        return json(200, keys.map(k => ({ id: k.id, name: k.name, isActive: k.isActive, createdAt: k.createdAt })))
      }),

    'POST /apikeys': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const body = await req.json() as { name?: string; tenantId?: string }
        if (!body.name) return json(400, { error: 'name is required' })
        const { raw, hash } = generateApiKey()
        const created = await storage.createApiKey({ tenantId: body.tenantId ?? 'default', name: body.name, keyHash: hash })
        return json(201, { id: created.id, name: created.name, key: raw, createdAt: created.createdAt })
      }),

    'DELETE /apikeys/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        await storage.revokeApiKey(p['id'] ?? '')
        return json(204, null)
      }),
  }
}
