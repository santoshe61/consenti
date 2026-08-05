import { chromium, type Browser, type BrowserContext, type Page, type Request } from 'playwright'
import type { CapturedRequest, SessionOptions } from './types.js'

const DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000
const DEFAULT_VIEWPORT = { width: 1280, height: 800 }

export interface BrowserSession {
  browser: Browser
  context: BrowserContext
  page: Page
  requests: CapturedRequest[]
  close: () => Promise<void>
}

export async function launchSession(url: string, options: SessionOptions = {}): Promise<BrowserSession> {
  const handleProcessSignals = options.handleProcessSignals ?? true
  const browser = await chromium.launch({
    headless: options.headless ?? true,
    handleSIGINT: handleProcessSignals,
    handleSIGTERM: handleProcessSignals,
    handleSIGHUP: handleProcessSignals,
  })
  try {
    const context = await browser.newContext({
      viewport: options.viewport ?? DEFAULT_VIEWPORT,
      ...(options.locale !== undefined ? { locale: options.locale } : {}),
      ...(options.timezoneId !== undefined ? { timezoneId: options.timezoneId } : {}),
      ...(options.reducedMotion !== undefined ? { reducedMotion: options.reducedMotion } : {}),
    })

    for (const script of options.initScripts ?? []) {
      await context.addInitScript({ content: script })
    }

    const page = await context.newPage()
    page.setDefaultNavigationTimeout(options.navigationTimeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS)

    const requests: CapturedRequest[] = []
    attachRequestCapture(page, requests)

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const close = async (): Promise<void> => {
      await context.close()
      await browser.close()
    }

    return { browser, context, page, requests, close }
  } catch (err) {
    // A failure anywhere after `chromium.launch()` (bad context options, a bad init script, or
    // — the common real-world case for a crawler visiting arbitrary URLs — `page.goto` timing
    // out or hitting a DNS/connection error) must not leak the already-launched browser process.
    // Before this, every failed navigation left an orphaned Chromium process running until the
    // OS reaped it, which compounds fast for a crawler hitting several bad URLs in a row.
    await browser.close().catch(() => {})
    throw err
  }
}

function attachRequestCapture(page: Page, requests: CapturedRequest[]): void {
  page.on('response', response => {
    void response
      .allHeaders()
      .catch(() => null)
      .then(headers => {
        requests.push(toCapturedRequest(response.request(), response.status(), headers))
      })
  })

  page.on('requestfailed', request => {
    requests.push(toCapturedRequest(request, null, null))
  })
}

function toCapturedRequest(
  request: Request,
  status: number | null,
  responseHeaders: Record<string, string> | null
): CapturedRequest {
  return {
    url: request.url(),
    domain: hostnameOf(request.url()),
    method: request.method(),
    resourceType: request.resourceType(),
    initiatorUrl: initiatorUrlOf(request),
    requestHeaders: request.headers(),
    status,
    responseHeaders,
  }
}

function initiatorUrlOf(request: Request): string | null {
  try {
    return request.frame()?.url() ?? null
  } catch {
    return null
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
