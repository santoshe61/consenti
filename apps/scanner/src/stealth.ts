import type { Page } from 'playwright'

/**
 * Neutralizes the two most trivial "this is an automated browser" signals a site's CMP or bot
 * mitigation might key off: `navigator.webdriver` (`true` for any CDP-automated session,
 * Playwright/Puppeteer/Selenium alike) and a `User-Agent` that literally contains
 * "HeadlessChrome". This tool's whole purpose is auditing what an *ordinary visitor* to a site
 * would see happen with cookies before/after consent — a CMP that serves automation a different
 * (often no-banner) experience based on these two trivially-visible signals would otherwise make
 * a scan systematically under-report. Opt-in only (`--skip-user-agent-checks`), not applied by
 * default — this is a deliberate action to bypass a site's own automation check, not something
 * to do silently on every scan.
 *
 * Deliberately narrow: this is not a general anti-detection/stealth suite (no canvas/WebGL/audio
 * fingerprint spoofing, no TLS/JA3 fingerprint changes, no behavioral simulation). Sites behind
 * more sophisticated bot mitigation — a WAF doing IP reputation or TLS-level fingerprinting, for
 * instance — can still behave differently for this tool than for a real visitor; that's a real,
 * known gap (see README's "Known limitations"), not something patched over here.
 *
 * Returns the `User-Agent` header the caller should merge into the session's extra HTTP headers
 * (rather than setting it directly) so a sibling call — e.g. `applyGpcSignal`'s `Sec-GPC` header —
 * doesn't clobber it: `page.setExtraHTTPHeaders()` replaces the entire header set on every call.
 */
export async function deHeadless(page: Page): Promise<Record<string, string>> {
  const realUserAgent = await page.evaluate(() => navigator.userAgent)
  const deHeadlessUserAgent = realUserAgent.replace('HeadlessChrome', 'Chrome')

  await page.evaluate(ua => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined })
    if (ua !== navigator.userAgent) {
      Object.defineProperty(Navigator.prototype, 'userAgent', { get: () => ua })
    }
  }, deHeadlessUserAgent)

  return deHeadlessUserAgent !== realUserAgent ? { 'User-Agent': deHeadlessUserAgent } : {}
}
