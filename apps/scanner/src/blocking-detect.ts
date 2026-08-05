import type { CapturedRequest, CapturedSignals } from '@consenti/browser-engine'
import type { BlockingSuspicion, ConsentState } from './types.js'

/** Cloudflare's own numbered error pages (1015 "you are being rate limited", 1020 "access
 * denied") are served as ordinary 429/403 at the wire level — there is no separate transport
 * status "1015"; that number only appears inside the HTML error page body, which this scanner
 * doesn't capture. Checking these three standard codes already covers both. */
const BLOCKING_STATUS_CODES = new Set([403, 429, 503])

/** Response header signatures that identify a CDN/WAF sitting in front of the origin. Presence
 * alone is never treated as suspicious here — the overwhelming majority of sites behind
 * CloudFront/Cloudflare/Akamai are perfectly reachable — this is only surfaced as corroborating
 * context once an actual blocking signal (a status code, the CloudFront error header, or a
 * request-count collapse) already triggered suspicion. */
const CDN_WAF_HEADER_SIGNATURES: { header: string; matches: (value: string) => boolean; label: string }[] = [
  { header: 'server', matches: v => /cloudfront/i.test(v), label: 'CloudFront' },
  { header: 'x-amz-cf-id', matches: () => true, label: 'CloudFront' },
  { header: 'server', matches: v => /cloudflare/i.test(v), label: 'Cloudflare' },
  { header: 'cf-ray', matches: () => true, label: 'Cloudflare' },
  { header: 'x-akamai-request-id', matches: () => true, label: 'Akamai' },
  { header: 'x-sucuri-id', matches: () => true, label: 'Sucuri' },
]

/** CloudFront's own explicit "the origin fetch errored, this is a generated error page rather
 * than real content" signal — unambiguous by itself, unlike the generic CDN signatures above,
 * so this one is checked as a direct trigger rather than mere corroborating context. */
function hasCloudfrontErrorHeader(headers: Record<string, string> | null): boolean {
  if (!headers) return false
  const xCache = headers['x-cache']
  return xCache !== undefined && /error from cloudfront/i.test(xCache)
}

function isBlockedResponse(req: CapturedRequest): boolean {
  return (req.status !== null && BLOCKING_STATUS_CODES.has(req.status)) || hasCloudfrontErrorHeader(req.responseHeaders)
}

function mainDocumentRequest(requests: CapturedRequest[]): CapturedRequest | undefined {
  return (
    requests.find(r => r.resourceType === 'document' && r.initiatorUrl === null) ??
    requests.find(r => r.resourceType === 'document')
  )
}

function cdnWafLabelsFor(requests: CapturedRequest[]): Set<string> {
  const labels = new Set<string>()
  for (const req of requests) {
    if (!req.responseHeaders) continue
    for (const sig of CDN_WAF_HEADER_SIGNATURES) {
      const value = req.responseHeaders[sig.header]
      if (value !== undefined && sig.matches(value)) labels.add(sig.label)
    }
  }
  return labels
}

/** Lightweight single-state check — used to abort a page's remaining consent states early once
 * blocking is already evident (see `scanPage` in `scan.ts`), rather than waiting until every
 * state has run to report it. Checks every captured request, not just the main document: a
 * blocked subresource (an analytics fetch returning 429, say) is just as strong a sign the rate
 * limiter has engaged, even if the main document itself still loaded. */
export function hasBlockingSignal(signals: CapturedSignals): { blocked: boolean; status: number | null } {
  const mainDoc = mainDocumentRequest(signals.requests)
  if (mainDoc && isBlockedResponse(mainDoc)) return { blocked: true, status: mainDoc.status }
  for (const req of signals.requests) {
    if (isBlockedResponse(req)) return { blocked: true, status: req.status }
  }
  return { blocked: false, status: null }
}

/**
 * Looks for signs that a CDN/WAF blocked or throttled part of this page's scan, rather than the
 * page genuinely having little content or no CMP — a real, observed failure mode (a rate-limiting
 * CDN returning 403 after too many requests in a short window) that otherwise looks identical to
 * "this page just doesn't have much on it," with no indication in the report that anything was
 * suppressed. Evidence-based rather than a bare boolean, so a report reader can judge for
 * themselves rather than take a flag on faith.
 *
 * Two independent triggers:
 * - Any captured request returning 403/429/503, or carrying CloudFront's own
 *   `X-Cache: Error from cloudfront` header (see `hasCloudfrontErrorHeader`) — checked across
 *   every request in each state, not just the main document.
 * - A dramatic collapse in request count between this page's own states (e.g. 73 → 1) — a
 *   self-referential signal needing no knowledge of any specific CDN/WAF, and the pattern actually
 *   observed scanning a site that started rate-limiting mid-scan. Real sites can legitimately vary
 *   a little state to state (a tag manager loading extra tags post-consent); the threshold here is
 *   set well above that normal variance.
 */
export function detectBlockingSuspicion(
  signalsByState: Partial<Record<ConsentState, CapturedSignals>>
): BlockingSuspicion {
  const evidence: string[] = []
  const requestCounts: number[] = []
  const cdnLabelsSeen = new Set<string>()
  const statusCodes = new Set<number>()

  for (const [state, signals] of Object.entries(signalsByState)) {
    if (!signals) continue
    requestCounts.push(signals.requests.length)

    const blockedRequests = signals.requests.filter(isBlockedResponse)
    for (const req of blockedRequests) if (req.status) statusCodes.add(req.status)

    const mainDoc = mainDocumentRequest(signals.requests)
    if (mainDoc && blockedRequests.includes(mainDoc)) {
      evidence.push(`[${state}] main document returned HTTP ${mainDoc.status}`)
    } else if (blockedRequests.length > 0) {
      evidence.push(`[${state}] ${blockedRequests.length} request(s) blocked (e.g. HTTP ${blockedRequests[0]?.status})`)
    }

    for (const label of cdnWafLabelsFor(signals.requests)) cdnLabelsSeen.add(label)
  }

  if (requestCounts.length >= 2) {
    const max = Math.max(...requestCounts)
    const min = Math.min(...requestCounts)
    if (max >= 5 && min <= 2 && max - min >= 5) {
      evidence.push(
        `Request count collapsed across states (${requestCounts.join(' → ')}) — possible mid-scan block`
      )
    }
  }

  const suspected = evidence.length > 0
  if (suspected && cdnLabelsSeen.size > 0) {
    evidence.push(`Site appears to be behind: ${Array.from(cdnLabelsSeen).join(', ')}`)
  }

  return { suspected, evidence, statusCodes: Array.from(statusCodes) }
}
