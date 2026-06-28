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
    { n: 'version',        t: 'int', def: 1 },
    { n: 'profile_json',   t: 'json' },
    { n: 'created_at',     t: 'ts', def: '$now' },
    { n: 'updated_at',     t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

// SQLite initial schema — without enterprise columns (added via ALTER TABLE in v3 migration)
const consentRecordsBase: TableDef = {
  name: 'consent_records',
  cols: [
    { n: 'id',              t: 'pk' },
    { n: 'tenant_id',       t: 'text', ref: 'tenants' },
    { n: 'visitor_id',      t: 'text' },
    { n: 'profile_id',      t: 'text', ref: 'profiles' },
    { n: 'profile_version', t: 'int' },
    { n: 'locale',          t: 'text_sm' },
    { n: 'consent_json',    t: 'json' },
    { n: 'gpc_detected',    t: 'bool', def: false },
    { n: 'source',          t: 'text_sm' },
    { n: 'created_at',      t: 'ts', def: '$now' },
    { n: 'updated_at',      t: 'ts', def: '$now', mysqlUpd: true },
  ],
  uq: [{ cols: ['visitor_id', 'profile_id'] }],
}

// Full schema — includes enterprise columns; used for PostgreSQL/MySQL
const consentRecordsFull: TableDef = {
  name: 'consent_records',
  cols: [
    { n: 'id',                     t: 'pk' },
    { n: 'tenant_id',              t: 'text', ref: 'tenants' },
    { n: 'visitor_id',             t: 'text' },
    { n: 'profile_id',             t: 'text', ref: 'profiles' },
    { n: 'profile_version',        t: 'int' },
    { n: 'locale',                 t: 'text_sm' },
    { n: 'consent_json',           t: 'json' },
    { n: 'gpc_detected',           t: 'bool', def: false },
    { n: 'source',                 t: 'text_sm' },
    { n: 'age_verified',           t: 'bool', def: false },
    { n: 'parental_consent_token', t: 'longtext', null: true },
    { n: 'tcf_string',             t: 'longtext', null: true },
    { n: 'created_at',             t: 'ts', def: '$now' },
    { n: 'updated_at',             t: 'ts', def: '$now', mysqlUpd: true },
  ],
  uq: [{ cols: ['visitor_id', 'profile_id'] }],
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
}

// SQLite initial schema — without TOTP columns (added via ALTER TABLE in v3 migration)
const usersBase: TableDef = {
  name: 'users',
  cols: [
    { n: 'id',            t: 'pk' },
    { n: 'tenant_id',     t: 'text', ref: 'tenants' },
    { n: 'name',          t: 'text' },
    { n: 'email',         t: 'text', unique: true },
    { n: 'password_hash', t: 'text' },
    { n: 'is_active',     t: 'bool', def: true },
    { n: 'created_at',    t: 'ts', def: '$now' },
    { n: 'updated_at',    t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

// Full schema — includes TOTP columns; used for PostgreSQL/MySQL
const usersFull: TableDef = {
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

// SQLite v1 — no tenant_id column (added via ALTER TABLE in v4 migration)
const userRolesBase: TableDef = {
  name: 'user_roles',
  cols: [
    { n: 'user_id', t: 'text', ref: 'users' },
    { n: 'role_id', t: 'text', ref: 'roles' },
  ],
  pk: ['user_id', 'role_id'],
}

// Full schema with tenant_id — used for PostgreSQL/MySQL
const userRolesFull: TableDef = {
  name: 'user_roles',
  cols: [
    { n: 'user_id',   t: 'text', ref: 'users' },
    { n: 'role_id',   t: 'text', ref: 'roles' },
    { n: 'tenant_id', t: 'text', def: 'default' },
  ],
  pk: ['user_id', 'role_id', 'tenant_id'],
}

const rolePermissions: TableDef = {
  name: 'role_permissions',
  cols: [
    { n: 'role_id',       t: 'text', ref: 'roles' },
    { n: 'permission_id', t: 'text', ref: 'permissions' },
  ],
  pk: ['role_id', 'permission_id'],
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
}

const apiKeys: TableDef = {
  name: 'api_keys',
  cols: [
    { n: 'id',         t: 'pk' },
    { n: 'tenant_id',  t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'key_hash',   t: 'text_hash', unique: true },
    { n: 'name',       t: 'text' },
    { n: 'is_active',  t: 'bool', def: true },
    { n: 'created_at', t: 'ts', def: '$now' },
  ],
}

const cookieTemplates: TableDef = {
  name: 'cookie_templates',
  cols: [
    { n: 'id',           t: 'pk' },
    { n: 'tenant_id',    t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'name',         t: 'text' },
    { n: 'cookies_json', t: 'json', def: '$arr' },
    { n: 'created_at',   t: 'ts', def: '$now' },
    { n: 'updated_at',   t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

const uiTemplates: TableDef = {
  name: 'ui_templates',
  cols: [
    { n: 'id',            t: 'pk' },
    { n: 'tenant_id',     t: 'text', ref: 'tenants', onDel: 'CASCADE' },
    { n: 'name',          t: 'text' },
    { n: 'settings_json', t: 'json', def: '$obj' },
    { n: 'created_at',    t: 'ts', def: '$now' },
    { n: 'updated_at',    t: 'ts', def: '$now', mysqlUpd: true },
  ],
}

// ── Exported table definition groups ─────────────────────────────────────────

/** Core tables for SQLite initial (v1) migration — no enterprise columns, no tenant_id in user_roles. */
export const CORE_TABLES_SQLITE: readonly TableDef[] = [
  tenants, profiles, consentRecordsBase, consentHistory, visitors,
  usersBase, roles, permissions, userRolesBase, rolePermissions, auditLogs,
]

/** Core tables with all current columns — for PostgreSQL/MySQL full initial schema. */
export const CORE_TABLES_FULL: readonly TableDef[] = [
  tenants, profiles, consentRecordsFull, consentHistory, visitors,
  usersFull, roles, permissions, userRolesFull, rolePermissions, auditLogs,
]

/** api_keys table — SQLite v2 migration. */
export const API_KEY_TABLES: readonly TableDef[] = [apiKeys]

/** Template tables — SQLite v5 migration. */
export const TEMPLATE_TABLES: readonly TableDef[] = [cookieTemplates, uiTemplates]

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
  const type = c.t === 'json' ? 'JSONB' : c.t === 'int' ? 'INTEGER' : c.t === 'bool' ? 'BOOLEAN' : c.t === 'ts' ? 'TIMESTAMPTZ' : 'TEXT'
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

const MYSQL_TEXT: Partial<Record<ColType, string>> = {
  text: 'VARCHAR(255)', text_sm: 'VARCHAR(20)', text_md: 'VARCHAR(100)',
  text_geo: 'VARCHAR(10)', text_hash: 'VARCHAR(64)', longtext: 'LONGTEXT', json: 'LONGTEXT',
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
  if (c.t === 'pk') return `${c.n} VARCHAR(36) PRIMARY KEY`
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

function toSQLite(tables: readonly TableDef[]): string { return tables.map(buildTableSQLite).join('\n') }
function toPostgres(tables: readonly TableDef[]): string { return tables.map(buildTablePg).join('\n') }
function toMySQL(tables: readonly TableDef[]): string { return tables.map(buildTableMySQL).join('\n') }

// ── Schema SQL exports ────────────────────────────────────────────────────────
// SQLite: separate blocks matching its versioned migration steps.
// PostgreSQL/MySQL: one block containing the full current schema.

/** SQLite v1 migration: core tables. */
export const SCHEMA_SQL_SQLITE = toSQLite(CORE_TABLES_SQLITE)

/** SQLite v2 migration: api_keys table. */
export const SCHEMA_SQL_SQLITE_API_KEYS = toSQLite(API_KEY_TABLES)

/** SQLite v3 migration: enterprise columns added via ALTER TABLE (not generatable from TableDef). */
export const SCHEMA_SQL_SQLITE_ENTERPRISE = `
ALTER TABLE consent_records ADD COLUMN age_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE consent_records ADD COLUMN parental_consent_token TEXT;
ALTER TABLE consent_records ADD COLUMN tcf_string TEXT;
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;
`

/** SQLite v5 migration: template tables. */
export const SCHEMA_SQL_SQLITE_TEMPLATES = toSQLite(TEMPLATE_TABLES)

const ALL_TABLES_FULL: readonly TableDef[] = [...CORE_TABLES_FULL, ...API_KEY_TABLES, ...TEMPLATE_TABLES]

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
]

export const SEED_ROLES: SeedRole[] = [
  { id: 'role_super_admin',        tenantId: 'default', name: 'super_admin',        description: 'Full system access' },
  { id: 'role_admin',              tenantId: 'default', name: 'admin',              description: 'Administrative access' },
  { id: 'role_compliance_officer', tenantId: 'default', name: 'compliance_officer', description: 'Compliance read access' },
  { id: 'role_viewer',             tenantId: 'default', name: 'viewer',             description: 'Read-only access' },
]

const adminExcluded     = new Set(['role:delete', 'user:delete'])
const complianceAllowed = new Set(['consent:view', 'visitor:view', 'audit:view', 'profile:view', 'export:run'])
const viewerAllowed     = new Set(['consent:view', 'visitor:view', 'profile:view'])

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
