import type { SafeAdminUser, AdminUser, UpdateUserInput } from '@consenti/types'
import { hashPassword } from '../utils/crypto'
import type { UserRepo } from '../repositories/user.repo'
import type { AuditRepo } from '../repositories/audit.repo'

export class UserService {
  constructor(
    private users: UserRepo,
    private audit: AuditRepo,
    private tenantId: string = 'default',
  ) {}

  private safe(user: AdminUser): SafeAdminUser {
    const { passwordHash: _p, ...rest } = user
    return rest
  }

  async create(
    input: { name: string; email: string; password: string; roleId?: string; allowedTenants?: string[] },
    actorId?: string,
  ): Promise<SafeAdminUser> {
    const user = await this.users.create({
      tenantId: this.tenantId,
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
      ...(input.allowedTenants ? { allowedTenants: input.allowedTenants } : {}),
    })
    if (input.roleId) await this.users.assignRole(user.id, input.roleId)
    await this.audit.log({
      tenantId: this.tenantId,
      ...(actorId != null ? { userId: actorId } : {}),
      action: 'user.created',
      resourceType: 'user',
      resourceId: user.id,
      newData: this.safe(user),
    })
    return this.safe(user)
  }

  async update(
    id: string,
    input: { name?: string; email?: string; isActive?: boolean; password?: string; allowedTenants?: string[] },
    actorId?: string,
  ): Promise<SafeAdminUser> {
    const existing = await this.users.getById(id)
    if (!existing) throw new Error(`User ${id} not found`)
    const data: UpdateUserInput = {}
    if (input.name != null) data.name = input.name
    if (input.email != null) data.email = input.email
    if (input.isActive != null) data.isActive = input.isActive
    if (input.password) data.passwordHash = hashPassword(input.password)
    if (input.allowedTenants != null) data.allowedTenants = input.allowedTenants
    const updated = await this.users.update(id, data)
    await this.audit.log({
      tenantId: this.tenantId,
      ...(actorId != null ? { userId: actorId } : {}),
      action: 'user.updated',
      resourceType: 'user',
      resourceId: id,
      oldData: this.safe(existing),
      newData: this.safe(updated),
    })
    return this.safe(updated)
  }

  async delete(id: string, actorId?: string): Promise<void> {
    const existing = await this.users.getById(id)
    await this.users.delete(id)
    await this.audit.log({
      tenantId: this.tenantId,
      ...(actorId != null ? { userId: actorId } : {}),
      action: 'user.deleted',
      resourceType: 'user',
      resourceId: id,
      ...(existing != null ? { oldData: this.safe(existing) } : {}),
    })
  }

  async get(id: string): Promise<SafeAdminUser | null> {
    const user = await this.users.getById(id)
    return user ? this.safe(user) : null
  }

  async list(): Promise<SafeAdminUser[]> {
    const users = await this.users.list(this.tenantId)
    return users.map(u => this.safe(u))
  }

  getRoles(userId: string, tenantId?: string) { return this.users.getRoles(userId, tenantId) }
  assignRole(userId: string, roleId: string, tenantId?: string) { return this.users.assignRole(userId, roleId, tenantId) }
  revokeRole(userId: string, roleId: string, tenantId?: string) { return this.users.revokeRole(userId, roleId, tenantId) }
}
