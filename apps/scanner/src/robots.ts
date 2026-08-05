/** Minimal `robots.txt` parser — only what's needed to respect crawl disallow rules for a
 * User-agent of `*` (this tool doesn't identify with a custom UA, so it follows the general
 * rule set, same as any generic crawler would). Doesn't implement `Allow:` precedence edge
 * cases from the (non-standardized) extended spec — a best-effort courtesy check, not a
 * compliance-grade robots parser. */
export interface RobotsRules {
  disallow: string[]
}

export async function fetchRobots(origin: string): Promise<RobotsRules> {
  try {
    const res = await fetch(new URL('/robots.txt', origin).toString(), {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { disallow: [] }
    const text = await res.text()
    return parseRobots(text)
  } catch {
    return { disallow: [] }
  }
}

export function parseRobots(text: string): RobotsRules {
  const lines = text.split(/\r?\n/).map(l => l.trim())
  const disallow: string[] = []
  let inWildcardGroup = false
  let sawAnyUserAgent = false

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0]?.trim() ?? ''
    if (!line) continue
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey?.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (key === 'user-agent') {
      sawAnyUserAgent = true
      inWildcardGroup = value === '*'
    } else if (key === 'disallow' && (inWildcardGroup || !sawAnyUserAgent)) {
      if (value) disallow.push(value)
    }
  }

  return { disallow }
}

export function isAllowedByRobots(path: string, rules: RobotsRules): boolean {
  return !rules.disallow.some(rule => path.startsWith(rule))
}
