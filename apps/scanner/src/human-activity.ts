import type { Page } from 'playwright'

const MOUSE_MOVE_COUNT = 3

/**
 * Spreads `totalWaitMs` (the same jittered `--crawl-delay` wait every session already applies —
 * see `crawl-delay.ts`) across a handful of small random mouse movements and occasional Tab key
 * presses, instead of one flat `waitForTimeout`. Total silence for a page's entire lifetime — no
 * mouse movement, no keyboard activity at all — is itself a signal some bot-detection heuristics
 * check for; this doesn't try to defeat sophisticated fingerprinting (no click simulation, no
 * fake typing), just avoids that one obviously-inhuman "absolutely nothing moved" tell.
 *
 * Deliberately narrow and low-risk: `page.mouse.move()` to random viewport coordinates never
 * clicks or hovers a specific element (which could trigger a menu, tooltip, or other page-side
 * effect), and `Tab` only ever moves keyboard focus — it can't submit a form or activate a
 * button the way Enter/Space could. Best-effort throughout: a failed move/keypress (e.g. the page
 * navigated away mid-wait) is swallowed, since this is a humanization layer, not something the
 * caller's own settle/detection logic depends on.
 */
export async function simulateHumanActivity(page: Page, totalWaitMs: number): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 }
  const segmentMs = Math.max(0, Math.floor(totalWaitMs / (MOUSE_MOVE_COUNT + 1)))

  for (let i = 0; i < MOUSE_MOVE_COUNT; i++) {
    await page.waitForTimeout(segmentMs)
    const x = Math.floor(Math.random() * viewport.width)
    const y = Math.floor(Math.random() * viewport.height)
    await page.mouse.move(x, y, { steps: 5 + Math.floor(Math.random() * 10) }).catch(() => {})
    if (Math.random() < 0.5) await page.keyboard.press('Tab').catch(() => {})
  }

  await page.waitForTimeout(Math.max(0, totalWaitMs - segmentMs * MOUSE_MOVE_COUNT))
}
