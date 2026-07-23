import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { randomProfileId, randomVisitorId, randomConsentId, randomConsentTemplateId, randomUITemplateId } from '../../utils/crypto'
import type {
  StorageAdapter,
  StorageConfig,
  Profile,
  StoredProfileJson,
  ProfileSummary,
  OptInStats,
  OptInFilters,
  ComplianceGroupId,
  CreateProfileInput,
  UpdateProfileInput,
  ConsentDbRecord,
  ConsentSummary,
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
  AuditLogSummary,
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
  ServerConsentTemplate,
  ServerUITemplate,
  CreateConsentTemplateInput,
  UpdateConsentTemplateInput,
  CreateUITemplateInput,
  UpdateUITemplateInput,
  TenantSettings,
  NoticeShownRecord,
  CreateNoticeShownInput,
  PagedResult,
} from '@consenti/types'
import { resolveStoragePaths } from '../../utils/storage-path'
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
  consent_templates: ServerConsentTemplate[]
  ui_templates: ServerUITemplate[]
  api_keys: ApiKey[]
  settings: Record<string, TenantSettings>
  notice_shown: NoticeShownRecord[]
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
    consent_templates: [],
    ui_templates: [],
    api_keys: [],
    settings: {},
    notice_shown: [],
  }
}

function page<T>(arr: T[], pageNum: number, limit: number): T[] {
  const l = Math.min(limit, MAX_PAGE_SIZE)
  const offset = (pageNum - 1) * l
  return arr.slice(offset, offset + l)
}

// The JSON driver holds everything in memory, so column projection saves no I/O here — these
// exist purely to keep the wire response shape identical to the other 6 adapters.
function toConsentSummary(c: ConsentDbRecord): ConsentSummary {
  const { id, tenantId, visitorId, profileId, locale, gpcDetected, source, ageVerified, createdAt, updatedAt } = c
  return { id, tenantId, visitorId, profileId, locale, gpcDetected, source, ...(ageVerified != null ? { ageVerified } : {}), createdAt, updatedAt }
}

function toAuditSummary(l: AuditLog): AuditLogSummary {
  const { id, tenantId, userId, action, resourceType, resourceId, createdAt } = l
  return { id, tenantId, action, resourceType, createdAt, ...(userId != null ? { userId } : {}), ...(resourceId != null ? { resourceId } : {}) }
}

export class JsonFileAdapter implements StorageAdapter {
  private db: JsonDb = emptyDb()
  private filePath = ''
  // Steno-equivalent: serialised writes via promise chain.
  // Old settled promises are GC'd on reassignment — no memory leak.
  private writeQueue: Promise<void> = Promise.resolve()

  constructor(private config: StorageConfig) {}

  private scheduleWrite(): void {
    this.writeQueue = this.writeQueue
      .then(async () => {
        await mkdir(this.filePath.replace(/\/[^/]+$/, ''), { recursive: true })
        const tmp = `${this.filePath}.tmp`
        await writeFile(tmp, JSON.stringify(this.db), 'utf8')
        await rename(tmp, this.filePath)
      })
      .catch((err: unknown) => { console.warn('[Consenti] JSON store write failed:', err) })
  }

  async connect(): Promise<void> {
    const { dbPath } = resolveStoragePaths(this.config.path ?? './consenti-data', 'json')
    this.filePath = dbPath
    try {
      const raw = await readFile(this.filePath, 'utf8')
      this.db = { ...emptyDb(), ...JSON.parse(raw) as JsonDb }
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
    const id = randomProfileId()
    const profile: Profile = {
      id,
      tenantId: data.tenantId,
      name: data.name,
      defaultLocale: data.defaultLocale,
      version: 1,
      profileJson: data.profileJson as StoredProfileJson,
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
      ...(data.profileJson != null && { profileJson: data.profileJson as StoredProfileJson }),
      ...(data.version != null && { version: data.version }),
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

  async findActiveProfileByComplianceGroup(tenantId: string, complianceGroup: string): Promise<Profile | null> {
    return this.db.profiles.find(p =>
      p.tenantId === tenantId &&
      (p.profileJson.complianceGroup === complianceGroup || (p.profileJson as { customComplianceGroup?: string }).customComplianceGroup === complianceGroup) &&
      p.profileJson.isActive
    ) ?? null
  }

  // ── Consents ──────────────────────────────────────────────────────────────

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const now = new Date().toISOString()
    const id = randomConsentId()
    const record: ConsentDbRecord = {
      id,
      tenantId: data.tenantId,
      visitorId: data.visitorId,
      profileId: data.profileId,
      locale: data.locale,
      consentJson: data.consentJson as ConsentValue,
      gpcDetected: data.gpcDetected ?? false,
      source: data.source as ConsentDbRecord['source'],
      ...(data.ageVerified != null && { ageVerified: data.ageVerified }),
      ...(data.parentalConsentToken != null && { parentalConsentToken: data.parentalConsentToken }),
      ...(data.tcfString != null && { tcfString: data.tcfString }),
      ...(data.signature != null && { signature: data.signature }),
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
      ...(data.signature != null && { signature: data.signature }),
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

  async getConsents(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>> {
    let rows = this.db.consents.filter(c => c.tenantId === filters.tenantId)
    if (filters.profileId) rows = rows.filter(c => c.profileId === filters.profileId)
    if (filters.from) rows = rows.filter(c => c.createdAt >= filters.from!)
    if (filters.to) rows = rows.filter(c => c.createdAt <= filters.to!)
    if (filters.q) {
      // Prefix match, not substring — kept consistent with every other adapter's search
      // semantics (which use a leading-wildcard-free query so they stay index-backed).
      const q = filters.q.toLowerCase()
      rows = rows.filter(c =>
        c.visitorId.toLowerCase().startsWith(q) ||
        c.profileId.toLowerCase().startsWith(q) ||
        c.locale.toLowerCase().startsWith(q) ||
        c.source.toLowerCase().startsWith(q))
    }
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const page_ = filters.page ?? 1
    const limit = filters.limit ?? 50
    return { items: page(rows, page_, limit).map(toConsentSummary), total: rows.length, page: page_, limit }
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    for (const c of this.db.consents.filter(c => c.tenantId === filters.tenantId)) yield c
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    return this.db.consent_history
      .filter(h => h.visitorId === visitorId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async createNoticeShown(data: CreateNoticeShownInput): Promise<NoticeShownRecord> {
    const record: NoticeShownRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      visitorId: data.visitorId,
      profileId: data.profileId,
      locale: data.locale,
      createdAt: new Date().toISOString(),
    }
    this.db.notice_shown.push(record)
    this.scheduleWrite()
    return record
  }

  async getNoticeShownForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    return this.db.notice_shown
      .filter(n => n.visitorId === visitorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ── Visitors ──────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const now = new Date().toISOString()
    const visitor: Visitor = {
      id: randomVisitorId(),
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

  async getVisitors(filters: VisitorFilters): Promise<PagedResult<Visitor>> {
    let rows = this.db.visitors.filter(v => v.tenantId === filters.tenantId)
    if (filters.from) rows = rows.filter(v => v.firstSeen >= filters.from!)
    if (filters.to) rows = rows.filter(v => v.firstSeen <= filters.to!)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      rows = rows.filter(v => v.visitorId.toLowerCase().startsWith(q) || (v.country?.toLowerCase().startsWith(q) ?? false))
    }
    rows.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    const page_ = filters.page ?? 1
    const limit = filters.limit ?? 50
    return { items: page(rows, page_, limit), total: rows.length, page: page_, limit }
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
      allowedTenants: data.allowedTenants ?? [],
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
      ...('allowedTenants' in data && { allowedTenants: data.allowedTenants ?? [] }),
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

  async getLogs(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    let rows = this.db.audit_logs.filter(l => l.tenantId === filters.tenantId)
    if (filters.action) rows = rows.filter(l => l.action === filters.action)
    if (filters.resourceType) rows = rows.filter(l => l.resourceType === filters.resourceType)
    if (filters.from) rows = rows.filter(l => l.createdAt >= filters.from!)
    if (filters.to) rows = rows.filter(l => l.createdAt <= filters.to!)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      rows = rows.filter(l =>
        l.action.toLowerCase().startsWith(q) ||
        l.resourceType.toLowerCase().startsWith(q) ||
        (l.resourceId?.toLowerCase().startsWith(q) ?? false) ||
        (l.userId?.toLowerCase().startsWith(q) ?? false))
    }
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const page_ = filters.page ?? 1
    const limit = filters.limit ?? 50
    return { items: page(rows, page_, limit).map(toAuditSummary), total: rows.length, page: page_, limit }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    return this.db.audit_logs.find(l => l.id === id) ?? null
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

  async getSettings(tenantId: string): Promise<TenantSettings> {
    return this.db.settings[tenantId] ?? {}
  }

  async updateSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings> {
    const updated = { ...(this.db.settings[tenantId] ?? {}), ...data }
    this.db.settings[tenantId] = updated
    this.scheduleWrite()
    return updated
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

  async purgeExpiredAuditLogs(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const before = this.db.audit_logs.length
    this.db.audit_logs = this.db.audit_logs.filter(l => l.createdAt >= cutoff)
    const removed = before - this.db.audit_logs.length
    if (removed > 0) this.scheduleWrite()
    return removed
  }

  // ── API Keys ───────────────────────────────────────────────────────────────

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const now = new Date().toISOString()
    const key: ApiKey = {
      id: randomUUID(),
      tenantId: data.tenantId,
      keyHash: data.keyHash,
      name: data.name,
      isActive: true,
      ...(data.createdBy !== undefined ? { createdBy: data.createdBy } : {}),
      ...(data.expireBy !== undefined ? { expireBy: data.expireBy } : {}),
      createdAt: now,
      updatedAt: now,
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
    if (key) { key.isActive = false; key.updatedAt = new Date().toISOString(); this.scheduleWrite() }
  }

  async reactivateApiKey(id: string): Promise<void> {
    const key = this.db.api_keys.find(k => k.id === id)
    if (!key) return
    key.isActive = true
    if (key.expireBy && new Date(key.expireBy) <= new Date()) delete key.expireBy
    key.updatedAt = new Date().toISOString()
    this.scheduleWrite()
  }

  async deleteApiKey(id: string): Promise<void> {
    const idx = this.db.api_keys.findIndex(k => k.id === id)
    if (idx === -1) return
    this.db.api_keys.splice(idx, 1)
    this.scheduleWrite()
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    return this.db.api_keys
      .filter(k => k.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ── Consent Templates ──────────────────────────────────────────────────────

  async createConsentTemplate(data: CreateConsentTemplateInput): Promise<ServerConsentTemplate> {
    const now = new Date().toISOString()
    const tpl: ServerConsentTemplate = {
      id: randomConsentTemplateId(), tenantId: data.tenantId, name: data.name,
      cookies: data.cookies, categories: data.categories, createdAt: now, updatedAt: now,
    }
    this.db.consent_templates.push(tpl)
    this.scheduleWrite()
    return tpl
  }

  async updateConsentTemplate(id: string, data: UpdateConsentTemplateInput): Promise<ServerConsentTemplate> {
    const idx = this.db.consent_templates.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Consent template not found')
    const now = new Date().toISOString()
    const updated: ServerConsentTemplate = {
      ...this.db.consent_templates[idx]!,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.cookies !== undefined && { cookies: data.cookies }),
      ...(data.categories !== undefined && { categories: data.categories }),
      updatedAt: now,
    }
    this.db.consent_templates[idx] = updated
    this.scheduleWrite()
    return updated
  }

  async deleteConsentTemplate(id: string): Promise<void> {
    this.db.consent_templates = this.db.consent_templates.filter(t => t.id !== id)
    this.scheduleWrite()
  }

  async getConsentTemplate(id: string): Promise<ServerConsentTemplate | null> {
    return this.db.consent_templates.find(t => t.id === id) ?? null
  }

  async getConsentTemplates(tenantId: string): Promise<ServerConsentTemplate[]> {
    return this.db.consent_templates
      .filter(t => t.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async copyConsentTemplate(id: string, newName: string): Promise<ServerConsentTemplate> {
    const src = await this.getConsentTemplate(id)
    if (!src) throw new Error('Consent template not found')
    return this.createConsentTemplate({ tenantId: src.tenantId, name: newName, cookies: src.cookies, categories: src.categories })
  }

  // ── UI Templates ───────────────────────────────────────────────────────────

  async createUITemplate(data: CreateUITemplateInput): Promise<ServerUITemplate> {
    const now = new Date().toISOString()
    const { tenantId, name, ...settings } = data
    const tpl = { id: randomUITemplateId(), tenantId, name, ...settings, createdAt: now, updatedAt: now } as ServerUITemplate
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

  // ── Profile summaries ──────────────────────────────────────────────────────

  private profileToSummary(p: Profile): ProfileSummary {
    const json = p.profileJson as StoredProfileJson & { complianceGroup?: string; customComplianceGroup?: string; isActive?: boolean; consentTemplateId?: string; uiTemplateId?: string }
    const ct = json.consentTemplateId ? this.db.consent_templates.find(t => t.id === json.consentTemplateId) : null
    const ut = json.uiTemplateId ? this.db.ui_templates.find(t => t.id === json.uiTemplateId) : null
    return {
      id: p.id,
      name: p.name,
      defaultLocale: p.defaultLocale,
      complianceGroup: (json.complianceGroup ?? null) as ComplianceGroupId | null,
      customComplianceGroup: json.customComplianceGroup ?? null,
      isActive: json.isActive ?? false,
      consentTemplateName: ct?.name ?? null,
      uiTemplateName: ut?.name ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }
  }

  async listProfilesSummary(tenantId: string): Promise<ProfileSummary[]> {
    return this.db.profiles
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(p => this.profileToSummary(p))
  }

  async findProfilesUsingConsentTemplate(templateId: string): Promise<ProfileSummary[]> {
    return this.db.profiles
      .filter(p => {
        const json = p.profileJson as { consentTemplateId?: string }
        return json.consentTemplateId === templateId
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => this.profileToSummary(p))
  }

  async findProfilesUsingUITemplate(templateId: string): Promise<ProfileSummary[]> {
    return this.db.profiles
      .filter(p => {
        const json = p.profileJson as { uiTemplateId?: string }
        return json.uiTemplateId === templateId
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => this.profileToSummary(p))
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getOptInStats(tenantId: string, filters: OptInFilters): Promise<OptInStats> {
    let records = this.db.consents.filter(c => c.tenantId === tenantId)
    if (filters.profileId) records = records.filter(c => c.profileId === filters.profileId)
    if (filters.from) records = records.filter(c => c.createdAt >= filters.from!)
    if (filters.to) records = records.filter(c => c.createdAt <= filters.to!)
    if (filters.locale) records = records.filter(c => c.locale === filters.locale)

    let total = 0, granted = 0, denied = 0, managed = 0
    const byLocale: Record<string, { total: number; granted: number; denied: number; managed: number }> = {}
    const dateMap = new Map<string, { total: number; granted: number; denied: number; managed: number }>()

    for (const r of records) {
      const statuses = Object.values(r.consentJson as Record<string, string>)
      const grantedPct = statuses.length > 0 ? statuses.filter(s => s === 'granted').length / statuses.length : 0
      const deniedPct = statuses.length > 0 ? statuses.filter(s => s === 'denied').length / statuses.length : 0
      total++
      const loc = r.locale
      if (!byLocale[loc]) byLocale[loc] = { total: 0, granted: 0, denied: 0, managed: 0 }
      byLocale[loc]!.total++

      const date = r.createdAt.slice(0, 10)
      const entry = dateMap.get(date) ?? { total: 0, granted: 0, denied: 0, managed: 0 }
      entry.total++

      if (grantedPct >= 0.9) { granted++; byLocale[loc]!.granted++; entry.granted++ }
      else if (deniedPct >= 0.9) { denied++; byLocale[loc]!.denied++; entry.denied++ }
      else { managed++; byLocale[loc]!.managed++; entry.managed++ }
      dateMap.set(date, entry)
    }

    const byDate = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }))

    return {
      total, granted, denied, managed,
      grantedPct: total > 0 ? Math.round((granted / total) * 1000) / 10 : 0,
      deniedPct: total > 0 ? Math.round((denied / total) * 1000) / 10 : 0,
      managedPct: total > 0 ? Math.round((managed / total) * 1000) / 10 : 0,
      byLocale,
      byDate,
    }
  }
}
