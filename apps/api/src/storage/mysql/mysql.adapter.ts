import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { randomUUID } from '../../utils/crypto'
import { SEED_TENANT, SEED_PERMISSIONS, SEED_ROLES, SEED_ROLE_PERMISSIONS, SCHEMA_SQL_MYSQL } from '../seed-data'
import type {
  StorageAdapter, StorageConfig, Profile, ProfileConfig,
  CreateProfileInput, UpdateProfileInput,
  ConsentDbRecord, ConsentHistoryEntry, ConsentValue, ConsentFilters,
  CreateConsentInput, UpdateConsentInput,
  Visitor, VisitorFilters, CreateVisitorInput, UpdateVisitorInput,
  AdminUser, CreateUserInput, UpdateUserInput,
  Role, CreateRoleInput, UpdateRoleInput,
  Permission, AuditLog, AuditFilters, CreateAuditLogInput,
  OverviewStats, CategoryStats, TimelineEntry,
  CountryStat, GpcStats, Tenant, ApiKey, CreateApiKeyInput,
  CreateTenantInput, UpdateTenantInput,
} from '@consenti/types'

// ── Raw row shapes ─────────────────────────────────────────────────────────────

interface RowProfile extends RowDataPacket {
  id: string; tenant_id: string; name: string; default_locale: string
  version: number; profile_json: string
  created_at: string; updated_at: string
}
interface RowConsent extends RowDataPacket {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  profile_version: number; locale: string; consent_json: string
  gpc_detected: number; source: string; created_at: string; updated_at: string
  age_verified?: number; parental_consent_token?: string | null; tcf_string?: string | null
}
interface RowConsentHistory extends RowDataPacket {
  id: string; tenant_id: string; consent_record_id: string; visitor_id: string
  old_json: string | null; new_json: string; action: string; created_at: string
}
interface RowVisitor extends RowDataPacket {
  id: string; tenant_id: string; visitor_id: string
  country: string | null; region: string | null; city: string | null
  ip_hash: string | null; user_agent_hash: string | null
  first_seen: string; last_seen: string
}
interface RowUser extends RowDataPacket {
  id: string; tenant_id: string; name: string; email: string
  password_hash: string; is_active: number; created_at: string; updated_at: string
  totp_secret?: string | null; totp_enabled?: number
}
interface RowRole extends RowDataPacket {
  id: string; tenant_id: string; name: string; description: string | null
}
interface RowPermission extends RowDataPacket {
  id: string; name: string; description: string | null
}
interface RowAuditLog extends RowDataPacket {
  id: string; tenant_id: string; user_id: string | null; action: string
  resource_type: string; resource_id: string | null
  old_data: string | null; new_data: string | null; created_at: string
}
interface RowCount extends RowDataPacket { total: number }
interface RowStatus extends RowDataPacket { status: string; count: number }
interface RowDateCount extends RowDataPacket { date: string; count: number }
interface RowCookieStatus extends RowDataPacket { cookie_id: string; status: string; count: number }
interface RowCountry extends RowDataPacket { country: string; count: number }
interface RowApiKey extends RowDataPacket {
  id: string; tenant_id: string; key_hash: string; name: string; is_active: number; created_at: string
}
interface RowTenant extends RowDataPacket { id: string; name: string; slug: string; created_at: string; updated_at: string }

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapProfile(r: RowProfile): Profile {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    defaultLocale: r.default_locale, version: r.version,
    profileJson: JSON.parse(r.profile_json) as ProfileConfig,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function mapConsent(r: RowConsent): ConsentDbRecord {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id,
    profileVersion: r.profile_version, locale: r.locale,
    consentJson: JSON.parse(r.consent_json) as ConsentValue,
    gpcDetected: r.gpc_detected === 1, source: r.source as ConsentDbRecord['source'],
    createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.age_verified != null ? { ageVerified: r.age_verified === 1 } : {}),
    ...(r.parental_consent_token != null ? { parentalConsentToken: r.parental_consent_token } : {}),
    ...(r.tcf_string != null ? { tcfString: r.tcf_string } : {}),
  }
}

function mapHistory(r: RowConsentHistory): ConsentHistoryEntry {
  return {
    id: r.id, tenantId: r.tenant_id, consentRecordId: r.consent_record_id,
    visitorId: r.visitor_id,
    oldJson: r.old_json ? JSON.parse(r.old_json) as ConsentValue : null,
    newJson: JSON.parse(r.new_json) as ConsentValue,
    action: r.action as ConsentHistoryEntry['action'], createdAt: r.created_at,
  }
}

function mapVisitor(r: RowVisitor): Visitor {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id,
    ...(r.country        != null ? { country:       r.country        } : {}),
    ...(r.region         != null ? { region:        r.region         } : {}),
    ...(r.city           != null ? { city:          r.city           } : {}),
    ...(r.ip_hash        != null ? { ipHash:        r.ip_hash        } : {}),
    ...(r.user_agent_hash!= null ? { userAgentHash: r.user_agent_hash} : {}),
    firstSeen: r.first_seen, lastSeen: r.last_seen,
  }
}

function mapUser(r: RowUser): AdminUser {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, email: r.email,
    passwordHash: r.password_hash, isActive: r.is_active === 1,
    createdAt: r.created_at, updatedAt: r.updated_at,
    totpEnabled: r.totp_enabled === 1,
    ...(r.totp_secret != null ? { totpSecret: r.totp_secret } : {}),
  }
}

function mapRole(r: RowRole): Role {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    ...(r.description != null ? { description: r.description } : {}),
  }
}

function mapPermission(r: RowPermission): Permission {
  return {
    id: r.id, name: r.name,
    ...(r.description != null ? { description: r.description } : {}),
  }
}

function mapAuditLog(r: RowAuditLog): AuditLog {
  return {
    id: r.id, tenantId: r.tenant_id, action: r.action, resourceType: r.resource_type,
    ...(r.user_id     != null ? { userId:     r.user_id                                } : {}),
    ...(r.resource_id != null ? { resourceId: r.resource_id                            } : {}),
    ...(r.old_data    != null ? { oldData:    JSON.parse(r.old_data) as unknown        } : {}),
    ...(r.new_data    != null ? { newData:    JSON.parse(r.new_data) as unknown        } : {}),
    createdAt: r.created_at,
  }
}

// ── Adapter ────────────────────────────────────────────────────────────────────

export class MySQLAdapter implements StorageAdapter {
  private pool!: Pool

  constructor(private config: StorageConfig) {}

  private async q<T extends RowDataPacket>(sql: string, params: (string | number | boolean | null)[] = []): Promise<T[]> {
    const [rows] = await this.pool.query<T[]>(sql, params)
    return rows
  }

  private async exec(sql: string, params: (string | number | boolean | null)[] = []): Promise<ResultSetHeader> {
    const [result] = await this.pool.query<ResultSetHeader>(sql, params)
    return result
  }

  async connect(): Promise<void> {
    const mysql = (await import('mysql2/promise')) as { createPool: typeof import('mysql2/promise').createPool }
    const cfg = this.config
    if (cfg.uri) {
      this.pool = mysql.createPool(cfg.uri)
    } else {
      this.pool = mysql.createPool({
        host:     cfg.host     ?? 'localhost',
        port:     cfg.port     ?? 3306,
        user:     cfg.user     ?? 'root',
        password: cfg.password ?? '',
        database: cfg.database ?? cfg.dbName ?? 'consenti',
      })
    }
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    await this.pool.end()
  }

  async migrate(): Promise<void> {
    const conn: PoolConnection = await this.pool.getConnection()
    try {
      const [tables] = await conn.query<RowDataPacket[]>('SHOW TABLES LIKE ?', ['schema_version'])
      if (tables.length === 0) {
        for (const stmt of SCHEMA_SQL_MYSQL.split(';').map(s => s.trim()).filter(Boolean)) {
          await conn.query(stmt)
        }
        await this.seed(conn)
        await conn.query('INSERT IGNORE INTO schema_version (version) VALUES (2)')
        return
      }
      const [vrows] = await conn.query<RowDataPacket[]>('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
      const version = (vrows[0] as { version?: number } | undefined)?.version ?? 0
      if (version < 2) {
        const alters = [
          'ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS age_verified TINYINT(1) NOT NULL DEFAULT 0',
          'ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS parental_consent_token TEXT',
          'ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS tcf_string TEXT',
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT',
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled TINYINT(1) NOT NULL DEFAULT 0',
        ]
        for (const stmt of alters) await conn.query(stmt)
        await conn.query('INSERT IGNORE INTO schema_version (version) VALUES (2)')
      }
      if (version < 3) {
        await conn.query('ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) NOT NULL DEFAULT \'default\'')
        await conn.query('INSERT IGNORE INTO schema_version (version) VALUES (3)')
      }
    } finally {
      conn.release()
    }
  }

  private async seed(conn: PoolConnection): Promise<void> {
    await conn.query('INSERT IGNORE INTO tenants (id, name, slug) VALUES (?,?,?)', [SEED_TENANT.id, SEED_TENANT.name, SEED_TENANT.slug])
    for (const p of SEED_PERMISSIONS) {
      await conn.query('INSERT IGNORE INTO permissions (id, name, description) VALUES (?,?,?)', [p.id, p.name, p.description])
    }
    for (const r of SEED_ROLES) {
      await conn.query('INSERT IGNORE INTO roles (id, tenant_id, name, description) VALUES (?,?,?,?)', [r.id, r.tenantId, r.name, r.description])
    }
    for (const { roleId, permissionId } of SEED_ROLE_PERMISSIONS) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [roleId, permissionId])
    }
  }

  // ── Profiles ─────────────────────────────────────────────────────────────────

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO profiles (id, tenant_id, name, default_locale, profile_json) VALUES (?,?,?,?,?)',
      [id, data.tenantId, data.name, data.defaultLocale, JSON.stringify(data.profileJson)],
    )
    const rows = await this.q<RowProfile>('SELECT * FROM profiles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Profile creation failed')
    return mapProfile(row)
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const sets: string[] = ['version = version + 1']
    const vals: (string | number | boolean | null)[] = []
    if (data.name != null)         { sets.push('name=?'); vals.push(data.name) }
    if (data.defaultLocale != null){ sets.push('default_locale=?'); vals.push(data.defaultLocale) }
    if (data.profileJson != null)  { sets.push('profile_json=?'); vals.push(JSON.stringify(data.profileJson)) }
    vals.push(id)
    await this.exec(`UPDATE profiles SET ${sets.join(',')} WHERE id=?`, vals)
    const rows = await this.q<RowProfile>('SELECT * FROM profiles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error(`Profile ${id} not found`)
    return mapProfile(row)
  }

  async deleteProfile(id: string): Promise<void> {
    await this.exec('DELETE FROM profiles WHERE id=?', [id])
  }

  async getProfile(id: string): Promise<Profile | null> {
    const rows = await this.q<RowProfile>('SELECT * FROM profiles WHERE id=?', [id])
    return rows[0] ? mapProfile(rows[0]) : null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    const rows = await this.q<RowProfile>('SELECT * FROM profiles WHERE tenant_id=? ORDER BY created_at DESC', [tenantId])
    return rows.map(mapProfile)
  }

  // ── Consents ─────────────────────────────────────────────────────────────────

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO consent_records (id, tenant_id, visitor_id, profile_id, profile_version, locale, consent_json, gpc_detected, source) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, data.tenantId, data.visitorId, data.profileId, data.profileVersion, data.locale,
       JSON.stringify(data.consentJson), data.gpcDetected ? 1 : 0, data.source],
    )
    const rows = await this.q<RowConsent>('SELECT * FROM consent_records WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Consent creation failed')
    await this.writeHistory(id, data.tenantId, data.visitorId, null, data.consentJson, 'created')
    return mapConsent(row)
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.getConsent(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)
    const sets: string[] = ['consent_json=?']
    const vals: (string | number | boolean | null)[] = [JSON.stringify(data.consentJson)]
    if (data.locale      != null) { sets.push('locale=?');       vals.push(data.locale) }
    if (data.gpcDetected != null) { sets.push('gpc_detected=?'); vals.push(data.gpcDetected ? 1 : 0) }
    vals.push(visitorId)
    await this.exec(`UPDATE consent_records SET ${sets.join(',')} WHERE visitor_id=?`, vals)
    const rows = await this.q<RowConsent>('SELECT * FROM consent_records WHERE visitor_id=?', [visitorId])
    const row = rows[0]
    if (!row) throw new Error(`Consent for visitor ${visitorId} not found`)
    await this.writeHistory(row.id, row.tenant_id, visitorId, existing.consentJson, data.consentJson, 'updated')
    return mapConsent(row)
  }

  async deleteConsent(visitorId: string): Promise<void> {
    await this.exec('DELETE FROM consent_history WHERE visitor_id=?', [visitorId])
    await this.exec('DELETE FROM consent_records WHERE visitor_id=?', [visitorId])
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    const rows = await this.q<RowConsent>('SELECT * FROM consent_records WHERE visitor_id=?', [visitorId])
    return rows[0] ? mapConsent(rows[0]) : null
  }

  async getConsents(filters: ConsentFilters): Promise<ConsentDbRecord[]> {
    const { sql, params } = this.buildConsentQuery(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const rows = await this.q<RowConsent>(`${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit])
    return rows.map(mapConsent)
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    const { sql, params } = this.buildConsentQuery(filters)
    const rows = await this.q<RowConsent>(`${sql} ORDER BY created_at ASC`, params)
    for (const r of rows) yield mapConsent(r)
  }

  private buildConsentQuery(f: ConsentFilters): { sql: string; params: (string | number | boolean | null)[] } {
    let sql = 'SELECT * FROM consent_records WHERE tenant_id=?'
    const params: (string | number | boolean | null)[] = [f.tenantId]
    if (f.profileId != null) { sql += ' AND profile_id=?'; params.push(f.profileId) }
    if (f.from != null)      { sql += ' AND created_at>=?'; params.push(f.from) }
    if (f.to   != null)      { sql += ' AND created_at<=?'; params.push(f.to) }
    return { sql, params }
  }

  private async writeHistory(
    consentRecordId: string, tenantId: string, visitorId: string,
    oldJson: ConsentValue | null, newJson: ConsentValue, action: string,
  ): Promise<void> {
    await this.exec(
      'INSERT INTO consent_history (id, tenant_id, consent_record_id, visitor_id, old_json, new_json, action) VALUES (?,?,?,?,?,?,?)',
      [randomUUID(), tenantId, consentRecordId, visitorId,
       oldJson ? JSON.stringify(oldJson) : null, JSON.stringify(newJson), action],
    )
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    const rows = await this.q<RowConsentHistory>('SELECT * FROM consent_history WHERE visitor_id=? ORDER BY created_at ASC', [visitorId])
    return rows.map(mapHistory)
  }

  // ── Visitors ─────────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO visitors (id, tenant_id, visitor_id, country, region, city, ip_hash, user_agent_hash) VALUES (?,?,?,?,?,?,?,?)',
      [id, data.tenantId, data.visitorId,
       data.country ?? null, data.region ?? null, data.city ?? null,
       data.ipHash ?? null, data.userAgentHash ?? null],
    )
    const rows = await this.q<RowVisitor>('SELECT * FROM visitors WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Visitor creation failed')
    return mapVisitor(row)
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const sets: string[] = ['last_seen=NOW()']
    const vals: (string | number | boolean | null)[] = []
    if (data.country != null) { sets.push('country=?'); vals.push(data.country) }
    if (data.region  != null) { sets.push('region=?');  vals.push(data.region) }
    if (data.city    != null) { sets.push('city=?');    vals.push(data.city) }
    vals.push(visitorId)
    await this.exec(`UPDATE visitors SET ${sets.join(',')} WHERE visitor_id=?`, vals)
    const rows = await this.q<RowVisitor>('SELECT * FROM visitors WHERE visitor_id=?', [visitorId])
    const row = rows[0]
    if (!row) throw new Error(`Visitor ${visitorId} not found`)
    return mapVisitor(row)
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    await this.exec('DELETE FROM visitors WHERE visitor_id=?', [visitorId])
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    const rows = await this.q<RowVisitor>('SELECT * FROM visitors WHERE visitor_id=?', [visitorId])
    return rows[0] ? mapVisitor(rows[0]) : null
  }

  async getVisitors(filters: VisitorFilters): Promise<Visitor[]> {
    let sql = 'SELECT * FROM visitors WHERE tenant_id=?'
    const params: (string | number | boolean | null)[] = [filters.tenantId]
    if (filters.from != null) { sql += ' AND first_seen>=?'; params.push(filters.from) }
    if (filters.to   != null) { sql += ' AND first_seen<=?'; params.push(filters.to) }
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const rows = await this.q<RowVisitor>(`${sql} ORDER BY first_seen DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit])
    return rows.map(mapVisitor)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const [[countRow], [gpcRow], [visitorRow]] = await Promise.all([
      this.q<RowCount>('SELECT COUNT(*) AS total FROM consent_records WHERE tenant_id=?', [tenantId]),
      this.q<RowCount>('SELECT COUNT(*) AS total FROM consent_records WHERE tenant_id=? AND gpc_detected=1', [tenantId]),
      this.q<RowCount>('SELECT COUNT(*) AS total FROM visitors WHERE tenant_id=?', [tenantId]),
    ])
    const total = countRow?.total ?? 0
    const gpcCount = gpcRow?.total ?? 0
    const visitors = visitorRow?.total ?? 0

    const statusRows = await this.q<RowStatus>(
      `SELECT jt.status, COUNT(*) AS count
       FROM consent_records cr
       JOIN JSON_TABLE(cr.consent_json, '$.*' COLUMNS (status VARCHAR(20) PATH '$')) AS jt
       WHERE cr.tenant_id=?
       GROUP BY jt.status`,
      [tenantId],
    )
    let granted = 0, denied = 0, all = 0
    for (const r of statusRows) {
      all += r.count
      if (r.status === 'granted') granted = r.count
      if (r.status === 'denied')  denied  = r.count
    }
    return {
      totalConsents: total,
      acceptedPct: all > 0 ? Math.round((granted / all) * 100) : 0,
      rejectedPct:  all > 0 ? Math.round((denied  / all) * 100) : 0,
      totalVisitors: visitors,
      gpcDetectedCount: gpcCount,
    }
  }

  async getCategoryStats(tenantId: string): Promise<CategoryStats> {
    const rows = await this.q<RowCookieStatus>(
      `SELECT jt.cookie_id, jt.status, COUNT(*) AS count
       FROM consent_records cr
       JOIN JSON_TABLE(cr.consent_json, '$.*' COLUMNS (NESTED PATH '$' COLUMNS (
         cookie_id VARCHAR(100) PATH '$.k',
         status    VARCHAR(20)  PATH '$.v'
       ))) AS jt
       WHERE cr.tenant_id=?
       GROUP BY jt.cookie_id, jt.status`,
      [tenantId],
    )
    const result: CategoryStats = {}
    for (const r of rows) {
      if (!result[r.cookie_id]) result[r.cookie_id] = { granted: 0, denied: 0, objected: 0 }
      const entry = result[r.cookie_id]
      if (entry) {
        if (r.status === 'granted')  entry.granted  += r.count
        if (r.status === 'denied')   entry.denied   += r.count
        if (r.status === 'objected') entry.objected += r.count
      }
    }
    return result
  }

  async getTimeline(tenantId: string, days = 30): Promise<TimelineEntry[]> {
    const from = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
    const rows = await this.q<RowDateCount>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM consent_records WHERE tenant_id=? AND created_at>=?
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [tenantId, from],
    )
    return rows.map(r => ({ date: String(r.date), count: r.count }))
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO users (id, tenant_id, name, email, password_hash) VALUES (?,?,?,?,?)',
      [id, data.tenantId, data.name, data.email, data.passwordHash],
    )
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('User creation failed')
    return mapUser(row)
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const sets: string[] = []
    const vals: (string | number | boolean | null)[] = []
    if (data.name         != null) { sets.push('name=?');          vals.push(data.name) }
    if (data.email        != null) { sets.push('email=?');         vals.push(data.email) }
    if (data.passwordHash != null) { sets.push('password_hash=?'); vals.push(data.passwordHash) }
    if (data.isActive     != null) { sets.push('is_active=?');     vals.push(data.isActive ? 1 : 0) }
    if (sets.length > 0) { vals.push(id); await this.exec(`UPDATE users SET ${sets.join(',')} WHERE id=?`, vals) }
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error(`User ${id} not found`)
    return mapUser(row)
  }

  async deleteUser(id: string): Promise<void> {
    await this.exec('DELETE FROM user_roles WHERE user_id=?', [id])
    await this.exec('DELETE FROM users WHERE id=?', [id])
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE id=?', [id])
    return rows[0] ? mapUser(rows[0]) : null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE email=?', [email])
    return rows[0] ? mapUser(rows[0]) : null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE tenant_id=? ORDER BY created_at DESC', [tenantId])
    return rows.map(mapUser)
  }

  async countUsers(tenantId?: string): Promise<number> {
    const rows = tenantId
      ? await this.q<RowCount>('SELECT COUNT(*) AS total FROM users WHERE tenant_id=?', [tenantId])
      : await this.q<RowCount>('SELECT COUNT(*) AS total FROM users')
    return rows[0]?.total ?? 0
  }

  // ── Roles & permissions ───────────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    const rows = await this.q<RowRole>('SELECT * FROM roles WHERE tenant_id=?', [tenantId])
    return rows.map(mapRole)
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO roles (id, tenant_id, name, description) VALUES (?,?,?,?)',
      [id, data.tenantId, data.name, data.description ?? null],
    )
    const rows = await this.q<RowRole>('SELECT * FROM roles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Role creation failed')
    return mapRole(row)
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const sets: string[] = []
    const vals: (string | number | boolean | null)[] = []
    if (data.name        != null) { sets.push('name=?');        vals.push(data.name) }
    if (data.description != null) { sets.push('description=?'); vals.push(data.description) }
    if (sets.length > 0) { vals.push(id); await this.exec(`UPDATE roles SET ${sets.join(',')} WHERE id=?`, vals) }
    const rows = await this.q<RowRole>('SELECT * FROM roles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error(`Role ${id} not found`)
    return mapRole(row)
  }

  async deleteRole(id: string): Promise<void> {
    await this.exec('DELETE FROM role_permissions WHERE role_id=?', [id])
    await this.exec('DELETE FROM user_roles WHERE role_id=?', [id])
    await this.exec('DELETE FROM roles WHERE id=?', [id])
  }

  async getAllPermissions(): Promise<Permission[]> {
    const rows = await this.q<RowPermission>('SELECT * FROM permissions ORDER BY name')
    return rows.map(mapPermission)
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rows = await this.q<RowPermission>(
      'SELECT p.* FROM permissions p JOIN role_permissions rp ON p.id=rp.permission_id WHERE rp.role_id=?',
      [roleId],
    )
    return rows.map(mapPermission)
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    const rows = tenantId
      ? await this.q<RowRole>(
          'SELECT r.* FROM roles r JOIN user_roles ur ON r.id=ur.role_id WHERE ur.user_id=? AND ur.tenant_id=?',
          [userId, tenantId],
        )
      : await this.q<RowRole>(
          'SELECT r.* FROM roles r JOIN user_roles ur ON r.id=ur.role_id WHERE ur.user_id=?',
          [userId],
        )
    return rows.map(mapRole)
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    await this.exec('INSERT IGNORE INTO user_roles (user_id, role_id, tenant_id) VALUES (?,?,?)', [userId, roleId, tenantId])
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.exec('DELETE FROM user_roles WHERE user_id=? AND role_id=? AND tenant_id=?', [userId, roleId, tenantId])
    } else {
      await this.exec('DELETE FROM user_roles WHERE user_id=? AND role_id=?', [userId, roleId])
    }
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.exec('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [roleId, permissionId])
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.exec('DELETE FROM role_permissions WHERE role_id=? AND permission_id=?', [roleId, permissionId])
  }

  // ── Audit logs ────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    await this.exec(
      'INSERT INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, old_data, new_data) VALUES (?,?,?,?,?,?,?,?)',
      [randomUUID(), data.tenantId, data.userId ?? null, data.action, data.resourceType,
       data.resourceId ?? null,
       data.oldData != null ? JSON.stringify(data.oldData) : null,
       data.newData != null ? JSON.stringify(data.newData) : null],
    )
  }

  async getLogs(filters: AuditFilters): Promise<AuditLog[]> {
    const { sql, params } = this.buildAuditQuery(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const rows = await this.q<RowAuditLog>(`${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit])
    return rows.map(mapAuditLog)
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    const { sql, params } = this.buildAuditQuery(filters)
    const rows = await this.q<RowAuditLog>(`${sql} ORDER BY created_at ASC`, params)
    for (const r of rows) yield mapAuditLog(r)
  }

  private buildAuditQuery(f: AuditFilters): { sql: string; params: (string | number | boolean | null)[] } {
    let sql = 'SELECT * FROM audit_logs WHERE tenant_id=?'
    const params: (string | number | boolean | null)[] = [f.tenantId]
    if (f.action       != null) { sql += ' AND action=?';        params.push(f.action) }
    if (f.resourceType != null) { sql += ' AND resource_type=?'; params.push(f.resourceType) }
    if (f.from != null)         { sql += ' AND created_at>=?';   params.push(f.from) }
    if (f.to   != null)         { sql += ' AND created_at<=?';   params.push(f.to) }
    return { sql, params }
  }

  // ── Stats extensions ───────────────────────────────────────────────────────────

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const rows = await this.q<RowCountry>(
      `SELECT v.country, COUNT(*) AS count FROM consent_records cr
       JOIN visitors v ON v.visitor_id=cr.visitor_id
       WHERE cr.tenant_id=? AND v.country IS NOT NULL
       GROUP BY v.country ORDER BY count DESC LIMIT 50`,
      [tenantId],
    )
    return rows.map(r => ({ country: r.country, count: r.count }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const [t] = await this.q<RowCount>('SELECT COUNT(*) AS total FROM consent_records WHERE tenant_id=?', [tenantId])
    const [d] = await this.q<RowCount>('SELECT COUNT(*) AS total FROM consent_records WHERE tenant_id=? AND gpc_detected=1', [tenantId])
    const total = t?.total ?? 0
    const detected = d?.total ?? 0
    return { detected, total, rate: total > 0 ? Math.round((detected / total) * 100) : 0 }
  }

  // ── Tenants ───────────────────────────────────────────────────────────────────

  async getTenants(): Promise<Tenant[]> {
    const rows = await this.q<RowTenant>('SELECT * FROM tenants ORDER BY name ASC', [])
    return rows.map(r => ({ id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }))
  }

  // ── API Keys ──────────────────────────────────────────────────────────────────

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO api_keys (id, tenant_id, key_hash, name) VALUES (?,?,?,?)',
      [id, data.tenantId, data.keyHash, data.name],
    )
    const rows = await this.q<RowApiKey>('SELECT * FROM api_keys WHERE id=?', [id])
    const r = rows[0]
    if (!r) throw new Error('Failed to create API key')
    return { id: r.id, tenantId: r.tenant_id, keyHash: r.key_hash, name: r.name, isActive: r.is_active === 1, createdAt: r.created_at }
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const rows = await this.q<RowApiKey>('SELECT * FROM api_keys WHERE key_hash=? AND is_active=1', [keyHash])
    const r = rows[0]
    if (!r) return null
    return { id: r.id, tenantId: r.tenant_id, keyHash: r.key_hash, name: r.name, isActive: r.is_active === 1, createdAt: r.created_at }
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.exec('UPDATE api_keys SET is_active=0 WHERE id=?', [id])
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const rows = await this.q<RowApiKey>('SELECT * FROM api_keys WHERE tenant_id=? ORDER BY created_at DESC', [tenantId])
    return rows.map(r => ({ id: r.id, tenantId: r.tenant_id, keyHash: r.key_hash, name: r.name, isActive: r.is_active === 1, createdAt: r.created_at }))
  }

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    const id = randomUUID()
    const now = new Date().toISOString()
    await this.exec('INSERT INTO tenants (id, name, slug, created_at, updated_at) VALUES (?,?,?,?,?)', [id, data.name, data.slug, now, now])
    const rows = await this.q<RowTenant>('SELECT * FROM tenants WHERE id=?', [id])
    const r = rows[0]
    if (!r) throw new Error('Failed to create tenant')
    return { id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const now = new Date().toISOString()
    const sets: string[] = ['updated_at=?']
    const vals: (string | number)[] = [now]
    if (data.name != null) { sets.push('name=?'); vals.push(data.name) }
    if (data.slug != null) { sets.push('slug=?'); vals.push(data.slug) }
    vals.push(id)
    await this.exec(`UPDATE tenants SET ${sets.join(',')} WHERE id=?`, vals)
    const rows = await this.q<RowTenant>('SELECT * FROM tenants WHERE id=?', [id])
    const r = rows[0]
    if (!r) throw new Error(`Tenant ${id} not found`)
    return { id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async deleteTenant(id: string): Promise<void> {
    await this.exec('DELETE FROM tenants WHERE id=?', [id])
  }

  async purgeExpiredConsents(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const visitorRows = await this.q<{ visitor_id: string } & RowDataPacket>(
      'SELECT visitor_id FROM consent_records WHERE created_at < ?', [cutoff]
    )
    if (visitorRows.length === 0) return 0
    const ids = visitorRows.map(r => r.visitor_id)
    const placeholders = ids.map(() => '?').join(',')
    await this.exec(`DELETE FROM consent_history WHERE visitor_id IN (${placeholders})`, ids)
    await this.exec(`DELETE FROM consent_records WHERE visitor_id IN (${placeholders})`, ids)
    return ids.length
  }

  // Template methods — not yet implemented for MySQL adapter
  async createCookieTemplate(): Promise<never> { throw new Error('Not implemented') }
  async updateCookieTemplate(): Promise<never> { throw new Error('Not implemented') }
  async deleteCookieTemplate(): Promise<void> { throw new Error('Not implemented') }
  async getCookieTemplate(): Promise<never> { throw new Error('Not implemented') }
  async getCookieTemplates(): Promise<never> { throw new Error('Not implemented') }
  async copyCookieTemplate(): Promise<never> { throw new Error('Not implemented') }
  async createUITemplate(): Promise<never> { throw new Error('Not implemented') }
  async updateUITemplate(): Promise<never> { throw new Error('Not implemented') }
  async deleteUITemplate(): Promise<void> { throw new Error('Not implemented') }
  async getUITemplate(): Promise<never> { throw new Error('Not implemented') }
  async getUITemplates(): Promise<never> { throw new Error('Not implemented') }
  async copyUITemplate(): Promise<never> { throw new Error('Not implemented') }
}
