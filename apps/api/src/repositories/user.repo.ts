import type {
  StorageAdapter,
  AdminUser,
  CreateUserInput,
  UpdateUserInput,
  Role,
} from '@consenti/types'

export class UserRepo {
  constructor(private adapter: StorageAdapter) {}

  getById(id: string): Promise<AdminUser | null> { return this.adapter.getUserById(id) }
  getByEmail(email: string): Promise<AdminUser | null> { return this.adapter.getUserByEmail(email) }
  list(tenantId: string): Promise<AdminUser[]> { return this.adapter.getUsers(tenantId) }
  create(data: CreateUserInput): Promise<AdminUser> { return this.adapter.createUser(data) }
  update(id: string, data: UpdateUserInput): Promise<AdminUser> { return this.adapter.updateUser(id, data) }
  delete(id: string): Promise<void> { return this.adapter.deleteUser(id) }
  getRoles(userId: string, tenantId?: string): Promise<Role[]> { return this.adapter.getUserRoles(userId, tenantId) }
  assignRole(userId: string, roleId: string, tenantId?: string): Promise<void> { return this.adapter.assignRole(userId, roleId, tenantId) }
  revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> { return this.adapter.revokeRole(userId, roleId, tenantId) }
}
