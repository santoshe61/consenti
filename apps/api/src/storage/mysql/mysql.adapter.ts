import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { randomUUID, randomProfileId, randomVisitorId, randomConsentId, randomConsentTemplateId, randomUITemplateId } from '../../utils/crypto'
import { SEED_TENANT, SEED_PERMISSIONS, SEED_ROLES, SEED_ROLE_PERMISSIONS, SCHEMA_SQL_MYSQL, SCHEMA_VERSION, LEGACY_PROBE_NAMES, legacyInstallError } from '../seed-data'
import { likePrefix } from '../../utils/sql-search'
import { buildProfileSummaries, tallyOptIn } from '../derived-queries'
import type {
  StorageAdapter, StorageConfig, Profile, StoredProfileJson,
  CreateProfileInput, UpdateProfileInput,
  ConsentDbRecord, ConsentSummary, ConsentHistoryEntry, ConsentValue, ConsentFilters,
  CreateConsentInput, UpdateConsentInput,
  Visitor, VisitorFilters, CreateVisitorInput, UpdateVisitorInput,
  AdminUser, CreateUserInput, UpdateUserInput,
  Role, CreateRoleInput, UpdateRoleInput,
  Permission, AuditLog, AuditLogSummary, AuditFilters, CreateAuditLogInput,
  OverviewStats, CategoryStats, TimelineEntry,
  CountryStat, GpcStats, Tenant, ApiKey, CreateApiKeyInput,
  CreateTenantInput, UpdateTenantInput, TenantSettings,
  NoticeShownRecord, CreateNoticeShownInput, PagedResult,
  ServerConsentTemplate, ServerUITemplate,
  CreateConsentTemplateInput, UpdateConsentTemplateInput,
  CreateUITemplateInput, UpdateUITemplateInput,
  ProfileSummary, OptInFilters, OptInStats,
} from '@consenti/types'

// ── Raw row shapes ─────────────────────────────────────────────────────────────

interface RowProfile extends RowDataPacket {
  id: string; tenant_id: string; name: string; default_locale: string
  version: number; profile_json: string
  created_at: string; updated_at: string
}
interface RowConsent extends RowDataPacket {
  id: string; tenant_id: string; visitor_id: string; profile_id: string; profile_version?: number | null
  locale: string; consent_json: string
  gpc_detected: number; source: string; created_at: string; updated_at: string
  age_verified?: number; parental_consent_token?: string | null; tcf_string?: string | null
  gpp_string?: string | null
  signature?: string | null
}
interface RowConsentSummary extends RowDataPacket {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; gpc_detected: number; source: string
  age_verified?: number; created_at: string; updated_at: string
}
interface RowConsentHistory extends RowDataPacket {
  id: string; tenant_id: string; consent_record_id: string; visitor_id: string; profile_version?: number | null
  old_json: string | null; new_json: string; action: string; created_at: string
}
interface RowVisitor extends RowDataPacket {
  id: string; tenant_id: string; visitor_id: string
  country: string | null; region: string | null; city: string | null
  ip_hash: string | null; user_agent_hash: string | null
  first_seen: string; last_seen: string
}
interface RowNoticeShown extends RowDataPacket {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; created_at: string
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
interface RowAuditLogSummary extends RowDataPacket {
  id: string; tenant_id: string; user_id: string | null; action: string
  resource_type: string; resource_id: string | null; created_at: string
}
interface RowCount extends RowDataPacket { total: number }
interface RowStatus extends RowDataPacket { status: string; count: number }
interface RowDateCount extends RowDataPacket { date: string; count: number }
interface RowCookieStatus extends RowDataPacket { cookie_id: string; status: string; count: number }
interface RowCountry extends RowDataPacket { country: string; count: number }
interface RowApiKey extends RowDataPacket {
  id: string; tenant_id: string; key_hash: string; name: string; is_active: number
  created_by: string | null; expire_by: string | null; created_at: string; updated_at: string | null
}
interface RowConsentTemplate extends RowDataPacket {
  id: string; tenant_id: string; name: string; cookies_json: string; categories_json: string
  created_at: string; updated_at: string
}
interface RowUITemplate extends RowDataPacket {
  id: string; tenant_id: string; name: string; settings_json: string
  created_at: string; updated_at: string
}
interface RowOptInConsent extends RowDataPacket { locale: string; day: string; consent_json: string }
interface RowTenant extends RowDataPacket { id: string; name: string; slug: string; created_at: string; updated_at: string }
interface RowTenantSettings extends RowDataPacket {
  allowed_origins_json: string; admin_allowed_origins_json: string; setup_completed: number
  profiles_seeded: number; tcf_confirmation_json: string | null; gpp_confirmation_json: string | null
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapProfile(r: RowProfile): Profile {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    defaultLocale: r.default_locale, version: r.version,
    profileJson: JSON.parse(r.profile_json) as StoredProfileJson,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function mapConsent(r: RowConsent): ConsentDbRecord {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id,
    ...(r.profile_version != null ? { profileVersion: r.profile_version } : {}),
    locale: r.locale,
    consentJson: JSON.parse(r.consent_json) as ConsentValue,
    gpcDetected: r.gpc_detected === 1, source: r.source as ConsentDbRecord['source'],
    createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.age_verified != null ? { ageVerified: r.age_verified === 1 } : {}),
    ...(r.parental_consent_token != null ? { parentalConsentToken: r.parental_consent_token } : {}),
    ...(r.tcf_string != null ? { tcfString: r.tcf_string } : {}),
    ...(r.gpp_string != null ? { gppString: r.gpp_string } : {}),
    ...(r.signature != null ? { signature: r.signature } : {}),
  }
}

const CONSENT_SUMMARY_COLS = 'id, tenant_id, visitor_id, profile_id, locale, gpc_detected, source, age_verified, created_at, updated_at'

function mapConsentSummary(r: RowConsentSummary): ConsentSummary {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id,
    locale: r.locale, gpcDetected: r.gpc_detected === 1, source: r.source as ConsentDbRecord['source'],
    createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.age_verified != null ? { ageVerified: r.age_verified === 1 } : {}),
  }
}

function mapHistory(r: RowConsentHistory): ConsentHistoryEntry {
  return {
    id: r.id, tenantId: r.tenant_id, consentRecordId: r.consent_record_id,
    visitorId: r.visitor_id,
    ...(r.profile_version != null ? { profileVersion: r.profile_version } : {}),
    oldJson: r.old_json ? JSON.parse(r.old_json) as ConsentValue : null,
    newJson: JSON.parse(r.new_json) as ConsentValue,
    action: r.action as ConsentHistoryEntry['action'], createdAt: r.created_at,
  }
}

function mapVisitor(r: RowVisitor): Visitor {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id,
    ...(r.country != null ? { country: r.country } : {}),
    ...(r.region != null ? { region: r.region } : {}),
    ...(r.city != null ? { city: r.city } : {}),
    ...(r.ip_hash != null ? { ipHash: r.ip_hash } : {}),
    ...(r.user_agent_hash != null ? { userAgentHash: r.user_agent_hash } : {}),
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
    ...(r.user_id != null ? { userId: r.user_id } : {}),
    ...(r.resource_id != null ? { resourceId: r.resource_id } : {}),
    ...(r.old_data != null ? { oldData: JSON.parse(r.old_data) as unknown } : {}),
    ...(r.new_data != null ? { newData: JSON.parse(r.new_data) as unknown } : {}),
    createdAt: r.created_at,
  }
}

const AUDIT_SUMMARY_COLS = 'id, tenant_id, user_id, action, resource_type, resource_id, created_at'

function mapAuditSummary(r: RowAuditLogSummary): AuditLogSummary {
  return {
    id: r.id, tenantId: r.tenant_id, action: r.action, resourceType: r.resource_type,
    ...(r.user_id != null ? { userId: r.user_id } : {}),
    ...(r.resource_id != null ? { resourceId: r.resource_id } : {}),
    createdAt: r.created_at,
  }
}

// ── Adapter ────────────────────────────────────────────────────────────────────

/**
 * `YYYY-MM-DD HH:MM:SS` in UTC for a DATETIME column. MySQL (strict mode, the default since 5.7) and
 * MariaDB reject an ISO-8601 string with a `T` and `Z` ("Incorrect datetime value").
 */
function mysqlTimestamp(d: Date = new Date()): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export class MySQLAdapter implements StorageAdapter {
  private pool!: Pool

  constructor(private config: StorageConfig) { }

  private async q<T extends RowDataPacket>(sql: string, params: (string | number | boolean | null)[] = []): Promise<T[]> {
    const timeout = this.config.statementTimeoutMs
    const [rows] = timeout
      ? await this.pool.query<T[]>({ sql, timeout }, params)
      : await this.pool.query<T[]>(sql, params)
    return rows
  }

  private async exec(sql: string, params: (string | number | boolean | null)[] = []): Promise<ResultSetHeader> {
    const timeout = this.config.statementTimeoutMs
    const [result] = timeout
      ? await this.pool.query<ResultSetHeader>({ sql, timeout }, params)
      : await this.pool.query<ResultSetHeader>(sql, params)
    return result
  }

  async connect(): Promise<void> {
    const mysql = (await import('mysql2/promise')) as { createPool: typeof import('mysql2/promise').createPool }
    const cfg = this.config
    // Bounded by default (5 — shared hosts commonly cap connections per database user at 5–25,
    // shared with every other app on the account; raise `poolMax` for a dedicated server). mysql2 has
    // no pool-wide statement timeout; `statementTimeoutMs` is instead applied per-query in q()/exec().
    this.pool = mysql.createPool({
      ...(cfg.uri ? { uri: cfg.uri } : {
        host: cfg.host ?? 'localhost',
        port: cfg.port ?? 3306,
        user: cfg.user ?? 'root',
        password: cfg.password ?? '',
        database: cfg.database ?? 'consenti',
      }),
      connectionLimit: cfg.poolMax ?? 5,
    })
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    await this.pool.end()
  }

  async migrate(): Promise<void> {
    // A fresh connect creates the full current schema in one pass and stamps SCHEMA_VERSION; an
    // older database is upgraded in place, gated on `schema_version` (see seed-data.ts for what
    // each version changed).
    const conn: PoolConnection = await this.pool.getConnection()
    // Several instances booting against a fresh database would otherwise run the same DDL at once.
    // A named lock needs no special privilege; it is released on `finally` (or if the connection drops).
    const lockSql = `CONCAT('consenti_schema_', IFNULL(DATABASE(), ''))`
    try {
      const [[lock]] = await conn.query<RowDataPacket[]>(`SELECT GET_LOCK(${lockSql}, 60) AS got`)
      if (lock?.['got'] !== 1) {
        throw new Error('[consenti] Timed out waiting for another Consenti instance to finish setting up the database schema.')
      }
      const [tables] = await conn.query<RowDataPacket[]>(
        `SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)`,
        [['consenti_schema_version', ...LEGACY_PROBE_NAMES]],
      )
      const present = new Set(tables.map(r => String(r['name'])))
      if (!present.has('consenti_schema_version') && LEGACY_PROBE_NAMES.every(n => present.has(n))) {
        throw legacyInstallError('tables')
      }
      if (!present.has('consenti_schema_version')) {
        try {
          for (const stmt of SCHEMA_SQL_MYSQL.split(';').map(s => s.trim()).filter(Boolean)) {
            await conn.query(stmt)
          }
          await this.seed(conn)
        } catch (err) {
          // DDL auto-commits, so a failure here leaves some tables behind. Every statement is
          // CREATE TABLE IF NOT EXISTS / INSERT IGNORE and `consenti_schema_version` is stamped last,
          // so simply starting again picks up where this stopped.
          throw new Error(
            `Creating the Consenti tables failed: ${err instanceof Error ? err.message : String(err)}. ` +
            `The database user needs SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX and REFERENCES on this ` +
            `database (it never creates databases or users). Safe to re-run: fix the cause and start again.`,
            { cause: err },
          )
        }
        await conn.query('INSERT IGNORE INTO consenti_schema_version (version) VALUES (?)', [SCHEMA_VERSION])
      } else {
        const [rows] = await conn.query<RowDataPacket[]>('SELECT MAX(version) AS version FROM consenti_schema_version')
        if ((rows[0]?.['version'] ?? 0) < 2) {
          try {
            await this.migrateToV2(conn)
          } catch (err) {
            throw new Error(
              `Upgrading the database schema to v2 failed: ${err instanceof Error ? err.message : String(err)}. ` +
              `The database user needs the ALTER privilege. This step only changes table structure, never rows, ` +
              `and is safe to re-run: fix the cause and start again.`,
              { cause: err },
            )
          }
        }
      }
    } finally {
      try { await conn.query(`SELECT RELEASE_LOCK(${lockSql})`) } catch { /* connection already gone — the lock went with it */ }
      conn.release()
    }
  }

  // MySQL DDL auto-commits, so this can't be rolled back — every step checks first instead, so a
  // run interrupted halfway simply resumes on the next start.
  private async migrateToV2(conn: PoolConnection): Promise<void> {
    const [fks] = await conn.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS tbl, CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('consenti_consent_records','consenti_notice_shown')
         AND COLUMN_NAME = 'profile_id' AND REFERENCED_TABLE_NAME = 'consenti_profiles'`,
    )
    for (const fk of fks) {
      await conn.query(`ALTER TABLE \`${String(fk['tbl'])}\` DROP FOREIGN KEY \`${String(fk['name']).replace(/`/g, '``')}\``)
    }
    for (const table of ['consenti_consent_records', 'consenti_consent_history']) {
      const [cols] = await conn.query<RowDataPacket[]>(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'profile_version'`,
        [table],
      )
      if (cols.length === 0) await conn.query(`ALTER TABLE ${table} ADD COLUMN profile_version INT NULL`)
    }
    await conn.query('INSERT IGNORE INTO consenti_schema_version (version) VALUES (?)', [SCHEMA_VERSION])
  }

  private async seed(conn: PoolConnection): Promise<void> {
    await conn.query('INSERT IGNORE INTO consenti_tenants (id, name, slug) VALUES (?,?,?)', [SEED_TENANT.id, SEED_TENANT.name, SEED_TENANT.slug])
    for (const p of SEED_PERMISSIONS) {
      await conn.query('INSERT IGNORE INTO consenti_permissions (id, name, description) VALUES (?,?,?)', [p.id, p.name, p.description])
    }
    for (const r of SEED_ROLES) {
      await conn.query('INSERT IGNORE INTO consenti_roles (id, tenant_id, name, description) VALUES (?,?,?,?)', [r.id, r.tenantId, r.name, r.description])
    }
    for (const { roleId, permissionId } of SEED_ROLE_PERMISSIONS) {
      await conn.query('INSERT IGNORE INTO consenti_role_permissions (role_id, permission_id) VALUES (?,?)', [roleId, permissionId])
    }
  }

  // ── Profiles ─────────────────────────────────────────────────────────────────

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const id = randomProfileId()
    await this.exec(
      'INSERT INTO consenti_profiles (id, tenant_id, name, default_locale, version, profile_json) VALUES (?,?,?,?,?,?)',
      [id, data.tenantId, data.name, data.defaultLocale, 1, JSON.stringify(data.profileJson)],
    )
    const rows = await this.q<RowProfile>('SELECT * FROM consenti_profiles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Profile creation failed')
    return mapProfile(row)
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const sets: string[] = []
    const vals: (string | number | boolean | null)[] = []
    if (data.name != null) { sets.push('name=?'); vals.push(data.name) }
    if (data.defaultLocale != null) { sets.push('default_locale=?'); vals.push(data.defaultLocale) }
    if (data.profileJson != null) { sets.push('profile_json=?'); vals.push(JSON.stringify(data.profileJson)) }
    if (data.version != null) { sets.push('version=?'); vals.push(data.version) }
    if (sets.length > 0) {
      vals.push(id)
      await this.exec(`UPDATE consenti_profiles SET ${sets.join(',')} WHERE id=?`, vals)
    }
    const rows = await this.q<RowProfile>('SELECT * FROM consenti_profiles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error(`Profile ${id} not found`)
    return mapProfile(row)
  }

  async deleteProfile(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_profiles WHERE id=?', [id])
  }

  async getProfile(id: string): Promise<Profile | null> {
    const rows = await this.q<RowProfile>('SELECT * FROM consenti_profiles WHERE id=?', [id])
    return rows[0] ? mapProfile(rows[0]) : null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    const rows = await this.q<RowProfile>('SELECT * FROM consenti_profiles WHERE tenant_id=? ORDER BY created_at DESC', [tenantId])
    return rows.map(mapProfile)
  }

  async findActiveProfileByComplianceGroup(tenantId: string, complianceGroup: string): Promise<Profile | null> {
    const profiles = await this.getProfiles(tenantId)
    return profiles.find(p =>
      (p.profileJson.complianceGroup === complianceGroup || (p.profileJson as { customComplianceGroup?: string }).customComplianceGroup === complianceGroup) &&
      p.profileJson.isActive
    ) ?? null
  }

  // ── Consents ─────────────────────────────────────────────────────────────────

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const id = randomConsentId()
    await this.exec(
      'INSERT INTO consenti_consent_records (id, tenant_id, visitor_id, profile_id, profile_version, locale, consent_json, gpc_detected, source, age_verified, parental_consent_token, tcf_string, gpp_string, signature) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, data.tenantId, data.visitorId, data.profileId, data.profileVersion ?? null, data.locale,
        JSON.stringify(data.consentJson), data.gpcDetected ? 1 : 0, data.source,
        data.ageVerified ? 1 : 0, data.parentalConsentToken ?? null, data.tcfString ?? null, data.gppString ?? null, data.signature ?? null],
    )
    const rows = await this.q<RowConsent>('SELECT * FROM consenti_consent_records WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Consent creation failed')
    await this.writeHistory(id, data.tenantId, data.visitorId, null, data.consentJson, 'created', data.profileVersion ?? null)
    return mapConsent(row)
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.getConsent(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)
    const sets: string[] = ['consent_json=?']
    const vals: (string | number | boolean | null)[] = [JSON.stringify(data.consentJson)]
    if (data.profileVersion != null) { sets.push('profile_version=?'); vals.push(data.profileVersion) }
    if (data.locale != null) { sets.push('locale=?'); vals.push(data.locale) }
    if (data.gpcDetected != null) { sets.push('gpc_detected=?'); vals.push(data.gpcDetected ? 1 : 0) }
    if (data.signature != null) { sets.push('signature=?'); vals.push(data.signature) }
    vals.push(visitorId)
    await this.exec(`UPDATE consenti_consent_records SET ${sets.join(',')} WHERE visitor_id=?`, vals)
    const rows = await this.q<RowConsent>('SELECT * FROM consenti_consent_records WHERE visitor_id=?', [visitorId])
    const row = rows[0]
    if (!row) throw new Error(`Consent for visitor ${visitorId} not found`)
    await this.writeHistory(row.id, row.tenant_id, visitorId, existing.consentJson, data.consentJson, 'updated', data.profileVersion ?? existing.profileVersion ?? null)
    return mapConsent(row)
  }

  async deleteConsent(visitorId: string): Promise<void> {
    await this.exec('DELETE FROM consenti_consent_history WHERE visitor_id=?', [visitorId])
    await this.exec('DELETE FROM consenti_consent_records WHERE visitor_id=?', [visitorId])
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    const rows = await this.q<RowConsent>('SELECT * FROM consenti_consent_records WHERE visitor_id=?', [visitorId])
    return rows[0] ? mapConsent(rows[0]) : null
  }

  async getConsents(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>> {
    const { where, params } = this.buildConsentWhere(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [rows, countRows] = await Promise.all([
      this.q<RowConsentSummary>(
        `SELECT ${CONSENT_SUMMARY_COLS} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit],
      ),
      this.q<RowCount>(`SELECT COUNT(*) AS total ${where}`, params),
    ])
    return { items: rows.map(mapConsentSummary), total: countRows[0]?.total ?? 0, page, limit }
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    const { where, params } = this.buildConsentWhere(filters)
    const rows = await this.q<RowConsent>(`SELECT * ${where} ORDER BY created_at ASC`, params)
    for (const r of rows) yield mapConsent(r)
  }

  private buildConsentWhere(f: ConsentFilters): { where: string; params: (string | number | boolean | null)[] } {
    let where = 'FROM consenti_consent_records WHERE tenant_id=?'
    const params: (string | number | boolean | null)[] = [f.tenantId]
    if (f.profileId != null) { where += ' AND profile_id=?'; params.push(f.profileId) }
    if (f.from != null) { where += ' AND created_at>=?'; params.push(f.from) }
    if (f.to != null) { where += ' AND created_at<=?'; params.push(f.to) }
    if (f.q) {
      // No ESCAPE clause: backslash is already MySQL's default LIKE escape character, which is what
      // likePrefix() emits (a trailing `ESCAPE` after the closing paren is a syntax error and broke search).
      where += " AND (visitor_id LIKE ? OR profile_id LIKE ? OR locale LIKE ? OR source LIKE ?)"
      const like = likePrefix(f.q)
      params.push(like, like, like, like)
    }
    return { where, params }
  }

  private async writeHistory(
    consentRecordId: string, tenantId: string, visitorId: string,
    oldJson: ConsentValue | null, newJson: ConsentValue, action: string, profileVersion: number | null,
  ): Promise<void> {
    await this.exec(
      'INSERT INTO consenti_consent_history (id, tenant_id, consent_record_id, visitor_id, profile_version, old_json, new_json, action) VALUES (?,?,?,?,?,?,?,?)',
      [randomUUID(), tenantId, consentRecordId, visitorId, profileVersion,
      oldJson ? JSON.stringify(oldJson) : null, JSON.stringify(newJson), action],
    )
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    const rows = await this.q<RowConsentHistory>('SELECT * FROM consenti_consent_history WHERE visitor_id=? ORDER BY created_at ASC', [visitorId])
    return rows.map(mapHistory)
  }

  async createNoticeShown(data: CreateNoticeShownInput): Promise<NoticeShownRecord> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO consenti_notice_shown (id, tenant_id, visitor_id, profile_id, locale) VALUES (?,?,?,?,?)',
      [id, data.tenantId, data.visitorId, data.profileId, data.locale],
    )
    const rows = await this.q<RowNoticeShown>('SELECT * FROM consenti_notice_shown WHERE id=?', [id])
    const r = rows[0]!
    return { id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id, locale: r.locale, createdAt: r.created_at }
  }

  async getNoticeShownForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    const rows = await this.q<RowNoticeShown>('SELECT * FROM consenti_notice_shown WHERE visitor_id=? ORDER BY created_at DESC', [visitorId])
    return rows.map(r => ({
      id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id,
      profileId: r.profile_id, locale: r.locale, createdAt: r.created_at,
    }))
  }

  // ── Visitors ─────────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const id = randomVisitorId()
    await this.exec(
      'INSERT INTO consenti_visitors (id, tenant_id, visitor_id, country, region, city, ip_hash, user_agent_hash) VALUES (?,?,?,?,?,?,?,?)',
      [id, data.tenantId, data.visitorId,
        data.country ?? null, data.region ?? null, data.city ?? null,
        data.ipHash ?? null, data.userAgentHash ?? null],
    )
    const rows = await this.q<RowVisitor>('SELECT * FROM consenti_visitors WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Visitor creation failed')
    return mapVisitor(row)
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const sets: string[] = ['last_seen=NOW()']
    const vals: (string | number | boolean | null)[] = []
    if (data.country != null) { sets.push('country=?'); vals.push(data.country) }
    if (data.region != null) { sets.push('region=?'); vals.push(data.region) }
    if (data.city != null) { sets.push('city=?'); vals.push(data.city) }
    vals.push(visitorId)
    await this.exec(`UPDATE consenti_visitors SET ${sets.join(',')} WHERE visitor_id=?`, vals)
    const rows = await this.q<RowVisitor>('SELECT * FROM consenti_visitors WHERE visitor_id=?', [visitorId])
    const row = rows[0]
    if (!row) throw new Error(`Visitor ${visitorId} not found`)
    return mapVisitor(row)
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    await this.exec('DELETE FROM consenti_visitors WHERE visitor_id=?', [visitorId])
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    const rows = await this.q<RowVisitor>('SELECT * FROM consenti_visitors WHERE visitor_id=?', [visitorId])
    return rows[0] ? mapVisitor(rows[0]) : null
  }

  async getVisitors(filters: VisitorFilters): Promise<PagedResult<Visitor>> {
    let where = 'FROM consenti_visitors WHERE tenant_id=?'
    const params: (string | number | boolean | null)[] = [filters.tenantId]
    if (filters.from != null) { where += ' AND first_seen>=?'; params.push(filters.from) }
    if (filters.to != null) { where += ' AND first_seen<=?'; params.push(filters.to) }
    if (filters.q) {
      where += " AND (visitor_id LIKE ? OR country LIKE ?)"
      const like = likePrefix(filters.q)
      params.push(like, like)
    }
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [rows, countRows] = await Promise.all([
      this.q<RowVisitor>(`SELECT * ${where} ORDER BY first_seen DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]),
      this.q<RowCount>(`SELECT COUNT(*) AS total ${where}`, params),
    ])
    return { items: rows.map(mapVisitor), total: countRows[0]?.total ?? 0, page, limit }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const [[countRow], [gpcRow], [visitorRow]] = await Promise.all([
      this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_consent_records WHERE tenant_id=?', [tenantId]),
      this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_consent_records WHERE tenant_id=? AND gpc_detected=1', [tenantId]),
      this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_visitors WHERE tenant_id=?', [tenantId]),
    ])
    const total = countRow?.total ?? 0
    const gpcCount = gpcRow?.total ?? 0
    const visitors = visitorRow?.total ?? 0

    const statusRows = await this.q<RowStatus>(
      `SELECT jt.status, COUNT(*) AS count
       FROM consenti_consent_records cr
       JOIN JSON_TABLE(cr.consent_json, '$.*' COLUMNS (status VARCHAR(20) PATH '$')) AS jt
       WHERE cr.tenant_id=?
       GROUP BY jt.status`,
      [tenantId],
    )
    let granted = 0, denied = 0, all = 0
    for (const r of statusRows) {
      all += r.count
      if (r.status === 'granted') granted = r.count
      if (r.status === 'denied') denied = r.count
    }
    return {
      totalConsents: total,
      acceptedPct: all > 0 ? Math.round((granted / all) * 100) : 0,
      rejectedPct: all > 0 ? Math.round((denied / all) * 100) : 0,
      totalVisitors: visitors,
      gpcDetectedCount: gpcCount,
    }
  }

  async getCategoryStats(tenantId: string): Promise<CategoryStats> {
    const rows = await this.q<RowCookieStatus>(
      `SELECT jt.cookie_id, jt.status, COUNT(*) AS count
       FROM consenti_consent_records cr
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
        if (r.status === 'granted') entry.granted += r.count
        if (r.status === 'denied') entry.denied += r.count
        if (r.status === 'objected') entry.objected += r.count
      }
    }
    return result
  }

  async getTimeline(tenantId: string, days = 30): Promise<TimelineEntry[]> {
    const from = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
    const rows = await this.q<RowDateCount>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
       FROM consenti_consent_records WHERE tenant_id=? AND created_at>=?
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY date ASC`,
      [tenantId, from],
    )
    return rows.map(r => ({ date: r.date, count: r.count }))
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO consenti_users (id, tenant_id, name, email, password_hash) VALUES (?,?,?,?,?)',
      [id, data.tenantId, data.name, data.email, data.passwordHash],
    )
    const rows = await this.q<RowUser>('SELECT * FROM consenti_users WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('User creation failed')
    return mapUser(row)
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const sets: string[] = []
    const vals: (string | number | boolean | null)[] = []
    if (data.name != null) { sets.push('name=?'); vals.push(data.name) }
    if (data.email != null) { sets.push('email=?'); vals.push(data.email) }
    if (data.passwordHash != null) { sets.push('password_hash=?'); vals.push(data.passwordHash) }
    if (data.isActive != null) { sets.push('is_active=?'); vals.push(data.isActive ? 1 : 0) }
    if (sets.length > 0) { vals.push(id); await this.exec(`UPDATE consenti_users SET ${sets.join(',')} WHERE id=?`, vals) }
    const rows = await this.q<RowUser>('SELECT * FROM consenti_users WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error(`User ${id} not found`)
    return mapUser(row)
  }

  async deleteUser(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_user_roles WHERE user_id=?', [id])
    await this.exec('DELETE FROM consenti_users WHERE id=?', [id])
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const rows = await this.q<RowUser>('SELECT * FROM consenti_users WHERE id=?', [id])
    return rows[0] ? mapUser(rows[0]) : null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    const rows = await this.q<RowUser>('SELECT * FROM consenti_users WHERE email=?', [email])
    return rows[0] ? mapUser(rows[0]) : null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    const rows = await this.q<RowUser>('SELECT * FROM consenti_users WHERE tenant_id=? ORDER BY created_at DESC', [tenantId])
    return rows.map(mapUser)
  }

  async countUsers(tenantId?: string): Promise<number> {
    const rows = tenantId
      ? await this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_users WHERE tenant_id=?', [tenantId])
      : await this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_users')
    return rows[0]?.total ?? 0
  }

  // ── Roles & permissions ───────────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    const rows = await this.q<RowRole>('SELECT * FROM consenti_roles WHERE tenant_id=?', [tenantId])
    return rows.map(mapRole)
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const id = randomUUID()
    await this.exec(
      'INSERT INTO consenti_roles (id, tenant_id, name, description) VALUES (?,?,?,?)',
      [id, data.tenantId, data.name, data.description ?? null],
    )
    const rows = await this.q<RowRole>('SELECT * FROM consenti_roles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('Role creation failed')
    return mapRole(row)
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const sets: string[] = []
    const vals: (string | number | boolean | null)[] = []
    if (data.name != null) { sets.push('name=?'); vals.push(data.name) }
    if (data.description != null) { sets.push('description=?'); vals.push(data.description) }
    if (sets.length > 0) { vals.push(id); await this.exec(`UPDATE consenti_roles SET ${sets.join(',')} WHERE id=?`, vals) }
    const rows = await this.q<RowRole>('SELECT * FROM consenti_roles WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error(`Role ${id} not found`)
    return mapRole(row)
  }

  async deleteRole(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_role_permissions WHERE role_id=?', [id])
    await this.exec('DELETE FROM consenti_user_roles WHERE role_id=?', [id])
    await this.exec('DELETE FROM consenti_roles WHERE id=?', [id])
  }

  async getAllPermissions(): Promise<Permission[]> {
    const rows = await this.q<RowPermission>('SELECT * FROM consenti_permissions ORDER BY name')
    return rows.map(mapPermission)
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rows = await this.q<RowPermission>(
      'SELECT p.* FROM consenti_permissions p JOIN consenti_role_permissions rp ON p.id=rp.permission_id WHERE rp.role_id=?',
      [roleId],
    )
    return rows.map(mapPermission)
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    const rows = tenantId
      ? await this.q<RowRole>(
        'SELECT r.* FROM consenti_roles r JOIN consenti_user_roles ur ON r.id=ur.role_id WHERE ur.user_id=? AND ur.tenant_id=?',
        [userId, tenantId],
      )
      : await this.q<RowRole>(
        'SELECT r.* FROM consenti_roles r JOIN consenti_user_roles ur ON r.id=ur.role_id WHERE ur.user_id=?',
        [userId],
      )
    return rows.map(mapRole)
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    await this.exec('INSERT IGNORE INTO consenti_user_roles (user_id, role_id, tenant_id) VALUES (?,?,?)', [userId, roleId, tenantId])
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.exec('DELETE FROM consenti_user_roles WHERE user_id=? AND role_id=? AND tenant_id=?', [userId, roleId, tenantId])
    } else {
      await this.exec('DELETE FROM consenti_user_roles WHERE user_id=? AND role_id=?', [userId, roleId])
    }
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.exec('INSERT IGNORE INTO consenti_role_permissions (role_id, permission_id) VALUES (?,?)', [roleId, permissionId])
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.exec('DELETE FROM consenti_role_permissions WHERE role_id=? AND permission_id=?', [roleId, permissionId])
  }

  // ── Audit logs ────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    await this.exec(
      'INSERT INTO consenti_audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, old_data, new_data) VALUES (?,?,?,?,?,?,?,?)',
      [randomUUID(), data.tenantId, data.userId ?? null, data.action, data.resourceType,
      data.resourceId ?? null,
      data.oldData != null ? JSON.stringify(data.oldData) : null,
      data.newData != null ? JSON.stringify(data.newData) : null],
    )
  }

  async getLogs(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    const { where, params } = this.buildAuditWhere(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [rows, countRows] = await Promise.all([
      this.q<RowAuditLogSummary>(
        `SELECT ${AUDIT_SUMMARY_COLS} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit],
      ),
      this.q<RowCount>(`SELECT COUNT(*) AS total ${where}`, params),
    ])
    return { items: rows.map(mapAuditSummary), total: countRows[0]?.total ?? 0, page, limit }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const rows = await this.q<RowAuditLog>('SELECT * FROM consenti_audit_logs WHERE id=?', [id])
    return rows[0] ? mapAuditLog(rows[0]) : null
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    const { where, params } = this.buildAuditWhere(filters)
    const rows = await this.q<RowAuditLog>(`SELECT * ${where} ORDER BY created_at ASC`, params)
    for (const r of rows) yield mapAuditLog(r)
  }

  private buildAuditWhere(f: AuditFilters): { where: string; params: (string | number | boolean | null)[] } {
    let where = 'FROM consenti_audit_logs WHERE tenant_id=?'
    const params: (string | number | boolean | null)[] = [f.tenantId]
    if (f.action != null) { where += ' AND action=?'; params.push(f.action) }
    if (f.resourceType != null) { where += ' AND resource_type=?'; params.push(f.resourceType) }
    if (f.from != null) { where += ' AND created_at>=?'; params.push(f.from) }
    if (f.to != null) { where += ' AND created_at<=?'; params.push(f.to) }
    if (f.q) {
      where += " AND (action LIKE ? OR resource_type LIKE ? OR resource_id LIKE ? OR user_id LIKE ?)"
      const like = likePrefix(f.q)
      params.push(like, like, like, like)
    }
    return { where, params }
  }

  // ── Stats extensions ───────────────────────────────────────────────────────────

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const rows = await this.q<RowCountry>(
      `SELECT v.country, COUNT(*) AS count FROM consenti_consent_records cr
       JOIN consenti_visitors v ON v.visitor_id=cr.visitor_id
       WHERE cr.tenant_id=? AND v.country IS NOT NULL
       GROUP BY v.country ORDER BY count DESC LIMIT 50`,
      [tenantId],
    )
    return rows.map(r => ({ country: r.country, count: r.count }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const [t] = await this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_consent_records WHERE tenant_id=?', [tenantId])
    const [d] = await this.q<RowCount>('SELECT COUNT(*) AS total FROM consenti_consent_records WHERE tenant_id=? AND gpc_detected=1', [tenantId])
    const total = t?.total ?? 0
    const detected = d?.total ?? 0
    return { detected, total, rate: total > 0 ? Math.round((detected / total) * 100) : 0 }
  }

  // ── Tenants ───────────────────────────────────────────────────────────────────

  async getTenants(): Promise<Tenant[]> {
    const rows = await this.q<RowTenant>('SELECT * FROM consenti_tenants ORDER BY name ASC', [])
    return rows.map(r => ({ id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }))
  }

  // ── API Keys ──────────────────────────────────────────────────────────────────

  private mapApiKey(r: RowApiKey): ApiKey {
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
    await this.exec(
      'INSERT INTO consenti_api_keys (id, tenant_id, key_hash, name, created_by, expire_by) VALUES (?,?,?,?,?,?)',
      [id, data.tenantId, data.keyHash, data.name, data.createdBy ?? null, data.expireBy ?? null],
    )
    const rows = await this.q<RowApiKey>('SELECT * FROM consenti_api_keys WHERE id=?', [id])
    const r = rows[0]
    if (!r) throw new Error('Failed to create API key')
    return this.mapApiKey(r)
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const rows = await this.q<RowApiKey>('SELECT * FROM consenti_api_keys WHERE key_hash=? AND is_active=1', [keyHash])
    const r = rows[0]
    return r ? this.mapApiKey(r) : null
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.exec('UPDATE consenti_api_keys SET is_active=0, updated_at=NOW() WHERE id=?', [id])
  }

  async reactivateApiKey(id: string): Promise<void> {
    await this.exec(
      'UPDATE consenti_api_keys SET is_active=1, updated_at=NOW(), expire_by=CASE WHEN expire_by <= NOW() THEN NULL ELSE expire_by END WHERE id=?',
      [id],
    )
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_api_keys WHERE id=?', [id])
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const rows = await this.q<RowApiKey>('SELECT * FROM consenti_api_keys WHERE tenant_id=? ORDER BY created_at DESC', [tenantId])
    return rows.map(r => this.mapApiKey(r))
  }

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    const id = randomUUID()
    const now = mysqlTimestamp()
    await this.exec('INSERT INTO consenti_tenants (id, name, slug, created_at, updated_at) VALUES (?,?,?,?,?)', [id, data.name, data.slug, now, now])
    const rows = await this.q<RowTenant>('SELECT * FROM consenti_tenants WHERE id=?', [id])
    const r = rows[0]
    if (!r) throw new Error('Failed to create tenant')
    return { id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const now = mysqlTimestamp()
    const sets: string[] = ['updated_at=?']
    const vals: (string | number)[] = [now]
    if (data.name != null) { sets.push('name=?'); vals.push(data.name) }
    if (data.slug != null) { sets.push('slug=?'); vals.push(data.slug) }
    vals.push(id)
    await this.exec(`UPDATE consenti_tenants SET ${sets.join(',')} WHERE id=?`, vals)
    const rows = await this.q<RowTenant>('SELECT * FROM consenti_tenants WHERE id=?', [id])
    const r = rows[0]
    if (!r) throw new Error(`Tenant ${id} not found`)
    return { id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async getSettings(tenantId: string): Promise<TenantSettings> {
    const rows = await this.q<RowTenantSettings>(
      'SELECT allowed_origins_json, admin_allowed_origins_json, setup_completed, profiles_seeded, tcf_confirmation_json, gpp_confirmation_json FROM consenti_tenant_settings WHERE tenant_id=?', [tenantId],
    )
    const r = rows[0]
    return r
      ? {
        allowedOrigins: JSON.parse(r.allowed_origins_json) as string[],
        adminAllowedOrigins: JSON.parse(r.admin_allowed_origins_json) as string[],
        setupCompleted: !!r.setup_completed,
        profilesSeeded: !!r.profiles_seeded,
        tcfConfirmation: r.tcf_confirmation_json ? JSON.parse(r.tcf_confirmation_json) : undefined,
        gppConfirmation: r.gpp_confirmation_json ? JSON.parse(r.gpp_confirmation_json) : undefined,
      }
      : {}
  }

  async updateSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings> {
    const current = await this.getSettings(tenantId)
    const merged = { ...current, ...data }
    await this.exec(
      `INSERT INTO consenti_tenant_settings (tenant_id, allowed_origins_json, admin_allowed_origins_json, setup_completed, profiles_seeded, tcf_confirmation_json, gpp_confirmation_json, updated_at) VALUES (?,?,?,?,?,?,?,NOW())
       ON DUPLICATE KEY UPDATE allowed_origins_json=VALUES(allowed_origins_json), admin_allowed_origins_json=VALUES(admin_allowed_origins_json), setup_completed=VALUES(setup_completed), profiles_seeded=VALUES(profiles_seeded), tcf_confirmation_json=VALUES(tcf_confirmation_json), gpp_confirmation_json=VALUES(gpp_confirmation_json), updated_at=NOW()`,
      [
        tenantId, JSON.stringify(merged.allowedOrigins ?? []), JSON.stringify(merged.adminAllowedOrigins ?? []), merged.setupCompleted ? 1 : 0,
        merged.profilesSeeded ? 1 : 0, merged.tcfConfirmation ? JSON.stringify(merged.tcfConfirmation) : null, merged.gppConfirmation ? JSON.stringify(merged.gppConfirmation) : null,
      ],
    )
    return this.getSettings(tenantId)
  }

  async deleteTenant(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_tenants WHERE id=?', [id])
  }

  async purgeExpiredConsents(olderThanDays: number): Promise<number> {
    const cutoff = mysqlTimestamp(new Date(Date.now() - olderThanDays * 86_400_000))
    const visitorRows = await this.q<{ visitor_id: string } & RowDataPacket>(
      'SELECT visitor_id FROM consenti_consent_records WHERE created_at < ?', [cutoff]
    )
    if (visitorRows.length === 0) return 0
    const ids = visitorRows.map(r => r.visitor_id)
    const placeholders = ids.map(() => '?').join(',')
    await this.exec(`DELETE FROM consenti_consent_history WHERE visitor_id IN (${placeholders})`, ids)
    await this.exec(`DELETE FROM consenti_consent_records WHERE visitor_id IN (${placeholders})`, ids)
    return ids.length
  }

  // ── Consent Templates ────────────────────────────────────────────────────────

  private mapConsentTemplate(r: RowConsentTemplate): ServerConsentTemplate {
    return {
      id: r.id, tenantId: r.tenant_id, name: r.name,
      cookies: JSON.parse(r.cookies_json), categories: JSON.parse(r.categories_json),
      createdAt: r.created_at, updatedAt: r.updated_at,
    }
  }

  async createConsentTemplate(data: CreateConsentTemplateInput): Promise<ServerConsentTemplate> {
    const id = randomConsentTemplateId()
    await this.exec(
      'INSERT INTO consenti_consent_templates (id, tenant_id, name, cookies_json, categories_json) VALUES (?,?,?,?,?)',
      [id, data.tenantId, data.name, JSON.stringify(data.cookies), JSON.stringify(data.categories)],
    )
    const created = await this.getConsentTemplate(id)
    if (!created) throw new Error('Consent template creation failed')
    return created
  }

  async updateConsentTemplate(id: string, data: UpdateConsentTemplateInput): Promise<ServerConsentTemplate> {
    const sets: string[] = []
    const vals: string[] = []
    if (data.name !== undefined) { sets.push('name=?'); vals.push(data.name) }
    if (data.cookies !== undefined) { sets.push('cookies_json=?'); vals.push(JSON.stringify(data.cookies)) }
    if (data.categories !== undefined) { sets.push('categories_json=?'); vals.push(JSON.stringify(data.categories)) }
    if (sets.length > 0) await this.exec(`UPDATE consenti_consent_templates SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    const updated = await this.getConsentTemplate(id)
    if (!updated) throw new Error('Consent template not found')
    return updated
  }

  async deleteConsentTemplate(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_consent_templates WHERE id=?', [id])
  }

  async getConsentTemplate(id: string): Promise<ServerConsentTemplate | null> {
    const rows = await this.q<RowConsentTemplate>('SELECT * FROM consenti_consent_templates WHERE id=?', [id])
    return rows[0] ? this.mapConsentTemplate(rows[0]) : null
  }

  async getConsentTemplates(tenantId: string): Promise<ServerConsentTemplate[]> {
    const rows = await this.q<RowConsentTemplate>('SELECT * FROM consenti_consent_templates WHERE tenant_id=? ORDER BY name ASC', [tenantId])
    return rows.map(r => this.mapConsentTemplate(r))
  }

  async copyConsentTemplate(id: string, newName: string): Promise<ServerConsentTemplate> {
    const src = await this.getConsentTemplate(id)
    if (!src) throw new Error('Consent template not found')
    return this.createConsentTemplate({ tenantId: src.tenantId, name: newName, cookies: src.cookies, categories: src.categories })
  }

  // ── UI Templates ─────────────────────────────────────────────────────────────

  private mapUITemplate(r: RowUITemplate): ServerUITemplate {
    const settings = JSON.parse(r.settings_json) as Omit<ServerUITemplate, 'id' | 'tenantId' | 'name' | 'createdAt' | 'updatedAt'>
    return { id: r.id, tenantId: r.tenant_id, name: r.name, ...settings, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async createUITemplate(data: CreateUITemplateInput): Promise<ServerUITemplate> {
    const id = randomUITemplateId()
    const { tenantId, name, ...settings } = data
    await this.exec(
      'INSERT INTO consenti_ui_templates (id, tenant_id, name, settings_json) VALUES (?,?,?,?)',
      [id, tenantId, name, JSON.stringify(settings)],
    )
    const created = await this.getUITemplate(id)
    if (!created) throw new Error('UI template creation failed')
    return created
  }

  async updateUITemplate(id: string, data: UpdateUITemplateInput): Promise<ServerUITemplate> {
    const rows = await this.q<RowUITemplate>('SELECT * FROM consenti_ui_templates WHERE id=?', [id])
    const row = rows[0]
    if (!row) throw new Error('UI template not found')
    const { name, ...settingsUpdate } = data
    const sets: string[] = []
    const vals: string[] = []
    if (name !== undefined) { sets.push('name=?'); vals.push(name) }
    if (Object.keys(settingsUpdate).length > 0) {
      const merged = { ...(JSON.parse(row.settings_json) as Record<string, unknown>), ...settingsUpdate }
      sets.push('settings_json=?'); vals.push(JSON.stringify(merged))
    }
    if (sets.length > 0) await this.exec(`UPDATE consenti_ui_templates SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    const updated = await this.getUITemplate(id)
    if (!updated) throw new Error('UI template not found')
    return updated
  }

  async deleteUITemplate(id: string): Promise<void> {
    await this.exec('DELETE FROM consenti_ui_templates WHERE id=?', [id])
  }

  async getUITemplate(id: string): Promise<ServerUITemplate | null> {
    const rows = await this.q<RowUITemplate>('SELECT * FROM consenti_ui_templates WHERE id=?', [id])
    return rows[0] ? this.mapUITemplate(rows[0]) : null
  }

  async getUITemplates(tenantId: string): Promise<ServerUITemplate[]> {
    const rows = await this.q<RowUITemplate>('SELECT * FROM consenti_ui_templates WHERE tenant_id=? ORDER BY name ASC', [tenantId])
    return rows.map(r => this.mapUITemplate(r))
  }

  async copyUITemplate(id: string, newName: string): Promise<ServerUITemplate> {
    const src = await this.getUITemplate(id)
    if (!src) throw new Error('UI template not found')
    const { tenantId, mainBanner, gpcBanner, preferenceModal } = src
    return this.createUITemplate({ tenantId, name: newName, mainBanner, gpcBanner, preferenceModal })
  }

  // ── Profile summaries ────────────────────────────────────────────────────────
  // Template ids live inside profile_json, so the summary is assembled in JS rather than via
  // JSON_EXTRACT/JSON_TABLE in SQL — those differ between MySQL and MariaDB (JSON_TABLE only
  // exists from MariaDB 10.6) and this adapter targets both.

  private async toProfileSummaries(profiles: Profile[]): Promise<ProfileSummary[]> {
    if (profiles.length === 0) return []
    const tenantIds = [...new Set(profiles.map(p => p.tenantId))]
    const [consentTemplates, uiTemplates] = await Promise.all([
      Promise.all(tenantIds.map(t => this.getConsentTemplates(t))),
      Promise.all(tenantIds.map(t => this.getUITemplates(t))),
    ])
    return buildProfileSummaries(
      profiles,
      new Map(consentTemplates.flat().map(t => [t.id, t.name])),
      new Map(uiTemplates.flat().map(t => [t.id, t.name])),
    )
  }

  async listProfilesSummary(tenantId: string): Promise<ProfileSummary[]> {
    const rows = await this.q<RowProfile>('SELECT * FROM consenti_profiles WHERE tenant_id=? ORDER BY created_at ASC', [tenantId])
    return this.toProfileSummaries(rows.map(mapProfile))
  }

  async findProfilesUsingConsentTemplate(templateId: string): Promise<ProfileSummary[]> {
    const rows = await this.q<RowProfile>(
      `SELECT * FROM consenti_profiles WHERE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.consentTemplateId'))=? ORDER BY name ASC`,
      [templateId],
    )
    return this.toProfileSummaries(rows.map(mapProfile))
  }

  async findProfilesUsingUITemplate(templateId: string): Promise<ProfileSummary[]> {
    const rows = await this.q<RowProfile>(
      `SELECT * FROM consenti_profiles WHERE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.uiTemplateId'))=? ORDER BY name ASC`,
      [templateId],
    )
    return this.toProfileSummaries(rows.map(mapProfile))
  }

  // ── Opt-in stats ─────────────────────────────────────────────────────────────

  async getOptInStats(tenantId: string, filters: OptInFilters): Promise<OptInStats> {
    let where = 'tenant_id=?'
    const params: (string | number)[] = [tenantId]
    if (filters.profileId) { where += ' AND profile_id=?'; params.push(filters.profileId) }
    if (filters.from) { where += ' AND created_at>=?'; params.push(filters.from) }
    if (filters.to) { where += ' AND created_at<=?'; params.push(filters.to) }
    if (filters.locale) { where += ' AND locale=?'; params.push(filters.locale) }

    const rows = await this.q<RowOptInConsent>(
      `SELECT locale, DATE_FORMAT(created_at, '%Y-%m-%d') AS day, consent_json FROM consenti_consent_records WHERE ${where} ORDER BY created_at ASC`,
      params,
    )

    return tallyOptIn(rows.map(r => ({ locale: r.locale, day: r.day, consentJson: JSON.parse(r.consent_json) as ConsentValue })))
  }
}
