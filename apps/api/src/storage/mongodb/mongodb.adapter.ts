import type { MongoClient, Db } from 'mongodb'
import { randomUUID, randomProfileId, randomVisitorId, randomConsentId } from '../../utils/crypto'
import { SEED_TENANT, SEED_PERMISSIONS, SEED_ROLES, SEED_ROLE_PERMISSIONS, ALL_INDEXES } from '../seed-data'
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

// ── Raw document shapes ────────────────────────────────────────────────────────

interface DocProfile {
  _id: string; tenant_id: string; name: string; default_locale: string
  version: number; profile_json: StoredProfileJson
  created_at: string; updated_at: string
}
interface DocConsent {
  _id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; consent_json: ConsentValue
  gpc_detected: boolean; source: string; created_at: string; updated_at: string
  age_verified?: boolean; parental_consent_token?: string; tcf_string?: string
  signature?: string
}
interface DocConsentSummary {
  _id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; gpc_detected: boolean; source: string
  created_at: string; updated_at: string
  age_verified?: boolean
}
interface DocConsentHistory {
  _id: string; tenant_id: string; consent_record_id: string; visitor_id: string
  old_json: ConsentValue | null; new_json: ConsentValue; action: string; created_at: string
}
interface DocVisitor {
  _id: string; tenant_id: string; visitor_id: string
  country?: string; region?: string; city?: string
  ip_hash?: string; user_agent_hash?: string
  first_seen: string; last_seen: string
}
interface DocNoticeShown {
  _id: string; tenant_id: string; visitor_id: string; profile_id: string
  locale: string; created_at: string
}
interface DocUser {
  _id: string; tenant_id: string; name: string; email: string
  password_hash: string; is_active: boolean; created_at: string; updated_at: string
}
interface DocRole { _id: string; tenant_id: string; name: string; description?: string }
interface DocPermission { _id: string; name: string; description?: string }
interface DocUserRole { user_id: string; role_id: string; tenant_id?: string }
interface DocRolePermission { role_id: string; permission_id: string }
interface DocAuditLog {
  _id: string; tenant_id: string; user_id?: string; action: string
  resource_type: string; resource_id?: string
  old_data?: unknown; new_data?: unknown; created_at: string
}
interface DocAuditLogSummary {
  _id: string; tenant_id: string; user_id?: string; action: string
  resource_type: string; resource_id?: string; created_at: string
}
interface DocApiKey {
  _id: string; tenant_id: string; key_hash: string; name: string; is_active: boolean
  created_by?: string; expire_by?: string; created_at: string; updated_at?: string
}

// ── Mapper helpers ─────────────────────────────────────────────────────────────

function cast<T extends object>(doc: object | null): T | null {
  return doc as T | null
}

function castArr<T extends object>(docs: object[]): T[] {
  return docs as T[]
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mapProfile(d: DocProfile): Profile {
  return {
    id: d._id, tenantId: d.tenant_id, name: d.name,
    defaultLocale: d.default_locale, version: d.version,
    profileJson: d.profile_json, createdAt: d.created_at, updatedAt: d.updated_at,
  }
}

function mapConsent(d: DocConsent): ConsentDbRecord {
  return {
    id: d._id, tenantId: d.tenant_id, visitorId: d.visitor_id, profileId: d.profile_id,
    locale: d.locale, consentJson: d.consent_json,
    gpcDetected: d.gpc_detected, source: d.source as ConsentDbRecord['source'],
    createdAt: d.created_at, updatedAt: d.updated_at,
    ...(d.age_verified != null ? { ageVerified: d.age_verified } : {}),
    ...(d.parental_consent_token != null ? { parentalConsentToken: d.parental_consent_token } : {}),
    ...(d.tcf_string != null ? { tcfString: d.tcf_string } : {}),
    ...(d.signature != null ? { signature: d.signature } : {}),
  }
}

const CONSENT_SUMMARY_PROJECTION = { tenant_id: 1, visitor_id: 1, profile_id: 1, locale: 1, gpc_detected: 1, source: 1, age_verified: 1, created_at: 1, updated_at: 1 }

function mapConsentSummary(d: DocConsentSummary): ConsentSummary {
  return {
    id: d._id, tenantId: d.tenant_id, visitorId: d.visitor_id, profileId: d.profile_id,
    locale: d.locale, gpcDetected: d.gpc_detected, source: d.source as ConsentDbRecord['source'],
    createdAt: d.created_at, updatedAt: d.updated_at,
    ...(d.age_verified != null ? { ageVerified: d.age_verified } : {}),
  }
}

function mapHistory(d: DocConsentHistory): ConsentHistoryEntry {
  return {
    id: d._id, tenantId: d.tenant_id, consentRecordId: d.consent_record_id,
    visitorId: d.visitor_id, oldJson: d.old_json, newJson: d.new_json,
    action: d.action as ConsentHistoryEntry['action'], createdAt: d.created_at,
  }
}

function mapVisitor(d: DocVisitor): Visitor {
  return {
    id: d._id, tenantId: d.tenant_id, visitorId: d.visitor_id,
    ...(d.country != null ? { country: d.country } : {}),
    ...(d.region != null ? { region: d.region } : {}),
    ...(d.city != null ? { city: d.city } : {}),
    ...(d.ip_hash != null ? { ipHash: d.ip_hash } : {}),
    ...(d.user_agent_hash != null ? { userAgentHash: d.user_agent_hash } : {}),
    firstSeen: d.first_seen, lastSeen: d.last_seen,
  }
}

function mapUser(d: DocUser): AdminUser {
  return {
    id: d._id, tenantId: d.tenant_id, name: d.name, email: d.email,
    passwordHash: d.password_hash, isActive: d.is_active,
    createdAt: d.created_at, updatedAt: d.updated_at,
  }
}

function mapRole(d: DocRole): Role {
  return {
    id: d._id, tenantId: d.tenant_id, name: d.name,
    ...(d.description != null ? { description: d.description } : {}),
  }
}

function mapPermission(d: DocPermission): Permission {
  return {
    id: d._id, name: d.name,
    ...(d.description != null ? { description: d.description } : {}),
  }
}

function mapAuditLog(d: DocAuditLog): AuditLog {
  return {
    id: d._id, tenantId: d.tenant_id, action: d.action, resourceType: d.resource_type,
    ...(d.user_id != null ? { userId: d.user_id } : {}),
    ...(d.resource_id != null ? { resourceId: d.resource_id } : {}),
    ...(d.old_data != null ? { oldData: d.old_data } : {}),
    ...(d.new_data != null ? { newData: d.new_data } : {}),
    createdAt: d.created_at,
  }
}

const AUDIT_SUMMARY_PROJECTION = { tenant_id: 1, user_id: 1, action: 1, resource_type: 1, resource_id: 1, created_at: 1 }

function mapAuditSummary(d: DocAuditLogSummary): AuditLogSummary {
  return {
    id: d._id, tenantId: d.tenant_id, action: d.action, resourceType: d.resource_type,
    ...(d.user_id != null ? { userId: d.user_id } : {}),
    ...(d.resource_id != null ? { resourceId: d.resource_id } : {}),
    createdAt: d.created_at,
  }
}

// ── Adapter ────────────────────────────────────────────────────────────────────

// Custom thin wrappers so MongoDB's ObjectId generics don't interfere with our string _id.
// DocCursor extends AsyncIterable so it supports `for await...of` iteration.
interface DocCursor extends AsyncIterable<object> {
  sort(s: object): DocCursor
  skip(n: number): DocCursor
  limit(n: number): DocCursor
  toArray(): Promise<object[]>
}
interface DocCollection {
  insertOne(doc: object): Promise<object>
  findOne(filter: object): Promise<object | null>
  findOneAndUpdate(filter: object, update: object, options?: object): Promise<object | null>
  find(filter: object, options?: { projection: object }): DocCursor
  updateOne(filter: object, update: object, options?: object): Promise<object>
  deleteOne(filter: object): Promise<object>
  deleteMany(filter: object): Promise<object>
  countDocuments(filter?: object): Promise<number>
  createIndex(spec: object, options?: object): Promise<object>
  aggregate(pipeline: object[]): { toArray(): Promise<object[]> }
}

export class MongoDBAdapter implements StorageAdapter {
  private client!: MongoClient
  private db!: Db

  constructor(private config: StorageConfig) { }

  private col(name: string): DocCollection {
    // MongoDB's Collection generics assume ObjectId for _id; we use string UUIDs throughout.
    // The cast via unknown is the TypeScript-sanctioned way to bridge structurally incompatible types.
    return this.db.collection(name) as unknown as DocCollection
  }

  async connect(): Promise<void> {
    const { MongoClient: MC } = (await import('mongodb')) as { MongoClient: typeof MongoClient }
    const uri = this.config.uri ?? 'mongodb://localhost:27017'
    this.client = new MC(uri)
    await this.client.connect()
    this.db = this.client.db(this.config.database ?? 'consenti')
    await this.migrate()
  }

  async disconnect(): Promise<void> {
    await this.client.close()
  }

  async migrate(): Promise<void> {
    await this.createIndexes()
    await this.seed()
  }

  private async createIndexes(): Promise<void> {
    // Single source of truth: apps/api/src/storage/seed-data.ts's `ALL_INDEXES`, generated from
    // the same TableDef list that drives CREATE INDEX for SQLite/Postgres/MySQL. createIndex() is
    // idempotent (a no-op when an identical index already exists), and this only runs once per
    // process at connect() time — not per request.
    for (const { table, cols, unique } of ALL_INDEXES) {
      const spec = Object.fromEntries(cols.map(c => [c, 1]))
      await this.col(table).createIndex(spec, unique ? { unique: true } : undefined)
    }
  }

  private async seed(): Promise<void> {
    const { id, name, slug } = SEED_TENANT
    if (!(await this.col('tenants').findOne({ _id: id }))) {
      await this.col('tenants').insertOne({ _id: id, name, slug })
    }
    for (const p of SEED_PERMISSIONS) {
      const doc = { _id: p.id, name: p.name, description: p.description }
      await this.col('permissions').updateOne({ _id: p.id }, { $setOnInsert: doc }, { upsert: true })
    }
    for (const r of SEED_ROLES) {
      const doc = { _id: r.id, tenant_id: r.tenantId, name: r.name, description: r.description }
      await this.col('roles').updateOne({ _id: r.id }, { $setOnInsert: doc }, { upsert: true })
    }
    const rp = this.col('role_permissions')
    for (const { roleId, permissionId } of SEED_ROLE_PERMISSIONS) {
      await rp.updateOne(
        { role_id: roleId, permission_id: permissionId },
        { $setOnInsert: { role_id: roleId, permission_id: permissionId } },
        { upsert: true },
      )
    }
  }

  // ── Profiles ─────────────────────────────────────────────────────────────────

  async createProfile(data: CreateProfileInput): Promise<Profile> {
    const now = new Date().toISOString()
    const id = randomProfileId()
    const doc: DocProfile = {
      _id: id, tenant_id: data.tenantId, name: data.name,
      default_locale: data.defaultLocale, version: 1,
      profile_json: data.profileJson,
      created_at: now, updated_at: now,
    }
    await this.col('profiles').insertOne(doc)
    return mapProfile(doc)
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    const now = new Date().toISOString()
    const set: Record<string, unknown> = { updated_at: now }
    if (data.name != null) set['name'] = data.name
    if (data.defaultLocale != null) set['default_locale'] = data.defaultLocale
    if (data.profileJson != null) set['profile_json'] = data.profileJson
    if (data.version != null) set['version'] = data.version
    const res = cast<DocProfile>(await this.col('profiles').findOneAndUpdate(
      { _id: id }, { $set: set }, { returnDocument: 'after' },
    ))
    if (!res) throw new Error(`Profile ${id} not found`)
    return mapProfile(res)
  }

  async deleteProfile(id: string): Promise<void> {
    await this.col('profiles').deleteOne({ _id: id })
  }

  async getProfile(id: string): Promise<Profile | null> {
    const doc = cast<DocProfile>(await this.col('profiles').findOne({ _id: id }))
    return doc ? mapProfile(doc) : null
  }

  async getProfiles(tenantId: string): Promise<Profile[]> {
    const docs = castArr<DocProfile>(await this.col('profiles').find({ tenant_id: tenantId }).toArray())
    return docs.map(mapProfile)
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
    const now = new Date().toISOString()
    const doc: DocConsent = {
      _id: randomConsentId(), tenant_id: data.tenantId, visitor_id: data.visitorId,
      profile_id: data.profileId,
      locale: data.locale, consent_json: data.consentJson,
      gpc_detected: data.gpcDetected, source: data.source,
      created_at: now, updated_at: now,
      ...(data.ageVerified != null ? { age_verified: data.ageVerified } : {}),
      ...(data.parentalConsentToken != null ? { parental_consent_token: data.parentalConsentToken } : {}),
      ...(data.tcfString != null ? { tcf_string: data.tcfString } : {}),
      ...(data.signature != null ? { signature: data.signature } : {}),
    }
    await this.col('consent_records').insertOne(doc)
    await this.writeHistory(doc._id, data.tenantId, data.visitorId, null, data.consentJson, 'created')
    return mapConsent(doc)
  }

  async updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.getConsent(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)
    const now = new Date().toISOString()
    const set: Record<string, unknown> = { updated_at: now, consent_json: data.consentJson }
    if (data.locale != null) set['locale'] = data.locale
    if (data.gpcDetected != null) set['gpc_detected'] = data.gpcDetected
    if (data.signature != null) set['signature'] = data.signature
    const res = cast<DocConsent>(await this.col('consent_records').findOneAndUpdate(
      { visitor_id: visitorId }, { $set: set }, { returnDocument: 'after' },
    ))
    if (!res) throw new Error(`Consent for visitor ${visitorId} not found`)
    await this.writeHistory(res._id, res.tenant_id, visitorId, existing.consentJson, data.consentJson, 'updated')
    return mapConsent(res)
  }

  async deleteConsent(visitorId: string): Promise<void> {
    await this.col('consent_history').deleteMany({ visitor_id: visitorId })
    await this.col('consent_records').deleteOne({ visitor_id: visitorId })
  }

  async getConsent(visitorId: string): Promise<ConsentDbRecord | null> {
    const doc = cast<DocConsent>(await this.col('consent_records').findOne({ visitor_id: visitorId }))
    return doc ? mapConsent(doc) : null
  }

  async getConsents(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>> {
    const q = this.buildConsentFilter(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [docsRaw, total] = await Promise.all([
      this.col('consent_records').find(q, { projection: CONSENT_SUMMARY_PROJECTION })
        .sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      this.col('consent_records').countDocuments(q),
    ])
    return { items: castArr<DocConsentSummary>(docsRaw).map(mapConsentSummary), total, page, limit }
  }

  async *streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord> {
    const q = this.buildConsentFilter(filters)
    const cursor = this.col('consent_records').find(q).sort({ created_at: 1 })
    for await (const doc of cursor) yield mapConsent(doc as unknown as DocConsent)
  }

  private buildConsentFilter(f: ConsentFilters): Record<string, unknown> {
    const q: Record<string, unknown> = { tenant_id: f.tenantId }
    if (f.profileId != null) q['profile_id'] = f.profileId
    if (f.from != null || f.to != null) {
      const range: Record<string, string> = {}
      if (f.from != null) range['$gte'] = f.from
      if (f.to != null) range['$lte'] = f.to
      q['created_at'] = range
    }
    if (f.q) {
      // Anchored prefix match (not a mid-string wildcard) — the only regex shape that can use a
      // b-tree index on any dialect, matching how visitor/profile IDs and codes are actually
      // searched (pasted or typed from the start, never a remembered middle fragment).
      const re = { $regex: '^' + escapeRegex(f.q), $options: 'i' }
      q['$or'] = [{ visitor_id: re }, { profile_id: re }, { locale: re }, { source: re }]
    }
    return q
  }

  private async writeHistory(
    consentRecordId: string, tenantId: string, visitorId: string,
    oldJson: ConsentValue | null, newJson: ConsentValue, action: string,
  ): Promise<void> {
    const doc: DocConsentHistory = {
      _id: randomUUID(), tenant_id: tenantId, consent_record_id: consentRecordId,
      visitor_id: visitorId, old_json: oldJson, new_json: newJson,
      action, created_at: new Date().toISOString(),
    }
    await this.col('consent_history').insertOne(doc)
  }

  async getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]> {
    const docs = castArr<DocConsentHistory>(
      await this.col('consent_history').find({ visitor_id: visitorId }).sort({ created_at: 1 }).toArray(),
    )
    return docs.map(mapHistory)
  }

  async createNoticeShown(data: CreateNoticeShownInput): Promise<NoticeShownRecord> {
    const doc: DocNoticeShown = {
      _id: randomUUID(), tenant_id: data.tenantId, visitor_id: data.visitorId,
      profile_id: data.profileId, locale: data.locale, created_at: new Date().toISOString(),
    }
    await this.col('notice_shown').insertOne(doc)
    return {
      id: doc._id, tenantId: doc.tenant_id, visitorId: doc.visitor_id,
      profileId: doc.profile_id, locale: doc.locale, createdAt: doc.created_at,
    }
  }

  async getNoticeShownForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    const docs = castArr<DocNoticeShown>(
      await this.col('notice_shown').find({ visitor_id: visitorId }).sort({ created_at: -1 }).toArray(),
    )
    return docs.map(d => ({
      id: d._id, tenantId: d.tenant_id, visitorId: d.visitor_id,
      profileId: d.profile_id, locale: d.locale, createdAt: d.created_at,
    }))
  }

  // ── Visitors ─────────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const now = new Date().toISOString()
    const doc: DocVisitor = {
      _id: randomVisitorId(), tenant_id: data.tenantId, visitor_id: data.visitorId,
      first_seen: now, last_seen: now,
      ...(data.country != null ? { country: data.country } : {}),
      ...(data.region != null ? { region: data.region } : {}),
      ...(data.city != null ? { city: data.city } : {}),
      ...(data.ipHash != null ? { ip_hash: data.ipHash } : {}),
      ...(data.userAgentHash != null ? { user_agent_hash: data.userAgentHash } : {}),
    }
    await this.col('visitors').insertOne(doc)
    return mapVisitor(doc)
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const set: Record<string, string> = { last_seen: data.lastSeen ?? new Date().toISOString() }
    if (data.country != null) set['country'] = data.country
    if (data.region != null) set['region'] = data.region
    if (data.city != null) set['city'] = data.city
    const res = cast<DocVisitor>(await this.col('visitors').findOneAndUpdate(
      { visitor_id: visitorId }, { $set: set }, { returnDocument: 'after' },
    ))
    if (!res) throw new Error(`Visitor ${visitorId} not found`)
    return mapVisitor(res)
  }

  async deleteVisitor(visitorId: string): Promise<void> {
    await this.col('visitors').deleteOne({ visitor_id: visitorId })
  }

  async getVisitor(visitorId: string): Promise<Visitor | null> {
    const doc = cast<DocVisitor>(await this.col('visitors').findOne({ visitor_id: visitorId }))
    return doc ? mapVisitor(doc) : null
  }

  async getVisitors(filters: VisitorFilters): Promise<PagedResult<Visitor>> {
    const q: Record<string, unknown> = { tenant_id: filters.tenantId }
    if (filters.from != null || filters.to != null) {
      const r: Record<string, string> = {}
      if (filters.from != null) r['$gte'] = filters.from
      if (filters.to != null) r['$lte'] = filters.to
      q['first_seen'] = r
    }
    if (filters.q) {
      const re = { $regex: '^' + escapeRegex(filters.q), $options: 'i' }
      q['$or'] = [{ visitor_id: re }, { country: re }]
    }
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [docsRaw, total] = await Promise.all([
      this.col('visitors').find(q).sort({ first_seen: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      this.col('visitors').countDocuments(q),
    ])
    return { items: castArr<DocVisitor>(docsRaw).map(mapVisitor), total, page, limit }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getOverviewStats(tenantId: string): Promise<OverviewStats> {
    const [total, gpcCount, visitors] = await Promise.all([
      this.col('consent_records').countDocuments({ tenant_id: tenantId }),
      this.col('consent_records').countDocuments({ tenant_id: tenantId, gpc_detected: true }),
      this.col('visitors').countDocuments({ tenant_id: tenantId }),
    ])

    const pipeline = [
      { $match: { tenant_id: tenantId } },
      { $addFields: { values: { $objectToArray: '$consent_json' } } },
      { $unwind: '$values' },
      { $group: { _id: '$values.v', count: { $sum: 1 } } },
    ]
    const results = await this.col('consent_records').aggregate(pipeline).toArray() as Array<{ _id: string; count: number }>

    let granted = 0, denied = 0, all = 0
    for (const r of results) {
      all += r.count
      if (r._id === 'granted') granted = r.count
      if (r._id === 'denied') denied = r.count
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
    const pipeline = [
      { $match: { tenant_id: tenantId } },
      { $addFields: { pairs: { $objectToArray: '$consent_json' } } },
      { $unwind: '$pairs' },
      { $group: { _id: { cookie: '$pairs.k', status: '$pairs.v' }, count: { $sum: 1 } } },
    ]
    const rows = await this.col('consent_records').aggregate(pipeline).toArray() as Array<{ _id: { cookie: string; status: string }; count: number }>
    const result: CategoryStats = {}
    for (const r of rows) {
      const cookie = r._id.cookie
      if (!result[cookie]) result[cookie] = { granted: 0, denied: 0, objected: 0 }
      const entry = result[cookie]
      if (entry) {
        if (r._id.status === 'granted') entry.granted += r.count
        if (r._id.status === 'denied') entry.denied += r.count
        if (r._id.status === 'objected') entry.objected += r.count
      }
    }
    return result
  }

  async getTimeline(tenantId: string, days = 30): Promise<TimelineEntry[]> {
    const from = new Date(Date.now() - days * 86400_000).toISOString()
    const pipeline = [
      { $match: { tenant_id: tenantId, created_at: { $gte: from } } },
      { $group: { _id: { $substr: ['$created_at', 0, 10] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]
    const rows = await this.col('consent_records').aggregate(pipeline).toArray() as Array<{ _id: string; count: number }>
    return rows.map(r => ({ date: r._id, count: r.count }))
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const now = new Date().toISOString()
    const doc: DocUser = {
      _id: randomUUID(), tenant_id: data.tenantId, name: data.name,
      email: data.email, password_hash: data.passwordHash,
      is_active: true, created_at: now, updated_at: now,
    }
    await this.col('users').insertOne(doc)
    return mapUser(doc)
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const set: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name != null) set['name'] = data.name
    if (data.email != null) set['email'] = data.email
    if (data.passwordHash != null) set['password_hash'] = data.passwordHash
    if (data.isActive != null) set['is_active'] = data.isActive
    const res = cast<DocUser>(await this.col('users').findOneAndUpdate(
      { _id: id }, { $set: set }, { returnDocument: 'after' },
    ))
    if (!res) throw new Error(`User ${id} not found`)
    return mapUser(res)
  }

  async deleteUser(id: string): Promise<void> {
    await this.col('user_roles').deleteMany({ user_id: id })
    await this.col('users').deleteOne({ _id: id })
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const doc = cast<DocUser>(await this.col('users').findOne({ _id: id }))
    return doc ? mapUser(doc) : null
  }

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    const doc = cast<DocUser>(await this.col('users').findOne({ email }))
    return doc ? mapUser(doc) : null
  }

  async getUsers(tenantId: string): Promise<AdminUser[]> {
    const docs = castArr<DocUser>(await this.col('users').find({ tenant_id: tenantId }).toArray())
    return docs.map(mapUser)
  }

  async countUsers(tenantId?: string): Promise<number> {
    return this.col('users').countDocuments(tenantId ? { tenant_id: tenantId } : {})
  }

  // ── Roles & permissions ───────────────────────────────────────────────────────

  async getRoles(tenantId: string): Promise<Role[]> {
    const docs = castArr<DocRole>(await this.col('roles').find({ tenant_id: tenantId }).toArray())
    return docs.map(mapRole)
  }

  async createRole(data: CreateRoleInput): Promise<Role> {
    const doc: DocRole = {
      _id: randomUUID(), tenant_id: data.tenantId, name: data.name,
      ...(data.description != null ? { description: data.description } : {}),
    }
    await this.col('roles').insertOne(doc)
    return mapRole(doc)
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
    const set: Record<string, string> = {}
    if (data.name != null) set['name'] = data.name
    if (data.description != null) set['description'] = data.description
    const res = cast<DocRole>(await this.col('roles').findOneAndUpdate(
      { _id: id }, { $set: set }, { returnDocument: 'after' },
    ))
    if (!res) throw new Error(`Role ${id} not found`)
    return mapRole(res)
  }

  async deleteRole(id: string): Promise<void> {
    await this.col('role_permissions').deleteMany({ role_id: id })
    await this.col('user_roles').deleteMany({ role_id: id })
    await this.col('roles').deleteOne({ _id: id })
  }

  async getAllPermissions(): Promise<Permission[]> {
    const docs = castArr<DocPermission>(await this.col('permissions').find({}).toArray())
    return docs.map(mapPermission)
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rps = castArr<DocRolePermission>(
      await this.col('role_permissions').find({ role_id: roleId }).toArray(),
    )
    const ids = rps.map(r => r.permission_id)
    if (ids.length === 0) return []
    const docs = castArr<DocPermission>(await this.col('permissions').find({ _id: { $in: ids } }).toArray())
    return docs.map(mapPermission)
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    const filter = tenantId
      ? { user_id: userId, tenant_id: tenantId }
      : { user_id: userId }
    const urs = castArr<DocUserRole>(await this.col('user_roles').find(filter).toArray())
    const ids = urs.map(r => r.role_id)
    if (ids.length === 0) return []
    const docs = castArr<DocRole>(await this.col('roles').find({ _id: { $in: ids } }).toArray())
    return docs.map(mapRole)
  }

  async assignRole(userId: string, roleId: string, tenantId = 'default'): Promise<void> {
    await this.col('user_roles').updateOne(
      { user_id: userId, role_id: roleId, tenant_id: tenantId },
      { $setOnInsert: { user_id: userId, role_id: roleId, tenant_id: tenantId } },
      { upsert: true },
    )
  }

  async revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.col('user_roles').deleteOne({ user_id: userId, role_id: roleId, tenant_id: tenantId })
    } else {
      await this.col('user_roles').deleteMany({ user_id: userId, role_id: roleId })
    }
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.col('role_permissions').updateOne(
      { role_id: roleId, permission_id: permissionId },
      { $setOnInsert: { role_id: roleId, permission_id: permissionId } },
      { upsert: true },
    )
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.col('role_permissions').deleteOne({ role_id: roleId, permission_id: permissionId })
  }

  // ── Audit logs ────────────────────────────────────────────────────────────────

  async createLog(data: CreateAuditLogInput): Promise<void> {
    const doc: DocAuditLog = {
      _id: randomUUID(), tenant_id: data.tenantId, action: data.action,
      resource_type: data.resourceType,
      ...(data.userId != null ? { user_id: data.userId } : {}),
      ...(data.resourceId != null ? { resource_id: data.resourceId } : {}),
      ...(data.oldData != null ? { old_data: data.oldData } : {}),
      ...(data.newData != null ? { new_data: data.newData } : {}),
      created_at: new Date().toISOString(),
    }
    await this.col('audit_logs').insertOne(doc)
  }

  async getLogs(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    const q = this.buildAuditFilter(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const [docsRaw, total] = await Promise.all([
      this.col('audit_logs').find(q, { projection: AUDIT_SUMMARY_PROJECTION })
        .sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      this.col('audit_logs').countDocuments(q),
    ])
    return { items: castArr<DocAuditLogSummary>(docsRaw).map(mapAuditSummary), total, page, limit }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const doc = cast<DocAuditLog>(await this.col('audit_logs').findOne({ _id: id }))
    return doc ? mapAuditLog(doc) : null
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    const q = this.buildAuditFilter(filters)
    const cursor = this.col('audit_logs').find(q).sort({ created_at: 1 })
    for await (const doc of cursor) yield mapAuditLog(doc as unknown as DocAuditLog)
  }

  private buildAuditFilter(f: AuditFilters): Record<string, unknown> {
    const q: Record<string, unknown> = { tenant_id: f.tenantId }
    if (f.action != null) q['action'] = f.action
    if (f.resourceType != null) q['resource_type'] = f.resourceType
    if (f.from != null || f.to != null) {
      const r: Record<string, string> = {}
      if (f.from != null) r['$gte'] = f.from
      if (f.to != null) r['$lte'] = f.to
      q['created_at'] = r
    }
    if (f.q) {
      const re = { $regex: '^' + escapeRegex(f.q), $options: 'i' }
      q['$or'] = [{ action: re }, { resource_type: re }, { resource_id: re }, { user_id: re }]
    }
    return q
  }

  // ── Stats extensions ──────────────────────────────────────────────────────────

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    const pipeline = [
      { $match: { tenant_id: tenantId } },
      { $lookup: { from: 'visitors', localField: 'visitor_id', foreignField: 'visitor_id', as: 'v' } },
      { $unwind: '$v' },
      { $match: { 'v.country': { $ne: null } } },
      { $group: { _id: '$v.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]
    const rows = await this.col('consent_records').aggregate(pipeline).toArray() as Array<{ _id: string; count: number }>
    return rows.map(r => ({ country: r._id, count: r.count }))
  }

  async getGpcStats(tenantId: string): Promise<GpcStats> {
    const total = await this.col('consent_records').countDocuments({ tenant_id: tenantId })
    const detected = await this.col('consent_records').countDocuments({ tenant_id: tenantId, gpc_detected: true })
    return { detected, total, rate: total > 0 ? Math.round((detected / total) * 100) : 0 }
  }

  // ── Tenants ───────────────────────────────────────────────────────────────────

  async getTenants(): Promise<Tenant[]> {
    const docs = castArr<{ _id: string; name: string; slug: string; created_at: string; updated_at: string }>(
      await this.col('tenants').find({}).toArray()
    )
    return docs.map(d => ({ id: d._id, name: d.name, slug: d.slug, createdAt: d.created_at, updatedAt: d.updated_at }))
  }

  // ── API Keys ──────────────────────────────────────────────────────────────────

  private mapApiKey(d: DocApiKey): ApiKey {
    return {
      id: d._id, tenantId: d.tenant_id, keyHash: d.key_hash, name: d.name, isActive: d.is_active,
      ...(d.created_by !== undefined ? { createdBy: d.created_by } : {}),
      ...(d.expire_by !== undefined ? { expireBy: d.expire_by } : {}),
      createdAt: d.created_at,
      ...(d.updated_at !== undefined ? { updatedAt: d.updated_at } : {}),
    }
  }

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const now = new Date().toISOString()
    const doc: DocApiKey = {
      _id: randomUUID(), tenant_id: data.tenantId, key_hash: data.keyHash,
      name: data.name, is_active: true,
      ...(data.createdBy !== undefined ? { created_by: data.createdBy } : {}),
      ...(data.expireBy !== undefined ? { expire_by: data.expireBy } : {}),
      created_at: now, updated_at: now,
    }
    await this.col('api_keys').insertOne(doc)
    return this.mapApiKey(doc)
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const doc = cast<DocApiKey>(await this.col('api_keys').findOne({ key_hash: keyHash, is_active: true }))
    return doc ? this.mapApiKey(doc) : null
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.col('api_keys').updateOne({ _id: id }, { $set: { is_active: false, updated_at: new Date().toISOString() } })
  }

  async reactivateApiKey(id: string): Promise<void> {
    const doc = cast<DocApiKey>(await this.col('api_keys').findOne({ _id: id }))
    if (!doc) return
    const expired = doc.expire_by && new Date(doc.expire_by) <= new Date()
    await this.col('api_keys').updateOne(
      { _id: id },
      {
        $set: { is_active: true, updated_at: new Date().toISOString() },
        ...(expired ? { $unset: { expire_by: '' } } : {}),
      },
    )
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.col('api_keys').deleteOne({ _id: id })
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const docs = castArr<DocApiKey>(await this.col('api_keys').find({ tenant_id: tenantId }).sort({ created_at: -1 }).toArray())
    return docs.map(d => this.mapApiKey(d))
  }

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const doc = { _id: id, name: data.name, slug: data.slug, created_at: now, updated_at: now }
    await this.col('tenants').insertOne(doc)
    return { id, name: data.name, slug: data.slug, createdAt: now, updatedAt: now }
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    const now = new Date().toISOString()
    const update: Record<string, string> = { updated_at: now }
    if (data.name != null) update['name'] = data.name
    if (data.slug != null) update['slug'] = data.slug
    await this.col('tenants').updateOne({ _id: id }, { $set: update })
    const doc = cast<{ _id: string; name: string; slug: string; created_at: string; updated_at: string }>(
      await this.col('tenants').findOne({ _id: id })
    )
    if (!doc) throw new Error(`Tenant ${id} not found`)
    return { id: doc._id, name: doc.name, slug: doc.slug, createdAt: doc.created_at, updatedAt: doc.updated_at }
  }

  async deleteTenant(id: string): Promise<void> {
    await this.col('tenants').deleteOne({ _id: id })
  }

  async getSettings(tenantId: string): Promise<TenantSettings> {
    const doc = cast<{ _id: string; allowed_origins?: string[]; admin_allowed_origins?: string[]; setup_completed?: boolean }>(
      await this.col('tenant_settings').findOne({ _id: tenantId })
    )
    return {
      ...(doc?.allowed_origins !== undefined ? { allowedOrigins: doc.allowed_origins } : {}),
      ...(doc?.admin_allowed_origins !== undefined ? { adminAllowedOrigins: doc.admin_allowed_origins } : {}),
      ...(doc?.setup_completed !== undefined ? { setupCompleted: doc.setup_completed } : {}),
    }
  }

  async updateSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings> {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.allowedOrigins !== undefined) update['allowed_origins'] = data.allowedOrigins
    if (data.adminAllowedOrigins !== undefined) update['admin_allowed_origins'] = data.adminAllowedOrigins
    if (data.setupCompleted !== undefined) update['setup_completed'] = data.setupCompleted
    await this.col('tenant_settings').updateOne({ _id: tenantId }, { $set: update }, { upsert: true })
    return this.getSettings(tenantId)
  }

  async purgeExpiredConsents(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const docs = castArr<{ visitor_id: string }>(
      await this.col('consent_records').find({ created_at: { $lt: cutoff } }).toArray()
    )
    if (docs.length === 0) return 0
    const visitorIds = docs.map(d => d.visitor_id)
    await this.col('consent_history').deleteMany({ visitor_id: { $in: visitorIds } })
    await this.col('consent_records').deleteMany({ visitor_id: { $in: visitorIds } })
    return docs.length
  }

  async purgeExpiredAuditLogs(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString()
    const filter = { created_at: { $lt: cutoff } }
    const count = await this.col('audit_logs').countDocuments(filter)
    await this.col('audit_logs').deleteMany(filter)
    return count
  }

  // Template methods — not yet implemented for MongoDB adapter
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

  // Profile summary / analytics — not yet implemented for MongoDB adapter
  async listProfilesSummary(): Promise<never[]> { return [] }
  async findProfilesUsingConsentTemplate(): Promise<never[]> { return [] }
  async findProfilesUsingUITemplate(): Promise<never[]> { return [] }
  async getOptInStats(): Promise<never> { throw new Error('Not implemented') }
}
