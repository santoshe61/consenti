import type { Profile, LocaleTranslations, ProfileTranslations } from '@consenti/types'

function mergeTranslations(base: LocaleTranslations, override: Partial<LocaleTranslations>): LocaleTranslations {
  return {
    mainBanner: { ...base.mainBanner, ...override.mainBanner },
    preferenceModal: {
      ...base.preferenceModal,
      ...override.preferenceModal,
      buttons: override.preferenceModal?.buttons ?? base.preferenceModal.buttons,
      categories: override.preferenceModal?.categories ?? base.preferenceModal.categories,
    },
    ...(override.gpcBanner != null || base.gpcBanner != null
      ? { gpcBanner: { ...(base.gpcBanner ?? base.mainBanner), ...override.gpcBanner } }
      : {}),
  }
}

export function resolveLocale(
  translations: ProfileTranslations,
  requested: string,
  defaultLocale: string,
): LocaleTranslations {
  const base = translations[defaultLocale]
  if (!base) throw new Error(`Default locale '${defaultLocale}' not found in translations`)

  if (requested === defaultLocale) return base

  const exact = translations[requested]
  if (exact) return mergeTranslations(base, exact)

  const lang = requested.split('-')[0] ?? ''
  const langMatch = lang ? translations[lang] : undefined
  if (langMatch) return mergeTranslations(base, langMatch)

  return base
}

export function resolveProfile(
  profile: Profile,
  locale: string,
): { profile: Profile; resolved: LocaleTranslations } {
  const translations = profile.profileJson.translations ?? {}
  const resolved = resolveLocale(translations, locale, profile.defaultLocale)
  return { profile, resolved }
}

export function bumpVersion(profile: Profile): number {
  return profile.version + 1
}
