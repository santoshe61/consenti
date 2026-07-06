import { existsSync, accessSync, constants, mkdirSync } from 'node:fs'
import { resolve, extname, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface StoragePaths {
  /** Full path to the adapter's DB file (inside basePath/db/). */
  dbPath: string
  /** Full path to the profiles directory (basePath/profiles/). */
  profilesDir: string
  /** Full path to the logs directory (basePath/logs/). */
  logsDir: string
  /** Resolved base directory path. */
  basePath: string
}

const DB_FILE_NAMES: Record<string, string> = {
  'node:sqlite': 'consenti.db',
  'better-sqlite3': 'consenti.db',
  'node-sqlite3-wasm': 'consenti.db',
  sqlite: 'consenti.db',
  json: 'consenti-data.json',
  mongodb: '',
  mysql: '',
  postgresql: '',
}

const _thisDir = dirname(fileURLToPath(import.meta.url))

/** Guard: path must not be inside the process's own module directory. */
function isInsidePackageInstall(resolved: string): boolean {
  const nodeModulesSegment = resolved.includes('node_modules')
  const isInDist = resolved.startsWith(resolve(_thisDir, '..', '..'))
  return nodeModulesSegment || isInDist
}

/**
 * Resolves and validates the storage base directory from `config.storage.path`.
 *
 * Backward compat: if the path has a file extension (.json, .db) it is treated as a
 * legacy file path — the parent directory is used instead and a deprecation warning is logged.
 */
export function resolveStoragePaths(rawPath: string, driver: string): StoragePaths {
  let basePath = resolve(rawPath)

  const ext = extname(basePath)
  if (ext) {
    console.warn(
      `[consenti] storage.path "${rawPath}" looks like a file path (has extension "${ext}"). ` +
      `Treating parent directory as storage root. Update your config to pass a directory path.`,
    )
    basePath = dirname(basePath)
  }

  if (isInsidePackageInstall(basePath)) {
    throw new Error(
      `[consenti] storage.path "${basePath}" is inside the package installation directory. ` +
      `Choose a writable directory outside node_modules.`,
    )
  }

  if (!existsSync(basePath)) {
    mkdirSync(basePath, { recursive: true })
  }

  try {
    accessSync(basePath, constants.W_OK)
  } catch {
    throw new Error(`[consenti] storage.path "${basePath}" is not writable.`)
  }

  const dbDir = join(basePath, 'db')
  const profilesDir = join(basePath, 'profiles')
  const logsDir = join(basePath, 'logs')

  mkdirSync(dbDir, { recursive: true })
  mkdirSync(profilesDir, { recursive: true })
  mkdirSync(logsDir, { recursive: true })

  const dbFileName = DB_FILE_NAMES[driver] ?? 'consenti.db'
  const dbPath = dbFileName ? join(dbDir, dbFileName) : ''

  return { basePath, dbPath, profilesDir, logsDir }
}
