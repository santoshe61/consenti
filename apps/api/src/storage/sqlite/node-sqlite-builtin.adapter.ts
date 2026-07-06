import type { DatabaseSync, StatementSync } from 'node:sqlite'

const MAX_PAGE_SIZE = 500
import { randomUUID, randomProfileId } from '../../utils/crypto'
import { resolveStoragePaths } from '../../utils/storage-path'
import {
  SEED_SQL,
  SCHEMA_SQL_SQLITE,
  SCHEMA_SQL_SQLITE_API_KEYS,
  SCHEMA_SQL_SQLITE_ENTERPRISE,
  SCHEMA_SQL_SQLITE_TEMPLATES,
} from '../seed-data'
import type {
  StorageAdapter,
  StorageConfig,
  Profile,
  ProfileConfig,
  ProfileSummary,
  OptInStats,
  OptInFilters,
  ComplianceGroupId,
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

interface RawProfile {
  id: string; tenant_id: string; name: string; default_locale: string
  version: number; profile_json: string
  created_at: string; updated_at: string
}
interface RawConsent {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  profile_version: number; locale: string; consent_json: string
  gpc_detected: number; source: string; created_at: string; updated_at: string
  age_verified?: number; parental_consent_token?: string | null; tcf_string?: string | null
}
interface RawConsentHistory {
  id: string; tenant_id: string; consent_record_id: string; visitor_id: string
  old_json: string | null; new_json: string; action: string; created_at: string
}
interface RawVisitor {
  id: string; tenant_id: string; visitor_id: string
  country: string | null; region: string | null; city: string | null
  ip_hash: string | null; user_agent_hash: string | null
  first_seen: string; last_seen: string
}
interface RawUser {
  id: string; tenant_id: string; name: string; email: string
  password_hash: string; is_active: number; created_at: string; updated_at: string
  totp_secret?: string | null; totp_enabled?: number
  allowed_tenants?: string | null
}

interface RawProfileSummary {
  id: string; name: string; default_locale: string; version: number
  compliance_group: string | null; is_active: number
  cookie_template_name: string | null; ui_template_name: string | null
  created_at: string; updated_at: string
  cookie_template_id: string | null; ui_template_id: string | null
}
interface RawRole {
  id: string; tenant_id: string; name: string; description: string | null
}
interface RawPermission {
  id: string; name: string; description: string | null
}
interface RawAuditLog {
  id: string; tenant_id: string; user_id: string | null; action: string
  resource_type: string; resource_id: string | null
  old_data: string | null; new_data: string | null; created_at: string
}
interface RawTenant {
  id: string; name: string; slug: string; created_at: string; updated_at: string
}
interface RawApiKey {
  id: string; tenant_id: string; key_hash: string; name: string; is_active: number; created_at: string
}
interface RawCookieTemplate {
  id: string; tenant_id: string; name: string; cookies_json: string; created_at: string; updated_at: string
}
interface RawUITemplate {
  id: string; tenant_id: string; name: string; settings_json: string; created_at: string; updated_at: string
}


type Stmt = StatementSync

export class NodeSqliteBuiltinAdapter implements StorageAdapter {
  private db!: DatabaseSync
  private cache = new Map<string, Stmt>()

  constructor(private config: StorageConfig) {}

  private stmt(sql: string): Stmt {
    let s = this.cache.get(sql)
    if (!s) { s = this.db.prepare(sql); this.cache.set(sql, s) }
    return s
  }

  async connect(): Promise<void> {
    // Lazy: node:sqlite is only available on Node.js >= 22.5.0.
    // Loading it here (not at module load) prevents startup failure on Node 20.
    const { DatabaseSync: Db } = await import('node:sqlite').catch(() => {
      throw new Error(`driver 'node:sqlite' requires Node.js >= 22.5.0 (current: ${process.version})`)
    }) as { DatabaseSync: new(path: string) => DatabaseSync }
    const { dbPath } = resolveStoragePaths(this.config.path ?? './consenti-data', 'node:sqlite')
    this.db = new Db(dbPath)
    this.db.exec('PRAGMA journal_mode=WAL')
    this.db.exec('PRAGMA foreign_keys=ON')
    this.db.exec('PRAGMA synchronous=NORMAL')
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    this.cache.clear()
    this.db.close()
  }

  async migrate(): Promise<void> {
    const row = this.db.prepare('PRAGMA user_version').get() as { user_version: number }
    if (row.user_version < 1) {
      this.db.exec(SCHEMA_SQL_SQLITE)
      this.db.exec(SEED_SQL)
      this.db.exec('PRAGMA user_version = 1')
    }
    if (row.user_version < 2) {
      this.db.exec(SCHEMA_SQL_SQLITE_API_KEYS)
      this.db.exec('PRAGMA user_version = 2')
    }
    if (row.user_version < 3) {
      this.db.exec(SCHEMA_SQL_SQLITE_ENTERPRISE)
      this.db.exec('PRAGMA user_version = 3')
    }
    if (row.user_version < 4) {
      this.db.exec('ALTER TABLE user_roles ADD COLUMN tenant_id TEXT NOT NULL DEFAULT \'default\'')
      this.db.exec('PRAGMA user_version = 4')
    }
    if (row.user_version < 5) {
      this.db.exec(SCHEMA_SQL_SQLITE_TEMPLATES)
      this.db.exec('PRAGMA user_version = 5')
    }
    if (row.user_version < 6) {
      this.db.exec('ALTER TABLE users ADD COLUMN allowed_tenants TEXT')
      this.db.exec('PRAGMA user_version = 6')
    }

    // Indexes — always idempotent (CREATE INDEX IF NOT EXISTS)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant_compliance_active
        ON profiles (tenant_id, json_extract(profile_json,'$.complianceGroup'), json_extract(profile_json,'$.isActive'));
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant
        ON profiles (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_consents_tenant_profile_date
        ON consent_records (tenant_id, profile_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_consents_visitor
        ON consent_records (visitor_id);
      CREATE INDEX IF NOT EXISTS idx_visitors_tenant
        ON visitors (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_audit_tenant_date
        ON audit_logs (tenant_id, created_at);
    `)
  }

  // ── Profiles ──────────────────────────────────────────────────────────────

  private mapProfile(row: RawProfile): Profile {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      defaultLocale: row.default_locale,
      version: row.version,
      profileJson: JSON.parse(row.profile_json) as ProfileConfig,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const id = randomProfileId()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO profiles (id,tenant_id,name,default_locale,profile_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)'
    ).run(id, data.tenantId, data.name, data.defaultLocale, JSON.stringify(data.profileJson), now, now)
    const profile = await this.getProfile(id)
    if (!profile) throw new Error('Failed to create profile')
    return profile
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const existing = await this.getProfile(id)
    if (!existing) throw new Error(`Profile ${id} not found`)
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?', 'version = version + 1']
    const vals: (string | number | null)[] = [now]
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.defaultLocale != null) { fields.push('default_locale = ?'); vals.push(data.defaultLocale) }
    if (data.profileJson != null) { fields.push('profile_json = ?'); vals.push(JSON.stringify(data.profileJson)) }
    vals.push(id)
    this.stmt(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
    const updated = await this.getProfile(id)
    if (!updated) throw new Error('Failed to update profile')
    return updated
  }

  async deleteProfile(id: string): Promise<void> {
    this.stmt('DELETE FROM profiles WHERE id = ?').run(id)
  }

  async getProfile(id: string): Promise<Profile | null> {
    const row = this.stmt('SELECT * FROM profiles WHERE id = ?').get(id) as RawProfile | undefined
    return row ? this.mapProfile(row) : null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    const rows = this.stmt('SELECT * FROM profiles WHERE tenant_id = ? ORDER BY created_at ASC').all(tenantId) as unknown as RawProfile[]
    return rows.map(r => this.mapProfile(r))
  }

  async findActiveProfileByComplianceGroup(tenantId: string, complianceGroup: string): Promise<Profile | null> {
    const row = this.stmt(
      `SELECT * FROM profiles WHERE tenant_id = ? AND json_extract(profile_json, '$.complianceGroup') = ? AND json_extract(profile_json, '$.isActive') = 1 LIMIT 1`
    ).get(tenantId, complianceGroup) as RawProfile | undefined
    return row ? this.mapProfile(row) : null
  }

  // ── Consents ──────────────────────────────────────────────────────────────

  private mapConsent(row: RawConsent): ConsentDbRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      visitorId: row.visitor_id,
      profileId: row.profile_id,
      profileVersion: row.profile_version,
      locale: row.locale,
      consentJson: JSON.parse(row.consent_json) as ConsentValue,
      gpcDetected: row.gpc_detected === 1,
      source: row.source as ConsentDbRecord['source'],
      ...(row.age_verified != null && row.age_verified !== 0 ? { ageVerified: true } : {}),
      ...(row.parental_consent_token != null ? { parentalConsentToken: row.parental_consent_token } : {}),
      ...(row.tcf_string != null ? { tcfString: row.tcf_string } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO consent_records (id,tenant_id,visitor_id,profile_id,profile_version,locale,consent_json,gpc_detected,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(id, data.tenantId, data.visitorId, data.profileId, data.profileVersion, data.locale, JSON.stringify(data.consentJson), data.gpcDetected ? 1 : 0, data.source, now, now)
    const histId = randomUUID()
    this.stmt(
      'INSERT INTO consent_history (id,tenant_id,consent_record_id,visitor_id,old_json,new_json,action,created_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run(histId, data.tenantId, id, data.visitorId, null, JSON.stringify(data.consentJson), 'created', now)
    const record = await this.getConsent(data.visitorId)
    if (!record) throw new Error('Failed to create consent')
    return record
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.getConsent(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?', 'consent_json = ?']
    const vals: (string | number | null)[] = [now, JSON.stringify(data.consentJson)]
    if (data.locale != null) { fields.push('locale = ?'); vals.push(data.locale) }
    if (data.gpcDetected != null) { fields.push('gpc_detected = ?'); vals.push(data.gpcDetected ? 1 : 0) }
    vals.push(visitorId)
    this.stmt(`UPDATE consent_records SET ${fields.join(', ')} WHERE visitor_id = ?`).run(...vals)
    const histId = randomUUID()
    this.stmt(
      'INSERT INTO consent_history (id,tenant_id,consent_record_id,visitor_id,old_json,new_json,action,created_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run(histId, existing.tenantId, existing.id, visitorId, JSON.stringify(existing.consentJson), JSON.stringify(data.consentJson), 'updated', now)
    const updated = await this.getConsent(visitorId)
    if (!updated) throw new Error('Failed to update consent')
    return updated
  }

  async deleteConsent(visitorId: string): Promise<void> {
    this.stmt('DELETE FROM consent_history WHERE visitor_id = ?').run(visitorId)
    this.stmt('DELETE FROM consent_records WHERE visitor_id = ?').run(visitorId)
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    const row = this.stmt('SELECT * FROM consent_records WHERE visitor_id = ?').get(visitorId) as RawConsent | undefined
    return row ? this.mapConsent(row) : null
  }

  async getConsents(filters: ConsentFilters): Promise<ConsentDbRecord[]> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: (string | number | null)[] = [filters.tenantId]
    if (filters.profileId) { conditions.push('profile_id = ?'); vals.push(filters.profileId) }
    if (filters.from) { conditions.push('created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('created_at <= ?'); vals.push(filters.to) }
    const limit = Math.min(filters.limit ?? 50, MAX_PAGE_SIZE)
    const offset = ((filters.page ?? 1) - 1) * limit
    vals.push(limit, offset)
    const rows = this.stmt(
      `SELECT * FROM consent_records WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...vals) as unknown as RawConsent[]
    return rows.map(r => this.mapConsent(r))
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    const pageSize = 500
    let offset = 0
    while (true) {
      const rows = this.stmt(
        'SELECT * FROM consent_records WHERE tenant_id = ? LIMIT ? OFFSET ?'
      ).all(filters.tenantId, pageSize, offset) as unknown as RawConsent[]
      if (rows.length === 0) break
      for (const row of rows) yield this.mapConsent(row)
      offset += pageSize
    }
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    const rows = this.stmt(
      'SELECT * FROM consent_history WHERE visitor_id = ? ORDER BY created_at ASC'
    ).all(visitorId) as unknown as RawConsentHistory[]
    return rows.map(r => ({
      id: r.id,
      tenantId: r.tenant_id,
      consentRecordId: r.consent_record_id,
      visitorId: r.visitor_id,
      oldJson: r.old_json != null ? JSON.parse(r.old_json) as ConsentValue : null,
      newJson: JSON.parse(r.new_json) as ConsentValue,
      action: r.action as ConsentHistoryEntry['action'],
      createdAt: r.created_at,
    }))
  }

  // ── Visitors ──────────────────────────────────────────────────────────────

  private mapVisitor(row: RawVisitor): Visitor {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      visitorId: row.visitor_id,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      ...(row.country != null ? { country: row.country } : {}),
      ...(row.region != null ? { region: row.region } : {}),
      ...(row.city != null ? { city: row.city } : {}),
      ...(row.ip_hash != null ? { ipHash: row.ip_hash } : {}),
      ...(row.user_agent_hash != null ? { userAgentHash: row.user_agent_hash } : {}),
    }
  }

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO visitors (id,tenant_id,visitor_id,country,region,city,ip_hash,user_agent_hash,first_seen,last_seen) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(id, data.tenantId, data.visitorId, data.country ?? null, data.region ?? null, data.city ?? null, data.ipHash ?? null, data.userAgentHash ?? null, now, now)
    const visitor = await this.getVisitor(data.visitorId)
    if (!visitor) throw new Error('Failed to create visitor')
    return visitor
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const now = new Date().toISOString()
    const fields: string[] = ['last_seen = ?']
    const vals: (string | number | null)[] = [data.lastSeen ?? now]
    if (data.country != null) { fields.push('country = ?'); vals.push(data.country) }
    if (data.region != null) { fields.push('region = ?'); vals.push(data.region) }
    if (data.city != null) { fields.push('city = ?'); vals.push(data.city) }
    vals.push(visitorId)
    this.stmt(`UPDATE visitors SET ${fields.join(', ')} WHERE visitor_id = ?`).run(...vals)
    const visitor = await this.getVisitor(visitorId)
    if (!visitor) throw new Error(`Visitor ${visitorId} not found`)
    return visitor
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    this.stmt('DELETE FROM visitors WHERE visitor_id = ?').run(visitorId)
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    const row = this.stmt('SELECT * FROM visitors WHERE visitor_id = ?').get(visitorId) as RawVisitor | undefined
    return row ? this.mapVisitor(row) : null
  }

  async getVisitors(filters: VisitorFilters): Promise<Visitor[]> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: (string | number | null)[] = [filters.tenantId]
    if (filters.from) { conditions.push('first_seen >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('first_seen <= ?'); vals.push(filters.to) }
    const limit = Math.min(filters.limit ?? 50, MAX_PAGE_SIZE)
    const offset = ((filters.page ?? 1) - 1) * limit
    vals.push(limit, offset)
    const rows = this.stmt(
      `SELECT * FROM visitors WHERE ${conditions.join(' AND ')} ORDER BY last_seen DESC LIMIT ? OFFSET ?`
    ).all(...vals) as unknown as RawVisitor[]
    return rows.map(r => this.mapVisitor(r))
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  private mapUser(row: RawUser): AdminUser {
    const allowedTenants: string[] = row.allowed_tenants
      ? JSON.parse(row.allowed_tenants) as string[]
      : []
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      isActive: row.is_active === 1,
      totpEnabled: row.totp_enabled === 1,
      ...(row.totp_secret != null ? { totpSecret: row.totp_secret } : {}),
      allowedTenants,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const allowedTenantsJson = data.allowedTenants?.length ? JSON.stringify(data.allowedTenants) : null
    this.stmt(
      'INSERT INTO users (id,tenant_id,name,email,password_hash,allowed_tenants,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run(id, data.tenantId, data.name, data.email, data.passwordHash, allowedTenantsJson, now, now)
    const user = await this.getUserByEmail(data.email)
    if (!user) throw new Error('Failed to create user')
    return user
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?']
    const vals: (string | number | null)[] = [now]
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.email != null) { fields.push('email = ?'); vals.push(data.email) }
    if (data.passwordHash != null) { fields.push('password_hash = ?'); vals.push(data.passwordHash) }
    if (data.isActive != null) { fields.push('is_active = ?'); vals.push(data.isActive ? 1 : 0) }
    if ('totpSecret' in data) { fields.push('totp_secret = ?'); vals.push(data.totpSecret ?? null) }
    if (data.totpEnabled != null) { fields.push('totp_enabled = ?'); vals.push(data.totpEnabled ? 1 : 0) }
    if ('allowedTenants' in data) {
      fields.push('allowed_tenants = ?')
      vals.push(data.allowedTenants?.length ? JSON.stringify(data.allowedTenants) : null)
    }
    vals.push(id)
    this.stmt(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
    const row = this.stmt('SELECT * FROM users WHERE id = ?').get(id) as RawUser | undefined
    if (!row) throw new Error(`User ${id} not found`)
    return this.mapUser(row)
  }

  async deleteUser(id: string): Promise<void> {
    this.stmt('DELETE FROM user_roles WHERE user_id = ?').run(id)
    this.stmt('DELETE FROM users WHERE id = ?').run(id)
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const row = this.stmt('SELECT * FROM users WHERE id = ?').get(id) as RawUser | undefined
    return row ? this.mapUser(row) : null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    const row = this.stmt('SELECT * FROM users WHERE email = ?').get(email) as RawUser | undefined
    return row ? this.mapUser(row) : null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    const rows = this.stmt('SELECT * FROM users WHERE tenant_id = ? ORDER BY created_at ASC').all(tenantId) as unknown as RawUser[]
    return rows.map(r => this.mapUser(r))
  }

  async countUsers(tenantId?: string): Promise<number> {
    const row = tenantId
      ? this.stmt('SELECT COUNT(*) as n FROM users WHERE tenant_id = ?').get(tenantId) as { n: number } | undefined
      : this.stmt('SELECT COUNT(*) as n FROM users').get() as { n: number } | undefined
    return row?.n ?? 0
  }

  // ── Roles & Permissions ───────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    const rows = this.stmt('SELECT * FROM roles WHERE tenant_id = ?').all(tenantId) as unknown as RawRole[]
    return rows.map(r => ({
      id: r.id, tenantId: r.tenant_id, name: r.name,
      ...(r.description != null ? { description: r.description } : {}),
    }))
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const id = randomUUID()
    this.stmt('INSERT INTO roles (id,tenant_id,name,description) VALUES (?,?,?,?)').run(
      id, data.tenantId, data.name, data.description ?? null
    )
    const row = this.stmt('SELECT * FROM roles WHERE id = ?').get(id) as RawRole | undefined
    if (!row) throw new Error('Failed to create role')
    return { id: row.id, tenantId: row.tenant_id, name: row.name, ...(row.description != null ? { description: row.description } : {}) }
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const fields: string[] = []
    const vals: (string | number | null)[] = []
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.description != null) { fields.push('description = ?'); vals.push(data.description) }
    if (fields.length > 0) {
      vals.push(id)
      this.stmt(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
    }
    const row = this.stmt('SELECT * FROM roles WHERE id = ?').get(id) as RawRole | undefined
    if (!row) throw new Error(`Role ${id} not found`)
    return { id: row.id, tenantId: row.tenant_id, name: row.name, ...(row.description != null ? { description: row.description } : {}) }
  }

  async deleteRole(id: string): Promise<void> {
    this.stmt('DELETE FROM role_permissions WHERE role_id = ?').run(id)
    this.stmt('DELETE FROM user_roles WHERE role_id = ?').run(id)
    this.stmt('DELETE FROM roles WHERE id = ?').run(id)
  }

  async getAllPermissions(): Promise<Permission[]> {
    const rows = this.stmt('SELECT * FROM permissions ORDER BY name ASC').all() as unknown as RawPermission[]
    return rows.map(r => ({ id: r.id, name: r.name, ...(r.description != null ? { description: r.description } : {}) }))
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    this.stmt('INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)').run(roleId, permissionId)
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    this.stmt('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(roleId, permissionId)
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rows = this.stmt(
      'SELECT p.* FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ?'
    ).all(roleId) as unknown as RawPermission[]
    return rows.map(r => ({
      id: r.id, name: r.name,
      ...(r.description != null ? { description: r.description } : {}),
    }))
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    const rows = tenantId
      ? this.stmt(
          'SELECT r.* FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? AND ur.tenant_id = ?'
        ).all(userId, tenantId) as unknown as RawRole[]
      : this.stmt(
          'SELECT r.* FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?'
        ).all(userId) as unknown as RawRole[]
    return rows.map(r => ({
      id: r.id, tenantId: r.tenant_id, name: r.name,
      ...(r.description != null ? { description: r.description } : {}),
    }))
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    this.stmt('INSERT OR IGNORE INTO user_roles (user_id, role_id, tenant_id) VALUES (?,?,?)').run(userId, roleId, tenantId)
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      this.stmt('DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND tenant_id = ?').run(userId, roleId, tenantId)
    } else {
      this.stmt('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?').run(userId, roleId)
    }
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO audit_logs (id,tenant_id,user_id,action,resource_type,resource_id,old_data,new_data,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(
      id, data.tenantId, data.userId ?? null, data.action, data.resourceType,
      data.resourceId ?? null,
      data.oldData != null ? JSON.stringify(data.oldData) : null,
      data.newData != null ? JSON.stringify(data.newData) : null,
      now
    )
  }

  async getLogs(filters: AuditFilters): Promise<AuditLog[]> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: (string | number | null)[] = [filters.tenantId]
    if (filters.action) { conditions.push('action = ?'); vals.push(filters.action) }
    if (filters.resourceType) { conditions.push('resource_type = ?'); vals.push(filters.resourceType) }
    if (filters.from) { conditions.push('created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('created_at <= ?'); vals.push(filters.to) }
    const limit = Math.min(filters.limit ?? 50, MAX_PAGE_SIZE)
    const offset = ((filters.page ?? 1) - 1) * limit
    vals.push(limit, offset)
    const rows = this.stmt(
      `SELECT * FROM audit_logs WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...vals) as unknown as RawAuditLog[]
    return rows.map(r => this.mapAuditLog(r))
  }

  private mapAuditLog(r: RawAuditLog): AuditLog {
    return {
      id: r.id, tenantId: r.tenant_id, action: r.action,
      resourceType: r.resource_type, createdAt: r.created_at,
      ...(r.user_id != null ? { userId: r.user_id } : {}),
      ...(r.resource_id != null ? { resourceId: r.resource_id } : {}),
      ...(r.old_data != null ? { oldData: JSON.parse(r.old_data) as unknown } : {}),
      ...(r.new_data != null ? { newData: JSON.parse(r.new_data) as unknown } : {}),
    }
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: (string | number | null)[] = [filters.tenantId]
    if (filters.action) { conditions.push('action = ?'); vals.push(filters.action) }
    if (filters.from) { conditions.push('created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('created_at <= ?'); vals.push(filters.to) }
    const pageSize = 500
    let offset = 0
    while (true) {
      const rows = this.stmt(
        `SELECT * FROM audit_logs WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).all(...vals, pageSize, offset) as unknown as RawAuditLog[]
      if (rows.length === 0) break
      for (const row of rows) yield this.mapAuditLog(row)
      offset += pageSize
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const tc = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ?').get(tenantId) as { n: number } | undefined
    const gc = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ? AND gpc_detected = 1').get(tenantId) as { n: number } | undefined
    const vc = this.stmt('SELECT COUNT(*) as n FROM visitors WHERE tenant_id = ?').get(tenantId) as { n: number } | undefined
    const totalConsents = tc?.n ?? 0

    const recent = this.stmt(
      'SELECT consent_json FROM consent_records WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 500'
    ).all(tenantId) as unknown as { consent_json: string }[]

    let accepted = 0, rejected = 0
    for (const r of recent) {
      const vals = Object.values(JSON.parse(r.consent_json) as Record<string, string>)
      const grantedPct = vals.length > 0 ? vals.filter(v => v === 'granted').length / vals.length : 0
      if (grantedPct >= 0.8) accepted++
      else if (grantedPct <= 0.2) rejected++
    }
    const sample = recent.length || 1

    return {
      totalConsents,
      gpcDetectedCount: gc?.n ?? 0,
      totalVisitors: vc?.n ?? 0,
      acceptedPct: Math.round((accepted / sample) * 100),
      rejectedPct: Math.round((rejected / sample) * 100),
    }
  }

  async getCategoryStats(tenantId: string): Promise<CategoryStats> {
    const rows = this.stmt(
      'SELECT consent_json FROM consent_records WHERE tenant_id = ? LIMIT 5000'
    ).all(tenantId) as unknown as { consent_json: string }[]
    const stats: CategoryStats = {}
    for (const row of rows) {
      const consent = JSON.parse(row.consent_json) as Record<string, string>
      for (const [key, status] of Object.entries(consent)) {
        if (!stats[key]) stats[key] = { granted: 0, denied: 0, objected: 0 }
        if (status === 'granted') stats[key]!.granted++
        else if (status === 'denied') stats[key]!.denied++
        else if (status === 'objected') stats[key]!.objected++
      }
    }
    return stats
  }

  async getTimeline(tenantId: string, days = 30): Promise<TimelineEntry[]> {
    const rows = this.stmt(
      `SELECT date(created_at) as date, COUNT(*) as count FROM consent_records WHERE tenant_id = ? AND created_at >= date('now', ?) GROUP BY date(created_at) ORDER BY date ASC`
    ).all(tenantId, `-${days} days`) as unknown as { date: string; count: number }[]
    return rows.map(r => ({ date: r.date, count: r.count }))
  }

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const rows = this.stmt(
      `SELECT v.country, COUNT(*) as count FROM consent_records cr JOIN visitors v ON v.visitor_id = cr.visitor_id WHERE cr.tenant_id = ? AND v.country IS NOT NULL GROUP BY v.country ORDER BY count DESC LIMIT 50`
    ).all(tenantId) as unknown as { country: string; count: number }[]
    return rows.map(r => ({ country: r.country, count: r.count }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const total = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ?').get(tenantId) as { n: number } | undefined
    const detected = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ? AND gpc_detected = 1').get(tenantId) as { n: number } | undefined
    const t = total?.n ?? 0
    const d = detected?.n ?? 0
    return { detected: d, total: t, rate: t > 0 ? Math.round((d / t) * 100) : 0 }
  }

  // ── Tenants ────────────────────────────────────────────────────────────────

  async getTenants(): Promise<Tenant[]> {
    const rows = this.stmt('SELECT * FROM tenants ORDER BY name ASC').all() as unknown as RawTenant[]
    return rows.map(r => ({ id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }))
  }

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt('INSERT INTO tenants (id,name,slug,created_at,updated_at) VALUES (?,?,?,?,?)').run(id, data.name, data.slug, now, now)
    const row = this.stmt('SELECT * FROM tenants WHERE id = ?').get(id) as RawTenant | undefined
    if (!row) throw new Error('Failed to create tenant')
    return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?']
    const vals: (string | number)[] = [now]
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.slug != null) { fields.push('slug = ?'); vals.push(data.slug) }
    vals.push(id)
    this.stmt(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
    const row = this.stmt('SELECT * FROM tenants WHERE id = ?').get(id) as RawTenant | undefined
    if (!row) throw new Error(`Tenant ${id} not found`)
    return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  async deleteTenant(id: string): Promise<void> {
    this.stmt('DELETE FROM tenants WHERE id = ?').run(id)
  }

  async purgeExpiredConsents(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const toDelete = this.stmt(
      'SELECT visitor_id FROM consent_records WHERE created_at < ?'
    ).all(cutoff) as unknown as { visitor_id: string }[]
    for (const { visitor_id } of toDelete) {
      this.stmt('DELETE FROM consent_history WHERE visitor_id = ?').run(visitor_id)
      this.stmt('DELETE FROM consent_records WHERE visitor_id = ?').run(visitor_id)
    }
    return toDelete.length
  }

  // ── API Keys ───────────────────────────────────────────────────────────────

  private mapApiKey(r: RawApiKey): ApiKey {
    return { id: r.id, tenantId: r.tenant_id, keyHash: r.key_hash, name: r.name, isActive: r.is_active === 1, createdAt: r.created_at }
  }

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt('INSERT INTO api_keys (id,tenant_id,key_hash,name,created_at) VALUES (?,?,?,?,?)').run(id, data.tenantId, data.keyHash, data.name, now)
    const row = this.stmt('SELECT * FROM api_keys WHERE id = ?').get(id) as RawApiKey | undefined
    if (!row) throw new Error('Failed to create API key')
    return this.mapApiKey(row)
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const row = this.stmt('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1').get(keyHash) as RawApiKey | undefined
    return row ? this.mapApiKey(row) : null
  }

  async revokeApiKey(id: string): Promise<void> {
    this.stmt('UPDATE api_keys SET is_active = 0 WHERE id = ?').run(id)
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const rows = this.stmt('SELECT * FROM api_keys WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId) as unknown as RawApiKey[]
    return rows.map(r => this.mapApiKey(r))
  }

  // ── Cookie Templates ───────────────────────────────────────────────────────

  private mapCookieTemplate(r: RawCookieTemplate): ServerCookieTemplate {
    return { id: r.id, tenantId: r.tenant_id, name: r.name, cookies: JSON.parse(r.cookies_json), createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async createCookieTemplate(data: CreateCookieTemplateInput): Promise<ServerCookieTemplate> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt('INSERT INTO cookie_templates (id,tenant_id,name,cookies_json,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(id, data.tenantId, data.name, JSON.stringify(data.cookies), now, now)
    return this.mapCookieTemplate(this.stmt('SELECT * FROM cookie_templates WHERE id = ?').get(id) as unknown as RawCookieTemplate)
  }

  async updateCookieTemplate(id: string, data: UpdateCookieTemplateInput): Promise<ServerCookieTemplate> {
    const now = new Date().toISOString()
    if (data.name !== undefined) this.stmt('UPDATE cookie_templates SET name = ?, updated_at = ? WHERE id = ?').run(data.name, now, id)
    if (data.cookies !== undefined) this.stmt('UPDATE cookie_templates SET cookies_json = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(data.cookies), now, id)
    const row = this.stmt('SELECT * FROM cookie_templates WHERE id = ?').get(id) as RawCookieTemplate | undefined
    if (!row) throw new Error('Cookie template not found')
    return this.mapCookieTemplate(row)
  }

  async deleteCookieTemplate(id: string): Promise<void> {
    this.stmt('DELETE FROM cookie_templates WHERE id = ?').run(id)
  }

  async getCookieTemplate(id: string): Promise<ServerCookieTemplate | null> {
    const row = this.stmt('SELECT * FROM cookie_templates WHERE id = ?').get(id) as RawCookieTemplate | undefined
    return row ? this.mapCookieTemplate(row) : null
  }

  async getCookieTemplates(tenantId: string): Promise<ServerCookieTemplate[]> {
    const rows = this.stmt('SELECT * FROM cookie_templates WHERE tenant_id = ? ORDER BY name ASC').all(tenantId) as unknown as RawCookieTemplate[]
    return rows.map(r => this.mapCookieTemplate(r))
  }

  async copyCookieTemplate(id: string, newName: string): Promise<ServerCookieTemplate> {
    const src = await this.getCookieTemplate(id)
    if (!src) throw new Error('Cookie template not found')
    return this.createCookieTemplate({ tenantId: src.tenantId, name: newName, cookies: src.cookies })
  }

  // ── UI Templates ───────────────────────────────────────────────────────────

  private mapUITemplate(r: RawUITemplate): ServerUITemplate {
    const s = JSON.parse(r.settings_json) as Omit<ServerUITemplate, 'id' | 'tenantId' | 'name' | 'createdAt' | 'updatedAt'>
    return { id: r.id, tenantId: r.tenant_id, name: r.name, ...s, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async createUITemplate(data: CreateUITemplateInput): Promise<ServerUITemplate> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const { tenantId, name, ...settings } = data
    this.stmt('INSERT INTO ui_templates (id,tenant_id,name,settings_json,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(id, tenantId, name, JSON.stringify(settings), now, now)
    return this.mapUITemplate(this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as unknown as RawUITemplate)
  }

  async updateUITemplate(id: string, data: UpdateUITemplateInput): Promise<ServerUITemplate> {
    const now = new Date().toISOString()
    const row = this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as RawUITemplate | undefined
    if (!row) throw new Error('UI template not found')
    if (data.name !== undefined) this.stmt('UPDATE ui_templates SET name = ?, updated_at = ? WHERE id = ?').run(data.name, now, id)
    const { name: _n, ...settingsUpdate } = data
    if (Object.keys(settingsUpdate).length > 0) {
      const current = JSON.parse(row.settings_json) as Record<string, unknown>
      const merged = { ...current, ...settingsUpdate }
      this.stmt('UPDATE ui_templates SET settings_json = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(merged), now, id)
    }
    return this.mapUITemplate(this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as unknown as RawUITemplate)
  }

  async deleteUITemplate(id: string): Promise<void> {
    this.stmt('DELETE FROM ui_templates WHERE id = ?').run(id)
  }

  async getUITemplate(id: string): Promise<ServerUITemplate | null> {
    const row = this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as RawUITemplate | undefined
    return row ? this.mapUITemplate(row) : null
  }

  async getUITemplates(tenantId: string): Promise<ServerUITemplate[]> {
    const rows = this.stmt('SELECT * FROM ui_templates WHERE tenant_id = ? ORDER BY name ASC').all(tenantId) as unknown as RawUITemplate[]
    return rows.map(r => this.mapUITemplate(r))
  }

  async copyUITemplate(id: string, newName: string): Promise<ServerUITemplate> {
    const src = await this.getUITemplate(id)
    if (!src) throw new Error('UI template not found')
    const { tenantId, mainBanner, gpcBanner, preferenceModal } = src
    return this.createUITemplate({ tenantId, name: newName, mainBanner, gpcBanner, preferenceModal })
  }

  // ── Profile summaries ──────────────────────────────────────────────────────

  private mapProfileSummary(r: RawProfileSummary): ProfileSummary {
    return {
      id: r.id,
      name: r.name,
      defaultLocale: r.default_locale,
      complianceGroup: (r.compliance_group ?? null) as ComplianceGroupId | null,
      version: r.version,
      isActive: r.is_active === 1,
      cookieTemplateName: r.cookie_template_name,
      uiTemplateName: r.ui_template_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  private readonly PROFILE_SUMMARY_SQL = `
    SELECT
      p.id, p.name, p.default_locale, p.version, p.created_at, p.updated_at,
      json_extract(p.profile_json, '$.complianceGroup') AS compliance_group,
      json_extract(p.profile_json, '$.isActive')        AS is_active,
      json_extract(p.profile_json, '$.cookieTemplateId') AS cookie_template_id,
      json_extract(p.profile_json, '$.uiTemplateId')     AS ui_template_id,
      ct.name AS cookie_template_name,
      ut.name AS ui_template_name
    FROM profiles p
    LEFT JOIN cookie_templates ct ON ct.id = json_extract(p.profile_json, '$.cookieTemplateId')
    LEFT JOIN ui_templates ut ON ut.id = json_extract(p.profile_json, '$.uiTemplateId')
  `

  async listProfilesSummary(tenantId: string): Promise<ProfileSummary[]> {
    const rows = this.stmt(
      `${this.PROFILE_SUMMARY_SQL} WHERE p.tenant_id = ? ORDER BY p.created_at ASC`
    ).all(tenantId) as unknown as RawProfileSummary[]
    return rows.map(r => this.mapProfileSummary(r))
  }

  async findProfilesUsingCookieTemplate(templateId: string): Promise<ProfileSummary[]> {
    const rows = this.stmt(
      `${this.PROFILE_SUMMARY_SQL} WHERE json_extract(p.profile_json, '$.cookieTemplateId') = ? ORDER BY p.name ASC`
    ).all(templateId) as unknown as RawProfileSummary[]
    return rows.map(r => this.mapProfileSummary(r))
  }

  async findProfilesUsingUITemplate(templateId: string): Promise<ProfileSummary[]> {
    const rows = this.stmt(
      `${this.PROFILE_SUMMARY_SQL} WHERE json_extract(p.profile_json, '$.uiTemplateId') = ? ORDER BY p.name ASC`
    ).all(templateId) as unknown as RawProfileSummary[]
    return rows.map(r => this.mapProfileSummary(r))
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getOptInStats(tenantId: string, filters: OptInFilters): Promise<OptInStats> {
    const conditions: string[] = ['cr.tenant_id = ?']
    const vals: (string | number | null)[] = [tenantId]
    if (filters.profileId) { conditions.push('cr.profile_id = ?'); vals.push(filters.profileId) }
    if (filters.from) { conditions.push('cr.created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('cr.created_at <= ?'); vals.push(filters.to) }
    if (filters.locale) { conditions.push('cr.locale = ?'); vals.push(filters.locale) }

    const where = conditions.join(' AND ')

    const rows = this.stmt(
      `SELECT cr.locale, cr.consent_json FROM consent_records cr WHERE ${where}`
    ).all(...vals) as unknown as { locale: string; consent_json: string }[]

    let total = 0, granted = 0, denied = 0, managed = 0
    const byLocale: Record<string, { total: number; granted: number; denied: number; managed: number }> = {}

    for (const r of rows) {
      const consent = JSON.parse(r.consent_json) as Record<string, string>
      const statuses = Object.values(consent)
      const grantedCount = statuses.filter(s => s === 'granted').length
      const deniedCount = statuses.filter(s => s === 'denied').length
      const grantedPct = statuses.length > 0 ? grantedCount / statuses.length : 0

      total++
      const loc = r.locale
      if (!byLocale[loc]) byLocale[loc] = { total: 0, granted: 0, denied: 0, managed: 0 }
      byLocale[loc]!.total++

      if (grantedPct >= 0.9) { granted++; byLocale[loc]!.granted++ }
      else if (deniedCount / (statuses.length || 1) >= 0.9) { denied++; byLocale[loc]!.denied++ }
      else { managed++; byLocale[loc]!.managed++ }
    }

    // byDate — aggregate by date(created_at)
    const dateRows = this.stmt(
      `SELECT date(cr.created_at) as d, cr.consent_json FROM consent_records cr WHERE ${where} ORDER BY d ASC`
    ).all(...vals) as unknown as { d: string; consent_json: string }[]

    const dateMap = new Map<string, { total: number; granted: number; denied: number; managed: number }>()
    for (const r of dateRows) {
      const entry = dateMap.get(r.d) ?? { total: 0, granted: 0, denied: 0, managed: 0 }
      const consent = JSON.parse(r.consent_json) as Record<string, string>
      const statuses = Object.values(consent)
      const grantedPct = statuses.length > 0 ? statuses.filter(s => s === 'granted').length / statuses.length : 0
      const deniedPct = statuses.length > 0 ? statuses.filter(s => s === 'denied').length / statuses.length : 0
      entry.total++
      if (grantedPct >= 0.9) entry.granted++
      else if (deniedPct >= 0.9) entry.denied++
      else entry.managed++
      dateMap.set(r.d, entry)
    }

    const byDate = Array.from(dateMap.entries()).map(([date, v]) => ({ date, ...v }))

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
