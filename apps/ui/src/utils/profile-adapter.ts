import type { ResolvedProfile, CookieMap, MainBanner, PreferenceModal, CategoryMap, Button } from '../types'
import type { EmbeddedProfile, EmbeddedCookie, EmbeddedBanner, EmbeddedModal, EmbeddedCategory, EmbeddedButton, EmbeddedTranslations } from '@consenti/utils/profiles'

// ─── Primitive mappers ────────────────────────────────────────────────────────

function mapCookie(c: EmbeddedCookie): CookieMap[string] {
  return {
    purpose: c.purpose,
    ...(c.listenGpc ? { listenGpc: true } : {}),
    ...(c.preGrant ? { preGrant: true } : {}),
    ...(c.cpraCategory ? { cpraCategory: c.cpraCategory } : {}),
  }
}

function mapCookies(cookies: Record<string, EmbeddedCookie>): CookieMap {
  const result: CookieMap = {}
  for (const [id, c] of Object.entries(cookies)) result[id] = mapCookie(c)
  return result
}

function mapButton(b: EmbeddedButton): Button {
  return {
    text: b.text,
    style: b.style,
    action: b.action,
    ...(b.cookies !== undefined ? { cookies: b.cookies } : {}),
  }
}

function mapButtons(buttons: Record<string, EmbeddedButton>): Record<string, Button> {
  const result: Record<string, Button> = {}
  for (const [id, b] of Object.entries(buttons)) result[id] = mapButton(b)
  return result
}

function mapCategory(cat: EmbeddedCategory): CategoryMap[string] {
  return {
    heading: cat.heading,
    htmlText: cat.htmlText,
    legalBasis: cat.legalBasis,
    ...(cat.legitimateInterestDescription !== undefined ? { legitimateInterestDescription: cat.legitimateInterestDescription } : {}),
    cookies: cat.cookies,
  }
}

function mapCategories(categories: Record<string, EmbeddedCategory>): CategoryMap {
  const result: CategoryMap = {}
  for (const [id, cat] of Object.entries(categories)) result[id] = mapCategory(cat)
  return result
}

function mapBanner(b: EmbeddedBanner): MainBanner {
  return {
    position: b.position,
    htmlText: b.htmlText,
    buttons: mapButtons(b.buttons),
    ...(b.heading ? { heading: b.heading } : {}),
    ...(b.showClose !== undefined ? { showClose: b.showClose } : {}),
    ...(b.showLocaleSwitcher !== undefined ? { showLocaleSwitcher: b.showLocaleSwitcher } : {}),
  }
}

function mapModal(m: EmbeddedModal): PreferenceModal {
  return {
    heading: m.heading,
    htmlText: m.htmlText ?? '',
    buttons: mapButtons(m.buttons),
    categories: mapCategories(m.categories),
    ...(m.position ? { position: m.position } : {}),
    ...(m.subheading ? { subheading: m.subheading } : {}),
    ...(m.persistent !== undefined ? { persistent: m.persistent } : {}),
  }
}

// ─── Locale resolution ────────────────────────────────────────────────────────

function pickTranslations(
  translations: Record<string, EmbeddedTranslations>,
  locale: string | undefined,
  defaultLocale: string,
): EmbeddedTranslations {
  if (locale) {
    if (translations[locale]) return translations[locale]!
    const prefix = locale.split('-')[0] ?? ''
    const prefixMatch = Object.keys(translations).find(k => k === prefix || k.startsWith(`${prefix}-`))
    if (prefixMatch) return translations[prefixMatch]!
  }
  return translations[defaultLocale] ?? Object.values(translations)[0]!
}

// ─── Public adapter ───────────────────────────────────────────────────────────

/**
 * Converts an `EmbeddedProfile` (from `@consenti/utils/profiles`) to a
 * `ResolvedProfile` suitable for direct use by the widget renderer.
 */
export function adaptEmbeddedProfile(
  embedded: EmbeddedProfile,
  locale?: string,
): ResolvedProfile {
  const tx = pickTranslations(embedded.translations, locale, embedded.defaultLocale)
  return {
    id: "0",
    defaultLocale: embedded.defaultLocale,
    locales: Object.keys(embedded.translations),
    cookies: mapCookies(embedded.cookies),
    ...(embedded.expiryDays ? { expiryDays: embedded.expiryDays } : {}),
    mainBanner: mapBanner(tx.mainBanner),
    preferenceModal: mapModal(tx.preferenceModal),
    gpcMode: embedded.gpcMode,
    complianceGroup: embedded.complianceGroup,
    ...(tx.gpcBanner ? { gpcBanner: mapBanner(tx.gpcBanner) } : {}),
  }
}
