import type { ServerUITemplate, ServerConsentTemplate } from '@consenti/types'
import { DEFAULT_PROFILES, resolveLocaleTranslation } from '@consenti/utils/profiles'
import type { EmbeddedButton, EmbeddedTranslations } from '@consenti/utils/profiles'
import type { LocaleContent, CategoryContent } from './templates'

// `packages/utils/src/profiles` is the single source of truth for default compliance-profile
// content (seeded profiles, "Load Defaults" here, and the widget's own embedded-profile
// fallback) — no compliance-group copy is authored in this file. A custom (non-preset)
// compliance group falls back to the `general-privacy-consent` group's real content, same as
// any other unmatched-but-valid selection, rather than a separate generic-content block.

type Bucket = 'acceptAll' | 'denyAll' | 'customSubset' | 'finalSubmit' | 'manage' | 'close' | 'link' | 'other'

function classify(action: string, cookies: string[] | '*' | '!' | undefined): Bucket {
  if (action === 'manage') return 'manage'
  if (action === 'close') return 'close'
  if (action === 'link') return 'link'
  if (action === 'submit' || action === 'custom') {
    if (cookies === '*') return 'acceptAll'
    if (cookies === '!') return 'denyAll'
    if (Array.isArray(cookies)) return 'customSubset'
    return 'finalSubmit'
  }
  return 'other'
}

const FALLBACK_BUTTON_TEXT: Record<Bucket, string> = {
  acceptAll: 'Accept All',
  denyAll: 'Reject All',
  customSubset: 'Select',
  finalSubmit: 'Save Preferences',
  manage: 'Manage Preferences',
  close: 'Close',
  link: 'Learn More',
  other: 'Continue',
}

/** Resolves each of `buttons`' label text against the matching embedded button, by (action,
 * cookies) bucket rather than by id — UI template button ids are freeform, author-assigned.
 * Returns labels keyed by `buttons`' own ids. */
function resolveButtonLabels(
  buttons: Record<string, { action: string; cookies?: string[] | '*' | '!' }>,
  embeddedButtons: Record<string, EmbeddedButton>,
): Record<string, string> {
  const byBucket = new Map<Bucket, string>()
  for (const b of Object.values(embeddedButtons)) {
    const bucket = classify(b.action, b.cookies)
    if (!byBucket.has(bucket)) byBucket.set(bucket, b.text)
  }
  const result: Record<string, string> = {}
  for (const [id, b] of Object.entries(buttons)) {
    const bucket = classify(b.action, b.cookies)
    result[id] = byBucket.get(bucket) ?? FALLBACK_BUTTON_TEXT[bucket]
  }
  return result
}

const FALLBACK_CATEGORY_TEXT = (id: string): { heading: string; htmlText: string } => ({
  heading: id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  htmlText: 'Used to enable specific functionality on this website.',
})

/**
 * Builds "Load Defaults" content for one profile, sourced entirely from `@consenti/utils/profiles`
 * for the given compliance group and locale (falling back to `general-privacy-consent` for a
 * custom group, and to the group's English text for a locale with no overlay). Cookie categories
 * from the author's own consent template are matched to the embedded profile's categories by the
 * cookie purpose already recorded on each parameter — not by category id, which is freeform.
 */
export function buildDefaultContent(
  complianceGroup: string,
  uiTemplate: ServerUITemplate,
  consentTemplate: ServerConsentTemplate | null | undefined,
  locale: string,
): LocaleContent {
  const group = DEFAULT_PROFILES[complianceGroup as keyof typeof DEFAULT_PROFILES] ? complianceGroup : 'general-privacy-consent'
  const translation: EmbeddedTranslations | undefined =
    resolveLocaleTranslation(group, locale) ?? DEFAULT_PROFILES[group as keyof typeof DEFAULT_PROFILES]?.translations['en']
  const embeddedCategories = translation?.preferenceModal.categories ?? {}

  // Cookie purpose -> embedded category key. 'preferences' has no standalone embedded category
  // (folded into 'functional' in every group), so it maps there instead of going unmatched.
  const purposeToKey: Record<string, string> = { necessary: 'necessary', functional: 'functional', preferences: 'functional', analytics: 'analytics', marketing: 'marketing' }

  const categories: CategoryContent[] = Object.entries(consentTemplate?.categories ?? {}).map(([id, cat]) => {
    const purposes = (cat.cookies ?? [])
      .map(cookieId => consentTemplate?.cookies?.[cookieId]?.purpose)
      .filter((p): p is string => !!p)
    const matchedKey = purposes.map(p => purposeToKey[p]).find(k => k && embeddedCategories[k])
    const embedded = matchedKey ? embeddedCategories[matchedKey] : undefined
    return embedded
      ? { id, heading: embedded.heading, htmlText: embedded.htmlText }
      : { id, ...FALLBACK_CATEGORY_TEXT(id) }
  })

  const mainBanner = translation?.mainBanner
  const gpcBanner = translation?.gpcBanner
  const preferenceModal = translation?.preferenceModal

  return {
    mainBanner: {
      heading: mainBanner?.heading ?? '',
      htmlText: mainBanner?.htmlText ?? '',
      buttonLabels: resolveButtonLabels(uiTemplate.mainBanner.buttons, mainBanner?.buttons ?? {}),
    },
    gpcBanner: {
      heading: gpcBanner?.heading ?? mainBanner?.heading ?? '',
      htmlText: gpcBanner?.htmlText ?? mainBanner?.htmlText ?? '',
      buttonLabels: resolveButtonLabels(uiTemplate.gpcBanner.buttons, gpcBanner?.buttons ?? mainBanner?.buttons ?? {}),
    },
    preferenceModal: {
      heading: preferenceModal?.heading ?? '',
      subheading: preferenceModal?.subheading ?? '',
      htmlText: preferenceModal?.htmlText ?? '',
      buttonLabels: resolveButtonLabels(uiTemplate.preferenceModal.buttons, preferenceModal?.buttons ?? {}),
      categories,
    },
  }
}
