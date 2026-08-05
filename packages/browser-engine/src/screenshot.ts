import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { BrowserSession } from './session.js'
import type { ScreenshotOptions } from './types.js'

export async function takeScreenshot(
  session: BrowserSession,
  outPath: string,
  options: ScreenshotOptions = {}
): Promise<string> {
  await mkdir(dirname(outPath), { recursive: true })
  if (options.selector) {
    await session.page.locator(options.selector).screenshot({ path: outPath })
  } else {
    await session.page.screenshot({ path: outPath, fullPage: options.fullPage ?? true })
  }
  return outPath
}
