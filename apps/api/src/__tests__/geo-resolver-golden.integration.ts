/**
 * Golden-case tests: geo → compliance-group resolution
 *
 * Locks down `GeoResolverService.resolve()`'s country/region → complianceGroup mapping against
 * `EMBEDDED_COMPLIANCE_MAP` (a 200+ entry table in packages/utils/src/compliance.ts) so a future
 * edit to that map can't silently change routing for a jurisdiction without a test failing —
 * especially the `overriddenRegions` carve-outs (US states, Quebec), which are easy to get wrong
 * silently since most countries don't have any.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { GeoResolverService } from '../services/geo-resolver.service.js'
import { EMBEDDED_COMPLIANCE_MAP } from '@consenti/utils'

function serviceFor(country: string | null, region: string | null): GeoResolverService {
  return new GeoResolverService(
    async () => ({ country, region, locale: null }),
    EMBEDDED_COMPLIANCE_MAP,
  )
}

describe('GeoResolverService — golden cases', () => {
  const cases: Array<{
    label: string
    country: string | null
    region: string | null
    complianceGroup: string
    requiresSensitiveOptIn?: boolean
  }> = [
    // ── Countries with no region-level carve-outs ──────────────────────────
    { label: 'Germany (GDPR) → opt-in', country: 'DE', region: null, complianceGroup: 'opt-in' },
    { label: 'India (DPDPA) → opt-in-dpdpa', country: 'IN', region: null, complianceGroup: 'opt-in-dpdpa' },
    { label: 'China (PIPL) → opt-in-china', country: 'CN', region: null, complianceGroup: 'opt-in-china' },
    { label: 'Brazil (LGPD) → opt-in-brazil', country: 'BR', region: null, complianceGroup: 'opt-in-brazil' },
    { label: 'Japan (APPI) → general-privacy-consent', country: 'JP', region: null, complianceGroup: 'general-privacy-consent' },
    { label: 'South Africa (POPIA) → general-privacy-consent', country: 'ZA', region: null, complianceGroup: 'general-privacy-consent' },
    { label: 'Thailand (PDPA-TH) → opt-in', country: 'TH', region: null, complianceGroup: 'opt-in' },

    // ── Canada: country-level default vs. Quebec's Law 25 override ────────
    { label: 'Canada, no region → general-privacy-consent (PIPEDA)', country: 'CA', region: null, complianceGroup: 'general-privacy-consent' },
    { label: 'Canada, Quebec → opt-in (Law 25 override)', country: 'CA', region: 'QC', complianceGroup: 'opt-in' },
    { label: 'Canada, Ontario (no override) → falls back to country group', country: 'CA', region: 'ON', complianceGroup: 'general-privacy-consent' },

    // ── United States: unknown-state default vs. per-state overrides ──────
    { label: 'US, region undetected → opt-out-strict (strictest default)', country: 'US', region: null, complianceGroup: 'opt-out-strict' },
    { label: 'US, California → opt-out-strict (CPRA)', country: 'US', region: 'CA', complianceGroup: 'opt-out-strict' },
    { label: 'US, Virginia → opt-out (VCDPA)', country: 'US', region: 'VA', complianceGroup: 'opt-out' },
    { label: 'US, Texas → opt-out (TDPSA)', country: 'US', region: 'TX', complianceGroup: 'opt-out' },
    {
      label: 'US, Colorado → opt-out (CPA) + requiresSensitiveOptIn carve-out',
      country: 'US', region: 'CO', complianceGroup: 'opt-out', requiresSensitiveOptIn: true,
    },
    {
      label: 'US, a state with no explicit override (e.g. Alabama) → falls back to base opt-out',
      country: 'US', region: 'AL', complianceGroup: 'opt-out',
    },

    // ── Unresolvable input ─────────────────────────────────────────────────
    { label: 'Unknown/unmapped country → empty group', country: 'XX', region: null, complianceGroup: '' },
    { label: 'No country resolved at all → empty group', country: null, region: null, complianceGroup: '' },
  ]

  for (const c of cases) {
    test(c.label, async () => {
      const geo = await serviceFor(c.country, c.region).resolve({ ip: '', language: '', timezone: '' })
      assert.equal(geo.complianceGroup, c.complianceGroup)
      assert.equal(geo.requiresSensitiveOptIn ?? false, c.requiresSensitiveOptIn ?? false)
    })
  }
})

describe('GeoResolverService — provider-returned complianceGroup override', () => {
  test('a provider-returned complianceGroup is used directly, skipping the country/region map entirely', async () => {
    const service = new GeoResolverService(
      // France would normally resolve to 'opt-in' via the embedded map — the explicit
      // complianceGroup below must win instead, proving the map lookup was skipped.
      async () => ({ country: 'FR', region: null, locale: null, complianceGroup: 'my-custom-group' }),
      EMBEDDED_COMPLIANCE_MAP,
    )
    const geo = await service.resolve({ ip: '', language: '', timezone: '' })
    assert.equal(geo.complianceGroup, 'my-custom-group')
    assert.equal(geo.country, 'FR')
  })

  test('requiresSensitiveOptIn is still computed from country/region even when complianceGroup is overridden', async () => {
    const service = new GeoResolverService(
      async () => ({ country: 'US', region: 'CO', locale: null, complianceGroup: 'my-custom-group' }),
      EMBEDDED_COMPLIANCE_MAP,
    )
    const geo = await service.resolve({ ip: '', language: '', timezone: '' })
    assert.equal(geo.complianceGroup, 'my-custom-group')
    assert.equal(geo.requiresSensitiveOptIn, true)
  })

  test('omitting complianceGroup from the provider result preserves normal country/region resolution', async () => {
    const geo = await serviceFor('DE', null).resolve({ ip: '', language: '', timezone: '' })
    assert.equal(geo.complianceGroup, 'opt-in')
  })
})
