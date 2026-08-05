import type { CountryResolverFn, ComplianceConfig, GeoResult } from '@consenti/types'
import { EMBEDDED_COMPLIANCE_MAP, type ComplianceMapData } from '@consenti/utils'
import { TIMEZONE_TO_COUNTRY } from '../data/timezone-country'

export type JurisdictionMap = typeof EMBEDDED_COMPLIANCE_MAP | ComplianceMapData

export interface GeoContext {
  ip: string
  language: string
  timezone: string
}

export interface ResolvedGeo {
  country: string
  region?: string
  regulation?: string
  complianceGroup: string
  locale?: string | null
  /** True when the resolved region carries `requiresSensitiveOptIn` — cookies tagged
   * `cpraCategory: 'sensitive'` should default to denied for this visitor even though the
   * rest of `complianceGroup`'s cookies default to granted. Per-region carve-out, not a
   * different group (see Colorado's CPA entry in `EMBEDDED_COMPLIANCE_MAP`). */
  requiresSensitiveOptIn?: boolean
}

const LANG_TO_COUNTRY: Readonly<Record<string, string>> = {
  'ar': 'SA', 'cs': 'CZ', 'da': 'DK', 'de': 'DE', 'el': 'GR',
  'fi': 'FI', 'fr': 'FR', 'he': 'IL', 'hi': 'IN', 'hu': 'HU',
  'id': 'ID', 'it': 'IT', 'ja': 'JP', 'ko': 'KR', 'nl': 'NL',
  'no': 'NO', 'pl': 'PL', 'pt': 'BR', 'ro': 'RO', 'ru': 'RU',
  'sv': 'SE', 'th': 'TH', 'tr': 'TR', 'uk': 'UA', 'vi': 'VN', 'zh': 'CN',
} as const

export class GeoResolverService {
  private readonly provider: Exclude<ComplianceConfig['geoDataProvider'], undefined>

  constructor(
    provider: ComplianceConfig['geoDataProvider'],
    private map: JurisdictionMap,
  ) {
    // 'default' and 'timezone' are both the timezone+language heuristic
    this.provider = provider ?? 'default'
    if (this.provider === 'default') {
      console.warn(
        '[Consenti] geoDataProvider is unset (using the timezone/language heuristic) — this cannot ' +
        'resolve US state-level regions (California, Colorado, etc.), so US visitors always fall back ' +
        'to the country-level default (the strictest group, opt-out-strict) rather than their actual ' +
        'state law. Configure a geoip-capable provider (geoip, hosted-geoip-lite, or maxmind) for ' +
        'accurate US state routing in production.',
      )
    }
  }

  /** Hot-swaps the jurisdiction map in place — used by the `compliance.complianceMap` URL
   * background-refresh cycle so a live server doesn't need to be restarted to pick up changes. */
  setMap(map: JurisdictionMap): void {
    this.map = map
  }

  /** A function-provider's `complianceGroup` result field (if set) is used directly, skipping
   * `resolveGroup()`'s country/region-map lookup entirely — see `GeoResult.complianceGroup`'s
   * own doc comment (`@consenti/types`) for when to use this. Not available for the built-in
   * `'default'`/`'geoip'`/`'hosted-geoip-lite'`/`'maxmind'` providers, which have no concept of a
   * compliance group beyond what the jurisdiction map computes from their resolved country/region. */
  async resolve(ctx: GeoContext): Promise<ResolvedGeo> {
    let country = ''
    let region: string | undefined
    let regulation: string | undefined
    let locale: string | null = null
    let overrideGroup: string | undefined

    if (typeof this.provider === 'function') {
      const result: GeoResult = await (this.provider as CountryResolverFn)(ctx)
      country = result.country ?? ''
      region = result.region ?? undefined
      locale = result.locale
      overrideGroup = result.complianceGroup ?? undefined
    } else {
      switch (this.provider) {
        case 'default':
          ; ({ country } = resolveFromTimezone(ctx.timezone))
          if (!country) {
            ; ({ country, region } = resolveFromLanguage(ctx.language))
          }
          break
        case 'geoip':
          ; ({ country, region } = await resolveFromGeoIPLite(ctx.ip))
          break
        case 'hosted-geoip-lite':
          ; ({ country, region } = await resolveFromHosted(ctx.ip))
          break
        case 'maxmind':
          ; ({ country, region } = await resolveFromMaxmind(ctx.ip))
          break
      }
    }

    const geo: ResolvedGeo = { country, complianceGroup: overrideGroup ?? this.resolveGroup(country, region) }
    if (region !== undefined) geo.region = region
    if (regulation !== undefined) geo.regulation = regulation
    if (locale !== null) geo.locale = locale
    const sensitiveOptIn = this.resolveRequiresSensitiveOptIn(country, region)
    if (sensitiveOptIn) geo.requiresSensitiveOptIn = true
    return geo
  }

  private countryEntry(country: string) {
    const countries = this.map.countries as Record<string, {
      complianceGroup: string
      default?: string
      overriddenRegions?: Record<string, { complianceGroup: string; requiresSensitiveOptIn?: boolean }>
    }>
    return countries[country]
  }

  private resolveGroup(country: string, region?: string): string {
    if (!country) return ''
    const entry = this.countryEntry(country)
    if (!entry) return ''
    if (region !== undefined) {
      // region was resolved — use override if present, else base country group
      return entry.overriddenRegions?.[region]?.complianceGroup ?? entry.complianceGroup
    }
    // region not available — use .default (most strict) so we never under-comply;
    // falls back to complianceGroup when a country has no explicit default set
    return entry.default ?? entry.complianceGroup
  }

  /** Only meaningful when `region` was actually resolved (requires a geoip/maxmind provider —
   * the timezone/language heuristic never determines a US state). Undetected region never
   * silently forces this on: no region means no per-region carve-out is known to apply. */
  private resolveRequiresSensitiveOptIn(country: string, region?: string): boolean {
    if (!country || region === undefined) return false
    return this.countryEntry(country)?.overriddenRegions?.[region]?.requiresSensitiveOptIn === true
  }
}

// ─── Strategy implementations ─────────────────────────────────────────────────

function resolveFromLanguage(language: string): { country: string; region?: string } {
  const first = language.split(',')[0]?.trim().split(';')[0]?.trim() ?? ''
  const parts = first.split('-')
  if (parts.length >= 2) {
    const tag = (parts[parts.length - 1] ?? '').toUpperCase()
    if (/^[A-Z]{2}$/.test(tag)) return { country: tag }
  }
  const country = LANG_TO_COUNTRY[(parts[0] ?? '').toLowerCase()] ?? ''
  return { country }
}

function resolveFromTimezone(timezone: string): { country: string } {
  return { country: TIMEZONE_TO_COUNTRY[timezone] ?? '' }
}

async function resolveFromGeoIPLite(ip: string): Promise<{ country: string; region?: string }> {
  if (!ip) return { country: '' }
  try {
    // geoip-lite is an optional peer dep — types may not be installed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const geoip = await import('geoip-lite') as {
      lookup(ip: string): { country?: string; region?: string } | null
    }
    const r = geoip.lookup(ip)
    const result: { country: string; region?: string } = { country: r?.country ?? '' }
    const reg = r?.region
    if (reg) result.region = reg
    return result
  } catch {
    console.warn('[Consenti] geoip-lite not installed — country detection skipped. Run: npm install geoip-lite')
    return { country: '' }
  }
}

// 'maxmind' — requires the `maxmind` npm package and a local GeoLite2-City.mmdb database.
// See HOW_TO_MAXMIND.md for setup instructions.
async function resolveFromMaxmind(ip: string): Promise<{ country: string; region?: string }> {
  if (!ip) return { country: '' }
  try {
    // maxmind is an optional peer dep — dynamically imported to avoid hard dependency
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const maxmind = await import('maxmind') as {
      open<T>(path: string): Promise<{ get(ip: string): T | null }>
    }
    const dbPath = process.env['MAXMIND_DB_PATH'] ?? './GeoLite2-City.mmdb'
    const reader = await maxmind.open<{
      country?: { iso_code?: string }
      subdivisions?: Array<{ iso_code?: string }>
    }>(dbPath)
    const r = reader.get(ip)
    const country = r?.country?.iso_code ?? ''
    const region = r?.subdivisions?.[0]?.iso_code
    const result: { country: string; region?: string } = { country }
    if (region) result.region = region
    return result
  } catch {
    console.warn('[Consenti] maxmind not available — country detection skipped. See HOW_TO_MAXMIND.md')
    return { country: '' }
  }
}

// 'hosted-geoip-lite' built-in: calls ipinfo.io with node:https (zero external dep).
// For a custom token or endpoint, pass a CountryResolverFn closure instead.
async function resolveFromHosted(ip: string): Promise<{ country: string; region?: string }> {
  if (!ip) return { country: '' }
  return new Promise((resolve) => {
    import('node:https').then(({ default: https }) => {
      const url = `https://ipinfo.io/${encodeURIComponent(ip)}/json`
      const req = https.get(url, { timeout: 3000 }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString()) as {
              country?: string
              region?: string
            }
            const result: { country: string; region?: string } = { country: body.country ?? '' }
            if (body.region) result.region = body.region
            resolve(result)
          } catch {
            resolve({ country: '' })
          }
        })
      })
      req.on('error', () => resolve({ country: '' }))
      req.on('timeout', () => { req.destroy(); resolve({ country: '' }) })
    }).catch(() => resolve({ country: '' }))
  })
}
