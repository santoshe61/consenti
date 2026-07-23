// Single source of truth for schema definitions, seed data, and SQL generation.
// Document DBs (JSON, MongoDB) use the JS objects directly.
// SQL DBs (SQLite, PostgreSQL, MySQL) import the generated SQL exports.

// ── Schema definition types ───────────────────────────────────────────────────

/** Abstract column types — each SQL dialect maps these to its native type. */
export type ColType =
  | 'pk'        // String primary key
  | 'text'      // Short-medium text  (TEXT in SQLite/PG; VARCHAR(255) in MySQL)
  | 'text_sm'   // Short code ≤20     (TEXT in SQLite/PG; VARCHAR(20)  in MySQL)
  | 'text_md'   // Medium text ≤100   (TEXT in SQLite/PG; VARCHAR(100) in MySQL)
  | 'text_geo'  // Geo code ≤10       (TEXT in SQLite/PG; VARCHAR(10)  in MySQL)
  | 'text_hash' // Hash string ≤64    (TEXT in SQLite/PG; VARCHAR(64)  in MySQL)
  | 'longtext'  // Long text          (TEXT in SQLite/PG; LONGTEXT     in MySQL)
  | 'json'      // JSON blob          (TEXT in SQLite; JSONB in PG; LONGTEXT in MySQL)
  | 'json_ordered' // JSON blob whose object-key order is meaningful (authored button/category/
                    // cookie maps) — same as 'json' except in PG, where it uses the plain JSON
                    // type instead of JSONB. JSONB's binary storage format re-sorts object keys
                    // (by key length, then lexicographically) on every write, silently discarding
                    // authored order; plain JSON stores the exact input text. (TEXT in SQLite; JSON in PG; LONGTEXT in MySQL)
  | 'int'       // Integer
  | 'bool'      // Boolean            (INTEGER 0/1 in SQLite; BOOLEAN in PG; TINYINT(1) in MySQL)
  | 'ts'        // Timestamp with current-time default

export interface ColDef {
  n: string                        // column name
  t: ColType
  null?: true                      // nullable; omit = NOT NULL
  def?: string | number | boolean  // '$now'→now(), '$arr'→'[]', '$obj'→'{}'
  unique?: true
  ref?: string                     // REFERENCES <ref>(id)
  onDel?: 'CASCADE'
  mysqlUpd?: true                  // MySQL: ON UPDATE CURRENT_TIMESTAMP
}

export interface TableDef {
  name: string
  cols: ColDef[]
  pk?: string[]                    // composite primary key
  uq?: { cols: string[] }[]        // composite unique constraints
  idx?: { cols: string[] }[]       // secondary indexes — generated for SQLite/Postgres/MySQL,
                                    // and consumed as-is by the Mongo adapter's createIndexes().
                                    // Single source of truth: add a query pattern here once,
                                    // it reaches every storage driver.
}

// ── Table definitions ─────────────────────────────────────────────────────────

const tenants: TableDef = {
  name: 'tenants',
  cols: [
    { n: 'id',         t: 'pk' },
    { n: 'name',       t: 'text' },
    { n: 'slug',       t: 'text', unique: true },
    { n: 'created_at', t: 'ts', def: '$now' },
    { n: 'updated_at', t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

const profiles: TableDef = {
  name: 'profiles',
  cols: [
    { n: 'id',             t: 'pk' },
    { n: 'tenant_id',      t: 'text', ref: 'tenants' },
    { n: 'name',           t: 'text' },
    { n: 'default_locale', t: 'text_sm', def: 'en' },
    // Incremented in place on every save — the row is mutated, not replaced.
    { n: 'version',        t: 'int', def: 1 },
    { n: 'profile_json',   t: 'json_ordered' },
    { n: 'created_at',     t: 'ts', def: '$now' },
    { n: 'updated_at',     t: 'ts', def: '$now', mysqlUpd: true },
  ],
  idx: [{ cols: ['tenant_id'] }],
  // SQLite adapters additionally hand-roll a `(tenant_id, json_extract(profile_json,'$.complianceGroup'),
  // json_extract(profile_json,'$.isActive'))` expression index for findActiveProfileByComplianceGroup —
  // expression indexes aren't representable in this plain-column declarative system, and profiles is a
  // small, per-tenant table (not a millions-of-rows target), so it stays hand-written there.
}

const consentRecords: TableDef = {
  name: 'consent_records',
  cols: [
    { n: 'id',                     t: 'pk' },
    { n: 'tenant_id',              t: 'text', ref: 'tenants' },
    { n: 'visitor_id',             t: 'text' },
    { n: 'profile_id',             t: 'text', ref: 'profiles' },
    { n: 'locale',                 t: 'text_sm' },
    { n: 'consent_json',           t: 'json' },
    { n: 'gpc_detected',           t: 'bool', def: false },
    { n: 'source',                 t: 'text_sm' },
    { n: 'age_verified',           t: 'bool', def: false },
    { n: 'parental_consent_token', t: 'longtext', null: true },
    { n: 'tcf_string',             t: 'longtext', null: true },
    { n: 'signature',              t: 'longtext', null: true },
    { n: 'created_at',             t: 'ts', def: '$now' },
    { n: 'updated_at',             t: 'ts', def: '$now', mysqlUpd: true },
  ],
  uq: [{ cols: ['visitor_id', 'profile_id'] }],
  // `uq` above already gives every dialect a (visitor_id, profile_id) index, which — by the
  // leftmost-prefix rule every SQL engine follows — also serves lookups/prefix-searches on
  // visitor_id alone, so it isn't repeated here.
  idx: [
    { cols: ['tenant_id', 'created_at'] },              // base list/sort (no profileId filter)
    { cols: ['tenant_id', 'profile_id', 'created_at'] }, // list/sort filtered by profileId
    { cols: ['locale'] },                                // q-search column
    { cols: ['source'] },                                // q-search column
  ],
}

const consentHistory: TableDef = {
  name: 'consent_history',
  cols: [
    { n: 'id',                t: 'pk' },
    { n: 'tenant_id',         t: 'text', ref: 'tenants' },
    { n: 'consent_record_id', t: 'text', ref: 'consent_records' },
    { n: 'visitor_id',        t: 'text' },
    { n: 'old_json',          t: 'json', null: true },
    { n: 'new_json',          t: 'json' },
    { n: 'action',            t: 'text_sm' },
    { n: 'created_at',        t: 'ts', def: '$now' },
  ],
  idx: [{ cols: ['visitor_id'] }],
}

const visitors: TableDef = {
  name: 'visitors',
  cols: [
    { n: 'id',              t: 'pk' },
    { n: 'tenant_id',       t: 'text', ref: 'tenants' },
    { n: 'visitor_id',      t: 'text', unique: true },
    { n: 'country',         t: 'text_geo',  null: true },
    { n: 'region',          t: 'text_md',   null: true },
    { n: 'city',            t: 'text_md',   null: true },
    { n: 'ip_hash',         t: 'text_hash', null: true },
    { n: 'user_agent_hash', t: 'text_hash', null: true },
    { n: 'first_seen',      t: 'ts', def: '$now' },
    { n: 'last_seen',       t: 'ts', def: '$now', mysqlUpd: true },
  ],
  // visitor_id's `unique: true` above already gives every dialect an index covering visitor_id.
  idx: [
    { cols: ['tenant_id', 'first_seen'] },
    { cols: ['country'] }, // q-search column
  ],
}

const noticeShown: TableDef = {
  name: 'notice_shown',
  cols: [
    { n: 'id',         t: 'pk' },
    { n: 'tenant_id',  t: 'text', ref: 'tenants' },
    { n: 'visitor_id', t: 'text' },
    { n: 'profile_id', t: 'text', ref: 'profiles' },
    { n: 'locale',     t: 'text_sm' },
    { n: 'created_at', t: 'ts', def: '$now' },
  ],
  idx: [{ cols: ['visitor_id'] }],
}

const users: TableDef = {
  name: 'users',
  cols: [
    { n: 'id',            t: 'pk' },
    { n: 'tenant_id',     t: 'text', ref: 'tenants' },
    { n: 'name',          t: 'text' },
    { n: 'email',         t: 'text', unique: true },
    { n: 'password_hash', t: 'text' },
    { n: 'is_active',     t: 'bool', def: true },
    { n: 'totp_secret',   t: 'longtext', null: true },
    { n: 'totp_enabled',  t: 'bool', def: false },
    { n: 'created_at',    t: 'ts', def: '$now' },
    { n: 'updated_at',    t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

/** SQLite-only variant — adds `allowed_tenants`, which only the SQLite adapters currently
 * read/write (see `RawUser.allowed_tenants` in each `sqlite/*.adapter.ts`). PostgreSQL/MySQL
 * don't support per-user tenant scoping yet. */
const usersSqlite: TableDef = {
  ...users,
  cols: [...users.cols, { n: 'allowed_tenants', t: 'json', null: true }],
}

const roles: TableDef = {
  name: 'roles',
  cols: [
    { n: 'id',          t: 'pk' },
    { n: 'tenant_id',   t: 'text', ref: 'tenants' },
    { n: 'name',        t: 'text_md' },
    { n: 'description', t: 'text', null: true },
  ],
}

const permissions: TableDef = {
  name: 'permissions',
  cols: [
    { n: 'id',          t: 'pk' },
    { n: 'name',        t: 'text_md', unique: true },
    { n: 'description', t: 'text', null: true },
  ],
}

const userRoles: TableDef = {
  name: 'user_roles',
  cols: [
    { n: 'user_id',   t: 'text', ref: 'users' },
    { n: 'role_id',   t: 'text', ref: 'roles' },
    { n: 'tenant_id', t: 'text', def: 'default' },
  ],
  pk: ['user_id', 'role_id', 'tenant_id'],
  idx: [{ cols: ['user_id'] }],
}

const rolePermissions: TableDef = {
  name: 'role_permissions',
  cols: [
    { n: 'role_id',       t: 'text', ref: 'roles' },
    { n: 'permission_id', t: 'text', ref: 'permissions' },
  ],
  pk: ['role_id', 'permission_id'],
  idx: [{ cols: ['role_id'] }],
}

const auditLogs: TableDef = {
  name: 'audit_logs',
  cols: [
    { n: 'id',            t: 'pk' },
    { n: 'tenant_id',     t: 'text', ref: 'tenants' },
    { n: 'user_id',       t: 'text', null: true },
    { n: 'action',        t: 'text_md' },
    { n: 'resource_type', t: 'text_md' },
    { n: 'resource_id',   t: 'text', null: true },
    { n: 'old_data',      t: 'json', null: true },
    { n: 'new_data',      t: 'json', null: true },
    { n: 'created_at',    t: 'ts', def: '$now' },
  ],
  idx: [
    { cols: ['tenant_id', 'created_at'] },
    { cols: ['action'] },
    { cols: ['resource_type'] },
    { cols: ['resource_id'] },
    { cols: ['user_id'] },
  ],
}

const apiKeys: TableDef = {
  name: 'api_keys',
  cols: [
    { n: 'id',         t: 'pk' },
    { n: 'tenant_id',  t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'key_hash',   t: 'text_hash', unique: true },
    { n: 'name',       t: 'text' },
    { n: 'is_active',  t: 'bool', def: true },
    { n: 'created_by', t: 'text', null: true },
    { n: 'expire_by',  t: 'ts', null: true },
    { n: 'created_at', t: 'ts', def: '$now' },
    { n: 'updated_at', t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

const tenantSettings: TableDef = {
  name: 'tenant_settings',
  cols: [
    { n: 'tenant_id',                   t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'allowed_origins_json',        t: 'json', def: '$arr' },
    { n: 'admin_allowed_origins_json',  t: 'json', def: '$arr' },
    // First-run setup wizard completion flag — set once, never reset (see setup.routes.ts).
    { n: 'setup_completed',             t: 'bool', def: false },
    { n: 'updated_at',                  t: 'ts', def: '$now', mysqlUpd: true },
  ],
  pk: ['tenant_id'],
}

const consentTemplates: TableDef = {
  name: 'consent_templates',
  cols: [
    { n: 'id',             t: 'pk' },
    { n: 'tenant_id',      t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'name',           t: 'text' },
    { n: 'cookies_json',   t: 'json_ordered', def: '$obj' },
    { n: 'categories_json', t: 'json_ordered', def: '$obj' },
    { n: 'created_at',     t: 'ts', def: '$now' },
    { n: 'updated_at',     t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

const uiTemplates: TableDef = {
  name: 'ui_templates',
  cols: [
    { n: 'id',            t: 'pk' },
    { n: 'tenant_id',     t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'name',          t: 'text' },
    { n: 'settings_json', t: 'json_ordered', def: '$obj' },
    { n: 'created_at',    t: 'ts', def: '$now' },
    { n: 'updated_at',    t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

// ── Exported table definition groups ─────────────────────────────────────────
// No installations predate this schema, so every adapter creates the full current table set
// in one pass on first connect — no incremental/versioned migration steps. `migrate()` in each
// SQL adapter keeps a `schema_version`/`PRAGMA user_version` check so *future* real migrations
// have somewhere to hook in; there's just nothing to gate behind a version yet.

/** All tables, SQLite dialect — `usersSqlite` includes `allowed_tenants`. */
export const ALL_TABLES_SQLITE: readonly TableDef[] = [
  tenants, profiles, consentRecords, consentHistory, visitors,
  usersSqlite, roles, permissions, userRoles, rolePermissions, auditLogs,
  apiKeys, consentTemplates, uiTemplates, tenantSettings, noticeShown,
]

/** All tables, PostgreSQL/MySQL dialect. */
export const ALL_TABLES_FULL: readonly TableDef[] = [
  tenants, profiles, consentRecords, consentHistory, visitors,
  users, roles, permissions, userRoles, rolePermissions, auditLogs,
  apiKeys, consentTemplates, uiTemplates, tenantSettings, noticeShown,
]

// ── SQL generators ────────────────────────────────────────────────────────────

function sqliteDef(def: string | number | boolean): string {
  if (def === '$now') return `DEFAULT (datetime('now'))`
  if (def === '$arr') return `DEFAULT '[]'`
  if (def === '$obj') return `DEFAULT '{}'`
  if (def === true)   return 'DEFAULT 1'
  if (def === false)  return 'DEFAULT 0'
  if (typeof def === 'string') return `DEFAULT '${def}'`
  return `DEFAULT ${def}`
}

function buildColSQLite(c: ColDef): string {
  if (c.t === 'pk') return `${c.n} TEXT PRIMARY KEY`
  const type = (c.t === 'int' || c.t === 'bool') ? 'INTEGER' : 'TEXT'
  const parts = [`${c.n} ${type}`]
  if (!c.null) parts.push('NOT NULL')
  if (c.def !== undefined) parts.push(sqliteDef(c.def))
  if (c.unique) parts.push('UNIQUE')
  if (c.ref) { parts.push(`REFERENCES ${c.ref}(id)`); if (c.onDel) parts.push(`ON DELETE ${c.onDel}`) }
  return parts.join(' ')
}

function buildTableSQLite(t: TableDef): string {
  const lines = t.cols.map(c => `  ${buildColSQLite(c)}`)
  if (t.pk) lines.push(`  PRIMARY KEY (${t.pk.join(', ')})`)
  if (t.uq) for (const u of t.uq) lines.push(`  UNIQUE(${u.cols.join(', ')})`)
  return `CREATE TABLE IF NOT EXISTS ${t.name} (\n${lines.join(',\n')}\n);`
}

function idxName(t: TableDef, cols: string[]): string {
  return `idx_${t.name}_${cols.join('_')}`
}

function buildIndexesSQLite(t: TableDef): string {
  return (t.idx ?? [])
    .map(i => `CREATE INDEX IF NOT EXISTS ${idxName(t, i.cols)} ON ${t.name} (${i.cols.join(', ')});`)
    .join('\n')
}

function pgDef(def: string | number | boolean): string {
  if (def === '$now') return 'DEFAULT NOW()'
  if (def === '$arr') return `DEFAULT '[]'`
  if (def === '$obj') return `DEFAULT '{}'`
  if (def === true)   return 'DEFAULT TRUE'
  if (def === false)  return 'DEFAULT FALSE'
  if (typeof def === 'string') return `DEFAULT '${def}'`
  return `DEFAULT ${def}`
}

function buildColPg(c: ColDef): string {
  if (c.t === 'pk') return `${c.n} TEXT PRIMARY KEY`
  const type = c.t === 'json' ? 'JSONB' : c.t === 'json_ordered' ? 'JSON' : c.t === 'int' ? 'INTEGER' : c.t === 'bool' ? 'BOOLEAN' : c.t === 'ts' ? 'TIMESTAMPTZ' : 'TEXT'
  const parts = [`${c.n} ${type}`]
  if (!c.null) parts.push('NOT NULL')
  if (c.def !== undefined) parts.push(pgDef(c.def))
  if (c.unique) parts.push('UNIQUE')
  if (c.ref) { parts.push(`REFERENCES ${c.ref}(id)`); if (c.onDel) parts.push(`ON DELETE ${c.onDel}`) }
  return parts.join(' ')
}

function buildTablePg(t: TableDef): string {
  const lines = t.cols.map(c => `  ${buildColPg(c)}`)
  if (t.pk) lines.push(`  PRIMARY KEY (${t.pk.join(', ')})`)
  if (t.uq) for (const u of t.uq) lines.push(`  UNIQUE (${u.cols.join(', ')})`)
  return `CREATE TABLE IF NOT EXISTS ${t.name} (\n${lines.join(',\n')}\n);`
}

function buildIndexesPg(t: TableDef): string {
  // Only runs once, inside the same version-gated fresh-install transaction as the CREATE TABLE
  // statements above (see PostgreSQLAdapter#migrate), so IF NOT EXISTS is defensive, not required.
  return (t.idx ?? [])
    .map(i => `CREATE INDEX IF NOT EXISTS ${idxName(t, i.cols)} ON ${t.name} (${i.cols.join(', ')});`)
    .join('\n')
}

const MYSQL_TEXT: Partial<Record<ColType, string>> = {
  text: 'VARCHAR(255)', text_sm: 'VARCHAR(20)', text_md: 'VARCHAR(100)',
  text_geo: 'VARCHAR(10)', text_hash: 'VARCHAR(64)', longtext: 'LONGTEXT', json: 'LONGTEXT', json_ordered: 'LONGTEXT',
}

function mysqlDef(def: string | number | boolean): string {
  if (def === '$now') return 'DEFAULT CURRENT_TIMESTAMP'
  if (def === '$arr') return `DEFAULT '[]'`
  if (def === '$obj') return `DEFAULT '{}'`
  if (def === true)   return 'DEFAULT 1'
  if (def === false)  return 'DEFAULT 0'
  if (typeof def === 'string') return `DEFAULT '${def}'`
  return `DEFAULT ${def}`
}

function buildColMySQL(c: ColDef): string {
  // Prefixed IDs (e.g. `cons_<40 hex chars>`, see utils/crypto.ts) run to 45 chars — sized with
  // headroom above a bare UUID's 36.
  if (c.t === 'pk') return `${c.n} VARCHAR(64) PRIMARY KEY`
  const type = c.t === 'int' ? 'INT' : c.t === 'bool' ? 'TINYINT(1)' : c.t === 'ts' ? 'DATETIME' : (MYSQL_TEXT[c.t] ?? 'TEXT')
  const parts = [`${c.n} ${type}`]
  if (!c.null) parts.push('NOT NULL')
  if (c.def !== undefined) parts.push(mysqlDef(c.def))
  if (c.mysqlUpd) parts.push('ON UPDATE CURRENT_TIMESTAMP')
  if (c.unique) parts.push('UNIQUE')
  if (c.ref) { parts.push(`REFERENCES ${c.ref}(id)`); if (c.onDel) parts.push(`ON DELETE ${c.onDel}`) }
  return parts.join(' ')
}

function buildTableMySQL(t: TableDef): string {
  const lines = t.cols.map(c => `  ${buildColMySQL(c)}`)
  if (t.pk) lines.push(`  PRIMARY KEY (${t.pk.join(', ')})`)
  if (t.uq) for (const u of t.uq) lines.push(`  UNIQUE KEY uq_${u.cols.join('_')} (${u.cols.join(', ')})`)
  return `CREATE TABLE IF NOT EXISTS ${t.name} (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
}

function buildIndexesMySQL(t: TableDef): string {
  // MySQL's CREATE INDEX has no IF NOT EXISTS — safe regardless, since this only runs once,
  // inside the same version-gated fresh-install pass as the CREATE TABLE statements above.
  return (t.idx ?? [])
    .map(i => `CREATE INDEX ${idxName(t, i.cols)} ON ${t.name} (${i.cols.join(', ')});`)
    .join('\n')
}

function toSQLite(tables: readonly TableDef[]): string {
  const idx = tables.map(buildIndexesSQLite).filter(Boolean).join('\n')
  return idx ? `${tables.map(buildTableSQLite).join('\n')}\n${idx}` : tables.map(buildTableSQLite).join('\n')
}
function toPostgres(tables: readonly TableDef[]): string {
  const idx = tables.map(buildIndexesPg).filter(Boolean).join('\n')
  return idx ? `${tables.map(buildTablePg).join('\n')}\n${idx}` : tables.map(buildTablePg).join('\n')
}
function toMySQL(tables: readonly TableDef[]): string {
  const idx = tables.map(buildIndexesMySQL).filter(Boolean).join('\n')
  return idx ? `${tables.map(buildTableMySQL).join('\n')}\n${idx}` : tables.map(buildTableMySQL).join('\n')
}

// ── Index list for document stores ────────────────────────────────────────────
// MongoDB is schemaless, so it can't consume CREATE INDEX SQL — it consumes this list directly.
// Same source of truth as the SQL dialects above: add a query pattern once (via `idx`/`uq`/
// `unique` on a TableDef), every driver picks it up.

export interface IndexDef { table: string; cols: string[]; unique?: true }

function collectIndexes(tables: readonly TableDef[]): IndexDef[] {
  const result: IndexDef[] = []
  for (const t of tables) {
    for (const u of t.uq ?? []) result.push({ table: t.name, cols: u.cols, unique: true })
    for (const c of t.cols) if (c.unique) result.push({ table: t.name, cols: [c.n], unique: true })
    for (const i of t.idx ?? []) result.push({ table: t.name, cols: i.cols })
  }
  return result
}

/** All indexes (unique + secondary), PostgreSQL/MySQL/Mongo dialect table names. */
export const ALL_INDEXES: readonly IndexDef[] = collectIndexes(ALL_TABLES_FULL)

// ── Schema SQL exports ────────────────────────────────────────────────────────
// One block per dialect containing the full current schema — applied once on first connect.

/** SQLite full schema — all tables with current column set. */
export const SCHEMA_SQL_SQLITE = toSQLite(ALL_TABLES_SQLITE)

/** PostgreSQL full schema — all tables with current column set. */
export const SCHEMA_SQL_POSTGRES =
  toPostgres(ALL_TABLES_FULL) +
  '\nCREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);\n'

/** MySQL full schema — all tables with current column set. */
export const SCHEMA_SQL_MYSQL =
  toMySQL(ALL_TABLES_FULL) +
  '\nCREATE TABLE IF NOT EXISTS schema_version (\n  version INT NOT NULL PRIMARY KEY\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n'

// ── Core data ─────────────────────────────────────────────────────────────────

export interface SeedPermission { id: string; name: string; description: string }
export interface SeedRole { id: string; tenantId: string; name: string; description: string }
export interface SeedRolePermission { roleId: string; permissionId: string }

export const SEED_TENANT = { id: 'default', name: 'Default', slug: 'default' } as const

export const SEED_PERMISSIONS: SeedPermission[] = [
  { id: 'perm_profile_create',  name: 'profile:create',  description: 'Create profiles' },
  { id: 'perm_profile_update',  name: 'profile:update',  description: 'Update profiles' },
  { id: 'perm_profile_delete',  name: 'profile:delete',  description: 'Delete profiles' },
  { id: 'perm_profile_view',    name: 'profile:view',    description: 'View profiles' },
  { id: 'perm_consent_view',    name: 'consent:view',    description: 'View consent records' },
  { id: 'perm_visitor_view',    name: 'visitor:view',    description: 'View visitor records' },
  { id: 'perm_user_create',     name: 'user:create',     description: 'Create users' },
  { id: 'perm_user_update',     name: 'user:update',     description: 'Update users' },
  { id: 'perm_user_delete',     name: 'user:delete',     description: 'Delete users' },
  { id: 'perm_user_view',       name: 'user:view',       description: 'View users' },
  { id: 'perm_role_create',     name: 'role:create',     description: 'Create roles' },
  { id: 'perm_role_update',     name: 'role:update',     description: 'Update roles' },
  { id: 'perm_role_delete',     name: 'role:delete',     description: 'Delete roles' },
  { id: 'perm_role_view',       name: 'role:view',       description: 'View roles' },
  { id: 'perm_audit_view',      name: 'audit:view',      description: 'View audit logs' },
  { id: 'perm_settings_update', name: 'settings:update', description: 'Update settings' },
  { id: 'perm_export_run',      name: 'export:run',      description: 'Run data exports' },
  { id: 'perm_stats_view',      name: 'stats:view',      description: 'View reporting and analytics' },
]

export const SEED_ROLES: SeedRole[] = [
  { id: 'role_super_admin',        tenantId: 'default', name: 'super_admin',        description: 'Full system access' },
  { id: 'role_admin',              tenantId: 'default', name: 'admin',              description: 'Administrative access' },
  { id: 'role_compliance_officer', tenantId: 'default', name: 'compliance_officer', description: 'Compliance read access' },
  { id: 'role_viewer',             tenantId: 'default', name: 'viewer',             description: 'Read-only access' },
]

const adminExcluded     = new Set(['role:delete', 'user:delete'])
const complianceAllowed = new Set(['consent:view', 'visitor:view', 'audit:view', 'profile:view', 'export:run', 'stats:view'])
const viewerAllowed     = new Set(['consent:view', 'visitor:view', 'profile:view', 'stats:view'])

export const SEED_ROLE_PERMISSIONS: SeedRolePermission[] = [
  ...SEED_PERMISSIONS.map(p => ({ roleId: 'role_super_admin', permissionId: p.id })),
  ...SEED_PERMISSIONS.filter(p => !adminExcluded.has(p.name)).map(p => ({ roleId: 'role_admin', permissionId: p.id })),
  ...SEED_PERMISSIONS.filter(p => complianceAllowed.has(p.name)).map(p => ({ roleId: 'role_compliance_officer', permissionId: p.id })),
  ...SEED_PERMISSIONS.filter(p => viewerAllowed.has(p.name)).map(p => ({ roleId: 'role_viewer', permissionId: p.id })),
]

// ── SQLite seed SQL ───────────────────────────────────────────────────────────
// Generated from seed data above — idempotent via INSERT OR IGNORE.
// MongoDB, MySQL, PostgreSQL adapters use the typed JS objects directly.

function q(s: string): string { return `'${s.replace(/'/g, "''")}'` }

function generateSeedSQL(): string {
  const { id, name, slug } = SEED_TENANT
  const tenant = `INSERT OR IGNORE INTO tenants (id, name, slug) VALUES (${q(id)},${q(name)},${q(slug)});`

  const perms = `INSERT OR IGNORE INTO permissions (id, name, description) VALUES\n${
    SEED_PERMISSIONS.map(p => `  (${q(p.id)},${q(p.name)},${q(p.description)})`).join(',\n')
  };`

  const rolesSQL = `INSERT OR IGNORE INTO roles (id, tenant_id, name, description) VALUES\n${
    SEED_ROLES.map(r => `  (${q(r.id)},${q(r.tenantId)},${q(r.name)},${q(r.description)})`).join(',\n')
  };`

  const byRole = new Map<string, string[]>()
  for (const rp of SEED_ROLE_PERMISSIONS) {
    if (!byRole.has(rp.roleId)) byRole.set(rp.roleId, [])
    byRole.get(rp.roleId)!.push(rp.permissionId)
  }
  const rolePerms = [...byRole.entries()].map(([roleId, permIds]) =>
    `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES\n${
      permIds.map(pid => `  (${q(roleId)},${q(pid)})`).join(',\n')
    };`
  ).join('\n')

  return [tenant, perms, rolesSQL, rolePerms].join('\n')
}

export const SEED_SQL = generateSeedSQL()
