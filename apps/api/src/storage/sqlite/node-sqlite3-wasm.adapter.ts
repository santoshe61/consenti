import type { Database as DB, Statement } from 'node-sqlite3-wasm'

const MAX_PAGE_SIZE = 500
import { randomUUID, randomProfileId, randomVisitorId, randomConsentId, randomConsentTemplateId, randomUITemplateId } from '../../utils/crypto'
import { resolveStoragePaths } from '../../utils/storage-path'
import { SEED_SQL, SCHEMA_SQL_SQLITE } from '../seed-data'
import { likePrefix } from '../../utils/sql-search'
import type {
  StorageAdapter,
  StorageConfig,
  Profile,
  StoredProfileJson,
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
  TenantSettings,
  ServerConsentTemplate,
  ServerUITemplate,
  CreateConsentTemplateInput,
  UpdateConsentTemplateInput,
  CreateUITemplateInput,
  UpdateUITemplateInput,
  ProfileSummary,
  OptInStats,
  OptInFilters,
  ComplianceGroupId,
  NoticeShownRecord,
  CreateNoticeShownInput,
  PagedResult,
} from '@consenti/types'

interface RawProfile {
  id: string; tenant_id: string; name: string; default_locale: string
  version: number; profile_json: string
  created_at: string; updated_at: string
}
interface RawConsent {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; consent_json: string
  gpc_detected: number; source: string; created_at: string; updated_at: string
  age_verified?: number; parental_consent_token?: string | null; tcf_string?: string | null
  signature?: string | null
}
interface RawConsentSummary {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; gpc_detected: number; source: string
  age_verified?: number; created_at: string; updated_at: string
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
interface RawNoticeShown {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; created_at: string
}
interface RawUser {
  id: string; tenant_id: string; name: string; email: string
  password_hash: string; is_active: number; created_at: string; updated_at: string
  totp_secret?: string | null; totp_enabled?: number
  allowed_tenants?: string | null
}
interface RawProfileSummary {
  id: string; name: string; default_locale: string
  compliance_group: string | null; custom_compliance_group: string | null; is_active: number
  consent_template_name: string | null; ui_template_name: string | null
  created_at: string; updated_at: string
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
interface RawAuditLogSummary {
  id: string; tenant_id: string; user_id: string | null; action: string
  resource_type: string; resource_id: string | null; created_at: string
}
interface RawCount { total: number }
interface RawTenant {
  id: string; name: string; slug: string; created_at: string; updated_at: string
}
interface RawApiKey {
  id: string; tenant_id: string; key_hash: string; name: string; is_active: number
  created_by: string | null; expire_by: string | null; created_at: string; updated_at: string | null
}
interface RawConsentTemplate {
  id: string; tenant_id: string; name: string; cookies_json: string; categories_json: string; created_at: string; updated_at: string
}
interface RawUITemplate {
  id: string; tenant_id: string; name: string; settings_json: string; created_at: string; updated_at: string
}


// node-sqlite3-wasm statements are NOT garbage-collected — they must be
// finalized explicitly. All cached statements are finalized in disconnect().
// Parameter binding uses run(array) / all(array) — not spread — per the WASM API.

type Val = string | number | null

export class NodeSqlite3WasmAdapter implements StorageAdapter {
  private db!: DB
  private cache = new Map<string, Statement>()

  constructor(private config: StorageConfig) { }

  private stmt(sql: string): Statement {
    let s = this.cache.get(sql)
    if (!s) { s = this.db.prepare(sql); this.cache.set(sql, s) }
    return s
  }

  async connect(): Promise<void> {
    // Lazy: only loaded when this driver is actually selected — allows the package
    // to be an optional peer dep without crashing on startup for other drivers.
    const mod = await import('node-sqlite3-wasm').catch(() => {
      throw new Error("driver 'node-sqlite3-wasm' requires: npm install node-sqlite3-wasm")
    }) as { default: { Database: new (path: string) => DB } }
    const { dbPath } = resolveStoragePaths(this.config.path ?? './consenti-data', 'node-sqlite3-wasm')
    this.db = new mod.default.Database(dbPath)
    this.db.exec('PRAGMA journal_mode=WAL')
    this.db.exec('PRAGMA foreign_keys=ON')
    this.db.exec('PRAGMA synchronous=NORMAL')
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    // Finalize all prepared statements before closing — WASM objects are not
    // GC'd and will leak if not explicitly freed.
    for (const stmt of this.cache.values()) {
      stmt.finalize()
    }
    this.cache.clear()
    this.db.close()
  }

  async migrate(): Promise<void> {
    // No installations predate this schema, so a fresh connect always creates the full current
    // table set in one pass — no incremental/versioned steps needed. `PRAGMA user_version` is
    // kept as the hook for whenever a *real* future migration is needed: add `if (ver < N)`
    // blocks below the initial creation, the same shape as the removed historical ones.
    const row = this.stmt('PRAGMA user_version').get() as { user_version: number } | null
    const ver = row?.user_version ?? 0
    if (ver < 1) {
      this.db.exec(SCHEMA_SQL_SQLITE)
      this.db.exec(SEED_SQL)
      this.db.exec('PRAGMA user_version = 1')
    }

    // Plain-column indexes (tenant_id, created_at, visitor_id, etc.) are generated into
    // SCHEMA_SQL_SQLITE from seed-data.ts's declarative `idx` field — see the `if` block above.
    // Only the JSON-expression index below survives here: SQLite's json_extract() functional
    // index has no equivalent representation across the Postgres/MySQL/Mongo dialects, so it
    // can't live in the shared declarative system.
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_tenant_compliance_active
        ON profiles (tenant_id, json_extract(profile_json,'$.complianceGroup'), json_extract(profile_json,'$.isActive'));
    `)
  }

  // ── Profiles ──────────────────────────────────────────────────────────────

  private mapProfile(row: RawProfile): Profile {
    return {
      id: row.id, tenantId: row.tenant_id, name: row.name,
      defaultLocale: row.default_locale, version: row.version,
      profileJson: JSON.parse(row.profile_json) as StoredProfileJson,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }
  }

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const id = randomProfileId()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO profiles (id,tenant_id,name,default_locale,version,profile_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run([id, data.tenantId, data.name, data.defaultLocale, 1, JSON.stringify(data.profileJson), now, now])
    const profile = await this.getProfile(id)
    if (!profile) throw new Error('Failed to create profile')
    return profile
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const existing = await this.getProfile(id)
    if (!existing) throw new Error(`Profile ${id} not found`)
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?']
    const vals: Val[] = [now]
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.defaultLocale != null) { fields.push('default_locale = ?'); vals.push(data.defaultLocale) }
    if (data.profileJson != null) { fields.push('profile_json = ?'); vals.push(JSON.stringify(data.profileJson)) }
    if (data.version != null) { fields.push('version = ?'); vals.push(data.version) }
    vals.push(id)
    this.stmt(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).run(vals)
    const updated = await this.getProfile(id)
    if (!updated) throw new Error('Failed to update profile')
    return updated
  }

  async deleteProfile(id: string): Promise<void> {
    this.stmt('DELETE FROM profiles WHERE id = ?').run(id)
  }

  async getProfile(id: string): Promise<Profile | null> {
    const row = this.stmt('SELECT * FROM profiles WHERE id = ?').get(id) as RawProfile | null
    return row ? this.mapProfile(row) : null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    const rows = this.stmt('SELECT * FROM profiles WHERE tenant_id = ? ORDER BY created_at ASC').all(tenantId) as unknown as RawProfile[]
    return rows.map(r => this.mapProfile(r))
  }

  async findActiveProfileByComplianceGroup(tenantId: string, complianceGroup: string): Promise<Profile | null> {
    // Fetch all tenant profiles and filter in memory — wasm Statement.get() only accepts a single bind value
    const profiles = await this.getProfiles(tenantId)
    return profiles.find(p =>
      (p.profileJson.complianceGroup === complianceGroup || (p.profileJson as { customComplianceGroup?: string }).customComplianceGroup === complianceGroup) &&
      p.profileJson.isActive
    ) ?? null
  }

  // ── Consents ──────────────────────────────────────────────────────────────

  private mapConsent(row: RawConsent): ConsentDbRecord {
    return {
      id: row.id, tenantId: row.tenant_id, visitorId: row.visitor_id,
      profileId: row.profile_id,
      locale: row.locale, consentJson: JSON.parse(row.consent_json) as ConsentValue,
      gpcDetected: row.gpc_detected === 1,
      source: row.source as ConsentDbRecord['source'],
      ...(row.age_verified != null && row.age_verified !== 0 ? { ageVerified: true } : {}),
      ...(row.parental_consent_token != null ? { parentalConsentToken: row.parental_consent_token } : {}),
      ...(row.tcf_string != null ? { tcfString: row.tcf_string } : {}),
      ...(row.signature != null ? { signature: row.signature } : {}),
      createdAt: row.created_at, updatedAt: row.updated_at,
    }
  }

  private static readonly CONSENT_SUMMARY_COLS =
    'id, tenant_id, visitor_id, profile_id, locale, gpc_detected, source, age_verified, created_at, updated_at'

  private mapConsentSummary(row: RawConsentSummary): ConsentSummary {
    return {
      id: row.id, tenantId: row.tenant_id, visitorId: row.visitor_id, profileId: row.profile_id,
      locale: row.locale, gpcDetected: row.gpc_detected === 1, source: row.source as ConsentDbRecord['source'],
      ...(row.age_verified != null && row.age_verified !== 0 ? { ageVerified: true } : {}),
      createdAt: row.created_at, updatedAt: row.updated_at,
    }
  }

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const id = randomConsentId()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO consent_records (id,tenant_id,visitor_id,profile_id,locale,consent_json,gpc_detected,source,age_verified,parental_consent_token,tcf_string,signature,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run([id, data.tenantId, data.visitorId, data.profileId, data.locale, JSON.stringify(data.consentJson), data.gpcDetected ? 1 : 0, data.source, data.ageVerified ? 1 : 0, data.parentalConsentToken ?? null, data.tcfString ?? null, data.signature ?? null, now, now])
    const histId = randomUUID()
    this.stmt(
      'INSERT INTO consent_history (id,tenant_id,consent_record_id,visitor_id,old_json,new_json,action,created_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run([histId, data.tenantId, id, data.visitorId, null, JSON.stringify(data.consentJson), 'created', now])
    const record = await this.getConsent(data.visitorId)
    if (!record) throw new Error('Failed to create consent')
    return record
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.getConsent(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?', 'consent_json = ?']
    const vals: Val[] = [now, JSON.stringify(data.consentJson)]
    if (data.locale != null) { fields.push('locale = ?'); vals.push(data.locale) }
    if (data.gpcDetected != null) { fields.push('gpc_detected = ?'); vals.push(data.gpcDetected ? 1 : 0) }
    if (data.signature != null) { fields.push('signature = ?'); vals.push(data.signature) }
    vals.push(visitorId)
    this.stmt(`UPDATE consent_records SET ${fields.join(', ')} WHERE visitor_id = ?`).run(vals)
    const histId = randomUUID()
    this.stmt(
      'INSERT INTO consent_history (id,tenant_id,consent_record_id,visitor_id,old_json,new_json,action,created_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run([histId, existing.tenantId, existing.id, visitorId, JSON.stringify(existing.consentJson), JSON.stringify(data.consentJson), 'updated', now])
    const updated = await this.getConsent(visitorId)
    if (!updated) throw new Error('Failed to update consent')
    return updated
  }

  async deleteConsent(visitorId: string): Promise<void> {
    this.stmt('DELETE FROM consent_history WHERE visitor_id = ?').run(visitorId)
    this.stmt('DELETE FROM consent_records WHERE visitor_id = ?').run(visitorId)
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    const row = this.stmt('SELECT * FROM consent_records WHERE visitor_id = ?').get(visitorId) as RawConsent | null
    return row ? this.mapConsent(row) : null
  }

  async getConsents(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: Val[] = [filters.tenantId]
    if (filters.profileId) { conditions.push('profile_id = ?'); vals.push(filters.profileId) }
    if (filters.from) { conditions.push('created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('created_at <= ?'); vals.push(filters.to) }
    if (filters.q) {
      conditions.push("(visitor_id LIKE ? OR profile_id LIKE ? OR locale LIKE ? OR source LIKE ?) ESCAPE '\\'")
      const like = likePrefix(filters.q)
      vals.push(like, like, like, like)
    }
    const where = conditions.join(' AND ')
    const page = filters.page ?? 1
    const limit = Math.min(filters.limit ?? 50, MAX_PAGE_SIZE)
    const offset = (page - 1) * limit
    const rows = this.stmt(
      `SELECT ${NodeSqlite3WasmAdapter.CONSENT_SUMMARY_COLS} FROM consent_records WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all([...vals, limit, offset]) as unknown as RawConsentSummary[]
    const countRow = this.stmt(`SELECT COUNT(*) AS total FROM consent_records WHERE ${where}`).get(vals) as unknown as RawCount | null
    return { items: rows.map(r => this.mapConsentSummary(r)), total: countRow?.total ?? 0, page, limit }
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    const pageSize = 500
    let offset = 0
    while (true) {
      const rows = this.stmt(
        'SELECT * FROM consent_records WHERE tenant_id = ? LIMIT ? OFFSET ?'
      ).all([filters.tenantId, pageSize, offset]) as unknown as RawConsent[]
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
      id: r.id, tenantId: r.tenant_id, consentRecordId: r.consent_record_id,
      visitorId: r.visitor_id,
      oldJson: r.old_json != null ? JSON.parse(r.old_json) as ConsentValue : null,
      newJson: JSON.parse(r.new_json) as ConsentValue,
      action: r.action as ConsentHistoryEntry['action'],
      createdAt: r.created_at,
    }))
  }

  async createNoticeShown(data: CreateNoticeShownInput): Promise<NoticeShownRecord> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO notice_shown (id,tenant_id,visitor_id,profile_id,locale,created_at) VALUES (?,?,?,?,?,?)'
    ).run([id, data.tenantId, data.visitorId, data.profileId, data.locale, now])
    return { id, tenantId: data.tenantId, visitorId: data.visitorId, profileId: data.profileId, locale: data.locale, createdAt: now }
  }

  async getNoticeShownForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    const rows = this.stmt(
      'SELECT * FROM notice_shown WHERE visitor_id = ? ORDER BY created_at DESC'
    ).all(visitorId) as unknown as RawNoticeShown[]
    return rows.map(r => ({
      id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id,
      profileId: r.profile_id, locale: r.locale, createdAt: r.created_at,
    }))
  }

  // ── Visitors ──────────────────────────────────────────────────────────────

  private mapVisitor(row: RawVisitor): Visitor {
    return {
      id: row.id, tenantId: row.tenant_id, visitorId: row.visitor_id,
      firstSeen: row.first_seen, lastSeen: row.last_seen,
      ...(row.country != null ? { country: row.country } : {}),
      ...(row.region != null ? { region: row.region } : {}),
      ...(row.city != null ? { city: row.city } : {}),
      ...(row.ip_hash != null ? { ipHash: row.ip_hash } : {}),
      ...(row.user_agent_hash != null ? { userAgentHash: row.user_agent_hash } : {}),
    }
  }

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const id = randomVisitorId()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO visitors (id,tenant_id,visitor_id,country,region,city,ip_hash,user_agent_hash,first_seen,last_seen) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run([id, data.tenantId, data.visitorId, data.country ?? null, data.region ?? null, data.city ?? null, data.ipHash ?? null, data.userAgentHash ?? null, now, now])
    const visitor = await this.getVisitor(data.visitorId)
    if (!visitor) throw new Error('Failed to create visitor')
    return visitor
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const now = new Date().toISOString()
    const fields: string[] = ['last_seen = ?']
    const vals: Val[] = [data.lastSeen ?? now]
    if (data.country != null) { fields.push('country = ?'); vals.push(data.country) }
    if (data.region != null) { fields.push('region = ?'); vals.push(data.region) }
    if (data.city != null) { fields.push('city = ?'); vals.push(data.city) }
    vals.push(visitorId)
    this.stmt(`UPDATE visitors SET ${fields.join(', ')} WHERE visitor_id = ?`).run(vals)
    const visitor = await this.getVisitor(visitorId)
    if (!visitor) throw new Error(`Visitor ${visitorId} not found`)
    return visitor
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    this.stmt('DELETE FROM visitors WHERE visitor_id = ?').run(visitorId)
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    const row = this.stmt('SELECT * FROM visitors WHERE visitor_id = ?').get(visitorId) as RawVisitor | null
    return row ? this.mapVisitor(row) : null
  }

  async getVisitors(filters: VisitorFilters): Promise<PagedResult<Visitor>> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: Val[] = [filters.tenantId]
    if (filters.from) { conditions.push('first_seen >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('first_seen <= ?'); vals.push(filters.to) }
    if (filters.q) {
      conditions.push("(visitor_id LIKE ? OR country LIKE ?) ESCAPE '\\'")
      const like = likePrefix(filters.q)
      vals.push(like, like)
    }
    const where = conditions.join(' AND ')
    const page = filters.page ?? 1
    const limit = Math.min(filters.limit ?? 50, MAX_PAGE_SIZE)
    const offset = (page - 1) * limit
    const rows = this.stmt(
      `SELECT * FROM visitors WHERE ${where} ORDER BY last_seen DESC LIMIT ? OFFSET ?`
    ).all([...vals, limit, offset]) as unknown as RawVisitor[]
    const countRow = this.stmt(`SELECT COUNT(*) AS total FROM visitors WHERE ${where}`).get(vals) as unknown as RawCount | null
    return { items: rows.map(r => this.mapVisitor(r)), total: countRow?.total ?? 0, page, limit }
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  private mapUser(row: RawUser): AdminUser {
    const allowedTenants: string[] = row.allowed_tenants
      ? JSON.parse(row.allowed_tenants) as string[]
      : []
    return {
      id: row.id, tenantId: row.tenant_id, name: row.name, email: row.email,
      passwordHash: row.password_hash, isActive: row.is_active === 1,
      totpEnabled: row.totp_enabled === 1,
      ...(row.totp_secret != null ? { totpSecret: row.totp_secret } : {}),
      allowedTenants,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }
  }

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const allowedTenantsJson = data.allowedTenants?.length ? JSON.stringify(data.allowedTenants) : null
    this.stmt(
      'INSERT INTO users (id,tenant_id,name,email,password_hash,allowed_tenants,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
    ).run([id, data.tenantId, data.name, data.email, data.passwordHash, allowedTenantsJson, now, now])
    const user = await this.getUserByEmail(data.email)
    if (!user) throw new Error('Failed to create user')
    return user
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?']
    const vals: Val[] = [now]
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
    this.stmt(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(vals)
    const row = this.stmt('SELECT * FROM users WHERE id = ?').get(id) as RawUser | null
    if (!row) throw new Error(`User ${id} not found`)
    return this.mapUser(row)
  }

  async deleteUser(id: string): Promise<void> {
    this.stmt('DELETE FROM user_roles WHERE user_id = ?').run(id)
    this.stmt('DELETE FROM users WHERE id = ?').run(id)
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const row = this.stmt('SELECT * FROM users WHERE id = ?').get(id) as RawUser | null
    return row ? this.mapUser(row) : null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    const row = this.stmt('SELECT * FROM users WHERE email = ?').get(email) as RawUser | null
    return row ? this.mapUser(row) : null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    const rows = this.stmt('SELECT * FROM users WHERE tenant_id = ? ORDER BY created_at ASC').all(tenantId) as unknown as RawUser[]
    return rows.map(r => this.mapUser(r))
  }

  async countUsers(tenantId?: string): Promise<number> {
    const row = tenantId
      ? this.stmt('SELECT COUNT(*) as n FROM users WHERE tenant_id = ?').get(tenantId) as { n: number } | null
      : this.stmt('SELECT COUNT(*) as n FROM users').get() as { n: number } | null
    return row?.n ?? 0
  }

  // ── Roles & Permissions ───────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    const rows = this.stmt('SELECT * FROM roles WHERE tenant_id = ?').all(tenantId) as unknown as RawRole[]
    return rows.map(r => ({ id: r.id, tenantId: r.tenant_id, name: r.name, ...(r.description != null ? { description: r.description } : {}) }))
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const id = randomUUID()
    this.stmt('INSERT INTO roles (id,tenant_id,name,description) VALUES (?,?,?,?)').run(
      [id, data.tenantId, data.name, data.description ?? null]
    )
    const row = this.stmt('SELECT * FROM roles WHERE id = ?').get(id) as RawRole | null
    if (!row) throw new Error('Failed to create role')
    return { id: row.id, tenantId: row.tenant_id, name: row.name, ...(row.description != null ? { description: row.description } : {}) }
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const fields: string[] = []
    const vals: Val[] = []
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.description != null) { fields.push('description = ?'); vals.push(data.description) }
    if (fields.length > 0) {
      vals.push(id)
      this.stmt(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`).run(vals)
    }
    const row = this.stmt('SELECT * FROM roles WHERE id = ?').get(id) as RawRole | null
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
    this.stmt('INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)').run([roleId, permissionId])
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    this.stmt('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run([roleId, permissionId])
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rows = this.stmt(
      'SELECT p.* FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ?'
    ).all(roleId) as unknown as RawPermission[]
    return rows.map(r => ({ id: r.id, name: r.name, ...(r.description != null ? { description: r.description } : {}) }))
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    const rows = tenantId
      ? this.stmt(
        'SELECT r.* FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? AND ur.tenant_id = ?'
      ).all([userId, tenantId]) as unknown as RawRole[]
      : this.stmt(
        'SELECT r.* FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?'
      ).all(userId) as unknown as RawRole[]
    return rows.map(r => ({ id: r.id, tenantId: r.tenant_id, name: r.name, ...(r.description != null ? { description: r.description } : {}) }))
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    this.stmt('INSERT OR IGNORE INTO user_roles (user_id, role_id, tenant_id) VALUES (?,?,?)').run([userId, roleId, tenantId])
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      this.stmt('DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND tenant_id = ?').run([userId, roleId, tenantId])
    } else {
      this.stmt('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?').run([userId, roleId])
    }
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt(
      'INSERT INTO audit_logs (id,tenant_id,user_id,action,resource_type,resource_id,old_data,new_data,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run([
      id, data.tenantId, data.userId ?? null, data.action, data.resourceType,
      data.resourceId ?? null,
      data.oldData != null ? JSON.stringify(data.oldData) : null,
      data.newData != null ? JSON.stringify(data.newData) : null,
      now,
    ])
  }

  async getLogs(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    const conditions: string[] = ['tenant_id = ?']
    const vals: Val[] = [filters.tenantId]
    if (filters.action) { conditions.push('action = ?'); vals.push(filters.action) }
    if (filters.resourceType) { conditions.push('resource_type = ?'); vals.push(filters.resourceType) }
    if (filters.from) { conditions.push('created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('created_at <= ?'); vals.push(filters.to) }
    if (filters.q) {
      conditions.push("(action LIKE ? OR resource_type LIKE ? OR resource_id LIKE ? OR user_id LIKE ?) ESCAPE '\\'")
      const like = likePrefix(filters.q)
      vals.push(like, like, like, like)
    }
    const where = conditions.join(' AND ')
    const page = filters.page ?? 1
    const limit = Math.min(filters.limit ?? 50, MAX_PAGE_SIZE)
    const offset = (page - 1) * limit
    const rows = this.stmt(
      `SELECT ${NodeSqlite3WasmAdapter.AUDIT_SUMMARY_COLS} FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all([...vals, limit, offset]) as unknown as RawAuditLogSummary[]
    const countRow = this.stmt(`SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`).get(vals) as unknown as RawCount | null
    return { items: rows.map(r => this.mapAuditSummary(r)), total: countRow?.total ?? 0, page, limit }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const row = this.stmt('SELECT * FROM audit_logs WHERE id = ?').get(id) as RawAuditLog | null
    return row ? this.mapAuditLog(row) : null
  }

  private static readonly AUDIT_SUMMARY_COLS = 'id, tenant_id, user_id, action, resource_type, resource_id, created_at'

  private mapAuditSummary(r: RawAuditLogSummary): AuditLogSummary {
    return {
      id: r.id, tenantId: r.tenant_id, action: r.action, resourceType: r.resource_type,
      ...(r.user_id != null ? { userId: r.user_id } : {}),
      ...(r.resource_id != null ? { resourceId: r.resource_id } : {}),
      createdAt: r.created_at,
    }
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
    const vals: Val[] = [filters.tenantId]
    if (filters.action) { conditions.push('action = ?'); vals.push(filters.action) }
    if (filters.from) { conditions.push('created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('created_at <= ?'); vals.push(filters.to) }
    const pageSize = 500
    let offset = 0
    while (true) {
      const rows = this.stmt(
        `SELECT * FROM audit_logs WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).all([...vals, pageSize, offset]) as unknown as RawAuditLog[]
      if (rows.length === 0) break
      for (const row of rows) yield this.mapAuditLog(row)
      offset += pageSize
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const tc = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ?').get(tenantId) as { n: number } | null
    const gc = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ? AND gpc_detected = 1').get(tenantId) as { n: number } | null
    const vc = this.stmt('SELECT COUNT(*) as n FROM visitors WHERE tenant_id = ?').get(tenantId) as { n: number } | null
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
    ).all([tenantId, `-${days} days`]) as unknown as { date: string; count: number }[]
    return rows.map(r => ({ date: r.date, count: r.count }))
  }

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const rows = this.stmt(
      `SELECT v.country, COUNT(*) as count FROM consent_records cr JOIN visitors v ON v.visitor_id = cr.visitor_id WHERE cr.tenant_id = ? AND v.country IS NOT NULL GROUP BY v.country ORDER BY count DESC LIMIT 50`
    ).all(tenantId) as unknown as { country: string; count: number }[]
    return rows.map(r => ({ country: r.country, count: r.count }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const total = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ?').get(tenantId) as { n: number } | null
    const detected = this.stmt('SELECT COUNT(*) as n FROM consent_records WHERE tenant_id = ? AND gpc_detected = 1').get(tenantId) as { n: number } | null
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
    this.stmt('INSERT INTO tenants (id,name,slug,created_at,updated_at) VALUES (?,?,?,?,?)').run([id, data.name, data.slug, now, now])
    const row = this.stmt('SELECT * FROM tenants WHERE id = ?').get(id) as RawTenant | null
    if (!row) throw new Error('Failed to create tenant')
    return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const now = new Date().toISOString()
    const fields: string[] = ['updated_at = ?']
    const vals: Val[] = [now]
    if (data.name != null) { fields.push('name = ?'); vals.push(data.name) }
    if (data.slug != null) { fields.push('slug = ?'); vals.push(data.slug) }
    vals.push(id)
    this.stmt(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).run(vals)
    const row = this.stmt('SELECT * FROM tenants WHERE id = ?').get(id) as RawTenant | null
    if (!row) throw new Error(`Tenant ${id} not found`)
    return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at, updatedAt: row.updated_at }
  }

  async deleteTenant(id: string): Promise<void> {
    this.stmt('DELETE FROM tenants WHERE id = ?').run(id)
  }

  async getSettings(tenantId: string): Promise<TenantSettings> {
    const row = this.stmt('SELECT allowed_origins_json, admin_allowed_origins_json, setup_completed FROM tenant_settings WHERE tenant_id = ?')
      .get(tenantId) as { allowed_origins_json: string; admin_allowed_origins_json: string; setup_completed: number } | null
    return row
      ? {
        allowedOrigins: JSON.parse(row.allowed_origins_json) as string[],
        adminAllowedOrigins: JSON.parse(row.admin_allowed_origins_json) as string[],
        setupCompleted: !!row.setup_completed,
      }
      : {}
  }

  async updateSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings> {
    const current = await this.getSettings(tenantId)
    const merged = { ...current, ...data }
    this.stmt(
      `INSERT INTO tenant_settings (tenant_id, allowed_origins_json, admin_allowed_origins_json, setup_completed, updated_at) VALUES (?,?,?,?,?)
       ON CONFLICT(tenant_id) DO UPDATE SET allowed_origins_json = excluded.allowed_origins_json, admin_allowed_origins_json = excluded.admin_allowed_origins_json, setup_completed = excluded.setup_completed, updated_at = excluded.updated_at`,
    ).run([tenantId, JSON.stringify(merged.allowedOrigins ?? []), JSON.stringify(merged.adminAllowedOrigins ?? []), merged.setupCompleted ? 1 : 0, new Date().toISOString()])
    return this.getSettings(tenantId)
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

  async purgeExpiredAuditLogs(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const { count } = this.stmt('SELECT COUNT(*) AS count FROM audit_logs WHERE created_at < ?').get(cutoff) as { count: number }
    this.stmt('DELETE FROM audit_logs WHERE created_at < ?').run(cutoff)
    return count
  }

  // ── API Keys ───────────────────────────────────────────────────────────────

  private mapApiKey(r: RawApiKey): ApiKey {
    return {
      id: r.id, tenantId: r.tenant_id, keyHash: r.key_hash, name: r.name, isActive: r.is_active === 1,
      ...(r.created_by !== null ? { createdBy: r.created_by } : {}),
      ...(r.expire_by !== null ? { expireBy: r.expire_by } : {}),
      createdAt: r.created_at,
      ...(r.updated_at !== null ? { updatedAt: r.updated_at } : {}),
    }
  }

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.stmt('INSERT INTO api_keys (id,tenant_id,key_hash,name,created_by,expire_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
      .run([id, data.tenantId, data.keyHash, data.name, data.createdBy ?? null, data.expireBy ?? null, now, now])
    const row = this.stmt('SELECT * FROM api_keys WHERE id = ?').get(id) as RawApiKey | null
    if (!row) throw new Error('Failed to create API key')
    return this.mapApiKey(row)
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const row = this.stmt('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1').get(keyHash) as RawApiKey | null
    return row ? this.mapApiKey(row) : null
  }

  async revokeApiKey(id: string): Promise<void> {
    this.stmt('UPDATE api_keys SET is_active = 0, updated_at = ? WHERE id = ?').run([new Date().toISOString(), id])
  }

  async reactivateApiKey(id: string): Promise<void> {
    const now = new Date().toISOString()
    this.stmt(
      'UPDATE api_keys SET is_active = 1, updated_at = ?, expire_by = CASE WHEN expire_by <= ? THEN NULL ELSE expire_by END WHERE id = ?',
    ).run([now, now, id])
  }

  async deleteApiKey(id: string): Promise<void> {
    this.stmt('DELETE FROM api_keys WHERE id = ?').run([id])
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const rows = this.stmt('SELECT * FROM api_keys WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId) as unknown as RawApiKey[]
    return rows.map(r => this.mapApiKey(r))
  }

  // ── Consent Templates ──────────────────────────────────────────────────────

  private mapConsentTemplate(r: RawConsentTemplate): ServerConsentTemplate {
    return { id: r.id, tenantId: r.tenant_id, name: r.name, cookies: JSON.parse(r.cookies_json), categories: JSON.parse(r.categories_json), createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async createConsentTemplate(data: CreateConsentTemplateInput): Promise<ServerConsentTemplate> {
    const id = randomConsentTemplateId()
    const now = new Date().toISOString()
    this.stmt('INSERT INTO consent_templates (id,tenant_id,name,cookies_json,categories_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run([id, data.tenantId, data.name, JSON.stringify(data.cookies), JSON.stringify(data.categories), now, now])
    return this.mapConsentTemplate(this.stmt('SELECT * FROM consent_templates WHERE id = ?').get(id) as unknown as RawConsentTemplate)
  }

  async updateConsentTemplate(id: string, data: UpdateConsentTemplateInput): Promise<ServerConsentTemplate> {
    const now = new Date().toISOString()
    if (data.name !== undefined) this.stmt('UPDATE consent_templates SET name = ?, updated_at = ? WHERE id = ?').run([data.name, now, id])
    if (data.cookies !== undefined) this.stmt('UPDATE consent_templates SET cookies_json = ?, updated_at = ? WHERE id = ?').run([JSON.stringify(data.cookies), now, id])
    if (data.categories !== undefined) this.stmt('UPDATE consent_templates SET categories_json = ?, updated_at = ? WHERE id = ?').run([JSON.stringify(data.categories), now, id])
    const row = this.stmt('SELECT * FROM consent_templates WHERE id = ?').get(id) as RawConsentTemplate | null
    if (!row) throw new Error('Consent template not found')
    return this.mapConsentTemplate(row)
  }

  async deleteConsentTemplate(id: string): Promise<void> {
    this.stmt('DELETE FROM consent_templates WHERE id = ?').run(id)
  }

  async getConsentTemplate(id: string): Promise<ServerConsentTemplate | null> {
    const row = this.stmt('SELECT * FROM consent_templates WHERE id = ?').get(id) as RawConsentTemplate | null
    return row ? this.mapConsentTemplate(row) : null
  }

  async getConsentTemplates(tenantId: string): Promise<ServerConsentTemplate[]> {
    const rows = this.stmt('SELECT * FROM consent_templates WHERE tenant_id = ? ORDER BY name ASC').all(tenantId) as unknown as RawConsentTemplate[]
    return rows.map(r => this.mapConsentTemplate(r))
  }

  async copyConsentTemplate(id: string, newName: string): Promise<ServerConsentTemplate> {
    const src = await this.getConsentTemplate(id)
    if (!src) throw new Error('Consent template not found')
    return this.createConsentTemplate({ tenantId: src.tenantId, name: newName, cookies: src.cookies, categories: src.categories })
  }

  // ── UI Templates ───────────────────────────────────────────────────────────

  private mapUITemplate(r: RawUITemplate): ServerUITemplate {
    const s = JSON.parse(r.settings_json) as Omit<ServerUITemplate, 'id' | 'tenantId' | 'name' | 'createdAt' | 'updatedAt'>
    return { id: r.id, tenantId: r.tenant_id, name: r.name, ...s, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async createUITemplate(data: CreateUITemplateInput): Promise<ServerUITemplate> {
    const id = randomUITemplateId()
    const now = new Date().toISOString()
    const { tenantId, name, ...settings } = data
    this.stmt('INSERT INTO ui_templates (id,tenant_id,name,settings_json,created_at,updated_at) VALUES (?,?,?,?,?,?)').run([id, tenantId, name, JSON.stringify(settings), now, now])
    return this.mapUITemplate(this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as unknown as RawUITemplate)
  }

  async updateUITemplate(id: string, data: UpdateUITemplateInput): Promise<ServerUITemplate> {
    const now = new Date().toISOString()
    const row = this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as RawUITemplate | null
    if (!row) throw new Error('UI template not found')
    if (data.name !== undefined) this.stmt('UPDATE ui_templates SET name = ?, updated_at = ? WHERE id = ?').run([data.name, now, id])
    const { name: _n, ...settingsUpdate } = data
    if (Object.keys(settingsUpdate).length > 0) {
      const current = JSON.parse(row.settings_json) as Record<string, unknown>
      const merged = { ...current, ...settingsUpdate }
      this.stmt('UPDATE ui_templates SET settings_json = ?, updated_at = ? WHERE id = ?').run([JSON.stringify(merged), now, id])
    }
    return this.mapUITemplate(this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as unknown as RawUITemplate)
  }

  async deleteUITemplate(id: string): Promise<void> {
    this.stmt('DELETE FROM ui_templates WHERE id = ?').run(id)
  }

  async getUITemplate(id: string): Promise<ServerUITemplate | null> {
    const row = this.stmt('SELECT * FROM ui_templates WHERE id = ?').get(id) as RawUITemplate | null
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
      customComplianceGroup: r.custom_compliance_group ?? null,
      isActive: r.is_active === 1,
      consentTemplateName: r.consent_template_name,
      uiTemplateName: r.ui_template_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  private readonly PROFILE_SUMMARY_SQL = `
    SELECT
      p.id, p.name, p.default_locale, p.created_at, p.updated_at,
      json_extract(p.profile_json, '$.complianceGroup') AS compliance_group,
      json_extract(p.profile_json, '$.customComplianceGroup') AS custom_compliance_group,
      json_extract(p.profile_json, '$.isActive')        AS is_active,
      json_extract(p.profile_json, '$.consentTemplateId') AS consent_template_id,
      json_extract(p.profile_json, '$.uiTemplateId')     AS ui_template_id,
      ct.name AS consent_template_name,
      ut.name AS ui_template_name
    FROM profiles p
    LEFT JOIN consent_templates ct ON ct.id = json_extract(p.profile_json, '$.consentTemplateId')
    LEFT JOIN ui_templates ut ON ut.id = json_extract(p.profile_json, '$.uiTemplateId')
  `

  async listProfilesSummary(tenantId: string): Promise<ProfileSummary[]> {
    const rows = this.stmt(
      `${this.PROFILE_SUMMARY_SQL} WHERE p.tenant_id = ? ORDER BY p.created_at ASC`
    ).all(tenantId) as unknown as RawProfileSummary[]
    return rows.map(r => this.mapProfileSummary(r))
  }

  async findProfilesUsingConsentTemplate(templateId: string): Promise<ProfileSummary[]> {
    const rows = this.stmt(
      `${this.PROFILE_SUMMARY_SQL} WHERE json_extract(p.profile_json, '$.consentTemplateId') = ? ORDER BY p.name ASC`
    ).all(templateId) as unknown as RawProfileSummary[]
    return rows.map(r => this.mapProfileSummary(r))
  }

  async findProfilesUsingUITemplate(templateId: string): Promise<ProfileSummary[]> {
    const rows = this.stmt(
      `${this.PROFILE_SUMMARY_SQL} WHERE json_extract(p.profile_json, '$.uiTemplateId') = ? ORDER BY p.name ASC`
    ).all(templateId) as unknown as RawProfileSummary[]
    return rows.map(r => this.mapProfileSummary(r))
  }

  async getOptInStats(tenantId: string, filters: OptInFilters): Promise<OptInStats> {
    const conditions: string[] = ['cr.tenant_id = ?']
    const vals: Val[] = [tenantId]
    if (filters.profileId) { conditions.push('cr.profile_id = ?'); vals.push(filters.profileId) }
    if (filters.from) { conditions.push('cr.created_at >= ?'); vals.push(filters.from) }
    if (filters.to) { conditions.push('cr.created_at <= ?'); vals.push(filters.to) }
    if (filters.locale) { conditions.push('cr.locale = ?'); vals.push(filters.locale) }
    const where = conditions.join(' AND ')

    const rows = this.stmt(
      `SELECT cr.locale, cr.consent_json FROM consent_records cr WHERE ${where}`
    ).all(vals) as unknown as { locale: string; consent_json: string }[]

    let total = 0, granted = 0, denied = 0, managed = 0
    const byLocale: Record<string, { total: number; granted: number; denied: number; managed: number }> = {}

    for (const r of rows) {
      const statuses = Object.values(JSON.parse(r.consent_json) as Record<string, string>)
      const grantedPct = statuses.length > 0 ? statuses.filter(s => s === 'granted').length / statuses.length : 0
      const deniedPct = statuses.length > 0 ? statuses.filter(s => s === 'denied').length / statuses.length : 0
      total++
      const loc = r.locale
      if (!byLocale[loc]) byLocale[loc] = { total: 0, granted: 0, denied: 0, managed: 0 }
      byLocale[loc]!.total++
      if (grantedPct >= 0.9) { granted++; byLocale[loc]!.granted++ }
      else if (deniedPct >= 0.9) { denied++; byLocale[loc]!.denied++ }
      else { managed++; byLocale[loc]!.managed++ }
    }

    const dateRows = this.stmt(
      `SELECT date(cr.created_at) as d, cr.consent_json FROM consent_records cr WHERE ${where} ORDER BY d ASC`
    ).all(vals) as unknown as { d: string; consent_json: string }[]

    const dateMap = new Map<string, { total: number; granted: number; denied: number; managed: number }>()
    for (const r of dateRows) {
      const entry = dateMap.get(r.d) ?? { total: 0, granted: 0, denied: 0, managed: 0 }
      const statuses = Object.values(JSON.parse(r.consent_json) as Record<string, string>)
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
