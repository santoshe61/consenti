import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'
import type {
  StorageAdapter,
  StorageConfig,
  Profile,
  ProfileConfig,
  CreateProfileInput,
  UpdateProfileInput,
  ConsentDbRecord,
  ConsentHistoryEntry,
  ConsentValue,
  CreateConsentInput,
  UpdateConsentInput,
  ConsentFilters,
  Visitor,
  VisitorFilters,
  CreateVisitorInput,
  UpdateVisitorInput,
  AdminUser,
  CreateUserInput,
  UpdateUserInput,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  Permission,
  AuditLog,
  AuditFilters,
  CreateAuditLogInput,
  OverviewStats,
  CategoryStats,
  TimelineEntry,
  CountryStat,
  GpcStats,
  Tenant,
  ApiKey,
  CreateApiKeyInput,
  CreateTenantInput,
  UpdateTenantInput,
  ServerCookieTemplate,
  ServerUITemplate,
  CreateCookieTemplateInput,
  UpdateCookieTemplateInput,
  CreateUITemplateInput,
  UpdateUITemplateInput,
} from '@consenti/types'
import {
  SEED_TENANT,
  SEED_PERMISSIONS,
  SEED_ROLES,
  SEED_ROLE_PERMISSIONS,
} from '../seed-data'

const MAX_PAGE_SIZE = 500

interface UserRole { userId: string; roleId: string; tenantId: string }
interface RolePermission { roleId: string; permissionId: string }

interface JsonDb {
  _version: number
  tenants: Tenant[]
  profiles: Profile[]
  consents: ConsentDbRecord[]
  consent_history: ConsentHistoryEntry[]
  visitors: Visitor[]
  users: AdminUser[]
  roles: Role[]
  permissions: Permission[]
  user_roles: UserRole[]
  role_permissions: RolePermission[]
  audit_logs: AuditLog[]
  cookie_templates: ServerCookieTemplate[]
  ui_templates: ServerUITemplate[]
  api_keys: ApiKey[]
}

function emptyDb(): JsonDb {
  return {
    _version: 1,
    tenants: [],
    profiles: [],
    consents: [],
    consent_history: [],
    visitors: [],
    users: [],
    roles: [],
    permissions: [],
    user_roles: [],
    role_permissions: [],
    audit_logs: [],
    cookie_templates: [],
    ui_templates: [],
    api_keys: [],
  }
}

function randomProfileId(): string {
  return `prof_${randomUUID().replace(/-/g, '')}`
}

function page<T>(arr: T[], pageNum: number, limit: number): T[] {
  const l = Math.min(limit, MAX_PAGE_SIZE)
  const offset = (pageNum - 1) * l
  return arr.slice(offset, offset + l)
}

export class JsonFileAdapter implements StorageAdapter {
  private db: JsonDb = emptyDb()
  private filePath: string
  // Steno-equivalent: serialised writes via promise chain.
  // Old settled promises are GC'd on reassignment — no memory leak.
  private writeQueue: Promise<void> = Promise.resolve()

  constructor(private config: StorageConfig) {
    this.filePath = config.path ?? './consenti-data.json'
  }

  private scheduleWrite(): void {
    this.writeQueue = this.writeQueue
      .then(async () => {
        await mkdir(dirname(this.filePath), { recursive: true })
        const tmp = `${this.filePath}.tmp`
        await writeFile(tmp, JSON.stringify(this.db), 'utf8')
        await rename(tmp, this.filePath)
      })
      .catch((err: unknown) => { console.warn('[Consenti] JSON store write failed:', err) })
  }

  async connect(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8')
      this.db = JSON.parse(raw) as JsonDb
    } catch {
      this.db = emptyDb()
    }
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    await this.writeQueue
  }

  async migrate(): Promise<void> {
    this.seed()
  }

  private seed(): void {
    const now = new Date().toISOString()
    const { id, name, slug } = SEED_TENANT
    if (!this.db.tenants.find(t => t.id === id)) {
      this.db.tenants.push({ id, name, slug, createdAt: now, updatedAt: now })
    }
    for (const p of SEED_PERMISSIONS) {
      if (!this.db.permissions.find(x => x.id === p.id)) {
        this.db.permissions.push({ id: p.id, name: p.name, description: p.description })
      }
    }
    for (const r of SEED_ROLES) {
      if (!this.db.roles.find(x => x.id === r.id)) {
        this.db.roles.push({ id: r.id, tenantId: r.tenantId, name: r.name, description: r.description })
      }
    }
    for (const rp of SEED_ROLE_PERMISSIONS) {
      if (!this.db.role_permissions.find(x => x.roleId === rp.roleId && x.permissionId === rp.permissionId)) {
        this.db.role_permissions.push(rp)
      }
    }
    this.scheduleWrite()
  }

  // ── Profiles ──────────────────────────────────────────────────────────────

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const now = new Date().toISOString()
    const profile: Profile = {
      id: randomProfileId(),
      tenantId: data.tenantId,
      name: data.name,
      defaultLocale: data.defaultLocale,
      version: 1,
      profileJson: data.profileJson as ProfileConfig,
      createdAt: now,
      updatedAt: now,
    }
    this.db.profiles.push(profile)
    this.scheduleWrite()
    return profile
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const idx = this.db.profiles.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Profile ${id} not found`)
    const existing = this.db.profiles[idx]!
    const updated: Profile = {
      ...existing,
      ...(data.name != null && { name: data.name }),
      ...(data.defaultLocale != null && { defaultLocale: data.defaultLocale }),
      ...(data.profileJson != null && { profileJson: data.profileJson as ProfileConfig }),
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    }
    this.db.profiles[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteProfile(id: string): Promise<void> {
    this.db.profiles = this.db.profiles.filter(p => p.id !== id)
    this.scheduleWrite()
  }

  async getProfile(id: string): Promise<Profile | null> {
    return this.db.profiles.find(p => p.id === id) ?? null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    return this.db.profiles.filter(p => p.tenantId === tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  // ── Consents ──────────────────────────────────────────────────────────────

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const now = new Date().toISOString()
    const id = randomUUID()
    const record: ConsentDbRecord = {
      id,
      tenantId: data.tenantId,
      visitorId: data.visitorId,
      profileId: data.profileId,
      profileVersion: data.profileVersion,
      locale: data.locale,
      consentJson: data.consentJson as ConsentValue,
      gpcDetected: data.gpcDetected ?? false,
      source: data.source as ConsentDbRecord['source'],
      createdAt: now,
      updatedAt: now,
    }
    this.db.consents.push(record)
    this.db.consent_history.push({
      id: randomUUID(),
      tenantId: data.tenantId,
      consentRecordId: id,
      visitorId: data.visitorId,
      oldJson: null,
      newJson: data.consentJson as ConsentValue,
      action: 'created',
      createdAt: now,
    })
    this.scheduleWrite()
    return record
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const idx = this.db.consents.findIndex(c => c.visitorId === visitorId)
    if (idx === -1) throw new Error(`Consent for visitor ${visitorId} not found`)
    const existing = this.db.consents[idx]!
    const now = new Date().toISOString()
    const updated: ConsentDbRecord = {
      ...existing,
      consentJson: data.consentJson as ConsentValue,
      ...(data.locale != null && { locale: data.locale }),
      ...(data.gpcDetected != null && { gpcDetected: data.gpcDetected }),
      updatedAt: now,
    }
    this.db.consents[idx] = updated
    this.db.consent_history.push({
      id: randomUUID(),
      tenantId: existing.tenantId,
      consentRecordId: existing.id,
      visitorId,
      oldJson: existing.consentJson,
      newJson: data.consentJson as ConsentValue,
      action: 'updated',
      createdAt: now,
    })
    this.scheduleWrite()
    return updated
  }

  async deleteConsent(visitorId: string): Promise<void> {
    this.db.consent_history = this.db.consent_history.filter(h => h.visitorId !== visitorId)
    this.db.consents = this.db.consents.filter(c => c.visitorId !== visitorId)
    this.scheduleWrite()
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    return this.db.consents.find(c => c.visitorId === visitorId) ?? null
  }

  async getConsents(filters: ConsentFilters): Promise<ConsentDbRecord[]> {
    let rows = this.db.consents.filter(c => c.tenantId === filters.tenantId)
    if (filters.profileId) rows = rows.filter(c => c.profileId === filters.profileId)
    if (filters.from) rows = rows.filter(c => c.createdAt >= filters.from!)
    if (filters.to) rows = rows.filter(c => c.createdAt <= filters.to!)
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return page(rows, filters.page ?? 1, filters.limit ?? 50)
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    for (const c of this.db.consents.filter(c => c.tenantId === filters.tenantId)) yield c
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    return this.db.consent_history
      .filter(h => h.visitorId === visitorId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  // ── Visitors ──────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const now = new Date().toISOString()
    const visitor: Visitor = {
      id: randomUUID(),
      tenantId: data.tenantId,
      visitorId: data.visitorId,
      firstSeen: now,
      lastSeen: now,
      ...(data.country != null && { country: data.country }),
      ...(data.region != null && { region: data.region }),
      ...(data.city != null && { city: data.city }),
      ...(data.ipHash != null && { ipHash: data.ipHash }),
      ...(data.userAgentHash != null && { userAgentHash: data.userAgentHash }),
    }
    this.db.visitors.push(visitor)
    this.scheduleWrite()
    return visitor
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const idx = this.db.visitors.findIndex(v => v.visitorId === visitorId)
    if (idx === -1) throw new Error(`Visitor ${visitorId} not found`)
    const existing = this.db.visitors[idx]!
    const updated: Visitor = {
      ...existing,
      lastSeen: data.lastSeen ?? new Date().toISOString(),
      ...(data.country != null && { country: data.country }),
      ...(data.region != null && { region: data.region }),
      ...(data.city != null && { city: data.city }),
    }
    this.db.visitors[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    this.db.visitors = this.db.visitors.filter(v => v.visitorId !== visitorId)
    this.scheduleWrite()
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    return this.db.visitors.find(v => v.visitorId === visitorId) ?? null
  }

  async getVisitors(filters: VisitorFilters): Promise<Visitor[]> {
    let rows = this.db.visitors.filter(v => v.tenantId === filters.tenantId)
    if (filters.from) rows = rows.filter(v => v.firstSeen >= filters.from!)
    if (filters.to) rows = rows.filter(v => v.firstSeen <= filters.to!)
    rows.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    return page(rows, filters.page ?? 1, filters.limit ?? 50)
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const now = new Date().toISOString()
    const user: AdminUser = {
      id: randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    this.db.users.push(user)
    this.scheduleWrite()
    return user
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const idx = this.db.users.findIndex(u => u.id === id)
    if (idx === -1) throw new Error(`User ${id} not found`)
    const existing = this.db.users[idx]!
    const updated: AdminUser = {
      ...existing,
      ...(data.name != null && { name: data.name }),
      ...(data.email != null && { email: data.email }),
      ...(data.passwordHash != null && { passwordHash: data.passwordHash }),
      ...(data.isActive != null && { isActive: data.isActive }),
      ...('totpSecret' in data && data.totpSecret != null && { totpSecret: data.totpSecret }),
      ...(data.totpEnabled != null && { totpEnabled: data.totpEnabled }),
      updatedAt: new Date().toISOString(),
    }
    this.db.users[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteUser(id: string): Promise<void> {
    this.db.user_roles = this.db.user_roles.filter(ur => ur.userId !== id)
    this.db.users = this.db.users.filter(u => u.id !== id)
    this.scheduleWrite()
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    return this.db.users.find(u => u.id === id) ?? null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    return this.db.users.find(u => u.email === email) ?? null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    return this.db.users.filter(u => u.tenantId === tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async countUsers(tenantId?: string): Promise<number> {
    return tenantId
      ? this.db.users.filter(u => u.tenantId === tenantId).length
      : this.db.users.length
  }

  // ── Roles & Permissions ────────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    return this.db.roles.filter(r => r.tenantId === tenantId)
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const role: Role = {
      id: randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      ...(data.description != null && { description: data.description }),
    }
    this.db.roles.push(role)
    this.scheduleWrite()
    return role
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const idx = this.db.roles.findIndex(r => r.id === id)
    if (idx === -1) throw new Error(`Role ${id} not found`)
    const updated: Role = {
      ...this.db.roles[idx]!,
      ...(data.name != null && { name: data.name }),
      ...(data.description != null && { description: data.description }),
    }
    this.db.roles[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteRole(id: string): Promise<void> {
    this.db.role_permissions = this.db.role_permissions.filter(rp => rp.roleId !== id)
    this.db.user_roles = this.db.user_roles.filter(ur => ur.roleId !== id)
    this.db.roles = this.db.roles.filter(r => r.id !== id)
    this.scheduleWrite()
  }

  async getAllPermissions(): Promise<Permission[]> {
    return [...this.db.permissions].sort((a, b) => a.name.localeCompare(b.name))
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const permIds = new Set(
      this.db.role_permissions.filter(rp => rp.roleId === roleId).map(rp => rp.permissionId)
    )
    return this.db.permissions.filter(p => permIds.has(p.id))
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    let urs = this.db.user_roles.filter(ur => ur.userId === userId)
    if (tenantId) urs = urs.filter(ur => ur.tenantId === tenantId)
    const roleIds = new Set(urs.map(ur => ur.roleId))
    return this.db.roles.filter(r => roleIds.has(r.id))
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    if (!this.db.user_roles.find(ur => ur.userId === userId && ur.roleId === roleId && ur.tenantId === tenantId)) {
      this.db.user_roles.push({ userId, roleId, tenantId })
      this.scheduleWrite()
    }
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    this.db.user_roles = this.db.user_roles.filter(ur =>
      !(ur.userId === userId && ur.roleId === roleId && (tenantId == null || ur.tenantId === tenantId))
    )
    this.scheduleWrite()
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    if (!this.db.role_permissions.find(rp => rp.roleId === roleId && rp.permissionId === permissionId)) {
      this.db.role_permissions.push({ roleId, permissionId })
      this.scheduleWrite()
    }
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    this.db.role_permissions = this.db.role_permissions.filter(
      rp => !(rp.roleId === roleId && rp.permissionId === permissionId)
    )
    this.scheduleWrite()
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    const log: AuditLog = {
      id: randomUUID(),
      tenantId: data.tenantId,
      action: data.action,
      resourceType: data.resourceType,
      createdAt: new Date().toISOString(),
      ...(data.userId != null && { userId: data.userId }),
      ...(data.resourceId != null && { resourceId: data.resourceId }),
      ...(data.oldData != null && { oldData: data.oldData }),
      ...(data.newData != null && { newData: data.newData }),
    }
    this.db.audit_logs.push(log)
    this.scheduleWrite()
  }

  async getLogs(filters: AuditFilters): Promise<AuditLog[]> {
    let rows = this.db.audit_logs.filter(l => l.tenantId === filters.tenantId)
    if (filters.action) rows = rows.filter(l => l.action === filters.action)
    if (filters.resourceType) rows = rows.filter(l => l.resourceType === filters.resourceType)
    if (filters.from) rows = rows.filter(l => l.createdAt >= filters.from!)
    if (filters.to) rows = rows.filter(l => l.createdAt <= filters.to!)
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return page(rows, filters.page ?? 1, filters.limit ?? 50)
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    let rows = this.db.audit_logs.filter(l => l.tenantId === filters.tenantId)
    if (filters.action) rows = rows.filter(l => l.action === filters.action)
    if (filters.from) rows = rows.filter(l => l.createdAt >= filters.from!)
    if (filters.to) rows = rows.filter(l => l.createdAt <= filters.to!)
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    for (const log of rows) yield log
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const consents = this.db.consents.filter(c => c.tenantId === tenantId)
    const recent = consents.slice(-500)
    let accepted = 0, rejected = 0
    for (const c of recent) {
      const vals = Object.values(c.consentJson)
      const grantedPct = vals.length > 0 ? vals.filter(v => v === 'granted').length / vals.length : 0
      if (grantedPct >= 0.8) accepted++
      else if (grantedPct <= 0.2) rejected++
    }
    const sample = recent.length || 1
    return {
      totalConsents: consents.length,
      gpcDetectedCount: consents.filter(c => c.gpcDetected).length,
      totalVisitors: this.db.visitors.filter(v => v.tenantId === tenantId).length,
      acceptedPct: Math.round((accepted / sample) * 100),
      rejectedPct: Math.round((rejected / sample) * 100),
    }
  }

  async getCategoryStats(tenantId: string): Promise<CategoryStats> {
    const stats: CategoryStats = {}
    for (const c of this.db.consents.filter(c => c.tenantId === tenantId).slice(0, 5000)) {
      for (const [key, status] of Object.entries(c.consentJson)) {
        if (!stats[key]) stats[key] = { granted: 0, denied: 0, objected: 0 }
        if (status === 'granted') stats[key]!.granted++
        else if (status === 'denied') stats[key]!.denied++
        else if (status === 'objected') stats[key]!.objected++
      }
    }
    return stats
  }

  async getTimeline(tenantId: string, days = 30): Promise<TimelineEntry[]> {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
    const counts = new Map<string, number>()
    for (const c of this.db.consents.filter(c => c.tenantId === tenantId && c.createdAt.slice(0, 10) >= cutoff)) {
      const date = c.createdAt.slice(0, 10)
      counts.set(date, (counts.get(date) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
  }

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const consentVisitors = new Set(
      this.db.consents.filter(c => c.tenantId === tenantId).map(c => c.visitorId)
    )
    const counts = new Map<string, number>()
    for (const v of this.db.visitors.filter(v => consentVisitors.has(v.visitorId) && v.country)) {
      const c = v.country!
      counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([country, count]) => ({ country, count }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const consents = this.db.consents.filter(c => c.tenantId === tenantId)
    const detected = consents.filter(c => c.gpcDetected).length
    const total = consents.length
    return { detected, total, rate: total > 0 ? Math.round((detected / total) * 100) : 0 }
  }

  // ── Tenants ────────────────────────────────────────────────────────────────

  async getTenants(): Promise<Tenant[]> {
    return [...this.db.tenants].sort((a, b) => a.name.localeCompare(b.name))
  }

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    const now = new Date().toISOString()
    const tenant: Tenant = { id: randomUUID(), name: data.name, slug: data.slug, createdAt: now, updatedAt: now }
    this.db.tenants.push(tenant)
    this.scheduleWrite()
    return tenant
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const idx = this.db.tenants.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tenant ${id} not found`)
    const now = new Date().toISOString()
    const updated: Tenant = {
      ...this.db.tenants[idx]!,
      ...(data.name != null && { name: data.name }),
      ...(data.slug != null && { slug: data.slug }),
      updatedAt: now,
    }
    this.db.tenants[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteTenant(id: string): Promise<void> {
    this.db.tenants = this.db.tenants.filter(t => t.id !== id)
    this.scheduleWrite()
  }

  async purgeExpiredConsents(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const toDelete = new Set(
      this.db.consents.filter(c => c.createdAt < cutoff).map(c => c.visitorId)
    )
    if (toDelete.size === 0) return 0
    this.db.consent_history = this.db.consent_history.filter(h => !toDelete.has(h.visitorId))
    this.db.consents = this.db.consents.filter(c => !toDelete.has(c.visitorId))
    this.scheduleWrite()
    return toDelete.size
  }

  // ── API Keys ───────────────────────────────────────────────────────────────

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const key: ApiKey = {
      id: randomUUID(),
      tenantId: data.tenantId,
      keyHash: data.keyHash,
      name: data.name,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    this.db.api_keys.push(key)
    this.scheduleWrite()
    return key
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    return this.db.api_keys.find(k => k.keyHash === keyHash && k.isActive) ?? null
  }

  async revokeApiKey(id: string): Promise<void> {
    const key = this.db.api_keys.find(k => k.id === id)
    if (key) { key.isActive = false; this.scheduleWrite() }
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    return this.db.api_keys
      .filter(k => k.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ── Cookie Templates ───────────────────────────────────────────────────────

  async createCookieTemplate(data: CreateCookieTemplateInput): Promise<ServerCookieTemplate> {
    const now = new Date().toISOString()
    const tpl: ServerCookieTemplate = {
      id: randomUUID(), tenantId: data.tenantId, name: data.name,
      cookies: data.cookies, createdAt: now, updatedAt: now,
    }
    this.db.cookie_templates.push(tpl)
    this.scheduleWrite()
    return tpl
  }

  async updateCookieTemplate(id: string, data: UpdateCookieTemplateInput): Promise<ServerCookieTemplate> {
    const idx = this.db.cookie_templates.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Cookie template not found')
    const now = new Date().toISOString()
    const updated: ServerCookieTemplate = {
      ...this.db.cookie_templates[idx]!,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.cookies !== undefined && { cookies: data.cookies }),
      updatedAt: now,
    }
    this.db.cookie_templates[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteCookieTemplate(id: string): Promise<void> {
    this.db.cookie_templates = this.db.cookie_templates.filter(t => t.id !== id)
    this.scheduleWrite()
  }

  async getCookieTemplate(id: string): Promise<ServerCookieTemplate | null> {
    return this.db.cookie_templates.find(t => t.id === id) ?? null
  }

  async getCookieTemplates(tenantId: string): Promise<ServerCookieTemplate[]> {
    return this.db.cookie_templates
      .filter(t => t.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async copyCookieTemplate(id: string, newName: string): Promise<ServerCookieTemplate> {
    const src = await this.getCookieTemplate(id)
    if (!src) throw new Error('Cookie template not found')
    return this.createCookieTemplate({ tenantId: src.tenantId, name: newName, cookies: src.cookies })
  }

  // ── UI Templates ───────────────────────────────────────────────────────────

  async createUITemplate(data: CreateUITemplateInput): Promise<ServerUITemplate> {
    const now = new Date().toISOString()
    const { tenantId, name, ...settings } = data
    const tpl = { id: randomUUID(), tenantId, name, ...settings, createdAt: now, updatedAt: now } as ServerUITemplate
    this.db.ui_templates.push(tpl)
    this.scheduleWrite()
    return tpl
  }

  async updateUITemplate(id: string, data: UpdateUITemplateInput): Promise<ServerUITemplate> {
    const idx = this.db.ui_templates.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('UI template not found')
    const { name: _name, ...settings } = data
    const now = new Date().toISOString()
    const updated = {
      ...this.db.ui_templates[idx]!,
      ...(data.name !== undefined && { name: data.name }),
      ...settings,
      updatedAt: now,
    } as ServerUITemplate
    this.db.ui_templates[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteUITemplate(id: string): Promise<void> {
    this.db.ui_templates = this.db.ui_templates.filter(t => t.id !== id)
    this.scheduleWrite()
  }

  async getUITemplate(id: string): Promise<ServerUITemplate | null> {
    return this.db.ui_templates.find(t => t.id === id) ?? null
  }

  async getUITemplates(tenantId: string): Promise<ServerUITemplate[]> {
    return this.db.ui_templates
      .filter(t => t.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async copyUITemplate(id: string, newName: string): Promise<ServerUITemplate> {
    const src = await this.getUITemplate(id)
    if (!src) throw new Error('UI template not found')
    const { tenantId, mainBanner, gpcBanner, preferenceModal } = src as ServerUITemplate & {
      mainBanner?: unknown; gpcBanner?: unknown; preferenceModal?: unknown
    }
    return this.createUITemplate({
      tenantId, name: newName,
      ...(mainBanner !== undefined && { mainBanner }),
      ...(gpcBanner !== undefined && { gpcBanner }),
      ...(preferenceModal !== undefined && { preferenceModal }),
    } as CreateUITemplateInput)
  }
}
