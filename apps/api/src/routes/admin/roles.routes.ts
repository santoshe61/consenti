import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

/** The seeded "full system access" role (see `SEED_ROLES` in seed-data.ts) — every install's
 * break-glass role. Locked against update/delete so it can't be accidentally stripped of
 * permissions or removed, which would leave no one able to manage roles/users. */
const SUPER_ADMIN_ROLE_ID = 'role_super_admin'

export function buildAdminRoleRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /roles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'role:view')
        if (denied) return denied
        const roles = await storage.getRoles('default')
        return json(200, roles)
      }),

    'GET /roles/:id/permissions': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'role:view')
        if (denied) return denied
        const perms = await storage.getPermissionsForRole(p['id'] ?? '')
        return json(200, perms)
      }),

    'POST /roles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'role:create')
        if (denied) return denied
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['name'] !== 'string' || !b['name']) return errorResponse(400, 'name is required')
        const role = await storage.createRole({
          tenantId: 'default',
          name: b['name'],
          ...(typeof b['description'] === 'string' ? { description: b['description'] } : {}),
        })
        await storage.createLog({
          tenantId: 'default',
          userId: actor!.sub,
          action: 'role.created',
          resourceType: 'role',
          resourceId: role.id,
          newData: role,
        })
        return json(201, role)
      }),

    'PUT /roles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'role:update')
        if (denied) return denied
        if (p['id'] === SUPER_ADMIN_ROLE_ID) return errorResponse(403, 'The super_admin role cannot be modified')
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        const role = await storage.updateRole(p['id'] ?? '', {
          ...(typeof b['name'] === 'string' ? { name: b['name'] } : {}),
          ...(typeof b['description'] === 'string' ? { description: b['description'] } : {}),
        })
        await storage.createLog({
          tenantId: 'default',
          userId: actor!.sub,
          action: 'role.updated',
          resourceType: 'role',
          resourceId: role.id,
          newData: role,
        })
        return json(200, role)
      }),

    'DELETE /roles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user: actor, denied } = await auth(req, 'role:delete')
        if (denied) return denied
        if (p['id'] === SUPER_ADMIN_ROLE_ID) return errorResponse(403, 'The super_admin role cannot be deleted')
        await storage.deleteRole(p['id'] ?? '')
        await storage.createLog({
          tenantId: 'default',
          userId: actor!.sub,
          action: 'role.deleted',
          resourceType: 'role',
          ...(p['id'] != null ? { resourceId: p['id'] } : {}),
        })
        return json(200, { success: true })
      }),

    'GET /permissions': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'role:view')
        if (denied) return denied
        const perms = await storage.getAllPermissions()
        return json(200, perms)
      }),

    'POST /roles/:id/permissions': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'role:update')
        if (denied) return denied
        if (p['id'] === SUPER_ADMIN_ROLE_ID) return errorResponse(403, 'The super_admin role cannot be modified')
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['permissionId'] !== 'string') return errorResponse(400, 'permissionId is required')
        await storage.assignPermissionToRole(p['id'] ?? '', b['permissionId'])
        return json(200, { success: true })
      }),

    'DELETE /roles/:id/permissions/:permissionId': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'role:update')
        if (denied) return denied
        if (p['id'] === SUPER_ADMIN_ROLE_ID) return errorResponse(403, 'The super_admin role cannot be modified')
        await storage.revokePermissionFromRole(p['id'] ?? '', p['permissionId'] ?? '')
        return json(200, { success: true })
      }),
  }
}
