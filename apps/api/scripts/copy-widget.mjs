import { copyFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const destDir = join(__dirname, '..', 'dist', 'widget')

const _require = createRequire(import.meta.url)

let uiDistDir
try {
  const resolved = _require.resolve('@consenti/ui/dist/index.umd.js')
  uiDistDir = dirname(resolved)
} catch {
  // fallback: monorepo sibling path
  uiDistDir = join(__dirname, '..', '..', 'ui', 'dist')
}

await mkdir(destDir, { recursive: true })
await copyFile(join(uiDistDir, 'index.umd.js'), join(destDir, 'widget.js'))
try {
  await copyFile(join(uiDistDir, 'index.css'), join(destDir, 'widget.css'))
} catch {
  console.warn('[copy-widget] Warning: index.css not found in UI dist — skipping CSS copy.')
  console.warn('[copy-widget] Run `npm run build --workspace=apps/ui` to generate it.')
}
console.log(`[copy-widget] Copied widget files to dist/widget/`)
