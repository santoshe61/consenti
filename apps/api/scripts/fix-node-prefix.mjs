import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const BARE_MODULES = [
  'crypto', 'path', 'fs', 'fs/promises',
  'events', 'url', 'http', 'https', 'stream',
  'buffer', 'util', 'os', 'net', 'tls',
  'child_process', 'worker_threads', 'module',
  'sqlite',
]

async function fixFile(filename) {
  const file = join(dir, filename)
  let src = await readFile(file, 'utf8')
  let changed = false
  for (const mod of BARE_MODULES) {
    const re = new RegExp(`from "(${mod.replace('/', '\\/')})"`, 'g')
    const replacement = `from "node:${mod}"`
    if (re.test(src)) {
      src = src.replace(re, replacement)
      changed = true
    }
    const reRequire = new RegExp(`require\\("(${mod.replace('/', '\\/')})"\\)`, 'g')
    const replacementRequire = `require("node:${mod}")`
    if (reRequire.test(src)) {
      src = src.replace(reRequire, replacementRequire)
      changed = true
    }
    // Dynamic import() calls (e.g. node:sqlite's lazy-load in node-sqlite-builtin.adapter.ts)
    // esbuild strips the "node:" prefix from these the same way it does static imports/requires.
    const reDynamicImport = new RegExp(`import\\("(${mod.replace('/', '\\/')})"\\)`, 'g')
    const replacementDynamicImport = `import("node:${mod}")`
    if (reDynamicImport.test(src)) {
      src = src.replace(reDynamicImport, replacementDynamicImport)
      changed = true
    }
  }
  if (changed) {
    await writeFile(file, src, 'utf8')
    console.log(`Patched ${filename}`)
  }
}

await fixFile('index.js')
await fixFile('index.cjs')
