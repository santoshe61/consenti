/**
 * Integration test: `'*': null` wildcard delete in deepMerge, and the accept-only banner check.
 *
 * Run: tsx --test src/__tests__/profile-wildcard-merge.integration.ts
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { deepMerge } from '../utils/locale.ts'
import { findAcceptOnlyBanners } from '../core/profile-warnings.ts'
import type { ResolvedProfile } from '../types/index.ts'

type Btn = { text: string; style: string; action: string; cookies?: string }
type Cat = { heading: string }

const base = {
  mainBanner: {
    heading: 'Cookies',
    buttons: {
      'accept-all': { text: 'Accept', style: 'primary', action: 'custom', cookies: '*' } as Btn,
      'reject-optional': { text: 'Reject', style: 'secondary', action: 'custom', cookies: '!' } as Btn,
      'manage-preferences': { text: 'Manage', style: 'text', action: 'manage' } as Btn,
    },
  },
  preferenceModal: {
    categories: {
      necessary: { heading: 'Necessary' } as Cat,
      analytics: { heading: 'Analytics' } as Cat,
      marketing: { heading: 'Marketing' } as Cat,
    },
  },
}

describe("'*': null wildcard delete", () => {
  test('drops every base key the override does not name and adds new ones', () => {
    const out = deepMerge(base as never, {
      mainBanner: { buttons: { '*': null, mine: { text: 'Mine', style: 'primary', action: 'custom', cookies: '*' } } },
    } as never) as typeof base
    assert.deepEqual(Object.keys(out.mainBanner.buttons), ['mine'])
  })

  test('named base keys are kept and merged onto their base value', () => {
    const out = deepMerge(base as never, {
      mainBanner: { buttons: { '*': null, 'accept-all': { text: 'Allow all' } } },
    } as never) as typeof base
    assert.deepEqual(out.mainBanner.buttons, {
      'accept-all': { text: 'Allow all', style: 'primary', action: 'custom', cookies: '*' },
    })
  })

  test('works on categories, and leaves sibling maps and fields untouched', () => {
    const out = deepMerge(base as never, {
      preferenceModal: { categories: { '*': null, necessary: {} } },
    } as never) as typeof base
    assert.deepEqual(Object.keys(out.preferenceModal.categories), ['necessary'])
    assert.equal(out.mainBanner.heading, 'Cookies')
    assert.equal(Object.keys(out.mainBanner.buttons).length, 3)
  })

  test("'*': null alone empties the map", () => {
    const out = deepMerge(base as never, { mainBanner: { buttons: { '*': null } } } as never) as typeof base
    assert.deepEqual(out.mainBanner.buttons, {})
  })

  test('explicit null alongside the wildcard still deletes a named key', () => {
    const out = deepMerge(base as never, {
      mainBanner: { buttons: { '*': null, 'accept-all': {}, 'reject-optional': null } },
    } as never) as typeof base
    assert.deepEqual(Object.keys(out.mainBanner.buttons), ['accept-all'])
  })

  test('does not mutate the base', () => {
    deepMerge(base as never, { mainBanner: { buttons: { '*': null } } } as never)
    assert.equal(Object.keys(base.mainBanner.buttons).length, 3)
  })

  test('without a wildcard, behaviour is unchanged (add + single-key null delete)', () => {
    const out = deepMerge(base as never, {
      mainBanner: { buttons: { mine: { text: 'Mine' }, 'manage-preferences': null } },
    } as never) as typeof base
    assert.deepEqual(Object.keys(out.mainBanner.buttons), ['accept-all', 'reject-optional', 'mine'])
  })

  test('wildcard in an override whose base has no such object never leaks a null entry', () => {
    const out = deepMerge({} as never, {
      gpcBanner: { buttons: { '*': null, ok: { text: 'OK' } } },
    } as never) as { gpcBanner: { buttons: Record<string, unknown> } }
    assert.deepEqual(out.gpcBanner.buttons, { ok: { text: 'OK' } })
  })
})

describe('findAcceptOnlyBanners', () => {
  const profile = (mainButtons: Record<string, unknown>, gpcButtons?: Record<string, unknown>) =>
    ({ mainBanner: { buttons: mainButtons }, ...(gpcButtons ? { gpcBanner: { buttons: gpcButtons } } : {}) }) as unknown as ResolvedProfile

  const accept = { text: 'A', style: 'primary', action: 'custom', cookies: '*' }
  const reject = { text: 'R', style: 'secondary', action: 'custom', cookies: '!' }
  const manage = { text: 'M', style: 'text', action: 'manage' }

  test('flags a banner with accept-all and no reject/manage', () => {
    assert.deepEqual(findAcceptOnlyBanners(profile({ accept })), ['mainBanner'])
  })
  test('accepts reject or manage as a refusal path', () => {
    assert.deepEqual(findAcceptOnlyBanners(profile({ accept, reject })), [])
    assert.deepEqual(findAcceptOnlyBanners(profile({ accept, manage })), [])
  })
  test('notice-only style banners (no accept-all) are not flagged', () => {
    assert.deepEqual(findAcceptOnlyBanners(profile({ ok: { text: 'OK', style: 'primary', action: 'close' } })), [])
  })
  test('checks gpcBanner independently', () => {
    assert.deepEqual(findAcceptOnlyBanners(profile({ accept, reject }, { accept })), ['gpcBanner'])
  })
})
