import type { Pool, PoolClient, QueryResult } from 'pg'
import { randomUUID, randomProfileId, randomVisitorId, randomConsentId } from '../../utils/crypto'
import { SEED_TENANT, SEED_PERMISSIONS, SEED_ROLES, SEED_ROLE_PERMISSIONS, SCHEMA_SQL_POSTGRES } from '../seed-data'
import { likePrefix } from '../../utils/sql-search'
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
} from '@consenti/types'

// ── Raw row shapes ─────────────────────────────────────────────────────────────

interface RowProfile {
  id: string; tenant_id: string; name: string; default_locale: string
  // pg auto-parses json/jsonb columns into JS values — never raw text, so these are typed as
  // the parsed shape, not `string`. Do NOT JSON.parse() these in the mappers below.
  version: number; profile_json: StoredProfileJson
  created_at: string; updated_at: string
}
interface RowConsent {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; consent_json: ConsentValue
  gpc_detected: boolean; source: string; created_at: string; updated_at: string
  age_verified?: boolean; parental_consent_token?: string | null; tcf_string?: string | null
  signature?: string | null
}
interface RowConsentSummary {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; gpc_detected: boolean; source: string
  age_verified?: boolean; created_at: string; updated_at: string
}
interface RowConsentHistory {
  id: string; tenant_id: string; consent_record_id: string; visitor_id: string
  old_json: ConsentValue | null; new_json: ConsentValue; action: string; created_at: string
}
interface RowVisitor {
  id: string; tenant_id: string; visitor_id: string
  country: string | null; region: string | null; city: string | null
  ip_hash: string | null; user_agent_hash: string | null
  first_seen: string; last_seen: string
}
interface RowNoticeShown {
  id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; created_at: string
}
interface RowUser {
  id: string; tenant_id: string; name: string; email: string
  password_hash: string; is_active: boolean; created_at: string; updated_at: string
  totp_secret?: string | null; totp_enabled?: boolean
}
interface RowRole { id: string; tenant_id: string; name: string; description: string | null }
interface RowPermission { id: string; name: string; description: string | null }
interface RowAuditLog {
  id: string; tenant_id: string; user_id: string | null; action: string
  resource_type: string; resource_id: string | null
  old_data: unknown; new_data: unknown; created_at: string
}
interface RowAuditLogSummary {
  id: string; tenant_id: string; user_id: string | null; action: string
  resource_type: string; resource_id: string | null; created_at: string
}
interface RowCount { total: string }
interface RowStatus { status: string; count: string }
interface RowDateCount { date: string; count: string }
interface RowCookieStatus { cookie_id: string; status: string; count: string }
interface RowCountry { country: string; count: string }
interface RowApiKey {
  id: string; tenant_id: string; key_hash: string; name: string; is_active: boolean
  created_by: string | null; expire_by: string | null; created_at: string; updated_at: string | null
}
interface RowTenant { id: string; name: string; slug: string; created_at: string; updated_at: string }

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapProfile(r: RowProfile): Profile {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    defaultLocale: r.default_locale, version: r.version,
    profileJson: r.profile_json,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function mapConsent(r: RowConsent): ConsentDbRecord {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id,
    locale: r.locale,
    consentJson: r.consent_json,
    gpcDetected: r.gpc_detected, source: r.source as ConsentDbRecord['source'],
    createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.age_verified != null ? { ageVerified: r.age_verified } : {}),
    ...(r.parental_consent_token != null ? { parentalConsentToken: r.parental_consent_token } : {}),
    ...(r.tcf_string != null ? { tcfString: r.tcf_string } : {}),
    ...(r.signature != null ? { signature: r.signature } : {}),
  }
}

const CONSENT_SUMMARY_COLS = 'id, tenant_id, visitor_id, profile_id, locale, gpc_detected, source, age_verified, created_at, updated_at'

function mapConsentSummary(r: RowConsentSummary): ConsentSummary {
  return {
    id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id,
    locale: r.locale, gpcDetected: r.gpc_detected, source: r.source as ConsentDbRecord['source'],
    createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.age_verified != null ? { ageVerified: r.age_verified } : {}),
  }
}

function mapHistory(r: RowConsentHistory): ConsentHistoryEntry {
  return {
    id: r.id, tenantId: r.tenant_id, consentRecordId: r.consent_record_id,
    visitorId: r.visitor_id,
    oldJson: r.old_json,
    newJson: r.new_json,
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
    passwordHash: r.password_hash, isActive: r.is_active,
    createdAt: r.created_at, updatedAt: r.updated_at,
    totpEnabled: r.totp_enabled ?? false,
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
    ...(r.old_data != null ? { oldData: r.old_data } : {}),
    ...(r.new_data != null ? { newData: r.new_data } : {}),
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

export class PostgreSQLAdapter implements StorageAdapter {
  private pool!: Pool

  constructor(private config: StorageConfig) { }

  private async q<T>(sql: string, params: (string | number | boolean | null)[] = []): Promise<T[]> {
    const result: QueryResult<T & object> = await this.pool.query<T & object>(sql, params as unknown[])
    return result.rows
  }

  async connect(): Promise<void> {
    type PgModule = { Pool: new (cfg: Record<string, unknown>) => Pool }
    const pg = (await import('pg')) as { default: PgModule }
    const PgPool = pg.default.Pool
    const cfg = this.config
    const poolCfg: Record<string, unknown> = cfg.uri
      ? { connectionString: cfg.uri }
      : {
        host: cfg.host ?? 'localhost',
        port: cfg.port ?? 5432,
        user: cfg.user ?? 'postgres',
        password: cfg.password ?? '',
        database: cfg.database ?? 'consenti',
      }
    // Bounded by default (10, matching pg's own default — made explicit/tunable). Timeouts stay
    // unset unless configured: see StorageConfig.statementTimeoutMs's doc comment for why.
    poolCfg['max'] = cfg.poolMax ?? 10
    if (cfg.statementTimeoutMs != null) poolCfg['statement_timeout'] = cfg.statementTimeoutMs
    if (cfg.idleInTransactionTimeoutMs != null) poolCfg['idle_in_transaction_session_timeout'] = cfg.idleInTransactionTimeoutMs
    this.pool = new PgPool(poolCfg)
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    await this.pool.end()
  }

  async migrate(): Promise<void> {
    // No installations predate this schema, so a fresh connect always creates the full current
    // table set in one pass — no incremental/versioned steps needed. `schema_version` is kept
    // as the hook for whenever a *real* future migration is needed: add `if (version < N)`
    // blocks below the initial creation, the same shape as the removed historical ones.
    const client: PoolClient = await this.pool.connect()
    try {
      let version = 0
      try {
        const res = await client.query<{ version: number }>('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
        version = res.rows[0]?.version ?? 0
      } catch {
        // schema_version doesn't exist — fresh install
      }

      if (version === 0) {
        await client.query('BEGIN')
        try {
          for (const stmt of SCHEMA_SQL_POSTGRES.split(';').map(s => s.trim()).filter(Boolean)) {
            await client.query(stmt)
          }
          await this.seedTx(client)
          await client.query('INSERT INTO schema_version (version) VALUES (1) ON CONFLICT DO NOTHING')
          await client.query('COMMIT')
        } catch (err) {
          await client.query('ROLLBACK')
          throw err
        }
      }
    } finally {
      client.release()
    }
  }

  private async seedTx(client: PoolClient): Promise<void> {
    await client.query(
      'INSERT INTO tenants (id, name, slug) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [SEED_TENANT.id, SEED_TENANT.name, SEED_TENANT.slug],
    )
    for (const p of SEED_PERMISSIONS) {
      await client.query(
        'INSERT INTO permissions (id, name, description) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [p.id, p.name, p.description],
      )
    }
    for (const r of SEED_ROLES) {
      await client.query(
        'INSERT INTO roles (id, tenant_id, name, description) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [r.id, r.tenantId, r.name, r.description],
      )
    }
    for (const { roleId, permissionId } of SEED_ROLE_PERMISSIONS) {
      await client.query(
        'INSERT INTO role_permissions VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [roleId, permissionId],
      )
    }
  }

  // ── Profiles ─────────────────────────────────────────────────────────────────

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const id = randomProfileId()
    const rows = await this.q<RowProfile>(
      `INSERT INTO profiles (id, tenant_id, name, default_locale, version, profile_json)
       VALUES ($1,$2,$3,$4,$5,$6::json) RETURNING *`,
      [id, data.tenantId, data.name, data.defaultLocale, 1, JSON.stringify(data.profileJson)],
    )
    const row = rows[0]
    if (!row) throw new Error('Profile creation failed')
    return mapProfile(row)
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const sets: string[] = ['updated_at = NOW()']
    const vals: (string | number | boolean | null)[] = []
    let idx = 1
    if (data.name != null) { sets.push(`name=$${idx++}`); vals.push(data.name) }
    if (data.defaultLocale != null) { sets.push(`default_locale=$${idx++}`); vals.push(data.defaultLocale) }
    if (data.profileJson != null) { sets.push(`profile_json=$${idx++}::json`); vals.push(JSON.stringify(data.profileJson)) }
    if (data.version != null) { sets.push(`version=$${idx++}`); vals.push(data.version) }
    vals.push(id)
    const rows = await this.q<RowProfile>(
      `UPDATE profiles SET ${sets.join(',')} WHERE id=$${idx} RETURNING *`,
      vals,
    )
    const row = rows[0]
    if (!row) throw new Error(`Profile ${id} not found`)
    return mapProfile(row)
  }

  async deleteProfile(id: string): Promise<void> {
    await this.q('DELETE FROM profiles WHERE id=$1', [id])
  }

  async getProfile(id: string): Promise<Profile | null> {
    const rows = await this.q<RowProfile>('SELECT * FROM profiles WHERE id=$1', [id])
    return rows[0] ? mapProfile(rows[0]) : null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    const rows = await this.q<RowProfile>('SELECT * FROM profiles WHERE tenant_id=$1 ORDER BY created_at DESC', [tenantId])
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
    const rows = await this.q<RowConsent>(
      `INSERT INTO consent_records (id, tenant_id, visitor_id, profile_id, locale, consent_json, gpc_detected, source, age_verified, parental_consent_token, tcf_string, signature)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [id, data.tenantId, data.visitorId, data.profileId,
        data.locale, JSON.stringify(data.consentJson), data.gpcDetected, data.source,
        data.ageVerified ?? false, data.parentalConsentToken ?? null, data.tcfString ?? null, data.signature ?? null],
    )
    const row = rows[0]
    if (!row) throw new Error('Consent creation failed')
    await this.writeHistory(id, data.tenantId, data.visitorId, null, data.consentJson, 'created')
    return mapConsent(row)
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.getConsent(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)
    const sets: string[] = ['consent_json=$1::jsonb', 'updated_at=NOW()']
    const vals: (string | number | boolean | null)[] = [JSON.stringify(data.consentJson)]
    let idx = 2
    if (data.locale != null) { sets.push(`locale=$${idx++}`); vals.push(data.locale) }
    if (data.gpcDetected != null) { sets.push(`gpc_detected=$${idx++}`); vals.push(data.gpcDetected) }
    if (data.signature != null) { sets.push(`signature=$${idx++}`); vals.push(data.signature) }
    vals.push(visitorId)
    const rows = await this.q<RowConsent>(
      `UPDATE consent_records SET ${sets.join(',')} WHERE visitor_id=$${idx} RETURNING *`,
      vals,
    )
    const row = rows[0]
    if (!row) throw new Error(`Consent for visitor ${visitorId} not found`)
    await this.writeHistory(row.id, row.tenant_id, visitorId, existing.consentJson, data.consentJson, 'updated')
    return mapConsent(row)
  }

  async deleteConsent(visitorId: string): Promise<void> {
    await this.q('DELETE FROM consent_history WHERE visitor_id=$1', [visitorId])
    await this.q('DELETE FROM consent_records WHERE visitor_id=$1', [visitorId])
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    const rows = await this.q<RowConsent>('SELECT * FROM consent_records WHERE visitor_id=$1', [visitorId])
    return rows[0] ? mapConsent(rows[0]) : null
  }

  async getConsents(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>> {
    const { where, params, nextIdx } = this.buildConsentWhere(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [rows, countRows] = await Promise.all([
      this.q<RowConsentSummary>(
        `SELECT ${CONSENT_SUMMARY_COLS} ${where} ORDER BY created_at DESC LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
        [...params, limit, (page - 1) * limit],
      ),
      this.q<RowCount>(`SELECT COUNT(*)::int AS total ${where}`, params),
    ])
    return { items: rows.map(mapConsentSummary), total: Number(countRows[0]?.total ?? 0), page, limit }
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    const { where, params } = this.buildConsentWhere(filters)
    const rows = await this.q<RowConsent>(`SELECT * ${where} ORDER BY created_at ASC`, params)
    for (const r of rows) yield mapConsent(r)
  }

  private buildConsentWhere(f: ConsentFilters): { where: string; params: (string | number | boolean | null)[]; nextIdx: number } {
    let where = 'FROM consent_records WHERE tenant_id=$1'
    const params: (string | number | boolean | null)[] = [f.tenantId]
    let idx = 2
    if (f.profileId != null) { where += ` AND profile_id=$${idx++}`; params.push(f.profileId) }
    if (f.from != null) { where += ` AND created_at>=$${idx++}`; params.push(f.from) }
    if (f.to != null) { where += ` AND created_at<=$${idx++}`; params.push(f.to) }
    if (f.q) {
      where += ` AND (visitor_id ILIKE $${idx} OR profile_id ILIKE $${idx} OR locale ILIKE $${idx} OR source ILIKE $${idx}) ESCAPE '\\'`
      params.push(likePrefix(f.q))
      idx++
    }
    return { where, params, nextIdx: idx }
  }

  private async writeHistory(
    consentRecordId: string, tenantId: string, visitorId: string,
    oldJson: ConsentValue | null, newJson: ConsentValue, action: string,
  ): Promise<void> {
    await this.q(
      `INSERT INTO consent_history (id, tenant_id, consent_record_id, visitor_id, old_json, new_json, action)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`,
      [randomUUID(), tenantId, consentRecordId, visitorId,
      oldJson ? JSON.stringify(oldJson) : null, JSON.stringify(newJson), action],
    )
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    const rows = await this.q<RowConsentHistory>(
      'SELECT * FROM consent_history WHERE visitor_id=$1 ORDER BY created_at ASC',
      [visitorId],
    )
    return rows.map(mapHistory)
  }

  async createNoticeShown(data: CreateNoticeShownInput): Promise<NoticeShownRecord> {
    const id = randomUUID()
    const rows = await this.q<RowNoticeShown>(
      `INSERT INTO notice_shown (id, tenant_id, visitor_id, profile_id, locale)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, data.tenantId, data.visitorId, data.profileId, data.locale],
    )
    const r = rows[0]!
    return { id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id, profileId: r.profile_id, locale: r.locale, createdAt: r.created_at }
  }

  async getNoticeShownForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    const rows = await this.q<RowNoticeShown>(
      'SELECT * FROM notice_shown WHERE visitor_id=$1 ORDER BY created_at DESC',
      [visitorId],
    )
    return rows.map(r => ({
      id: r.id, tenantId: r.tenant_id, visitorId: r.visitor_id,
      profileId: r.profile_id, locale: r.locale, createdAt: r.created_at,
    }))
  }

  // ── Visitors ─────────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const id = randomVisitorId()
    const rows = await this.q<RowVisitor>(
      `INSERT INTO visitors (id, tenant_id, visitor_id, country, region, city, ip_hash, user_agent_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, data.tenantId, data.visitorId,
        data.country ?? null, data.region ?? null, data.city ?? null,
        data.ipHash ?? null, data.userAgentHash ?? null],
    )
    const row = rows[0]
    if (!row) throw new Error('Visitor creation failed')
    return mapVisitor(row)
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const sets: string[] = ['last_seen=NOW()']
    const vals: (string | number | boolean | null)[] = []
    let idx = 1
    if (data.country != null) { sets.push(`country=$${idx++}`); vals.push(data.country) }
    if (data.region != null) { sets.push(`region=$${idx++}`); vals.push(data.region) }
    if (data.city != null) { sets.push(`city=$${idx++}`); vals.push(data.city) }
    vals.push(visitorId)
    const rows = await this.q<RowVisitor>(
      `UPDATE visitors SET ${sets.join(',')} WHERE visitor_id=$${idx} RETURNING *`,
      vals,
    )
    const row = rows[0]
    if (!row) throw new Error(`Visitor ${visitorId} not found`)
    return mapVisitor(row)
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    await this.q('DELETE FROM visitors WHERE visitor_id=$1', [visitorId])
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    const rows = await this.q<RowVisitor>('SELECT * FROM visitors WHERE visitor_id=$1', [visitorId])
    return rows[0] ? mapVisitor(rows[0]) : null
  }

  async getVisitors(filters: VisitorFilters): Promise<PagedResult<Visitor>> {
    let where = 'FROM visitors WHERE tenant_id=$1'
    const params: (string | number | boolean | null)[] = [filters.tenantId]
    let idx = 2
    if (filters.from != null) { where += ` AND first_seen>=$${idx++}`; params.push(filters.from) }
    if (filters.to != null) { where += ` AND first_seen<=$${idx++}`; params.push(filters.to) }
    if (filters.q) {
      where += ` AND (visitor_id ILIKE $${idx} OR country ILIKE $${idx}) ESCAPE '\\'`
      params.push(likePrefix(filters.q))
      idx++
    }
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [rows, countRows] = await Promise.all([
      this.q<RowVisitor>(
        `SELECT * ${where} ORDER BY first_seen DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, (page - 1) * limit],
      ),
      this.q<RowCount>(`SELECT COUNT(*)::int AS total ${where}`, params),
    ])
    return { items: rows.map(mapVisitor), total: Number(countRows[0]?.total ?? 0), page, limit }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const [[countRow], [gpcRow], [visitorRow]] = await Promise.all([
      this.q<RowCount>('SELECT COUNT(*)::int AS total FROM consent_records WHERE tenant_id=$1', [tenantId]),
      this.q<RowCount>('SELECT COUNT(*)::int AS total FROM consent_records WHERE tenant_id=$1 AND gpc_detected=true', [tenantId]),
      this.q<RowCount>('SELECT COUNT(*)::int AS total FROM visitors WHERE tenant_id=$1', [tenantId]),
    ])
    const total = Number(countRow?.total ?? 0)
    const gpcCount = Number(gpcRow?.total ?? 0)
    const visitors = Number(visitorRow?.total ?? 0)

    const statusRows = await this.q<RowStatus>(
      `SELECT val AS status, COUNT(*)::int AS count
       FROM consent_records cr,
            jsonb_each_text(cr.consent_json) AS kv(key, val)
       WHERE cr.tenant_id=$1
       GROUP BY val`,
      [tenantId],
    )
    let granted = 0, denied = 0, all = 0
    for (const r of statusRows) {
      all += Number(r.count)
      if (r.status === 'granted') granted = Number(r.count)
      if (r.status === 'denied') denied = Number(r.count)
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
      `SELECT kv.key AS cookie_id, kv.val AS status, COUNT(*)::int AS count
       FROM consent_records cr,
            jsonb_each_text(cr.consent_json) AS kv(key, val)
       WHERE cr.tenant_id=$1
       GROUP BY kv.key, kv.val`,
      [tenantId],
    )
    const result: CategoryStats = {}
    for (const r of rows) {
      if (!result[r.cookie_id]) result[r.cookie_id] = { granted: 0, denied: 0, objected: 0 }
      const entry = result[r.cookie_id]
      if (entry) {
        if (r.status === 'granted') entry.granted += Number(r.count)
        if (r.status === 'denied') entry.denied += Number(r.count)
        if (r.status === 'objected') entry.objected += Number(r.count)
      }
    }
    return result
  }

  async getTimeline(tenantId: string, days = 30): Promise<TimelineEntry[]> {
    const from = new Date(Date.now() - days * 86400_000).toISOString()
    const rows = await this.q<RowDateCount>(
      `SELECT to_char(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
       FROM consent_records
       WHERE tenant_id=$1 AND created_at>=$2
       GROUP BY to_char(created_at, 'YYYY-MM-DD')
       ORDER BY date ASC`,
      [tenantId, from],
    )
    return rows.map(r => ({ date: r.date, count: Number(r.count) }))
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const id = randomUUID()
    const rows = await this.q<RowUser>(
      'INSERT INTO users (id, tenant_id, name, email, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, data.tenantId, data.name, data.email, data.passwordHash],
    )
    const row = rows[0]
    if (!row) throw new Error('User creation failed')
    return mapUser(row)
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const sets: string[] = ['updated_at=NOW()']
    const vals: (string | number | boolean | null)[] = []
    let idx = 1
    if (data.name != null) { sets.push(`name=$${idx++}`); vals.push(data.name) }
    if (data.email != null) { sets.push(`email=$${idx++}`); vals.push(data.email) }
    if (data.passwordHash != null) { sets.push(`password_hash=$${idx++}`); vals.push(data.passwordHash) }
    if (data.isActive != null) { sets.push(`is_active=$${idx++}`); vals.push(data.isActive) }
    vals.push(id)
    const rows = await this.q<RowUser>(
      `UPDATE users SET ${sets.join(',')} WHERE id=$${idx} RETURNING *`,
      vals,
    )
    const row = rows[0]
    if (!row) throw new Error(`User ${id} not found`)
    return mapUser(row)
  }

  async deleteUser(id: string): Promise<void> {
    await this.q('DELETE FROM user_roles WHERE user_id=$1', [id])
    await this.q('DELETE FROM users WHERE id=$1', [id])
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE id=$1', [id])
    return rows[0] ? mapUser(rows[0]) : null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE email=$1', [email])
    return rows[0] ? mapUser(rows[0]) : null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    const rows = await this.q<RowUser>('SELECT * FROM users WHERE tenant_id=$1 ORDER BY created_at DESC', [tenantId])
    return rows.map(mapUser)
  }

  async countUsers(tenantId?: string): Promise<number> {
    const rows = tenantId
      ? await this.q<RowCount>('SELECT COUNT(*)::int AS total FROM users WHERE tenant_id=$1', [tenantId])
      : await this.q<RowCount>('SELECT COUNT(*)::int AS total FROM users')
    return Number(rows[0]?.total ?? 0)
  }

  // ── Roles & permissions ───────────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    const rows = await this.q<RowRole>('SELECT * FROM roles WHERE tenant_id=$1', [tenantId])
    return rows.map(mapRole)
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const id = randomUUID()
    const rows = await this.q<RowRole>(
      'INSERT INTO roles (id, tenant_id, name, description) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, data.tenantId, data.name, data.description ?? null],
    )
    const row = rows[0]
    if (!row) throw new Error('Role creation failed')
    return mapRole(row)
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const sets: string[] = []
    const vals: (string | number | boolean | null)[] = []
    let idx = 1
    if (data.name != null) { sets.push(`name=$${idx++}`); vals.push(data.name) }
    if (data.description != null) { sets.push(`description=$${idx++}`); vals.push(data.description) }
    if (sets.length === 0) {
      const rows = await this.q<RowRole>('SELECT * FROM roles WHERE id=$1', [id])
      const row = rows[0]
      if (!row) throw new Error(`Role ${id} not found`)
      return mapRole(row)
    }
    vals.push(id)
    const rows = await this.q<RowRole>(`UPDATE roles SET ${sets.join(',')} WHERE id=$${idx} RETURNING *`, vals)
    const row = rows[0]
    if (!row) throw new Error(`Role ${id} not found`)
    return mapRole(row)
  }

  async deleteRole(id: string): Promise<void> {
    await this.q('DELETE FROM role_permissions WHERE role_id=$1', [id])
    await this.q('DELETE FROM user_roles WHERE role_id=$1', [id])
    await this.q('DELETE FROM roles WHERE id=$1', [id])
  }

  async getAllPermissions(): Promise<Permission[]> {
    const rows = await this.q<RowPermission>('SELECT * FROM permissions ORDER BY name')
    return rows.map(mapPermission)
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rows = await this.q<RowPermission>(
      'SELECT p.* FROM permissions p JOIN role_permissions rp ON p.id=rp.permission_id WHERE rp.role_id=$1',
      [roleId],
    )
    return rows.map(mapPermission)
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    const rows = tenantId
      ? await this.q<RowRole>(
        'SELECT r.* FROM roles r JOIN user_roles ur ON r.id=ur.role_id WHERE ur.user_id=$1 AND ur.tenant_id=$2',
        [userId, tenantId],
      )
      : await this.q<RowRole>(
        'SELECT r.* FROM roles r JOIN user_roles ur ON r.id=ur.role_id WHERE ur.user_id=$1',
        [userId],
      )
    return rows.map(mapRole)
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    await this.q('INSERT INTO user_roles (user_id, role_id, tenant_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [userId, roleId, tenantId])
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.q('DELETE FROM user_roles WHERE user_id=$1 AND role_id=$2 AND tenant_id=$3', [userId, roleId, tenantId])
    } else {
      await this.q('DELETE FROM user_roles WHERE user_id=$1 AND role_id=$2', [userId, roleId])
    }
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.q('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [roleId, permissionId])
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.q('DELETE FROM role_permissions WHERE role_id=$1 AND permission_id=$2', [roleId, permissionId])
  }

  // ── Audit logs ────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    await this.q(
      `INSERT INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, old_data, new_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)`,
      [randomUUID(), data.tenantId, data.userId ?? null, data.action, data.resourceType,
      data.resourceId ?? null,
      data.oldData != null ? JSON.stringify(data.oldData) : null,
      data.newData != null ? JSON.stringify(data.newData) : null],
    )
  }

  async getLogs(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    const { where, params, nextIdx } = this.buildAuditWhere(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [rows, countRows] = await Promise.all([
      this.q<RowAuditLogSummary>(
        `SELECT ${AUDIT_SUMMARY_COLS} ${where} ORDER BY created_at DESC LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
        [...params, limit, (page - 1) * limit],
      ),
      this.q<RowCount>(`SELECT COUNT(*)::int AS total ${where}`, params),
    ])
    return { items: rows.map(mapAuditSummary), total: Number(countRows[0]?.total ?? 0), page, limit }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const rows = await this.q<RowAuditLog>('SELECT * FROM audit_logs WHERE id=$1', [id])
    return rows[0] ? mapAuditLog(rows[0]) : null
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    const { where, params } = this.buildAuditWhere(filters)
    const rows = await this.q<RowAuditLog>(`SELECT * ${where} ORDER BY created_at ASC`, params)
    for (const r of rows) yield mapAuditLog(r)
  }

  private buildAuditWhere(f: AuditFilters): { where: string; params: (string | number | boolean | null)[]; nextIdx: number } {
    let where = 'FROM audit_logs WHERE tenant_id=$1'
    const params: (string | number | boolean | null)[] = [f.tenantId]
    let idx = 2
    if (f.action != null) { where += ` AND action=$${idx++}`; params.push(f.action) }
    if (f.resourceType != null) { where += ` AND resource_type=$${idx++}`; params.push(f.resourceType) }
    if (f.from != null) { where += ` AND created_at>=$${idx++}`; params.push(f.from) }
    if (f.to != null) { where += ` AND created_at<=$${idx++}`; params.push(f.to) }
    if (f.q) {
      where += ` AND (action ILIKE $${idx} OR resource_type ILIKE $${idx} OR resource_id ILIKE $${idx} OR user_id ILIKE $${idx}) ESCAPE '\\'`
      params.push(likePrefix(f.q))
      idx++
    }
    return { where, params, nextIdx: idx }
  }

  // ── Stats extensions ───────────────────────────────────────────────────────────

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const rows = await this.q<RowCountry>(
      `SELECT v.country, COUNT(*)::int AS count FROM consent_records cr
       JOIN visitors v ON v.visitor_id=cr.visitor_id
       WHERE cr.tenant_id=$1 AND v.country IS NOT NULL
       GROUP BY v.country ORDER BY count DESC LIMIT 50`,
      [tenantId],
    )
    return rows.map(r => ({ country: r.country, count: Number(r.count) }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const [t] = await this.q<RowCount>('SELECT COUNT(*)::int AS total FROM consent_records WHERE tenant_id=$1', [tenantId])
    const [d] = await this.q<RowCount>('SELECT COUNT(*)::int AS total FROM consent_records WHERE tenant_id=$1 AND gpc_detected=TRUE', [tenantId])
    const total = Number(t?.total ?? 0)
    const detected = Number(d?.total ?? 0)
    return { detected, total, rate: total > 0 ? Math.round((detected / total) * 100) : 0 }
  }

  // ── Tenants ───────────────────────────────────────────────────────────────────

  async getTenants(): Promise<Tenant[]> {
    const rows = await this.q<RowTenant>('SELECT * FROM tenants ORDER BY name ASC', [])
    return rows.map(r => ({ id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }))
  }

  // ── API Keys ──────────────────────────────────────────────────────────────────

  private mapApiKey(r: RowApiKey): ApiKey {
    return {
      id: r.id, tenantId: r.tenant_id, keyHash: r.key_hash, name: r.name, isActive: r.is_active,
      ...(r.created_by !== null ? { createdBy: r.created_by } : {}),
      ...(r.expire_by !== null ? { expireBy: r.expire_by } : {}),
      createdAt: r.created_at,
      ...(r.updated_at !== null ? { updatedAt: r.updated_at } : {}),
    }
  }

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const id = randomUUID()
    const rows = await this.q<RowApiKey>(
      'INSERT INTO api_keys (id, tenant_id, key_hash, name, created_by, expire_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, data.tenantId, data.keyHash, data.name, data.createdBy ?? null, data.expireBy ?? null],
    )
    const r = rows[0]
    if (!r) throw new Error('Failed to create API key')
    return this.mapApiKey(r)
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const rows = await this.q<RowApiKey>('SELECT * FROM api_keys WHERE key_hash=$1 AND is_active=TRUE', [keyHash])
    const r = rows[0]
    return r ? this.mapApiKey(r) : null
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.q('UPDATE api_keys SET is_active=FALSE, updated_at=NOW() WHERE id=$1', [id])
  }

  async reactivateApiKey(id: string): Promise<void> {
    await this.q(
      "UPDATE api_keys SET is_active=TRUE, updated_at=NOW(), expire_by=CASE WHEN expire_by <= NOW() THEN NULL ELSE expire_by END WHERE id=$1",
      [id],
    )
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.q('DELETE FROM api_keys WHERE id=$1', [id])
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const rows = await this.q<RowApiKey>('SELECT * FROM api_keys WHERE tenant_id=$1 ORDER BY created_at DESC', [tenantId])
    return rows.map(r => this.mapApiKey(r))
  }

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const rows = await this.q<RowTenant>(
      'INSERT INTO tenants (id, name, slug, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, data.name, data.slug, now, now],
    )
    const r = rows[0]
    if (!r) throw new Error('Failed to create tenant')
    return { id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const now = new Date().toISOString()
    const sets: string[] = ['updated_at=$1']
    const vals: (string | number)[] = [now]
    let idx = 2
    if (data.name != null) { sets.push(`name=$${idx++}`); vals.push(data.name) }
    if (data.slug != null) { sets.push(`slug=$${idx++}`); vals.push(data.slug) }
    vals.push(id)
    const rows = await this.q<RowTenant>(
      `UPDATE tenants SET ${sets.join(',')} WHERE id=$${idx} RETURNING *`, vals,
    )
    const r = rows[0]
    if (!r) throw new Error(`Tenant ${id} not found`)
    return { id: r.id, name: r.name, slug: r.slug, createdAt: r.created_at, updatedAt: r.updated_at }
  }

  async deleteTenant(id: string): Promise<void> {
    await this.q('DELETE FROM tenants WHERE id=$1', [id])
  }

  async getSettings(tenantId: string): Promise<TenantSettings> {
    const rows = await this.q<{ allowed_origins_json: string[]; admin_allowed_origins_json: string[]; setup_completed: boolean }>(
      'SELECT allowed_origins_json, admin_allowed_origins_json, setup_completed FROM tenant_settings WHERE tenant_id=$1', [tenantId],
    )
    const r = rows[0]
    return r ? { allowedOrigins: r.allowed_origins_json, adminAllowedOrigins: r.admin_allowed_origins_json, setupCompleted: r.setup_completed } : {}
  }

  async updateSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings> {
    const current = await this.getSettings(tenantId)
    const merged = { ...current, ...data }
    await this.q(
      `INSERT INTO tenant_settings (tenant_id, allowed_origins_json, admin_allowed_origins_json, setup_completed, updated_at) VALUES ($1,$2::jsonb,$3::jsonb,$4,NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET allowed_origins_json=$2::jsonb, admin_allowed_origins_json=$3::jsonb, setup_completed=$4, updated_at=NOW()`,
      [tenantId, JSON.stringify(merged.allowedOrigins ?? []), JSON.stringify(merged.adminAllowedOrigins ?? []), merged.setupCompleted ?? false],
    )
    return this.getSettings(tenantId)
  }

  async purgeExpiredConsents(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const visitorRows = await this.q<{ visitor_id: string }>(
      'SELECT visitor_id FROM consent_records WHERE created_at < $1', [cutoff]
    )
    if (visitorRows.length === 0) return 0
    const ids = visitorRows.map(r => r.visitor_id)
    const placeholders = ids.map((_: string, i: number) => `$${i + 1}`).join(',')
    await this.q(`DELETE FROM consent_history WHERE visitor_id IN (${placeholders})`, ids)
    await this.q(`DELETE FROM consent_records WHERE visitor_id IN (${placeholders})`, ids)
    return ids.length
  }

  async purgeExpiredAuditLogs(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const rows = await this.q<RowCount>('SELECT COUNT(*)::int AS total FROM audit_logs WHERE created_at < $1', [cutoff])
    await this.q('DELETE FROM audit_logs WHERE created_at < $1', [cutoff])
    return Number(rows[0]?.total ?? 0)
  }

  // Template methods — not yet implemented for PostgreSQL adapter
  async createConsentTemplate(): Promise<never> { throw new Error('Not implemented') }
  async updateConsentTemplate(): Promise<never> { throw new Error('Not implemented') }
  async deleteConsentTemplate(): Promise<void> { throw new Error('Not implemented') }
  async getConsentTemplate(): Promise<never> { throw new Error('Not implemented') }
  async getConsentTemplates(): Promise<never> { throw new Error('Not implemented') }
  async copyConsentTemplate(): Promise<never> { throw new Error('Not implemented') }
  async createUITemplate(): Promise<never> { throw new Error('Not implemented') }
  async updateUITemplate(): Promise<never> { throw new Error('Not implemented') }
  async deleteUITemplate(): Promise<void> { throw new Error('Not implemented') }
  async getUITemplate(): Promise<never> { throw new Error('Not implemented') }
  async getUITemplates(): Promise<never> { throw new Error('Not implemented') }
  async copyUITemplate(): Promise<never> { throw new Error('Not implemented') }

  // Profile summary / analytics — not yet implemented for PostgreSQL adapter
  async listProfilesSummary(): Promise<never[]> { return [] }
  async findProfilesUsingConsentTemplate(): Promise<never[]> { return [] }
  async findProfilesUsingUITemplate(): Promise<never[]> { return [] }
  async getOptInStats(): Promise<never> { throw new Error('Not implemented') }
}
