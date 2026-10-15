/**
 * Compliance-group keys and locale codes become directory / file names. Validation must reject
 * anything that is unsafe on ANY supported OS, and the worker — the layer that deletes and
 * replaces directories — must refuse bad names even if validation is bypassed.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { COMPLIANCE_GROUP_IDS } from '@consenti/utils'
import { isSafeGroupKey, isSafeLocale, findUnsafePathSegment } from '../utils/path-segment.js'
import { validateCreateProfile, validateUpdateProfile } from '../validators/profile.validator.js'
import { runWorkerAction } from '../workers/profile-json-worker-core.js'
import type { WorkerMessage } from '../workers/profile-json-worker-core.js'

describe('isSafeGroupKey', () => {
  test('accepts every built-in compliance group and ordinary custom keys', () => {
    for (const id of COMPLIANCE_GROUP_IDS) assert.ok(isSafeGroupKey(id), id)
    for (const key of ['custom', 'my_group-2', 'a', '0abc']) assert.ok(isSafeGroupKey(key), key)
  })

  test('rejects traversal, separators, reserved names, case, and profile-id lookalikes', () => {
    const bad = [
      '', '.', '..', '../x', 'a/b', 'a\\b', 'a:b', 'a b', 'trailing.', '.hidden', '-lead', '_lead',
      'Opt-In', 'UPPER', 'con', 'NUL', 'aux', 'prn', 'com1', 'lpt9', 'prof_abc123', 'x'.repeat(65), 'é',
    ]
    for (const key of bad) assert.equal(isSafeGroupKey(key), false, JSON.stringify(key))
    assert.equal(isSafeGroupKey(undefined), false)
    assert.equal(isSafeGroupKey(42), false)
  })
})

describe('isSafeLocale', () => {
  test('accepts language tags', () => {
    for (const l of ['en', 'de', 'pt-BR', 'zh-Hans', 'en-US', 'fil']) assert.ok(isSafeLocale(l), l)
  })

  test('rejects anything that is not a language tag, incl. the reserved "default" file name', () => {
    for (const l of ['', 'default', '../x', 'en/US', 'en\\US', 'e', 'en_US', 'toolonglocale', 'con', 'nul', 'en.json']) {
      assert.equal(isSafeLocale(l), false, JSON.stringify(l))
    }
  })
})

describe('findUnsafePathSegment', () => {
  test('flags locales that differ only by case (one file on Windows / macOS)', () => {
    assert.match(findUnsafePathSegment({ locales: ['en-US', 'en-us'] }) ?? '', /twice/)
    assert.equal(findUnsafePathSegment({ locales: ['en', 'de'] }), null)
  })

  test('checks localeContent keys and treats every field as optional', () => {
    assert.match(findUnsafePathSegment({ localeContentKeys: ['en', '../x'] }) ?? '', /locale/)
    assert.equal(findUnsafePathSegment({}), null)
  })
})

describe('profile validators', () => {
  const valid = {
    name: 'P', defaultLocale: 'en',
    profileJson: { consentTemplateId: 'c', uiTemplateId: 'u', complianceGroup: 'opt-in', locales: ['en', 'de'] },
  }

  test('create accepts a normal profile', () => {
    assert.deepEqual(validateCreateProfile(valid), { valid: true })
  })

  test('create rejects an unsafe customComplianceGroup, locale and defaultLocale', () => {
    const withPj = (extra: Record<string, unknown>) => ({ ...valid, profileJson: { ...valid.profileJson, ...extra } })
    assert.equal(validateCreateProfile(withPj({ customComplianceGroup: '..' })).valid, false)
    assert.equal(validateCreateProfile(withPj({ customComplianceGroup: 'Has Space' })).valid, false)
    assert.equal(validateCreateProfile(withPj({ locales: ['en', '../../x'] })).valid, false)
    assert.equal(validateCreateProfile({ ...valid, defaultLocale: 'a/b' }).valid, false)
    assert.equal(validateCreateProfile({ ...valid, localeContent: { '..': {} } }).valid, false)
  })

  test('update validates only what it sends', () => {
    assert.deepEqual(validateUpdateProfile({ name: 'renamed' }), { valid: true })
    assert.equal(validateUpdateProfile({ profileJson: { customComplianceGroup: '../x' } }).valid, false)
  })
})

describe('worker refuses unsafe names before touching the file system', () => {
  let storage: string
  let precious: string

  beforeEach(() => {
    storage = mkdtempSync(join(tmpdir(), 'consenti-worker-'))
    const dir = join(storage, 'profiles', 'default', 'prof_keep', '1')
    mkdirSync(dir, { recursive: true })
    precious = join(dir, 'en.json')
    writeFileSync(precious, '{"archived":"snapshot"}')
  })

  afterEach(() => rmSync(storage, { recursive: true, force: true }))

  const message = (action: WorkerMessage['action'], complianceGroup: string, locales = ['en']): WorkerMessage => ({
    action, storagePath: storage, tenantId: 'default', profileId: 'prof_new', version: 1, complianceGroup,
    profile: { id: 'prof_new', defaultLocale: 'en', locales, cookies: {} },
    localeContent: {},
  })

  test('deactivate / activate with a traversal, empty or profile-id group', async () => {
    for (const group of ['..', '.', '', 'prof_keep', '../..']) {
      await assert.rejects(runWorkerAction(message('deactivate', group)), /Refusing/, JSON.stringify(group))
      await assert.rejects(runWorkerAction(message('activate', group)), /Refusing/, JSON.stringify(group))
    }
    assert.ok(existsSync(precious), 'archived snapshot is untouched')
    assert.ok(existsSync(join(storage, 'profiles', 'default')), 'tenant directory is untouched')
  })

  test('write with an unsafe locale', async () => {
    await assert.rejects(runWorkerAction(message('write', 'opt-in', ['en', '../../evil'])), /Refusing/)
    assert.ok(!existsSync(join(storage, 'evil.json')))
    assert.ok(existsSync(precious))
  })
})
