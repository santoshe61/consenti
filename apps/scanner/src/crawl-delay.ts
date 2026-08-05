/** Floor so jitter can never produce a literal zero/negative wait. */
const MIN_DELAY_MS = 200

/** Default range when the user doesn't set `--crawl-delay` — deliberately randomized per
 * navigation rather than a fixed value: a perfectly periodic request cadence is itself a signal
 * some rate-limiters/bot-mitigation key off, so jittered spacing is closer to real traffic than a
 * fixed interval would be. Also happens to be good crawler etiquette independent of any of that —
 * see robots.txt's own `Crawl-delay` directive, which this option is named after. */
const DEFAULT_MIN_SECONDS = 2.0
const DEFAULT_MAX_SECONDS = 5.0

/** How far the actual per-navigation wait can jitter around a user-set `--crawl-delay` value. */
const USER_JITTER_SECONDS = 2.0

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * The wait to apply before acting on a freshly-navigated page — re-rolled independently for
 * *every* navigation in the scan (crawl link-discovery, each consent state, preference-panel
 * discovery, each per-category test), not once per scan. Serves two purposes at once: gives a
 * slow-to-initialize CMP (geo-lookup, async script load, animation) time to actually finish
 * before we look for it, and paces requests to the target site widely enough to avoid tripping a
 * per-IP rate limit (CloudFront and similar CDNs/WAFs commonly enforce one) — both were the same
 * underlying problem for a site scanned too quickly.
 *
 * `crawlDelaySeconds === undefined` (the default, `--crawl-delay` not passed): each wait is drawn
 * fresh from `uniform(2.0, 5.0)` seconds. When set, each wait is `value ± uniform(0, 2.0)` seconds,
 * floored so it can never go non-positive.
 */
export function computeCrawlDelayMs(crawlDelaySeconds: number | undefined): number {
  const seconds =
    crawlDelaySeconds === undefined
      ? randomInRange(DEFAULT_MIN_SECONDS, DEFAULT_MAX_SECONDS)
      : crawlDelaySeconds + randomInRange(-USER_JITTER_SECONDS, USER_JITTER_SECONDS)
  return Math.max(MIN_DELAY_MS, Math.round(seconds * 1000))
}
