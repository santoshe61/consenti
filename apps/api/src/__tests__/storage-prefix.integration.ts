/**
 * `consenti_` table / collection prefix for PostgreSQL, MySQL and MongoDB, and the shape of the
 * schema SQL they run on first start. No database needed — the adapters' behaviour against real
 * servers is covered by running them; this pins the things that are easy to regress silently:
 * a new query that forgets the prefix, an index name that outgrows an identifier limit, or a
 * `CREATE INDEX` creeping back into the MySQL install (which made a half-finished first start
 * unrecoverable).
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ALL_TABLES_FULL, SCHEMA_SQL_MYSQL, SCHEMA_SQL_POSTGRES, SCHEMA_SQL_SQLITE, TABLE_PREFIX,
} from '../storage/seed-data.js'

const TABLES = [...ALL_TABLES_FULL.map(t => t.name), 'schema_version']
const storageDir = join(import.meta.dirname, '..', 'storage')
const read = (file: string): string => readFileSync(join(storageDir, file), 'utf8')

/** Source with `//` comments and `/* *​/` blocks removed, so prose can't trip the scans below. */
function code(file: string): string {
  return read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
}

describe('generated schema SQL', () => {
  for (const [name, sql] of [['PostgreSQL', SCHEMA_SQL_POSTGRES], ['MySQL', SCHEMA_SQL_MYSQL]] as const) {
    test(`${name}: every table is created with the ${TABLE_PREFIX} prefix`, () => {
      const created = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m => m[1])
      assert.equal(created.length, TABLES.length)
      for (const n of created) assert.ok(n!.startsWith(TABLE_PREFIX), `${n} is not prefixed`)
    })

    test(`${name}: foreign-key references point at prefixed tables`, () => {
      for (const m of sql.matchAll(/REFERENCES (\w+)\(/g)) assert.ok(m[1]!.startsWith(TABLE_PREFIX), `REFERENCES ${m[1]}`)
    })

    test(`${name}: index names fit the identifier limit (PostgreSQL 63, MySQL 64)`, () => {
      for (const m of sql.matchAll(/\bidx_\w+/g)) assert.ok(m[0].length <= 63, `${m[0]} is ${m[0].length} chars`)
    })
  }

  test('MySQL: indexes are declared inside CREATE TABLE, never as separate CREATE INDEX statements', () => {
    assert.doesNotMatch(SCHEMA_SQL_MYSQL, /CREATE\s+(UNIQUE\s+)?INDEX/i)
    assert.match(SCHEMA_SQL_MYSQL, /\n {2}INDEX idx_consenti_consent_records_/)
  })

  test('MySQL: every statement is re-runnable (CREATE TABLE IF NOT EXISTS)', () => {
    const stmts = SCHEMA_SQL_MYSQL.split(';').map(s => s.trim()).filter(Boolean)
    for (const s of stmts) assert.match(s, /^CREATE TABLE IF NOT EXISTS /)
  })

  test('SQLite keeps the plain table names (its file is Consenti-owned)', () => {
    assert.match(SCHEMA_SQL_SQLITE, /CREATE TABLE IF NOT EXISTS tenants \(/)
    assert.doesNotMatch(SCHEMA_SQL_SQLITE, new RegExp(TABLE_PREFIX))
  })
})

describe('adapter sources', () => {
  const bareTable = new RegExp(
    `\\b(FROM|INTO|UPDATE|JOIN|TABLE|REFERENCES|EXISTS)\\s+\`?(${TABLES.join('|')})\\b|to_regclass\\('(${TABLES.join('|')})'\\)`,
  )

  for (const file of ['mysql/mysql.adapter.ts', 'postgresql/postgresql.adapter.ts']) {
    test(`${file}: no SQL names a table without the prefix`, () => {
      const m = bareTable.exec(code(file))
      assert.equal(m, null, `unprefixed table in SQL: "${m?.[0]}"`)
    })
  }

  test('mongodb: every collection goes through col(), which applies the prefix', () => {
    const src = code('mongodb/mongodb.adapter.ts')
    assert.equal((src.match(/\.collection\(/g) ?? []).length, 1)
    assert.match(src, /this\.db\.collection\(prefixed\(name\)\)/)
    assert.match(src, /\$lookup: \{ from: prefixed\('visitors'\)/)
  })

  test('connection pools default to 5, not the drivers\' own larger defaults', () => {
    assert.match(code('mysql/mysql.adapter.ts'), /connectionLimit: cfg\.poolMax \?\? 5\b/)
    assert.match(code('postgresql/postgresql.adapter.ts'), /\['max'\] = cfg\.poolMax \?\? 5\b/)
    assert.match(code('mongodb/mongodb.adapter.ts'), /maxPoolSize: this\.config\.poolMax \?\? 5\b/)
  })

  test('search clauses have no trailing ESCAPE after the closing parenthesis (syntax error on MySQL/PostgreSQL)', () => {
    for (const file of ['mysql/mysql.adapter.ts', 'postgresql/postgresql.adapter.ts']) {
      assert.doesNotMatch(code(file), /\)\s*ESCAPE\b/, file)
    }
  })
})
