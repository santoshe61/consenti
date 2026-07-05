import { copyFileSync, writeFileSync, renameSync, unlinkSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function safeJsonWrite(
  filePath: string,
  data: unknown,
  validateSchema: (parsed: unknown) => boolean,
): void {
  const bak = filePath + '.bak'
  const tmp = filePath + '.tmp'
  mkdirSync(dirname(filePath), { recursive: true })
  const had = existsSync(filePath)
  if (had) copyFileSync(filePath, bak)
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    const parsed = JSON.parse(readFileSync(tmp, 'utf8')) as unknown
    if (!validateSchema(parsed)) throw new Error('Schema validation failed for ' + filePath)
    renameSync(tmp, filePath)
    if (had) { try { unlinkSync(bak) } catch { /* ok */ } }
  } catch (err) {
    if (had) { try { copyFileSync(bak, filePath); unlinkSync(bak) } catch { /* ok */ } }
    try { unlinkSync(tmp) } catch { /* ok */ }
    throw err
  }
}
