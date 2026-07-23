import type {
  ConsentDbRecord, ConsentVerifyResult, CreateConsentInput, UpdateConsentInput,
  ComplianceConfig, TcfConfig, CategoryMap, CookieMap, ProfileConfig, StorageAdapter,
} from '@consenti/types'
import { buildConsentValue, verifyConsent, validateConsentInput, buildTcfPayload, buildConsentSignaturePayload } from '../core/consent-engine'
import { buildCookieCategoryIndex, encodeTcString } from '@consenti/utils'
import { getGvl } from '../tcf/gvl-cache'
import { signHmac } from '../utils/crypto'
import type { ConsentRepo } from '../repositories/consent.repo'
import type { VisitorRepo } from '../repositories/visitor.repo'
import type { ProfileRepo } from '../repositories/profile.repo'
import type { AuditRepo } from '../repositories/audit.repo'
import type { PluginEngine } from '../core/plugin-engine'
import type { EventEmitter } from 'node:events'
import { applyCookiesOverride } from './profile.service'

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
    private storage?: StorageAdapter,
    private consentSigningKey?: string,
  ) {}

  private sign(payload: { tenantId: string; visitorId: string; profileId: string; locale: string; consentJson: ConsentDbRecord['consentJson'] }): string | undefined {
    if (!this.consentSigningKey) return undefined
    return signHmac(buildConsentSignaturePayload(payload), this.consentSigningKey)
  }

  /**
   * Profiles created via the dashboard wizard reference a consent template (`consentTemplateId`)
   * rather than embedding `cookies`/`preferenceModal.categories` directly on `profileJson` — those
   * fields are only populated for the embedded/seeded default profiles (see
   * `ProfileService.seedDefaultProfile`). Cookie/category membership and `legalBasis` are
   * locale-independent, so the raw consent template's data is sufficient here — no need to
   * resolve per-locale text via `ProfileService.getResolved()`. Mirrors the same fallback
   * `ProfileService.getResolved()` and the admin route validators already apply.
   */
  private async resolveTemplateData(pj: ProfileConfig): Promise<{ cookies: CookieMap; categories: CategoryMap }> {
    const needsCookies = !pj.cookies
    const needsCategories = !pj.preferenceModal?.categories
    const ct = (needsCookies || needsCategories) && pj.consentTemplateId && this.storage
      ? await this.storage.getConsentTemplate(pj.consentTemplateId)
      : null
    return {
      cookies: pj.cookies ?? (ct ? applyCookiesOverride(ct.cookies, pj.cookiesOverride) : {}),
      categories: pj.preferenceModal?.categories ?? ct?.categories ?? {},
    }
  }

  async create(input: Omit<CreateConsentInput, 'tenantId'>): Promise<ConsentDbRecord> {
    const profile = await this.profiles.get(input.profileId)
    if (!profile) throw new Error(`Profile ${input.profileId} not found`)

    const regulation = profile.profileJson.regulation
    const { cookies: profileCookies, categories } = await this.resolveTemplateData(profile.profileJson)
    const categoryIndex = buildCookieCategoryIndex(categories)
    // GPC server-side enforcement — skip for DPDPA (no GPC opt-out signal recognised)
    let effectiveConsent = input.consentJson
    if (input.gpcDetected && this.compliance?.gpc !== false && regulation !== 'dpdpa') {
      effectiveConsent = { ...effectiveConsent }
      for (const [id, cookie] of Object.entries(profileCookies)) {
        if (regulation === 'cpra') {
          // CPRA: deny sale + sharing on GPC; sensitive stays as submitted
          if (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing') {
            effectiveConsent[id] = 'denied'
          }
        } else if (cookie.listenGpc) {
          effectiveConsent[id] = 'denied'
        }
      }
    }

    const validation = validateConsentInput({ ...input, consentJson: effectiveConsent }, profileCookies, categoryIndex)
    if (!validation.valid) throw new Error(validation.errors.join('; '))

    const builtConsent = buildConsentValue(
      profileCookies,
      categoryIndex,
      effectiveConsent,
      input.gpcDetected,
      regulation,
    )

    let tcfString: string | undefined
    if (this.tcfConfig?.enabled && Object.values(profileCookies).some(c => c.tcfVendorId)) {
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

    const signature = this.sign({
      tenantId: this.tenantId, visitorId: input.visitorId, profileId: input.profileId,
      locale: input.locale, consentJson: builtConsent,
    })

    let baseInput: CreateConsentInput = {
      ...input,
      tenantId: this.tenantId,
      consentJson: builtConsent,
      ...(tcfString ? { tcfString } : {}),
      ...(signature ? { signature } : {}),
    }
    if (this.pluginEngine) baseInput = await this.pluginEngine.runBeforeConsentSave(baseInput)

    const existing = await this.consents.get(input.visitorId)
    let record: ConsentDbRecord

    if (existing) {
      const updateData = await (this.pluginEngine
        ? this.pluginEngine.runBeforeConsentUpdate({ consentJson: builtConsent, locale: input.locale, gpcDetected: input.gpcDetected, ...(signature ? { signature } : {}) })
        : Promise.resolve({ consentJson: builtConsent, locale: input.locale, gpcDetected: input.gpcDetected, ...(signature ? { signature } : {}) }))
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
    const { cookies: profileCookies2, categories: categories2 } = await this.resolveTemplateData(profile.profileJson)
    const categoryIndex2 = buildCookieCategoryIndex(categories2)
    const effectiveGpc = input.gpcDetected ?? existing.gpcDetected
    let effectiveConsent = input.consentJson
    if (effectiveGpc && this.compliance?.gpc !== false && regulation !== 'dpdpa') {
      effectiveConsent = { ...effectiveConsent }
      for (const [id, cookie] of Object.entries(profileCookies2)) {
        if (regulation === 'cpra') {
          if (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing') {
            effectiveConsent[id] = 'denied'
          }
        } else if (cookie.listenGpc) {
          effectiveConsent[id] = 'denied'
        }
      }
    }

    const builtConsent = buildConsentValue(
      profileCookies2,
      categoryIndex2,
      effectiveConsent,
      effectiveGpc,
      regulation,
    )

    const signature = this.sign({
      tenantId: this.tenantId, visitorId, profileId: existing.profileId,
      locale: input.locale ?? existing.locale, consentJson: builtConsent,
    })

    const updatePayload: UpdateConsentInput = {
      consentJson: builtConsent,
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.gpcDetected !== undefined ? { gpcDetected: input.gpcDetected } : {}),
      ...(signature ? { signature } : {}),
    }
    const updateData = await (this.pluginEngine
      ? this.pluginEngine.runBeforeConsentUpdate(updatePayload)
      : Promise.resolve(updatePayload))
    const record = await this.consents.update(visitorId, updateData)
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'consent.updated',
      resourceType: 'consent',
      resourceId: record.id,
      oldData: existing,
      newData: record,
    })
    this.eventBus?.emit('consent.updated', { previous: existing, current: record })
    await this.pluginEngine?.runAfterConsentUpdate(record)
    return record
  }

  get(visitorId: string): Promise<ConsentDbRecord | null> {
    return this.consents.get(visitorId)
  }

  async verify(visitorId: string): Promise<ConsentVerifyResult> {
    const record = await this.consents.get(visitorId)
    if (!record) return { valid: false, reasons: ['profile_changed'] }

    const recordProfile = await this.profiles.get(record.profileId)
    if (!recordProfile) return { valid: false, reasons: ['profile_changed'] }

    const complianceGroup = recordProfile.profileJson.complianceGroup
    const activeProfile = complianceGroup ? await this.profiles.findActiveByComplianceGroup(this.tenantId, complianceGroup) : null

    return verifyConsent(record, recordProfile, activeProfile, this.consentSigningKey)
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
