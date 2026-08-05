import type { CapturedSignals } from '@consenti/browser-engine'
import { isSameSite, matchDomainKnowledge, matchTrackerKnowledge } from '../source-data/index.js'
import type { TrackerFinding } from './types.js'

/** Classifies every signal captured in a single consent-state run against a page. Does not know
 * about `seenInStates` — the caller (`scan.ts`) merges same-`id`+`kind` findings across the three
 * states after calling this once per state. */
export function classifyState(signals: CapturedSignals, pageHostname: string): TrackerFinding[] {
  const findings: TrackerFinding[] = []

  for (const cookie of signals.cookies) {
    findings.push(classifyNamed(cookie.name, 'cookie', `domain: ${cookie.domain}`))
  }
  for (const entry of signals.localStorage) {
    findings.push(classifyNamed(entry.key, 'localStorage'))
  }
  for (const entry of signals.sessionStorage) {
    findings.push(classifyNamed(entry.key, 'sessionStorage'))
  }

  const seenRequestHosts = new Set<string>()
  for (const req of signals.requests) {
    if (!req.domain || isSameSite(req.domain, pageHostname)) continue
    if (seenRequestHosts.has(req.domain)) continue
    seenRequestHosts.add(req.domain)
    findings.push(classifyDomain(req.domain, 'request'))
  }

  for (const origin of signals.iframeOrigins) {
    try {
      const hostname = new URL(origin).hostname
      if (isSameSite(hostname, pageHostname)) continue
      findings.push(classifyDomain(hostname, 'iframe'))
    } catch {
      continue
    }
  }

  for (const script of signals.scriptTags) {
    if (!script.src) continue
    try {
      const hostname = new URL(script.src).hostname
      if (isSameSite(hostname, pageHostname)) continue
      findings.push(classifyDomain(hostname, 'script', script.src))
    } catch {
      continue
    }
  }

  return findings
}

function classifyNamed(
  id: string,
  kind: TrackerFinding['kind'],
  detail?: string
): TrackerFinding {
  const match = matchTrackerKnowledge(id)
  if (!match) {
    return { id, kind, vendor: null, category: null, confidence: 'unclassified', seenInStates: [], detail }
  }
  return {
    id,
    kind,
    vendor: match.vendor,
    category: match.category,
    confidence: match.pattern.endsWith('*') ? 'pattern' : 'exact',
    seenInStates: [],
    detail,
  }
}

function classifyDomain(hostname: string, kind: TrackerFinding['kind'], detail?: string): TrackerFinding {
  const match = matchDomainKnowledge(hostname)
  if (!match) {
    return {
      id: hostname,
      kind,
      vendor: null,
      category: null,
      confidence: 'unclassified',
      seenInStates: [],
      detail,
    }
  }
  return {
    id: hostname,
    kind,
    vendor: match.vendor,
    category: match.category,
    confidence: 'behavioral-only',
    seenInStates: [],
    detail,
  }
}
