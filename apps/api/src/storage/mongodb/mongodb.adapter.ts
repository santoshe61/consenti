import type { MongoClient, Db } from 'mongodb'
import { randomUUID } from '../../utils/crypto'
import { SEED_TENANT, SEED_PERMISSIONS, SEED_ROLES, SEED_ROLE_PERMISSIONS } from '../seed-data'
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

// ── Raw document shapes ────────────────────────────────────────────────────────

interface DocProfile {
  _id: string; tenant_id: string; name: string; default_locale: string
  version: number; profile_json: ProfileConfig
  created_at: string; updated_at: string
}
interface DocConsent {
  _id: string; tenant_id: string; visitor_id: string; profile_id: string
  profile_version: number; locale: string; consent_json: ConsentValue
  gpc_detected: boolean; source: string; created_at: string; updated_at: string
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
interface DocApiKey {
  _id: string; tenant_id: string; key_hash: string; name: string; is_active: boolean; created_at: string
}

// ── Mapper helpers ─────────────────────────────────────────────────────────────

function cast<T extends object>(doc: object | null): T | null {
  return doc as T | null
}

function castArr<T extends object>(docs: object[]): T[] {
  return docs as T[]
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
    profileVersion: d.profile_version, locale: d.locale, consentJson: d.consent_json,
    gpcDetected: d.gpc_detected, source: d.source as ConsentDbRecord['source'],
    createdAt: d.created_at, updatedAt: d.updated_at,
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
    ...(d.country        != null ? { country:       d.country        } : {}),
    ...(d.region         != null ? { region:        d.region         } : {}),
    ...(d.city           != null ? { city:          d.city           } : {}),
    ...(d.ip_hash        != null ? { ipHash:        d.ip_hash        } : {}),
    ...(d.user_agent_hash!= null ? { userAgentHash: d.user_agent_hash} : {}),
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
    ...(d.user_id     != null ? { userId:     d.user_id     } : {}),
    ...(d.resource_id != null ? { resourceId: d.resource_id } : {}),
    ...(d.old_data    != null ? { oldData:    d.old_data    } : {}),
    ...(d.new_data    != null ? { newData:    d.new_data    } : {}),
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
  find(filter: object): DocCursor
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

  constructor(private config: StorageConfig) {}

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
    this.db = this.client.db(this.config.dbName ?? this.config.database ?? 'consenti')
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
    await this.col('consent_records').createIndex({ visitor_id: 1, profile_id: 1 }, { unique: true })
    await this.col('consent_records').createIndex({ tenant_id: 1 })
    await this.col('consent_records').createIndex({ created_at: 1 })
    await this.col('visitors').createIndex({ visitor_id: 1 }, { unique: true })
    await this.col('visitors').createIndex({ tenant_id: 1 })
    await this.col('users').createIndex({ email: 1 }, { unique: true })
    await this.col('audit_logs').createIndex({ tenant_id: 1, created_at: 1 })
    await this.col('user_roles').createIndex({ user_id: 1 })
    await this.col('role_permissions').createIndex({ role_id: 1 })
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
    const doc: DocProfile = {
      _id: randomUUID(), tenant_id: data.tenantId, name: data.name,
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
    if (data.name != null)          set['name']           = data.name
    if (data.defaultLocale != null) set['default_locale'] = data.defaultLocale
    if (data.profileJson != null)   set['profile_json']   = data.profileJson
    const res = cast<DocProfile>(await this.col('profiles').findOneAndUpdate(
      { _id: id }, { $set: set, $inc: { version: 1 } }, { returnDocument: 'after' },
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

  // ── Consents ─────────────────────────────────────────────────────────────────

  async createConsent(data: CreateConsentInput): Promise<ConsentDbRecord> {
    const now = new Date().toISOString()
    const doc: DocConsent = {
      _id: randomUUID(), tenant_id: data.tenantId, visitor_id: data.visitorId,
      profile_id: data.profileId, profile_version: data.profileVersion,
      locale: data.locale, consent_json: data.consentJson,
      gpc_detected: data.gpcDetected, source: data.source,
      created_at: now, updated_at: now,
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
    if (data.locale      != null) set['locale']       = data.locale
    if (data.gpcDetected != null) set['gpc_detected'] = data.gpcDetected
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

  async getConsents(filters: ConsentFilters): Promise<ConsentDbRecord[]> {
    const q = this.buildConsentFilter(filters)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const docs = castArr<DocConsent>(
      await this.col('consent_records').find(q).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    )
    return docs.map(mapConsent)
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
      if (f.to   != null) range['$lte'] = f.to
      q['created_at'] = range
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

  // ── Visitors ─────────────────────────────────────────────────────────────────

  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const now = new Date().toISOString()
    const doc: DocVisitor = {
      _id: randomUUID(), tenant_id: data.tenantId, visitor_id: data.visitorId,
      first_seen: now, last_seen: now,
      ...(data.country       != null ? { country:        data.country       } : {}),
      ...(data.region        != null ? { region:         data.region        } : {}),
      ...(data.city          != null ? { city:           data.city          } : {}),
      ...(data.ipHash        != null ? { ip_hash:        data.ipHash        } : {}),
      ...(data.userAgentHash != null ? { user_agent_hash: data.userAgentHash } : {}),
    }
    await this.col('visitors').insertOne(doc)
    return mapVisitor(doc)
  }

  async updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    const set: Record<string, string> = { last_seen: data.lastSeen ?? new Date().toISOString() }
    if (data.country != null) set['country'] = data.country
    if (data.region  != null) set['region']  = data.region
    if (data.city    != null) set['city']    = data.city
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

  async getVisitors(filters: VisitorFilters): Promise<Visitor[]> {
    const q: Record<string, unknown> = { tenant_id: filters.tenantId }
    if (filters.from != null || filters.to != null) {
      const r: Record<string, string> = {}
      if (filters.from != null) r['$gte'] = filters.from
      if (filters.to   != null) r['$lte'] = filters.to
      q['first_seen'] = r
    }
    const page  = filters.page  ?? 1
    const limit = filters.limit ?? 50
    const docs = castArr<DocVisitor>(
      await this.col('visitors').find(q).sort({ first_seen: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    )
    return docs.map(mapVisitor)
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
      if (r._id === 'denied')  denied  = r.count
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
        if (r._id.status === 'granted')  entry.granted  += r.count
        if (r._id.status === 'denied')   entry.denied   += r.count
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
    if (data.name         != null) set['name']          = data.name
    if (data.email        != null) set['email']         = data.email
    if (data.passwordHash != null) set['password_hash'] = data.passwordHash
    if (data.isActive     != null) set['is_active']     = data.isActive
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
    if (data.name        != null) set['name']        = data.name
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
      ...(data.userId     != null ? { user_id:     data.userId     } : {}),
      ...(data.resourceId != null ? { resource_id: data.resourceId } : {}),
      ...(data.oldData    != null ? { old_data:    data.oldData    } : {}),
      ...(data.newData    != null ? { new_data:    data.newData    } : {}),
      created_at: new Date().toISOString(),
    }
    await this.col('audit_logs').insertOne(doc)
  }

  async getLogs(filters: AuditFilters): Promise<AuditLog[]> {
    const q = this.buildAuditFilter(filters)
    const page  = filters.page  ?? 1
    const limit = filters.limit ?? 50
    const docs = castArr<DocAuditLog>(
      await this.col('audit_logs').find(q).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    )
    return docs.map(mapAuditLog)
  }

  async *streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog> {
    const q = this.buildAuditFilter(filters)
    const cursor = this.col('audit_logs').find(q).sort({ created_at: 1 })
    for await (const doc of cursor) yield mapAuditLog(doc as unknown as DocAuditLog)
  }

  private buildAuditFilter(f: AuditFilters): Record<string, unknown> {
    const q: Record<string, unknown> = { tenant_id: f.tenantId }
    if (f.action       != null) q['action']        = f.action
    if (f.resourceType != null) q['resource_type'] = f.resourceType
    if (f.from != null || f.to != null) {
      const r: Record<string, string> = {}
      if (f.from != null) r['$gte'] = f.from
      if (f.to   != null) r['$lte'] = f.to
      q['created_at'] = r
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

  async createApiKey(data: CreateApiKeyInput): Promise<ApiKey> {
    const doc: DocApiKey = {
      _id: randomUUID(), tenant_id: data.tenantId, key_hash: data.keyHash,
      name: data.name, is_active: true, created_at: new Date().toISOString(),
    }
    await this.col('api_keys').insertOne(doc)
    return { id: doc._id, tenantId: doc.tenant_id, keyHash: doc.key_hash, name: doc.name, isActive: doc.is_active, createdAt: doc.created_at }
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const doc = cast<DocApiKey>(await this.col('api_keys').findOne({ key_hash: keyHash, is_active: true }))
    if (!doc) return null
    return { id: doc._id, tenantId: doc.tenant_id, keyHash: doc.key_hash, name: doc.name, isActive: doc.is_active, createdAt: doc.created_at }
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.col('api_keys').updateOne({ _id: id }, { $set: { is_active: false } })
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    const docs = castArr<DocApiKey>(await this.col('api_keys').find({ tenant_id: tenantId }).sort({ created_at: -1 }).toArray())
    return docs.map(d => ({ id: d._id, tenantId: d.tenant_id, keyHash: d.key_hash, name: d.name, isActive: d.is_active, createdAt: d.created_at }))
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

  // Template methods — not yet implemented for MongoDB adapter
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
