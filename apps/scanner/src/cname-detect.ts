import { resolveCname } from 'node:dns/promises'
import type { CloakingFinding } from './types.js'
import { registrableDomainOf } from '../source-data/index.js'

/**
 * First-party cloaking: a tracker vendor provisions a CNAME record on a subdomain of the site
 * being scanned (e.g. `metrics.example.com` → `some-vendor.customer-proxy.net`) so requests to
 * it look same-site (same registrable domain in the browser's eyes — cookies set there survive
 * ITP/first-party-only defenses) while actually being served by a third party. Renaming a
 * cookie doesn't defeat this check because it operates on the *hostname*, not cookie names.
 *
 * Only checks hostnames that are subdomains of the site's own registrable domain — a request to
 * an already-obviously-third-party domain doesn't need a CNAME lookup to be flagged as such.
 */
export async function detectCnameCloaking(
  requestHostnames: string[],
  pageHostname: string
): Promise<CloakingFinding[]> {
  const pageRegistrable = registrableDomainOf(pageHostname)
  const candidates = Array.from(new Set(requestHostnames)).filter(
    host =>
      host !== pageHostname &&
      host !== `www.${pageRegistrable}` &&
      host !== pageRegistrable &&
      registrableDomainOf(host) === pageRegistrable
  )

  const findings: CloakingFinding[] = []
  for (const subdomain of candidates) {
    const target = await lookupCname(subdomain)
    if (!target) continue
    const targetRegistrable = registrableDomainOf(target)
    if (targetRegistrable !== pageRegistrable) {
      findings.push({
        subdomain,
        cnameTarget: target,
        cnameTargetRegistrableDomain: targetRegistrable,
        note: `${subdomain} looks first-party but CNAMEs to ${target} (${targetRegistrable}) — likely a proxied third-party tracker, not same-site.`,
      })
    }
  }
  return findings
}

async function lookupCname(hostname: string): Promise<string | null> {
  try {
    const records = await resolveCname(hostname)
    return records[0] ?? null
  } catch {
    return null
  }
}
