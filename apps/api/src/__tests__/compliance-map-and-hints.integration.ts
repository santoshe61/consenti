/**
 * compliance.complianceMap merge/override semantics and the geo hints forwarded to
 * `geoDataProvider` by `GET /resolve-profile`.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { EMBEDDED_COMPLIANCE_MAP, resolveComplianceMapOverride, type ComplianceMapData } from '@consenti/utils'
import type { CountryResolverFn } from '@consenti/types'
import { GeoResolverService } from '../services/geo-resolver.service.js'
import { buildProfileRoutes } from '../routes/public/profile.routes.js'
import { parseAcceptLanguage, sanitizeLanguages } from '../utils/geo-hints.js'
import type { ProfileService } from '../services/profile.service.js'

const noWarn = (): void => {}

async function resolveGroup(map: ComplianceMapData | undefined, country: string, region?: string): Promise<string> {
  const { map: resolved } = await resolveComplianceMapOverride(map, noWarn)
  const geo = new GeoResolverService(async () => ({ country, region: region ?? null, locale: null }), resolved)
  return (await geo.resolve({ ip: '', language: '', languages: [], timezone: '', locale: '' })).complianceGroup
}

describe('complianceMap — default is replace (unchanged behaviour)', () => {
  test('without an override key only the listed countries resolve', async () => {
    const map: ComplianceMapData = { version: 't', countries: { DE: { complianceGroup: 'opt-out' } } }
    assert.equal(await resolveGroup(map, 'DE'), 'opt-out')
    assert.equal(await resolveGroup(map, 'FR'), '')
  })

  test('override: true behaves the same as omitting it', async () => {
    const map: ComplianceMapData = { version: 't', override: true, countries: { DE: { complianceGroup: 'opt-out' } } }
    assert.equal(await resolveGroup(map, 'DE'), 'opt-out')
    assert.equal(await resolveGroup(map, 'FR'), '')
  })
})

describe('complianceMap — override: false merges over the embedded map', () => {
  test('a listed country changes, every unlisted country keeps its built-in group', async () => {
    const map: ComplianceMapData = { version: 't', override: false, countries: { DE: { complianceGroup: 'opt-out' } } }
    assert.equal(await resolveGroup(map, 'DE'), 'opt-out')
    assert.equal(await resolveGroup(map, 'FR'), 'opt-in')
    assert.equal(await resolveGroup(map, 'BR'), 'opt-in-brazil')
    assert.equal(await resolveGroup(map, 'US'), 'opt-out-strict')
  })

  test('an operator entry replaces the embedded entry wholesale (no inherited overriddenRegions)', async () => {
    const map: ComplianceMapData = { version: 't', override: false, countries: { US: { complianceGroup: 'opt-out', default: 'opt-out' } } }
    // embedded US routes California to opt-out-strict; the operator's US entry has no such region
    assert.equal(await resolveGroup(map, 'US', 'CA'), 'opt-out')
  })

  test('GB and UK are one country: an operator GB entry displaces the embedded UK entry', async () => {
    const map: ComplianceMapData = { version: 't', override: false, countries: { GB: { complianceGroup: 'opt-out' } } }
    assert.equal(await resolveGroup(map, 'GB'), 'opt-out')
    assert.equal(await resolveGroup(map, 'UK'), 'opt-out')
  })

  test('the embedded map object is never mutated', async () => {
    const before = Object.keys(EMBEDDED_COMPLIANCE_MAP.countries).length
    await resolveGroup({ version: 't', override: false, countries: { GB: { complianceGroup: 'opt-out' } } }, 'GB')
    assert.equal(Object.keys(EMBEDDED_COMPLIANCE_MAP.countries).length, before)
    assert.ok('UK' in EMBEDDED_COMPLIANCE_MAP.countries)
  })
})

describe('complianceMap — validation', () => {
  test('a non-boolean override fails validation and falls back to the embedded map', async () => {
    const warnings: string[] = []
    const bad = { version: 't', override: 'yes', countries: { DE: { complianceGroup: 'opt-out' } } } as unknown as ComplianceMapData
    const { map } = await resolveComplianceMapOverride(bad, m => warnings.push(m))
    assert.equal(map, EMBEDDED_COMPLIANCE_MAP)
    assert.equal(warnings.length, 1)
  })
})

describe('geo hint parsing', () => {
  test('Accept-Language is split in header order without q-values', () => {
    assert.deepEqual(parseAcceptLanguage('en-GB,en;q=0.9,de;q=0.8'), ['en-GB', 'en', 'de'])
    assert.deepEqual(parseAcceptLanguage(''), [])
  })

  test('untrusted languages: non-strings and oversized tags dropped, count capped', () => {
    assert.deepEqual(sanitizeLanguages(['en', 5, null, 'x'.repeat(100), ' fr ']), ['en', 'fr'])
    assert.equal(sanitizeLanguages(Array.from({ length: 50 }, () => 'en')).length, 20)
    assert.deepEqual(sanitizeLanguages('en'), [])
  })
})

describe('GET /resolve-profile → geoDataProvider context', () => {
  async function captureContext(query: string, headers: Record<string, string> = {}): Promise<Parameters<CountryResolverFn>[0]> {
    let captured: Parameters<CountryResolverFn>[0] | undefined
    const provider: CountryResolverFn = async ctx => { captured = ctx; return { country: 'DE', region: null, locale: null } }
    const geo = new GeoResolverService(provider, EMBEDDED_COMPLIANCE_MAP)
    const profiles = { findActiveByComplianceGroup: async () => null } as unknown as ProfileService
    const routes = buildProfileRoutes(profiles, geo)
    const handler = routes['GET /resolve-profile']
    await handler(new Request(`http://localhost/consenti/api/v1/resolve-profile?${query}`, { headers }), {})
    assert.ok(captured, 'provider was not called')
    return captured
  }

  const data = (hints: unknown): string => `data=${encodeURIComponent(Buffer.from(JSON.stringify(hints)).toString('base64'))}`

  test('widget data hint: full language list and requested locale reach the provider', async () => {
    const ctx = await captureContext(data({ timezone: 'Europe/London', language: 'en-GB', languages: ['en-GB', 'en', 'de'], locale: 'en' }))
    assert.equal(ctx.timezone, 'Europe/London')
    assert.equal(ctx.language, 'en-GB')
    assert.deepEqual(ctx.languages, ['en-GB', 'en', 'de'])
    assert.equal(ctx.locale, 'en')
  })

  test('no widget hints: languages parsed from Accept-Language, language keeps the raw header', async () => {
    const ctx = await captureContext('', { 'accept-language': 'fr-FR,fr;q=0.8' })
    assert.deepEqual(ctx.languages, ['fr-FR', 'fr'])
    assert.equal(ctx.language, 'fr-FR,fr;q=0.8')
    assert.equal(ctx.locale, '')
  })

  test('a malformed languages hint is ignored rather than failing the request', async () => {
    const ctx = await captureContext(data({ timezone: 'UTC', language: 'en', languages: 'en-GB' }))
    assert.deepEqual(ctx.languages, [])
  })
})
