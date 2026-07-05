import type {
  ConsentDbRecord, ConsentVerifyResult, CreateConsentInput, UpdateConsentInput,
  ComplianceConfig, TcfConfig,
} from '@consenti/types'
import { buildConsentValue, verifyConsent, validateConsentInput, buildTcfPayload } from '../core/consent-engine'
import { encodeTcString } from '../tcf/tc-string'
import { getGvl } from '../tcf/gvl-cache'
import type { ConsentRepo } from '../repositories/consent.repo'
import type { VisitorRepo } from '../repositories/visitor.repo'
import type { ProfileRepo } from '../repositories/profile.repo'
import type { AuditRepo } from '../repositories/audit.repo'
import type { PluginEngine } from '../core/plugin-engine'
import type { EventEmitter } from 'node:events'

export class ConsentService {
  constructor(
    private consents: ConsentRepo,
    private visitors: VisitorRepo,
    private profiles: ProfileRepo,
    private audit: AuditRepo,
    private tenantId: string = 'default',
    private compliance?: ComplianceConfig,
    private pluginEngine?: PluginEngine,
    private eventBus?: EventEmitter,
    private tcfConfig?: TcfConfig,
  ) {}

  async create(input: Omit<CreateConsentInput, 'tenantId'>): Promise<ConsentDbRecord> {
    const profile = await this.profiles.get(input.profileId)
    if (!profile) throw new Error(`Profile ${input.profileId} not found`)

    const regulation = profile.profileJson.regulation
    const profileCookies = profile.profileJson.cookies ?? []
    // GPC server-side enforcement — skip for DPDPA (no GPC opt-out signal recognised)
    let effectiveConsent = input.consentJson
    if (input.gpcDetected && this.compliance?.gpc !== false && regulation !== 'dpdpa') {
      effectiveConsent = { ...effectiveConsent }
      for (const cookie of profileCookies) {
        if (regulation === 'cpra') {
          // CPRA: deny sale + sharing on GPC; sensitive stays as submitted
          if (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing') {
            effectiveConsent[cookie.id] = 'denied'
          }
        } else if (cookie.listenGpc) {
          effectiveConsent[cookie.id] = 'denied'
        }
      }
    }

    const validation = validateConsentInput({ ...input, consentJson: effectiveConsent }, profile)
    if (!validation.valid) throw new Error(validation.errors.join('; '))

    const builtConsent = buildConsentValue(
      profileCookies,
      effectiveConsent,
      input.gpcDetected,
      regulation,
    )

    let tcfString: string | undefined
    if (this.tcfConfig?.enabled && profileCookies.some(c => c.tcfVendorId)) {
      const gvl = await getGvl()
      const { vendorConsents, purposeConsents } = buildTcfPayload(profileCookies, builtConsent)
      tcfString = encodeTcString({
        cmpId: this.tcfConfig.cmpId,
        cmpVersion: this.tcfConfig.cmpVersion,
        consentScreen: 1,
        consentLanguage: input.locale?.slice(0, 2) ?? 'en',
        vendorListVersion: gvl?.vendorListVersion ?? 0,
        purposeConsents,
        vendorConsents,
      })
    }

    let baseInput: CreateConsentInput = {
      ...input,
      tenantId: this.tenantId,
      consentJson: builtConsent,
      profileVersion: profile.version,
      ...(tcfString ? { tcfString } : {}),
    }
    if (this.pluginEngine) baseInput = await this.pluginEngine.runBeforeConsentSave(baseInput)

    const existing = await this.consents.get(input.visitorId)
    let record: ConsentDbRecord

    if (existing) {
      const updateData = await (this.pluginEngine
        ? this.pluginEngine.runBeforeConsentUpdate({ consentJson: builtConsent, locale: input.locale, gpcDetected: input.gpcDetected })
        : Promise.resolve({ consentJson: builtConsent, locale: input.locale, gpcDetected: input.gpcDetected }))
      record = await this.consents.update(input.visitorId, updateData)
    } else {
      record = await this.consents.create(baseInput)
    }

    await this.audit.log({
      tenantId: this.tenantId,
      action: existing ? 'consent.updated' : 'consent.created',
      resourceType: 'consent',
      resourceId: record.id,
      ...(existing != null ? { oldData: existing } : {}),
      newData: record,
    })

    if (existing) {
      this.eventBus?.emit('consent.updated', { previous: existing, current: record })
      await this.pluginEngine?.runAfterConsentUpdate(record)
    } else {
      this.eventBus?.emit('consent.created', record)
      await this.pluginEngine?.runAfterConsentSave(record)
    }

    return record
  }

  async update(visitorId: string, input: UpdateConsentInput): Promise<ConsentDbRecord> {
    const existing = await this.consents.get(visitorId)
    if (!existing) throw new Error(`Consent for visitor ${visitorId} not found`)

    const profile = await this.profiles.get(existing.profileId)
    if (!profile) throw new Error(`Profile ${existing.profileId} not found`)

    const regulation = profile.profileJson.regulation
    const profileCookies2 = profile.profileJson.cookies ?? []
    const effectiveGpc = input.gpcDetected ?? existing.gpcDetected
    let effectiveConsent = input.consentJson
    if (effectiveGpc && this.compliance?.gpc !== false && regulation !== 'dpdpa') {
      effectiveConsent = { ...effectiveConsent }
      for (const cookie of profileCookies2) {
        if (regulation === 'cpra') {
          if (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing') {
            effectiveConsent[cookie.id] = 'denied'
          }
        } else if (cookie.listenGpc) {
          effectiveConsent[cookie.id] = 'denied'
        }
      }
    }

    const builtConsent = buildConsentValue(
      profileCookies2,
      effectiveConsent,
      effectiveGpc,
      regulation,
    )

    const record = await this.consents.update(visitorId, { ...input, consentJson: builtConsent })
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'consent.updated',
      resourceType: 'consent',
      resourceId: record.id,
      oldData: existing,
      newData: record,
    })
    return record
  }

  get(visitorId: string): Promise<ConsentDbRecord | null> {
    return this.consents.get(visitorId)
  }

  async verify(visitorId: string): Promise<ConsentVerifyResult> {
    const record = await this.consents.get(visitorId)
    if (!record) return { valid: false, reasons: ['profile_version_mismatch'] }

    const profile = await this.profiles.get(record.profileId)
    if (!profile) return { valid: false, reasons: ['profile_version_mismatch'] }

    return verifyConsent(record, profile)
  }

  async erase(visitorId: string): Promise<void> {
    const existing = await this.consents.get(visitorId)
    await this.consents.delete(visitorId)
    await this.visitors.delete(visitorId)
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'consent.erased',
      resourceType: 'consent',
      resourceId: visitorId,
      ...(existing != null ? { oldData: existing } : {}),
    })
    this.eventBus?.emit('consent.erased', { visitorId })
  }
}
