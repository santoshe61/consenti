import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import type { UserService } from '../../services/user.service'

export function buildAdminUserRoutes(
  userService: UserService,
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /users': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'user:view')
        if (denied) return denied
        const users = await userService.list()
        return json(200, users)
      }),

    'GET /users/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'user:view')
        if (denied) return denied
        const user = await userService.get(p['id'] ?? '')
        if (!user) return errorResponse(404, 'User not found')
        const roles = await userService.getRoles(user.id)
        return json(200, { ...user, roles: roles.map(r => ({ id: r.id, name: r.name })) })
      }),

    'POST /users': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'user:create')
        if (denied) return denied
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['name'] !== 'string' || !b['name']) return errorResponse(400, 'name is required')
        if (typeof b['email'] !== 'string' || !b['email']) return errorResponse(400, 'email is required')
        if (typeof b['password'] !== 'string' || !b['password']) return errorResponse(400, 'password is required')
        if (b['password'].length < 12) return errorResponse(400, 'password must be at least 12 characters')
        const created = await userService.create(
          {
            name: b['name'],
            email: b['email'],
            password: b['password'],
            ...(typeof b['roleId'] === 'string' ? { roleId: b['roleId'] } : {}),
            ...(Array.isArray(b['allowedTenants']) ? { allowedTenants: b['allowedTenants'] as string[] } : {}),
          },
          actor!.sub,
        )
        return json(201, created)
      }),

    'PUT /users/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'user:update')
        if (denied) return denied
        const id = p['id'] ?? ''
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['password'] === 'string' && b['password'].length < 12) {
          return errorResponse(400, 'password must be at least 12 characters')
        }
        const updated = await userService.update(
          id,
          {
            ...(typeof b['name'] === 'string' ? { name: b['name'] } : {}),
            ...(typeof b['email'] === 'string' ? { email: b['email'] } : {}),
            ...(b['isActive'] != null ? { isActive: Boolean(b['isActive']) } : {}),
            ...(typeof b['password'] === 'string' ? { password: b['password'] } : {}),
            ...(Array.isArray(b['allowedTenants']) ? { allowedTenants: b['allowedTenants'] as string[] } : {}),
          },
          actor!.sub,
        )
        return json(200, updated)
      }),

    'DELETE /users/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'user:delete')
        if (denied) return denied
        const id = p['id'] ?? ''
        if (id === actor!.sub) return errorResponse(400, 'Cannot delete your own account')
        await userService.delete(id, actor!.sub)
        return json(200, { success: true })
      }),

    'POST /users/:id/roles': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'role:update')
        if (denied) return denied
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['roleId'] !== 'string') return errorResponse(400, 'roleId is required')
        const tenantId = typeof b['tenantId'] === 'string' ? b['tenantId'] : undefined
        await userService.assignRole(p['id'] ?? '', b['roleId'], tenantId)
        await storage.createLog({
          tenantId: 'default',
          userId: actor!.sub,
          action: 'user.role_assigned',
          resourceType: 'user',
          ...(p['id'] != null ? { resourceId: p['id'] } : {}),
          newData: { roleId: b['roleId'] },
        })
        return json(200, { success: true })
      }),

    'DELETE /users/:id/roles/:roleId': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'role:update')
        if (denied) return denied
        const url = new URL(req.url)
        const revokedTenantId = url.searchParams.get('tenantId') ?? undefined
        await userService.revokeRole(p['id'] ?? '', p['roleId'] ?? '', revokedTenantId)
        await storage.createLog({
          tenantId: 'default',
          userId: actor!.sub,
          action: 'user.role_revoked',
          resourceType: 'user',
          ...(p['id'] != null ? { resourceId: p['id'] } : {}),
          oldData: { roleId: p['roleId'] },
        })
        return json(200, { success: true })
      }),
  }
}
