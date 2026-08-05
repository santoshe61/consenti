import type { Page } from 'playwright'

/**
 * Applies the Global Privacy Control signal to an already-loaded page: sets
 * `navigator.globalPrivacyControl = true` (the client-side signal Consenti's own widget reads —
 * see `apps/ui/src/core/gpc.ts`) and returns the `Sec-GPC: 1` request header a real GPC-enabled
 * browser also sends on every request, for the caller to merge into the session's extra HTTP
 * headers. Lets a scan be run twice — with and without `--enable-gpc` — to see whether a site
 * actually changes its tracking behavior in response to the signal, which several US state
 * privacy laws (CPRA and others) require treating as an opt-out-of-sale request.
 */
export async function applyGpcSignal(page: Page): Promise<Record<string, string>> {
  await page.evaluate(() => {
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true })
  })
  return { 'Sec-GPC': '1' }
}
