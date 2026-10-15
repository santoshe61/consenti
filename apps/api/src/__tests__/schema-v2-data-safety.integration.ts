/**
 * Schema v1 → v2 must never lose or alter existing data. These tests fill EVERY table of a v1
 * SQLite database (awkward values, thousands of rows, WAL mode), upgrade it, and compare full
 * before/after dumps — then prove the failure paths leave the data untouched.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { NodeSqliteBuiltinAdapter } from '../storage/sqlite/node-sqlite-builtin.adapter.js'
import { NodeSqlite3WasmAdapter } from '../storage/sqlite/node-sqlite3-wasm.adapter.js'
import { SCHEMA_SQL_SQLITE, SEED_SQL } from '../storage/seed-data.js'
import type { StorageAdapter, StorageConfig } from '@consenti/types'

const CONSENT_ROWS = 5000

/** The v1 schema, derived from the current one: foreign keys back on, profile_version off. */
function legacyV1Schema(): string {
  return SCHEMA_SQL_SQLITE
    .replace(/^ {2}profile_version INTEGER,?\n/gm, '')
    .replace(/profile_id TEXT NOT NULL/g, 'profile_id TEXT NOT NULL REFERENCES profiles(id)')
}

type Dump = Record<string, string[]>

/** Every table, every column, every row — as canonical strings, so two dumps compare exactly. */
function dumpAll(db: DatabaseSync, skipColumns: Record<string, string[]> = {}): Dump {
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map(t => t.name)
  const out: Dump = {}
  for (const table of tables) {
    const skip = new Set(skipColumns[table] ?? [])
    const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]
    out[table] = rows
      .map(r => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !skip.has(k)).sort(([a], [b]) => a.localeCompare(b)))))
      .sort()
  }
  return out
}

const NASTY = [
  'plain', '', ' leading and trailing ', 'ünïcödé — 日本語 — 🍪🔒', "quote ' double \" backslash \\",
  'line\nbreak\r\nand\ttab', 'null\u0000byte-ish', '%_wildcards%', '{"json":"looking"}', 'x'.repeat(5000),
]

function populate(db: DatabaseSync): void {
  const run = (sql: string, ...args: (string | number | null)[]) => db.prepare(sql).run(...args)
  run("INSERT INTO tenants (id, name, slug) VALUES ('t2', 'Second', 'second')")
  run("INSERT INTO users (id, tenant_id, name, email, password_hash, totp_secret, allowed_tenants) VALUES ('u1','default','Ann','ann@example.com','scrypt$abc',NULL,'[\"default\"]')")
  run("INSERT INTO users (id, tenant_id, name, email, password_hash, totp_secret, totp_enabled) VALUES ('u2','t2','Bob','bob@example.com','scrypt$def','SECRET',1)")
  run("INSERT INTO user_roles (user_id, role_id, tenant_id) SELECT 'u1', id, 'default' FROM roles LIMIT 1")
  run("INSERT INTO api_keys (id, tenant_id, key_hash, name, created_by, expire_by) VALUES ('k1','default','hash1','Key','u1','2030-01-01 00:00:00')")
  run("INSERT INTO consent_templates (id, tenant_id, name, cookies_json, categories_json) VALUES ('ct1','default','CT','{\"b\":1,\"a\":2}','{\"z\":1,\"y\":2}')")
  run("INSERT INTO ui_templates (id, tenant_id, name, settings_json) VALUES ('ut1','default','UT','{\"k\":\"v\"}')")
  run("INSERT INTO tenant_settings (tenant_id, allowed_origins_json, setup_completed, profiles_seeded, tcf_confirmation_json) VALUES ('default','[\"https://a.example\"]',1,1,'{\"h\":\"x\"}')")
  NASTY.forEach((n, i) => run('INSERT INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, old_data, new_data) VALUES (?,?,?,?,?,?,?,?)',
    `a${i}`, 'default', 'u1', 'profile:updated', 'profile', `p${i}`, JSON.stringify({ note: n }), i % 2 ? null : JSON.stringify({ n: i })))
  for (let p = 0; p < 3; p++) {
    run('INSERT INTO profiles (id, tenant_id, name, default_locale, version, profile_json) VALUES (?,?,?,?,?,?)',
      `prof_${p}`, 'default', `Profile ${NASTY[p]}`, 'en', p + 1, JSON.stringify({ complianceGroup: 'opt-in', n: NASTY[p] }))
  }
  db.exec('BEGIN')
  const consent = db.prepare(`INSERT INTO consent_records
    (id, tenant_id, visitor_id, profile_id, locale, consent_json, gpc_detected, source, age_verified, parental_consent_token, tcf_string, gpp_string, signature, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  const visitor = db.prepare('INSERT INTO visitors (id, tenant_id, visitor_id, country, region, city, ip_hash, user_agent_hash) VALUES (?,?,?,?,?,?,?,?)')
  const history = db.prepare('INSERT INTO consent_history (id, tenant_id, consent_record_id, visitor_id, old_json, new_json, action, created_at) VALUES (?,?,?,?,?,?,?,?)')
  const notice = db.prepare('INSERT INTO notice_shown (id, tenant_id, visitor_id, profile_id, locale, created_at) VALUES (?,?,?,?,?,?)')
  for (let i = 0; i < CONSENT_ROWS; i++) {
    const v = `visitor-${i}`
    const withExtras = i % 3 === 0
    visitor.run(`vid${i}`, 'default', v, i % 2 ? 'DE' : null, null, NASTY[i % NASTY.length]!, 'a'.repeat(64), null)
    consent.run(
      `cons_${i}`, 'default', v, `prof_${i % 3}`, ['en', 'de', 'ja'][i % 3]!, JSON.stringify({ analytics: i % 2 ? 'granted' : 'denied', note: NASTY[i % NASTY.length] }),
      i % 5 === 0 ? 1 : 0, ['banner', 'api', 'import'][i % 3]!, i % 7 === 0 ? 1 : 0,
      withExtras ? 'ptok' : null, withExtras ? 'CPtcf' : null, withExtras ? 'DBABgpp' : null, withExtras ? `sig${i}` : null,
      `2026-0${(i % 9) + 1}-1${i % 10} 10:00:00`, `2026-0${(i % 9) + 1}-2${i % 10} 11:30:15`,
    )
    history.run(`h${i}a`, 'default', `cons_${i}`, v, null, JSON.stringify({ analytics: 'granted' }), 'created', `2026-01-0${(i % 9) + 1}T00:00:00.000Z`)
    if (i % 4 === 0) history.run(`h${i}b`, 'default', `cons_${i}`, v, JSON.stringify({ analytics: 'granted' }), JSON.stringify({ analytics: 'denied' }), 'updated', `2026-02-0${(i % 9) + 1}T00:00:00.000Z`)
    if (i % 2 === 0) notice.run(`n${i}`, 'default', v, `prof_${i % 3}`, 'en', '2026-03-03 03:03:03')
  }
  db.exec('COMMIT')
}

const DRIVERS: Array<[StorageConfig['driver'], new (config: StorageConfig) => StorageAdapter]> = [
  ['node:sqlite', NodeSqliteBuiltinAdapter],
  ['node-sqlite3-wasm', NodeSqlite3WasmAdapter],
]

for (const [driver, Adapter] of DRIVERS) describe(`schema v2 keeps every existing row (${driver})`, () => {
  let dir: string
  let dbPath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'consenti-datasafety-'))
    mkdirSync(join(dir, 'db'), { recursive: true })
    dbPath = join(dir, 'db', 'consenti.db')
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function buildLegacyDb(): void {
    const db = new DatabaseSync(dbPath)
    // The wasm driver can't open WAL files (and never creates them), so only exercise WAL elsewhere.
    if (driver === 'node:sqlite') db.exec('PRAGMA journal_mode=WAL')
    db.exec('PRAGMA foreign_keys=ON')
    db.exec(legacyV1Schema())
    db.exec(SEED_SQL)
    populate(db)
    db.exec('PRAGMA user_version = 1')
    db.close()
  }

  const backups = () => readdirSync(join(dir, 'db')).filter(f => f.includes('.pre-v2-'))

  test('a full dump of every table is identical after the upgrade (apart from the new column)', async () => {
    buildLegacyDb()
    const rawBefore = new DatabaseSync(dbPath)
    const before = dumpAll(rawBefore)
    assert.equal((rawBefore.prepare('SELECT COUNT(*) AS n FROM consent_records').get() as { n: number }).n, CONSENT_ROWS)
    rawBefore.close()

    const storage = new Adapter({ driver, path: dir })
    await storage.connect()
    await storage.disconnect()

    const rawAfter = new DatabaseSync(dbPath)
    const after = dumpAll(rawAfter, { consent_records: ['profile_version'], consent_history: ['profile_version'] })
    // Every table, including the ones the upgrade never touches, is row-for-row identical.
    assert.deepEqual(Object.keys(after), Object.keys(before))
    for (const table of Object.keys(before)) assert.deepEqual(after[table], before[table], `table ${table} changed`)
    // The new column exists and is empty for pre-existing rows — nothing was invented.
    for (const table of ['consent_records', 'consent_history']) {
      const filled = rawAfter.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE profile_version IS NOT NULL`).get() as { n: number }
      assert.equal(filled.n, 0, `${table}.profile_version must stay NULL for existing rows`)
    }
    // Constraints and indexes survived the rebuild.
    const idx = rawAfter.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name IN ('consent_records','notice_shown')").all() as { name: string }[]
    assert.ok(idx.length >= 5, `indexes recreated (got ${idx.length})`)
    assert.throws(() => rawAfter.exec("INSERT INTO consent_records (id, tenant_id, visitor_id, profile_id, locale, consent_json, source) VALUES ('dup','default','visitor-0','prof_0','en','{}','banner')"), /UNIQUE/)
    rawAfter.close()
  })

  test('writes a readable backup of the pre-upgrade database', async () => {
    buildLegacyDb()
    const storage = new Adapter({ driver, path: dir })
    await storage.connect()
    await storage.disconnect()

    const [backup] = backups()
    assert.ok(backup, 'a .pre-v2-*.bak file was written')
    const copy = new DatabaseSync(join(dir, 'db', backup))
    assert.equal((copy.prepare('SELECT COUNT(*) AS n FROM consent_records').get() as { n: number }).n, CONSENT_ROWS)
    assert.equal((copy.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 1)
    // The backup is the genuine v1 database, FK and all.
    assert.throws(() => copy.exec("DELETE FROM profiles WHERE id = 'prof_0'"), /FOREIGN KEY/)
    copy.close()
  })

  test('a second start neither changes data nor writes another backup', async () => {
    buildLegacyDb()
    for (let i = 0; i < 2; i++) {
      const storage = new Adapter({ driver, path: dir })
      await storage.connect()
      await storage.disconnect()
    }
    assert.equal(backups().length, 1)
  })

  test('a failure part-way rolls everything back and leaves the data and version untouched', async () => {
    buildLegacyDb()
    const raw = new DatabaseSync(dbPath)
    raw.exec('CREATE TABLE notice_shown_v2 (x TEXT)') // makes the second table's rebuild fail
    const before = dumpAll(raw)
    raw.close()

    const storage = new Adapter({ driver, path: dir })
    await assert.rejects(storage.connect())
    try { await storage.disconnect() } catch { /* never fully connected */ }

    const check = new DatabaseSync(dbPath)
    assert.deepEqual(dumpAll(check), before, 'no table changed')
    assert.equal((check.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 1)
    const cols = check.prepare('PRAGMA table_info(consent_records)').all() as { name: string }[]
    assert.ok(!cols.some(c => c.name === 'profile_version'), 'consent_records was rolled back to v1')
    check.close()
  })

  test('refuses to upgrade a table with a column it would delete, changing nothing', async () => {
    buildLegacyDb()
    const raw = new DatabaseSync(dbPath)
    raw.exec('ALTER TABLE consent_records ADD COLUMN custom_note TEXT')
    raw.exec("UPDATE consent_records SET custom_note = 'keep me'")
    const before = dumpAll(raw)
    raw.close()

    const storage = new Adapter({ driver, path: dir })
    await assert.rejects(storage.connect(), /custom_note/)
    try { await storage.disconnect() } catch { /* never fully connected */ }

    const check = new DatabaseSync(dbPath)
    assert.deepEqual(dumpAll(check), before, 'the extra column and every value are intact')
    assert.equal((check.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 1)
    check.close()
    assert.equal(backups().length, 0, 'it failed before any change, so no backup was needed')
    assert.ok(existsSync(dbPath))
  })
})
