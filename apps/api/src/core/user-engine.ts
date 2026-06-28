import type { AdminUser, SafeAdminUser, UpdateUserInput, Role } from '@consenti/types'
import { hashPassword } from '../utils/crypto'
import type { StorageAdapter } from '@consenti/types'

export function safeUser(user: AdminUser): SafeAdminUser {
  const { passwordHash: _p, ...rest } = user
  return rest
}

export async function buildCreateUserInput(
  tenantId: string,
  input: { name: string; email: string; password: string },
): Promise<{ tenantId: string; name: string; email: string; passwordHash: string }> {
  return {
    tenantId,
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
  }
}

export function buildUpdateUserInput(input: {
  name?: string
  email?: string
  isActive?: boolean
  password?: string
}): UpdateUserInput {
  const data: UpdateUserInput = {}
  if (input.name != null) data.name = input.name
  if (input.email != null) data.email = input.email
  if (input.isActive != null) data.isActive = input.isActive
  if (input.password) data.passwordHash = hashPassword(input.password)
  return data
}

export async function resolveUserPermissions(
  userId: string,
  storage: StorageAdapter,
): Promise<string[]> {
  const roles: Role[] = await storage.getUserRoles(userId)
  const permSets = await Promise.all(roles.map(r => storage.getPermissionsForRole(r.id)))
  return [...new Set(permSets.flat().map(p => p.name))]
}
