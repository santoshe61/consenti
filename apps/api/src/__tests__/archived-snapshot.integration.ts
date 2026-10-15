/**
 * `ProfileService.getArchivedSnapshot()` — resolves a deleted profile to the on-disk snapshot of
 * the version a consent record was given, falling back to the newest. The JSON store test also
 * round-trips `profileVersion` through a real file on whatever OS the suite runs on.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProfileService } from '../services/profile.service.js'
import { JsonFileAdapter } from '../storage/json/json-file.adapter.js'

describe('getArchivedSnapshot', () => {
  let dir: string
  let service: ProfileService

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'consenti-archive-'))
    for (const [version, expiryDays] of [[1, 10], [2, 20]] as const) {
      const vdir = join(dir, 'profiles', 'default', 'prof_gone', String(version))
      mkdirSync(vdir, { recursive: true })
      writeFileSync(join(vdir, 'default.json'), JSON.stringify({ id: 'prof_gone', version, expiryDays, complianceGroup: 'opt-in' }))
      writeFileSync(join(vdir, 'en.json'), JSON.stringify({ id: 'prof_gone', version, expiryDays }))
    }
    // The repositories are never touched by this method.
    service = new ProfileService({} as never, {} as never, 'default', undefined, undefined, undefined, join(dir, 'profiles'))
  })

  after(() => rmSync(dir, { recursive: true, force: true }))

  test('returns the recorded version', async () => {
    assert.equal((await service.getArchivedSnapshot('prof_gone', 1))?.version, 1)
    assert.equal((await service.getArchivedSnapshot('prof_gone', 1))?.expiryDays, 10)
  })

  test('falls back to the newest when no version, or a missing one, is given', async () => {
    assert.equal((await service.getArchivedSnapshot('prof_gone'))?.version, 2)
    assert.equal((await service.getArchivedSnapshot('prof_gone', 9))?.version, 2)
  })

  test('is null for a profile that never wrote anything', async () => {
    assert.equal(await service.getArchivedSnapshot('prof_never'), null)
  })
})

describe('JSON store keeps profileVersion', () => {
  let dir: string

  before(() => { dir = mkdtempSync(join(tmpdir(), 'consenti-json-')) })
  after(() => rmSync(dir, { recursive: true, force: true }))

  test('on the record and in history, across a restart', async () => {
    let storage = new JsonFileAdapter({ driver: 'json', path: dir })
    await storage.connect()
    await storage.createVisitor({ tenantId: 'default', visitorId: 'v1' })
    await storage.createConsent({
      tenantId: 'default', visitorId: 'v1', profileId: 'prof_a', profileVersion: 3,
      locale: 'en', consentJson: {}, gpcDetected: false, source: 'banner',
    })
    await storage.updateConsent('v1', { consentJson: { a: 'denied' }, profileVersion: 4 })
    await storage.disconnect()

    storage = new JsonFileAdapter({ driver: 'json', path: dir })
    await storage.connect()
    assert.equal((await storage.getConsent('v1'))?.profileVersion, 4)
    const history = await storage.getConsentHistory('v1')
    assert.deepEqual(history.map(h => h.profileVersion), [3, 4])
    await storage.disconnect()
  })
})
