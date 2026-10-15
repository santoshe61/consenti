import { copyFileSync, existsSync } from 'node:fs'
import { V2_REBUILT_TABLES, currentColumns, sqliteRebuildStatements } from '../seed-data'

/** The slice of a SQLite handle the upgrade needs — each driver adapts its own API to this. */
export interface SqliteRunner {
  exec(sql: string): void
  all(sql: string): Record<string, unknown>[]
}

function columnsOf(db: SqliteRunner, table: string): string[] {
  return db.all(`PRAGMA table_info(${table})`).map(r => String(r['name']))
}

function countOf(db: SqliteRunner, table: string): number {
  return Number(db.all(`SELECT COUNT(*) AS n FROM ${table}`)[0]?.['n'])
}

/**
 * v1 → v2: drops the profile_id foreign keys on consent_records / notice_shown (rebuilding both
 * tables) and adds profile_version to consent_history. Built so existing data cannot be lost:
 *  - refuses to run if an old table has a column the new schema doesn't know (it would vanish with
 *    the old table), before touching anything;
 *  - writes a copy of the database file first (`dbPath`), and aborts if it can't;
 *  - inside one transaction, checks each copy has exactly the original row count before the old
 *    table is dropped, and re-checks every count before committing — any mismatch rolls back.
 */
export function migrateSqliteToV2(db: SqliteRunner, dbPath: string): void {
  const copyCols = new Map<string, string[]>()
  for (const table of V2_REBUILT_TABLES) {
    const have = columnsOf(db, table)
    const want = new Set(currentColumns(table))
    const unknown = have.filter(c => !want.has(c))
    if (unknown.length > 0) {
      throw new Error(
        `Cannot upgrade ${table} to schema v2: it has column(s) ${unknown.join(', ')} that this version doesn't know, ` +
        `and rebuilding the table would delete them. Nothing was changed.`,
      )
    }
    copyCols.set(table, have)
  }

  if (dbPath && existsSync(dbPath)) {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    const backup = `${dbPath}.pre-v2-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.bak`
    copyFileSync(dbPath, backup)
    console.warn(`[Consenti] Upgrading the SQLite schema to v2. A copy of the database was saved to ${backup} — delete it once you are happy with the upgrade.`)
  }

  const before = new Map(V2_REBUILT_TABLES.map(t => [t, countOf(db, t)]))
  db.exec('PRAGMA foreign_keys=OFF')
  try {
    db.exec('BEGIN')
    for (const table of V2_REBUILT_TABLES) {
      const { create, copy, swap } = sqliteRebuildStatements(table, copyCols.get(table)!)
      db.exec(create)
      db.exec(copy)
      const copied = countOf(db, `${table}_v2`)
      if (copied !== before.get(table)) {
        throw new Error(`Schema v2 upgrade aborted: ${table} had ${before.get(table)} rows but the copy has ${copied}. Nothing was changed.`)
      }
      db.exec(swap)
    }
    if (!columnsOf(db, 'consent_history').includes('profile_version')) {
      db.exec('ALTER TABLE consent_history ADD COLUMN profile_version INTEGER')
    }
    for (const table of V2_REBUILT_TABLES) {
      const after = countOf(db, table)
      if (after !== before.get(table)) {
        throw new Error(`Schema v2 upgrade aborted: ${table} has ${after} rows after the upgrade, expected ${before.get(table)}. Nothing was changed.`)
      }
    }
    db.exec('PRAGMA user_version = 2')
    db.exec('COMMIT')
  } catch (err) {
    try { db.exec('ROLLBACK') } catch { /* no transaction was opened */ }
    throw err
  } finally {
    db.exec('PRAGMA foreign_keys=ON')
  }
}
