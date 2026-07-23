import { randomBytes, createHash } from 'node:crypto'
import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

function generateApiKey(): { raw: string; hash: string } {
  const raw = `ck_live_${randomBytes(12).toString('hex')}${randomBytes(12).toString('hex')}}`
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
        const now = new Date()
        const result = await Promise.all(keys.map(async k => {
          // Lazy expiration: no background sweep — a key someone actually views here self-heals
          // to accurate status, same idea as the real auth path in tenant.middleware.ts.
          const expired = k.isActive && !!k.expireBy && new Date(k.expireBy) <= now
          if (expired) await storage.revokeApiKey(k.id).catch(() => { })
          return {
            id: k.id, name: k.name, isActive: expired ? false : k.isActive,
            createdAt: k.createdAt, updatedAt: k.updatedAt,
            ...(k.createdBy !== undefined ? { createdBy: k.createdBy } : {}),
            ...(k.expireBy !== undefined ? { expireBy: k.expireBy } : {}),
          }
        }))
        return json(200, result)
      }),

    'POST /apikeys': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req)
        if (denied) return denied
        const body = await req.json() as { name?: string; tenantId?: string; expireBy?: string }
        if (!body.name) return json(400, { error: 'name is required' })
        if (body.expireBy !== undefined && Number.isNaN(new Date(body.expireBy).getTime())) {
          return json(400, { error: 'expireBy must be a valid date' })
        }
        const { raw, hash } = generateApiKey()
        const created = await storage.createApiKey({
          tenantId: body.tenantId ?? 'default',
          name: body.name,
          keyHash: hash,
          ...(user ? { createdBy: user.sub } : {}),
          ...(body.expireBy !== undefined ? { expireBy: body.expireBy } : {}),
        })
        return json(201, { id: created.id, name: created.name, key: raw, createdAt: created.createdAt })
      }),

    'DELETE /apikeys/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        await storage.revokeApiKey(p['id'] ?? '')
        // 204 forbids a body — the JSON.stringify(null) `json()` would normally send trips
        // the Response constructor's null-body-status check ("Invalid response status code 204").
        return new Response(null, { status: 204 })
      }),

    // Re-enables a previously revoked key — same hash, no new secret to distribute. Distinct
    // from creating a new key: whatever system already has the old raw secret saved starts
    // working again immediately.
    'POST /apikeys/:id/reactivate': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        await storage.reactivateApiKey(p['id'] ?? '')
        return new Response(null, { status: 204 })
      }),

    // Permanently removes the row — unlike DELETE /apikeys/:id (revoke), this cannot be undone.
    'DELETE /apikeys/:id/permanent': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        await storage.deleteApiKey(p['id'] ?? '')
        return new Response(null, { status: 204 })
      }),
  }
}
