#!/usr/bin/env node
// One-off: rename the unprefixed tables / collections of a Consenti install older than 0.6.0
// (tenants, profiles, consent_records, …) to the `consenti_` names the adapters now use.
//
// Only PostgreSQL, MySQL/MariaDB and MongoDB are affected — SQLite and the JSON file store keep
// their data in a file Consenti owns and are unchanged.
//
// It renames, nothing else: no rows are read, copied or deleted, so it is quick and cannot lose
// data. Run it with the same CONSENTI_DB_* environment variables your app uses:
//
//   node node_modules/@consenti/api/scripts/migrate-to-consenti-prefix.mjs           # dry run: prints the plan
//   node node_modules/@consenti/api/scripts/migrate-to-consenti-prefix.mjs --apply   # does it
//
// Take a backup first. Stop the app first. Re-running after a partial run is safe.
//
// Options (each falls back to the matching environment variable):
//   --driver postgresql|mysql|mongodb   CONSENTI_DB_DRIVER
//   --uri <connection string>           CONSENTI_DB_URI
//   --host/--port/--user/--password     CONSENTI_DB_HOST / _PORT / _USER / _PASSWORD
//   --database <name>                   CONSENTI_DB_DATABASE
//   --apply                             actually rename (default is a dry run)

const PREFIX = 'consenti_'
// Every table the 0.5.x adapters created (schema_version last). MongoDB has no schema_version.
const NAMES = [
  'tenants', 'profiles', 'consent_records', 'consent_history', 'visitors', 'notice_shown',
  'users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'audit_logs',
  'api_keys', 'tenant_settings', 'consent_templates', 'ui_templates', 'schema_version',
]

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--apply') out.apply = true
    else if (a === '--help' || a === '-h') out.help = true
    else if (a.startsWith('--')) {
      const v = argv[++i]
      if (v === undefined) fail(`Missing value for ${a}`)
      out[a.slice(2)] = v
    } else fail(`Unknown argument: ${a}`)
  }
  return out
}

function fail(msg) {
  console.error(`✖ ${msg}`)
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))
if (args.help) {
  console.log(`Usage: node migrate-to-consenti-prefix.mjs [--apply] [--driver D] [--uri U] [--host H --port P --user U --password W] [--database N]\n\nSee the header of this file, or CHANGELOG 0.6.0.`)
  process.exit(0)
}

const env = process.env
const cfg = {
  driver: args.driver ?? env.CONSENTI_DB_DRIVER ?? 'json',
  uri: args.uri ?? env.CONSENTI_DB_URI,
  host: args.host ?? env.CONSENTI_DB_HOST,
  port: args.port ?? env.CONSENTI_DB_PORT,
  user: args.user ?? env.CONSENTI_DB_USER,
  password: args.password ?? env.CONSENTI_DB_PASSWORD,
  database: args.database ?? env.CONSENTI_DB_DATABASE,
}
const apply = args.apply === true

if (!['postgresql', 'mysql', 'mongodb'].includes(cfg.driver)) {
  console.log(`Driver "${cfg.driver}" does not use the ${PREFIX} prefix — nothing to migrate.`)
  process.exit(0)
}

async function load(pkg) {
  try {
    return await import(pkg)
  } catch {
    fail(`Could not load "${pkg}". Run this from your project, where it is installed (npm install ${pkg}).`)
  }
}

/** Shared plan logic: which names exist, which can be renamed, which would clash. */
function plan(existing) {
  const have = new Set(existing)
  const legacy = NAMES.filter(n => have.has(n))
  const clashes = legacy.filter(n => have.has(PREFIX + n))
  const alreadyDone = NAMES.filter(n => !have.has(n) && have.has(PREFIX + n))
  return { legacy, clashes, alreadyDone }
}

function report({ legacy, clashes, alreadyDone }) {
  if (alreadyDone.length) console.log(`  already renamed: ${alreadyDone.map(n => PREFIX + n).join(', ')}`)
  if (clashes.length) {
    fail(
      `Both "${clashes[0]}" and "${PREFIX}${clashes[0]}" exist` +
      (clashes.length > 1 ? ` (and ${clashes.length - 1} more)` : '') +
      `. Refusing to overwrite — inspect the database by hand (is another app using these names?).`,
    )
  }
  if (!legacy.length) {
    console.log(alreadyDone.length ? '✔ Nothing left to rename.' : '✔ No unprefixed Consenti tables/collections found — nothing to do (fresh database, or already migrated).')
    process.exit(0)
  }
  console.log(`${apply ? 'Renaming' : 'Would rename'} ${legacy.length}:`)
  for (const n of legacy) console.log(`  ${n}  →  ${PREFIX}${n}`)
}

function dryRunNotice() {
  if (!apply) console.log('\nDry run — nothing was changed. Back up the database, stop your app, then re-run with --apply.')
}

async function mysqlRun() {
  const mysql = await load('mysql2/promise')
  const conn = await mysql.createConnection(cfg.uri ?? {
    host: cfg.host ?? 'localhost', port: Number(cfg.port ?? 3306), user: cfg.user ?? 'root',
    password: cfg.password ?? '', database: cfg.database ?? 'consenti',
  })
  try {
    const [rows] = await conn.query(
      'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)',
      [[...NAMES, ...NAMES.map(n => PREFIX + n)]],
    )
    const p = plan(rows.map(r => r.name))
    report(p)
    if (apply) {
      // One statement: MySQL renames all of them atomically — all or none.
      await conn.query(`RENAME TABLE ${p.legacy.map(n => `\`${n}\` TO \`${PREFIX}${n}\``).join(', ')}`)
    }
  } finally {
    await conn.end()
  }
}

async function pgRun() {
  const pgModule = await load('pg')
  const pg = pgModule.default ?? pgModule
  const client = new pg.Client(cfg.uri
    ? { connectionString: cfg.uri }
    : { host: cfg.host ?? 'localhost', port: Number(cfg.port ?? 5432), user: cfg.user ?? 'postgres', password: cfg.password ?? '', database: cfg.database ?? 'consenti' })
  await client.connect()
  try {
    const res = await client.query(
      'SELECT n AS name FROM unnest($1::text[]) AS n WHERE to_regclass(n) IS NOT NULL',
      [[...NAMES, ...NAMES.map(n => PREFIX + n)]],
    )
    const p = plan(res.rows.map(r => r.name))
    report(p)
    if (apply) {
      await client.query('BEGIN') // PostgreSQL DDL is transactional — all or none
      try {
        for (const n of p.legacy) await client.query(`ALTER TABLE "${n}" RENAME TO "${PREFIX}${n}"`)
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
  } finally {
    await client.end()
  }
}

async function mongoRun() {
  const { MongoClient } = await load('mongodb')
  const client = new MongoClient(cfg.uri ?? 'mongodb://localhost:27017')
  await client.connect()
  try {
    const db = client.db(cfg.database ?? 'consenti')
    const names = NAMES.filter(n => n !== 'schema_version')
    const existing = (await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name)
    const p = plan(existing.filter(n => names.includes(n) || names.some(x => PREFIX + x === n)))
    report(p)
    if (apply) {
      // Collection renames are individual operations (no cross-collection transaction); each keeps its
      // data and indexes, and a re-run skips the ones already done.
      for (const n of p.legacy) await db.renameCollection(n, PREFIX + n)
    }
  } finally {
    await client.close()
  }
}

try {
  console.log(`Consenti ${PREFIX} prefix migration — ${cfg.driver}${apply ? '' : ' (dry run)'}`)
  if (cfg.driver === 'mysql') await mysqlRun()
  else if (cfg.driver === 'postgresql') await pgRun()
  else await mongoRun()
  if (apply) console.log('\n✔ Done. Start your app — it will finish any remaining schema upgrade on its own.')
  else dryRunNotice()
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  const hint = /denied|permission|not authorized|unauthorized/i.test(msg)
    ? '\nRenaming needs more than the app normally does: MySQL needs ALTER + DROP on the old tables and CREATE + INSERT on the new ones (ALL PRIVILEGES on the database covers it); PostgreSQL needs you to own the tables; MongoDB needs the renameCollection action (readWrite includes it).'
    : ''
  fail(`${msg}${hint}\nNothing further was changed by this run beyond what is listed above; fix the cause and re-run (it is safe to repeat).`)
}
