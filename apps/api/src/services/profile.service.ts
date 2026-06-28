import type { Profile, CreateProfileInput, UpdateProfileInput, PublicProfileResponse, StorageAdapter, LocaleTextContent, ServerUITemplate, LocaleTranslations, ButtonStyle, ButtonAction } from '@consenti/types'
import { resolveLocale } from '../core/profile-engine'
import type { ProfileRepo } from '../repositories/profile.repo'
import type { AuditRepo } from '../repositories/audit.repo'

function buildTranslations(template: ServerUITemplate, localeContents: Record<string, LocaleTextContent>): Record<string, LocaleTranslations> {
  const result: Record<string, LocaleTranslations> = {}
  for (const [locale, content] of Object.entries(localeContents)) {
    result[locale] = {
      mainBanner: {
        position: template.mainBanner.position as LocaleTranslations['mainBanner']['position'],
        overlayOpacity: template.mainBanner.overlayOpacity,
        showClose: template.mainBanner.showClose,
        headingTag: template.mainBanner.headingTag,
        heading: content.mainBanner.heading,
        htmlText: content.mainBanner.htmlText,
        buttons: template.mainBanner.buttons.map((btn, i) => ({
          text: content.mainBanner.buttonLabels[i] ?? btn.text,
          style: btn.type as ButtonStyle,
          action: btn.action as ButtonAction,
          ...(btn.cookies != null ? { cookies: btn.cookies as '*' | '!' | string[] } : {}),
        })),
      },
      gpcBanner: {
        position: template.gpcBanner.position as LocaleTranslations['mainBanner']['position'],
        overlayOpacity: template.gpcBanner.overlayOpacity,
        showClose: template.gpcBanner.showClose,
        headingTag: template.gpcBanner.headingTag,
        heading: content.gpcBanner.heading,
        htmlText: content.gpcBanner.htmlText,
        buttons: template.gpcBanner.buttons.map((btn, i) => ({
          text: content.gpcBanner.buttonLabels[i] ?? btn.text,
          style: btn.type as ButtonStyle,
          action: btn.action as ButtonAction,
          ...(btn.cookies != null ? { cookies: btn.cookies as '*' | '!' | string[] } : {}),
        })),
      },
      preferenceModal: {
        position: template.preferenceModal.position as 'left' | 'right' | 'center',
        overlayOpacity: template.preferenceModal.overlayOpacity,
        showClose: template.preferenceModal.showClose,
        persistent: template.preferenceModal.persistent,
        headingTag: template.preferenceModal.headingTag,
        heading: content.preferenceModal.heading ?? '',
        ...(content.preferenceModal.subheading ? { subheading: content.preferenceModal.subheading } : {}),
        ...(content.preferenceModal.htmlText ? { htmlText: content.preferenceModal.htmlText } : {}),
        buttons: template.preferenceModal.buttons.map((btn, i) => ({
          text: content.preferenceModal.buttonLabels[i] ?? btn.text,
          style: btn.type as ButtonStyle,
          action: btn.action as ButtonAction,
          ...(btn.cookies != null ? { cookies: btn.cookies as '*' | '!' | string[] } : {}),
        })),
        categories: template.preferenceModal.categories.map(cat => {
          const c = content.preferenceModal.categories.find(c => c.id === cat.id)
          return {
            id: cat.id,
            heading: c?.heading ?? cat.id,
            headingTag: cat.headingTag,
            htmlText: c?.htmlText ?? '',
            mandatory: cat.mandatory,
            type: cat.type,
            ...(cat.liEnabled ? { legitimateInterest: { enabled: true } } : {}),
            cookies: cat.cookies,
          }
        }),
      },
    }
  }
  return result
}

export class ProfileService {
  constructor(
    private profiles: ProfileRepo,
    private audit: AuditRepo,
    private tenantId: string = 'default',
    private storage?: StorageAdapter,
  ) {}

  async create(input: Omit<CreateProfileInput, 'tenantId'>): Promise<Profile> {
    const profile = await this.profiles.create({ ...input, tenantId: this.tenantId })
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.created',
      resourceType: 'profile',
      resourceId: profile.id,
      newData: profile,
    })
    return profile
  }

  async update(id: string, input: UpdateProfileInput): Promise<Profile> {
    const old = await this.profiles.get(id)
    const profile = await this.profiles.update(id, input)
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.updated',
      resourceType: 'profile',
      resourceId: id,
      ...(old != null ? { oldData: old } : {}),
      newData: profile,
    })
    return profile
  }

  async delete(id: string): Promise<void> {
    const old = await this.profiles.get(id)
    await this.profiles.delete(id)
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.deleted',
      resourceType: 'profile',
      resourceId: id,
      ...(old != null ? { oldData: old } : {}),
    })
  }

  async get(id: string, locale?: string): Promise<Profile | null> {
    const profile = await this.profiles.get(id)
    if (!profile) return null
    if (!locale) return profile
    const resolved = resolveLocale(profile.profileJson.translations ?? {}, locale, profile.defaultLocale)
    return {
      ...profile,
      profileJson: {
        ...profile.profileJson,
        translations: { [locale]: resolved },
      },
    }
  }

  async getResolved(id: string, locale?: string): Promise<PublicProfileResponse | null> {
    const profile = await this.profiles.get(id)
    if (!profile) return null
    const pj = profile.profileJson

    let cookies = pj.cookies ?? []
    let translations = pj.translations ?? {}

    if (pj.cookieTemplateId && this.storage) {
      const ct = await this.storage.getCookieTemplate(pj.cookieTemplateId)
      if (ct) cookies = ct.cookies
    }

    if (pj.uiTemplateId && pj.localeContents && this.storage) {
      const ut = await this.storage.getUITemplate(pj.uiTemplateId)
      if (ut) translations = buildTranslations(ut, pj.localeContents)
    }

    const currentLocale = locale ?? profile.defaultLocale
    const localeKeys = pj.localeContents ? Object.keys(pj.localeContents) : Object.keys(translations)
    const resolved = resolveLocale(translations, currentLocale, profile.defaultLocale)
    return {
      id: profile.id,
      version: profile.version,
      defaultLocale: profile.defaultLocale,
      currentLocale,
      locales: localeKeys,
      cookies,
      mainBanner: resolved.mainBanner,
      preferenceModal: resolved.preferenceModal,
      ...(resolved.gpcBanner != null ? { gpcBanner: resolved.gpcBanner } : {}),
    }
  }

  list(): Promise<Profile[]> {
    return this.profiles.list(this.tenantId)
  }
}
