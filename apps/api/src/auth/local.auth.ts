import type { StorageAdapter, AdminUser } from '@consenti/types'
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../utils/crypto'

const LOCKOUT_WINDOW_MS = 15 * 60_000
const MAX_FAILED_ATTEMPTS = 5

export class LocalAuth {
  private loginAttempts = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private storage: StorageAdapter,
    private secret: string,
  ) {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.loginAttempts) {
        if (now >= entry.resetAt) this.loginAttempts.delete(key)
      }
    }, LOCKOUT_WINDOW_MS).unref()
  }

  async bootstrap(email: string, password: string): Promise<AdminUser | null> {
    const count = await this.storage.countUsers('default')
    if (count > 0) return null
    if (password.length < 12) {
      throw new Error('[Consenti] bootstrap: admin password must be at least 12 characters')
    }
    if (password.length < 16) {
      console.warn('[Consenti] bootstrap: admin password is shorter than 16 characters — consider using a longer password')
    }
    const passwordHash = hashPassword(password)
    const user = await this.storage.createUser({
      tenantId: 'default',
      name: 'Admin',
      email,
      passwordHash,
    })
    await this.storage.assignRole(user.id, 'role_super_admin')
    return user
  }

  async login(email: string, password: string): Promise<string | null> {
    const now = Date.now()
    const attempts = this.loginAttempts.get(email)
    if (attempts && now < attempts.resetAt && attempts.count >= MAX_FAILED_ATTEMPTS) return null

    const user = await this.storage.getUserByEmail(email)
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      const entry = this.loginAttempts.get(email)
      if (!entry || now >= entry.resetAt) {
        this.loginAttempts.set(email, { count: 1, resetAt: now + LOCKOUT_WINDOW_MS })
      } else {
        entry.count += 1
      }
      return null
    }

    this.loginAttempts.delete(email)
    const roles = await this.storage.getUserRoles(user.id)
    const permSets = await Promise.all(roles.map(r => this.storage.getPermissionsForRole(r.id)))
    const permissions = [...new Set(permSets.flat().map(p => p.name))]
    return signJwt(
      { sub: user.id, email: user.email, roles: roles.map(r => r.name), permissions },
      this.secret,
    )
  }

  signToken(payload: { sub: string; email: string; roles: string[]; permissions: string[] }): string {
    return signJwt(payload, this.secret)
  }

  verify(token: string): Record<string, unknown> | null {
    return verifyJwt(token, this.secret)
  }

  async getUser(token: string): Promise<AdminUser | null> {
    const payload = this.verify(token)
    if (!payload) return null
    const id = payload['sub']
    if (typeof id !== 'string') return null
    return this.storage.getUserById(id)
  }
}
