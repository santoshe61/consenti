import type { CapturedScriptTag } from '@consenti/browser-engine'
import type { TagManagerFinding } from './types.js'

const GTM_PATTERN = /googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/i
const TEALIUM_PATTERN = /tiqcdn\.com\/utag\/[^/]+\/([^/]+)\/[^/]+\/utag\.js/i

/**
 * Detects GTM/Tealium container script tags and extracts the container ID. Unlike a static tag
 * manager parser, this scanner doesn't need to separately "enumerate what the container loads"
 * — the multi-state signal capture (`@consenti/browser-engine`'s request/cookie capture) already
 * observes every request the container actually fires at runtime, container-loaded or not, since
 * it's live execution rather than static config parsing. Detecting the container itself is still
 * useful context for the report (explains *why* a page has many third-party requests from a
 * single script tag) — see `findings` in the report for the individual tags it fired.
 */
export function detectTagManagers(scriptTags: CapturedScriptTag[]): TagManagerFinding[] {
  const findings: TagManagerFinding[] = []
  for (const tag of scriptTags) {
    if (!tag.src) continue
    const gtmMatch = tag.src.match(GTM_PATTERN)
    if (gtmMatch?.[1]) {
      findings.push({ type: 'gtm', containerId: gtmMatch[1], scriptUrl: tag.src })
      continue
    }
    const tealiumMatch = tag.src.match(TEALIUM_PATTERN)
    if (tealiumMatch?.[1]) {
      findings.push({ type: 'tealium', containerId: tealiumMatch[1], scriptUrl: tag.src })
    }
  }
  return findings
}
