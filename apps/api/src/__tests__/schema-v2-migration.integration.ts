/**
 * Schema v1 → v2 upgrade (SQLite). A v1 database has foreign keys from consent_records /
 * notice_shown to profiles and no profile_version column; connecting with the current adapter
 * must drop the keys, add the column to consent_records and consent_history, keep every row,
 * and stamp user_version 2.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { NodeSqliteBuiltinAdapter } from '../storage/sqlite/node-sqlite-builtin.adapter.js'
import { NodeSqlite3WasmAdapter } from '../storage/sqlite/node-sqlite3-wasm.adapter.js'
import type { StorageAdapter, StorageConfig } from '@consenti/types'
import { SCHEMA_SQL_SQLITE, SEED_SQL, SCHEMA_VERSION } from '../storage/seed-data.js'

/** The v1 schema, derived from the current one: foreign keys back on, profile_version off. */
function legacyV1Schema(): string {
  return SCHEMA_SQL_SQLITE
    .replace(/^ {2}profile_version INTEGER,?\n/gm, '')
    .replace(/profile_id TEXT NOT NULL/g, 'profile_id TEXT NOT NULL REFERENCES profiles(id)')
}

const DRIVERS: Array<[StorageConfig['driver'], new (config: StorageConfig) => StorageAdapter]> = [
  ['node:sqlite', NodeSqliteBuiltinAdapter],
  ['node-sqlite3-wasm', NodeSqlite3WasmAdapter],
]

for (const [driver, Adapter] of DRIVERS) describe(`SQLite schema v1 → v2 (${driver})`, () => {
  let dir: string
  let dbPath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'consenti-migrate-v2-'))
    dbPath = join(dir, 'db', 'consenti.db')
  })

  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function seedLegacyDb(): void {
    mkdirSync(join(dir, 'db'), { recursive: true })
    const db = new DatabaseSync(dbPath)
    db.exec('PRAGMA foreign_keys=ON')
    db.exec(legacyV1Schema())
    db.exec(SEED_SQL)
    db.exec(`
      INSERT INTO profiles (id, tenant_id, name, profile_json) VALUES ('prof_a', 'default', 'Old', '{}');
      INSERT INTO visitors (id, tenant_id, visitor_id) VALUES ('v1', 'default', 'visitor-1');
      INSERT INTO consent_records (id, tenant_id, visitor_id, profile_id, locale, consent_json, source)
        VALUES ('cons_1', 'default', 'visitor-1', 'prof_a', 'en', '{"a":"granted"}', 'banner');
      INSERT INTO consent_history (id, tenant_id, consent_record_id, visitor_id, new_json, action)
        VALUES ('h1', 'default', 'cons_1', 'visitor-1', '{"a":"granted"}', 'created');
      INSERT INTO notice_shown (id, tenant_id, visitor_id, profile_id, locale)
        VALUES ('n1', 'default', 'visitor-1', 'prof_a', 'en');
      PRAGMA user_version = 1;
    `)
    // Sanity: the legacy database really does refuse to delete a referenced profile.
    assert.throws(() => db.exec("DELETE FROM profiles WHERE id = 'prof_a'"), /FOREIGN KEY/)
    db.close()
  }

  test('drops the profile foreign keys, adds profile_version, keeps all data', async () => {
    seedLegacyDb()
    const storage = new Adapter({ driver, path: dir })
    await storage.connect()
    try {
      const record = await storage.getConsent('visitor-1')
      assert.equal(record?.profileId, 'prof_a')
      assert.equal(record?.profileVersion, undefined, 'pre-existing records have no recorded version')
      assert.equal((await storage.getConsentHistory('visitor-1')).length, 1)

      await storage.deleteProfile('prof_a') // was a FOREIGN KEY failure on v1
      assert.equal((await storage.getConsent('visitor-1'))?.profileId, 'prof_a')

      await storage.updateConsent('visitor-1', { consentJson: { a: 'denied' }, profileVersion: 4 })
      assert.equal((await storage.getConsent('visitor-1'))?.profileVersion, 4)
      const history = await storage.getConsentHistory('visitor-1')
      assert.equal(history.find(h => h.action === 'updated')?.profileVersion, 4)
    } finally {
      await storage.disconnect()
    }

    const check = new DatabaseSync(dbPath)
    assert.equal((check.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, SCHEMA_VERSION)
    check.exec('PRAGMA foreign_keys=ON')
    assert.equal(check.prepare('PRAGMA foreign_key_check').all().length, 0)
    const indexes = check.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='consent_records'").all() as { name: string }[]
    assert.ok(indexes.some(i => i.name.startsWith('idx_consent_records_')), 'indexes were recreated')
    check.close()
  })

  test('running it again is a no-op', async () => {
    seedLegacyDb()
    for (let i = 0; i < 2; i++) {
      const storage = new Adapter({ driver, path: dir })
      await storage.connect()
      assert.equal((await storage.getConsent('visitor-1'))?.profileId, 'prof_a')
      await storage.disconnect()
    }
  })

  test('a fresh install is stamped with the current version', async () => {
    const storage = new Adapter({ driver, path: dir })
    await storage.connect()
    await storage.disconnect()
    const check = new DatabaseSync(dbPath)
    assert.equal((check.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, SCHEMA_VERSION)
    check.close()
  })
})
