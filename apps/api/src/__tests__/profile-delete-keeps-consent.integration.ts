/**
 * Deleting a profile must not be blocked by (or destroy) the consent records collected against
 * it: the profile row goes, the records stay, and `verify()` resolves the record's profile via
 * the archived on-disk snapshot.
 *
 * Run: tsx --test src/__tests__/*.integration.ts
 */

import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NodeSqliteBuiltinAdapter } from '../storage/sqlite/node-sqlite-builtin.adapter.js'
import { ConsentRepo } from '../repositories/consent.repo.js'
import { VisitorRepo } from '../repositories/visitor.repo.js'
import { ProfileRepo } from '../repositories/profile.repo.js'
import { AuditRepo } from '../repositories/audit.repo.js'
import { ConsentService } from '../services/consent.service.js'
import type { StoredProfileJson } from '@consenti/types'

const TENANT = 'default'

describe('deleting a profile that has consent records', () => {
  let dir: string
  let storage: NodeSqliteBuiltinAdapter

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'consenti-delete-profile-'))
    storage = new NodeSqliteBuiltinAdapter({ driver: 'node:sqlite', path: dir })
    await storage.connect()
  })

  after(async () => {
    await storage.disconnect()
    rmSync(dir, { recursive: true, force: true })
  })

  async function createProfileWithRecords(): Promise<{ profileId: string; visitorId: string }> {
    const profile = await storage.createProfile({
      tenantId: TENANT,
      name: 'Custom',
      defaultLocale: 'en',
      profileJson: { id: 'x', defaultLocale: 'en', complianceGroup: 'opt-in', isActive: true } as unknown as StoredProfileJson,
    })
    const visitorId = `visitor-${profile.id}`
    await storage.createVisitor({ tenantId: TENANT, visitorId })
    await storage.createConsent({
      tenantId: TENANT, visitorId, profileId: profile.id, locale: 'en',
      consentJson: {}, gpcDetected: false, source: 'banner',
    })
    await storage.createNoticeShown({ tenantId: TENANT, visitorId, profileId: profile.id, locale: 'en' })
    return { profileId: profile.id, visitorId }
  }

  test('the profile row is deleted and its consent + notice records survive', async () => {
    const { profileId, visitorId } = await createProfileWithRecords()

    await storage.deleteProfile(profileId)

    assert.equal(await storage.getProfile(profileId), null)
    const record = await storage.getConsent(visitorId)
    assert.equal(record?.profileId, profileId)
  })

  test('verify() resolves the deleted profile to its archived snapshot', async () => {
    const { profileId, visitorId } = await createProfileWithRecords()
    await storage.deleteProfile(profileId)

    const service = (snapshot: ((id: string) => Promise<never>) | ((id: string) => Promise<unknown>)) =>
      new ConsentService(
        new ConsentRepo(storage), new VisitorRepo(storage), new ProfileRepo(storage), new AuditRepo(storage),
        TENANT, undefined, undefined, undefined, undefined, storage, undefined, undefined,
        snapshot as never,
      )

    const withSnapshot = await service(async id => ({ id, version: 3, complianceGroup: 'opt-in', expiryDays: 365 })).verify(visitorId)
    assert.equal(withSnapshot.valid, false)
    assert.deepEqual(withSnapshot.reasons, ['profile_changed'])
    assert.equal(withSnapshot.consentProfileId, profileId)

    const withoutSnapshot = await service(async () => null).verify(visitorId)
    assert.deepEqual(withoutSnapshot, { valid: false, reasons: ['profile_changed'] })
  })
})
