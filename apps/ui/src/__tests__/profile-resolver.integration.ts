/**
 * Integration test: profile resolver dispatcher
 *
 * Covers the full resolve-profile → static fetch → consent store flow.
 *
 * Run: tsx --test src/__tests__/profile-resolver.integration.ts
 */

import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// ─── Browser global shims ─────────────────────────────────────────────────────
// profile-resolver.ts only reads these inside function calls (not at module load
// time), so synchronous assignment before the first test function runs is safe.

const _storage: Record<string, string> = {}

Object.assign(globalThis, {
  window: { location: { origin: 'https://example.com' } },
  navigator: { language: 'de-DE', languages: ['de-DE', 'en'] },
  sessionStorage: {
    getItem:    (k: string)         => _storage[k] ?? null,
    setItem:    (k: string, v: string) => { _storage[k] = v },
    removeItem: (k: string)         => { delete _storage[k] },
    clear:      ()                  => { Object.keys(_storage).forEach(k => delete _storage[k]) },
  },
})

// ─── Modules under test ───────────────────────────────────────────────────────

import {
  mapPublicProfileToResolved,
  resolveProfile,
  DEFAULT_PROFILE,
  getCachedResolution,
  setCachedResolution,
} from '../core/profile-resolver.ts'
import { resolveConsentMaxAge } from '../core/consent-store.ts'
import type { PublicProfileResponse, ConsentiConfig, Cookie } from '../types/index.ts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearStorage(): void {
  Object.keys(_storage).forEach(k => delete _storage[k])
}

/** Stub globalThis.fetch to return responses in sequence. */
function stubFetch(...responses: Array<{ ok: boolean; body?: unknown }>): void {
  let callIndex = 0
  globalThis.fetch = async (_input: RequestInfo | URL) => {
    const r = responses[callIndex++] ?? { ok: false }
    return {
      ok: r.ok,
      status: r.ok ? 200 : 500,
      statusText: r.ok ? 'OK' : 'Internal Server Error',
      json: async () => r.body,
    } as Response
  }
}

/** Minimal PublicProfileResponse fixture. */
function makePublicProfile(overrides: Partial<PublicProfileResponse> = {}): PublicProfileResponse {
  return {
    id: 'prof-uuid-123',
    version: 2,
    defaultLocale: 'en',
    locales: ['en'],
    gpcMode: 'honor',
    cookies: [
      { id: 'necessary', mandatory: true },
      { id: 'analytics', listenGpc: true, expiry: 180 },
    ],
    mainBanner: {
      position: 'bottom',
      heading: 'We value your privacy',
      htmlText: 'We use cookies.',
      buttons: [{ text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' }],
    },
    preferenceModal: {
      heading: 'Cookie Preferences',
      subheading: 'Manage your cookies.',
      htmlText: 'Choose below.',
      showClose: true,
      overlayOpacity: 50,
      categories: [
        { id: 'cat-necessary', heading: 'Necessary', htmlText: 'Required.', mandatory: true, cookies: ['necessary'] },
        { id: 'cat-analytics', heading: 'Analytics', htmlText: 'Analytics.', cookies: ['analytics'] },
      ],
      buttons: [{ text: 'Save', style: 'primary', action: 'submit' }],
    },
    complianceGroup: 'opt-in',
    ...overrides,
  } as PublicProfileResponse
}

/** Minimal ConsentiConfig with api enabled. */
function makeConfig(overrides: Partial<ConsentiConfig> = {}): ConsentiConfig {
  return {
    core: { tenantId: 'acme' },
    api: { enabled: true, baseUrl: 'https://example.com' },
    compliance: { type: 'auto' },
    ...overrides,
  } as ConsentiConfig
}

// ─── mapPublicProfileToResolved ───────────────────────────────────────────────

describe('mapPublicProfileToResolved', () => {
  test('maps legacy boolean gpcMode true → honor', () => {
    const profile = makePublicProfile({ gpcMode: true as unknown as 'honor' })
    const resolved = mapPublicProfileToResolved(profile)
    assert.equal(resolved.gpcMode, 'honor')
  })

  test('maps legacy boolean gpcMode false → ignore', () => {
    const profile = makePublicProfile({ gpcMode: false as unknown as 'honor' })
    const resolved = mapPublicProfileToResolved(profile)
    assert.equal(resolved.gpcMode, 'ignore')
  })

  test('passes through string gpcMode strict', () => {
    const profile = makePublicProfile({ gpcMode: 'strict' })
    const resolved = mapPublicProfileToResolved(profile)
    assert.equal(resolved.gpcMode, 'strict')
  })

  test('sets profileUuid from response id', () => {
    const resolved = mapPublicProfileToResolved(makePublicProfile())
    assert.equal(resolved.profileUuid, 'prof-uuid-123')
  })

  test('sets complianceGroup from response', () => {
    const resolved = mapPublicProfileToResolved(makePublicProfile({ complianceGroup: 'opt-out' }))
    assert.equal(resolved.complianceGroup, 'opt-out')
  })

  test('omits gpcBanner when not present in response', () => {
    const profile = makePublicProfile()
    delete (profile as Partial<typeof profile>).gpcBanner
    const resolved = mapPublicProfileToResolved(profile)
    assert.equal('gpcBanner' in resolved, false)
  })
})

// ─── resolveConsentMaxAge ─────────────────────────────────────────────────────

describe('resolveConsentMaxAge', () => {
  test('returns min expiry converted to seconds', () => {
    const cookies: Cookie[] = [
      { id: 'a', expiry: 365 },
      { id: 'b', expiry: 90 },
      { id: 'c', expiry: 180 },
    ]
    assert.equal(resolveConsentMaxAge(cookies), 90 * 24 * 60 * 60)
  })

  test('defaults to 365 days when expiry is undefined', () => {
    const cookies: Cookie[] = [{ id: 'a' }, { id: 'b' }]
    assert.equal(resolveConsentMaxAge(cookies), 365 * 24 * 60 * 60)
  })

  test('handles single cookie with custom expiry', () => {
    const cookies: Cookie[] = [{ id: 'a', expiry: 30 }]
    assert.equal(resolveConsentMaxAge(cookies), 30 * 24 * 60 * 60)
  })
})

// ─── sessionStorage cache ─────────────────────────────────────────────────────

describe('getCachedResolution / setCachedResolution', () => {
  beforeEach(() => clearStorage())

  test('returns null when nothing is cached', () => {
    const result = getCachedResolution('acme', 'en', true)
    assert.equal(result, null)
  })

  test('returns cached data within TTL', () => {
    setCachedResolution('acme', 'en', true, {
      filePath: 'https://example.com/profiles/acme/opt-in/en.json',
      version: 3,
      complianceGroup: 'opt-in',
      tenantId: 'acme',
      locale: 'en',
    })
    const cached = getCachedResolution('acme', 'en', true)
    assert.ok(cached !== null)
    assert.equal(cached!.filePath, 'https://example.com/profiles/acme/opt-in/en.json')
    assert.equal(cached!.complianceGroup, 'opt-in')
    assert.equal(cached!.tenantId, 'acme')
  })

  test('returns null when cache is disabled', () => {
    setCachedResolution('acme', 'en', false, {
      filePath: 'https://example.com/profiles/acme/opt-in/en.json',
      version: 3,
      complianceGroup: 'opt-in',
      tenantId: 'acme',
      locale: 'en',
    })
    const cached = getCachedResolution('acme', 'en', false)
    assert.equal(cached, null)
  })

  test('is keyed by tenantId + locale — different locale misses cache', () => {
    setCachedResolution('acme', 'en', true, {
      filePath: 'https://example.com/profiles/acme/opt-in/en.json',
      version: 1,
      complianceGroup: 'opt-in',
      tenantId: 'acme',
      locale: 'en',
    })
    const cached = getCachedResolution('acme', 'fr', true)
    assert.equal(cached, null)
  })
})

// ─── resolveProfile — Scenario 2A (api on, auto) ─────────────────────────────

describe('resolveProfile — Scenario 2A', () => {
  beforeEach(() => clearStorage())

  test('calls /resolve-profile then fetches static profile JSON', async () => {
    const publicProfile = makePublicProfile()
    const resolveResponse = {
      filePath: 'https://example.com/profiles/acme/opt-in/de.json',
      tenantId: 'acme',
      profileId: 'prof-uuid-123',
      complianceGroup: 'opt-in',
      locale: 'de',
      version: 2,
    }

    stubFetch(
      { ok: true, body: resolveResponse },    // /resolve-profile
      { ok: true, body: publicProfile },       // static profile JSON
    )

    const config = makeConfig()
    const resolved = await resolveProfile(config)

    assert.equal(resolved.profileUuid, 'prof-uuid-123')
    assert.equal(resolved.complianceGroup, 'opt-in')
    assert.equal(resolved.gpcMode, 'honor')
    assert.equal(resolved.cookies.length, 2)
  })

  test('caches /resolve-profile URL in sessionStorage for subsequent calls', async () => {
    const publicProfile = makePublicProfile()
    const resolveResponse = {
      filePath: 'https://example.com/profiles/acme/opt-in/de.json',
      tenantId: 'acme',
      profileId: 'prof-uuid-123',
      complianceGroup: 'opt-in',
      locale: 'de',
      version: 2,
    }

    let resolveCallCount = 0
    const responses = [
      { ok: true, body: resolveResponse },   // /resolve-profile (first call only)
      { ok: true, body: publicProfile },      // static profile JSON (first call)
      { ok: true, body: publicProfile },      // static profile JSON (second call, from cache)
    ]
    let callIdx = 0
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
      if (urlStr.includes('resolve-profile')) resolveCallCount++
      const r = responses[callIdx++] ?? { ok: false, body: null }
      return { ok: r.ok, status: r.ok ? 200 : 500, statusText: 'OK', json: async () => r.body } as Response
    }

    const config = makeConfig({ core: { tenantId: 'acme', cacheResolvedProfiles: true } })

    await resolveProfile(config)
    await resolveProfile(config)

    // /resolve-profile should only be called once; second call uses sessionStorage cache
    assert.equal(resolveCallCount, 1)
  })

  test('falls back to DEFAULT_PROFILE when /resolve-profile request fails', async () => {
    stubFetch({ ok: false })  // /resolve-profile fails → triggers scenario1A

    const config = makeConfig()
    const resolved = await resolveProfile(config)

    // scenario1A → loadPrebuiltProfile('opt-in') fails in Node (no .js file) → DEFAULT_PROFILE
    assert.equal(resolved.id, DEFAULT_PROFILE.id)
    assert.ok(resolved.mainBanner !== undefined)
  })
})

// ─── resolveProfile — domain allowlist ───────────────────────────────────────

describe('resolveProfile — domain allowlist (Scenario 2B)', () => {
  beforeEach(() => clearStorage())

  test('blocks profile when origin not in allowedOrigins', async () => {
    // window.location.origin is 'https://example.com' (set in shims)
    // profile only allows 'https://other.com'
    const restrictedProfile = makePublicProfile({
      allowedOrigins: ['https://other.com'] as unknown as string[],
    })

    stubFetch({ ok: true, body: restrictedProfile })

    const config = makeConfig({
      compliance: { type: 'opt-in' },   // Scenario 2B
    })
    const resolved = await resolveProfile(config)

    // Domain check fails → falls back to scenario1B → loadPrebuiltProfile → DEFAULT_PROFILE
    assert.equal(resolved.id, DEFAULT_PROFILE.id)
  })

  test('allows profile when allowedOrigins is empty (no restriction)', async () => {
    const openProfile = makePublicProfile({ complianceGroup: 'opt-in' })
    delete (openProfile as Partial<typeof openProfile>).allowedOrigins

    stubFetch({ ok: true, body: openProfile })

    const config = makeConfig({ compliance: { type: 'opt-in' } })
    const resolved = await resolveProfile(config)

    assert.equal(resolved.complianceGroup, 'opt-in')
  })

  test('allows profile when api.trustDomain is true (bypasses allowlist)', async () => {
    const restrictedProfile = makePublicProfile({
      allowedOrigins: ['https://other.com'] as unknown as string[],
      complianceGroup: 'opt-in',
    })

    stubFetch({ ok: true, body: restrictedProfile })

    const config = makeConfig({
      compliance: { type: 'opt-in' },
      api: { enabled: true, baseUrl: 'https://example.com', trustDomain: true },
    })
    const resolved = await resolveProfile(config)

    // trustDomain: true bypasses allowlist check
    assert.equal(resolved.complianceGroup, 'opt-in')
  })
})

// ─── resolveProfile — Scenario 1B (api off, fixed group) ─────────────────────

describe('resolveProfile — Scenario 1B', () => {
  test('falls back to DEFAULT_PROFILE when prebuilt module not found', async () => {
    // api.enabled = false, compliance.type = 'opt-in'
    // loadPrebuiltProfile attempts import('../profiles/opt-in.js') which fails in
    // a Node test environment (source is .ts, not .js) → returns DEFAULT_PROFILE
    const config: ConsentiConfig = {
      core: { tenantId: 'acme' },
      compliance: { type: 'opt-in' },
    } as ConsentiConfig

    const resolved = await resolveProfile(config)

    // In CI/test env: dynamic import fails → DEFAULT_PROFILE is the safe fallback
    assert.ok(resolved !== undefined)
    assert.ok(resolved.cookies.length > 0)
  })
})
