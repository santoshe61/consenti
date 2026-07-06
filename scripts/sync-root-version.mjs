/**
 * Reads the version that Changesets just wrote to @consenti/ui and mirrors it
 * into the root package.json so the monorepo root always tracks the release version.
 * Run automatically as part of `npm run version-packages`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const uiPkg = JSON.parse(readFileSync(resolve(root, 'apps/ui/package.json'), 'utf8'))
const version = uiPkg.version

const rootPkgPath = resolve(root, 'package.json')
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'))
rootPkg.version = version
writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n')

console.log(`synced root version → ${version}`)
