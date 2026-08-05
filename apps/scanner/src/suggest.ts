import type {
  Cookie,
  CookieMap,
  Category,
  CategoryMap,
  ButtonMap,
  TemplateBannerDef,
  TemplateGpcBannerDef,
  TemplateModalDef,
  TemplateButtonMap,
  ProfileConfig,
  RegisterableProfileConfig,
  ComplianceGroupId,
  CookiePurpose,
} from '@consenti/types'
import { COOKIE_PURPOSE_DEFAULTS, DEFAULT_PROFILES } from '@consenti/utils'
import type { EmbeddedButton, EmbeddedProfile, EmbeddedTranslations } from '@consenti/utils'
import type { ScanReport, TrackerFinding } from './types.js'

const CLASSIFIABLE_PURPOSES = new Set<CookiePurpose>([
  'necessary',
  'functional',
  'preferences',
  'analytics',
  'marketing',
])

function isCookiePurpose(category: TrackerFinding['category']): category is CookiePurpose {
  return category !== null && CLASSIFIABLE_PURPOSES.has(category as CookiePurpose)
}

/** Site-wide, deduplicated view of every finding across all scanned pages, merging `seenInStates`
 * for repeats of the same id and preferring whichever occurrence was actually classified (a
 * tracker can classify on one page and read as unclassified on another if e.g. a request never
 * fired there). This is a local dedup for building suggestions — `report.summary.manualReview`
 * remains the canonical deduplicated manual-review list for display purposes. */
function dedupeFindings(report: ScanReport): TrackerFinding[] {
  const byId = new Map<string, TrackerFinding>()
  for (const page of report.pages) {
    for (const finding of page.findings) {
      const existing = byId.get(finding.id)
      if (!existing) {
        byId.set(finding.id, { ...finding, seenInStates: [...finding.seenInStates] })
        continue
      }
      for (const state of finding.seenInStates) {
        if (!existing.seenInStates.includes(state)) existing.seenInStates.push(state)
      }
      if (existing.category === null && finding.category !== null) {
        existing.category = finding.category
        existing.vendor = finding.vendor
        existing.confidence = finding.confidence
      }
    }
  }
  return [...byId.values()]
}

export interface ComplianceSuggestion {
  group: ComplianceGroupId
  rationale: string
}

/** The scanner has no signal about who the site's visitors actually are (no jurisdiction, no
 * audience data), so this can only ever be a starting point, not a legal determination — worded
 * accordingly. Opt-in is the safe universal default whenever anything non-essential was found:
 * it satisfies opt-in jurisdictions outright and is a strict superset of what opt-out
 * jurisdictions require, so it's never *wrong*, only possibly stricter than necessary. */
function suggestComplianceGroup(report: ScanReport, findings: TrackerFinding[]): ComplianceSuggestion {
  const nonEssential = findings.filter(f => isCookiePurpose(f.category) && f.category !== 'necessary')

  if (nonEssential.length === 0) {
    return {
      group: 'notice-only',
      rationale:
        'No functional, preference, analytics, or marketing trackers were found — only strictly-necessary trackers, or none at all. A privacy notice may be sufficient, but confirm this against the site\'s actual audience and jurisdiction before relying on it.',
    }
  }

  const beforeConsentNote =
    report.summary.firingBeforeConsent > 0
      ? ` ${report.summary.firingBeforeConsent} tracker(s) fired before any consent was given — the headline compliance gap this scan exists to catch.`
      : ''

  return {
    group: 'opt-in',
    rationale:
      `${nonEssential.length} non-essential tracker(s) were found.${beforeConsentNote} Opt-in ` +
      '(GDPR/ePrivacy-style prior consent) is the safest universal default: it satisfies opt-in ' +
      'jurisdictions outright and is a strict superset of what opt-out jurisdictions require. ' +
      'Narrow this to a jurisdiction-specific group (e.g. opt-out for a US-only audience) once you ' +
      "know who the site's visitors actually are.",
  }
}

/** Every built-in embedded profile carries a translation for its own `defaultLocale` — a bug in
 * `@consenti/utils` if not, never a possible scanner-input state — so this throws rather than
 * silently falling back, the same "fail loud on an internal invariant break" stance the rest of
 * this codebase takes. */
function getBaseTranslations(base: EmbeddedProfile): EmbeddedTranslations {
  const t = base.translations[base.defaultLocale]
  if (!t) {
    throw new Error(
      `Embedded default profile for compliance group "${base.complianceGroup}" has no translation for its own defaultLocale "${base.defaultLocale}"`
    )
  }
  return t
}

/** Maps each cookie purpose to the id of the built-in category that owns it, derived from the
 * embedded default profile's own category→cookie→purpose wiring rather than assumed 1:1 (e.g.
 * every built-in group folds `preferences` into the `functional` category). */
function purposeToCategoryId(base: EmbeddedProfile): Partial<Record<CookiePurpose, string>> {
  const categories = base.translations[base.defaultLocale]?.preferenceModal.categories ?? {}
  const map: Partial<Record<CookiePurpose, string>> = {}
  for (const [catId, cat] of Object.entries(categories)) {
    for (const cookieId of cat.cookies) {
      const purpose = base.cookies[cookieId]?.purpose
      if (purpose && map[purpose] === undefined) map[purpose] = catId
    }
  }
  return map
}

export interface SuggestedConsentTemplate {
  name: string
  cookies: CookieMap
  categories: CategoryMap
}

/** Builds a consent template (cookie/parameter catalog + categories) from the site's actual
 * discovered trackers, using the chosen compliance group's built-in category copy/legal-basis as
 * the shell. Only trackers with a confident purpose classification are placed — anything
 * unclassified (or scanner-only categories like `fingerprinting`, which isn't a valid consent
 * `CookiePurpose`) is returned separately for manual placement, matching this tool's existing
 * "never auto-assigns, never writes to a live profile" stance (see README.md). */
function buildSuggestedConsentTemplate(
  report: ScanReport,
  findings: TrackerFinding[],
  group: ComplianceGroupId
): { template: SuggestedConsentTemplate; needsManualReview: TrackerFinding[] } {
  const base = DEFAULT_PROFILES[group]
  const catByPurpose = purposeToCategoryId(base)
  const baseCategories = base.translations[base.defaultLocale]?.preferenceModal.categories ?? {}

  const categories: CategoryMap = {}
  for (const [catId, cat] of Object.entries(baseCategories)) {
    const category: Category = {
      heading: cat.heading,
      htmlText: cat.htmlText,
      legalBasis: cat.legalBasis,
      cookies: [],
    }
    if (cat.legitimateInterestDescription) category.legitimateInterestDescription = cat.legitimateInterestDescription
    categories[catId] = category
  }

  const cookies: CookieMap = {}
  const needsManualReview: TrackerFinding[] = []

  for (const finding of findings) {
    const catId = isCookiePurpose(finding.category) ? catByPurpose[finding.category] : undefined
    const category = catId ? categories[catId] : undefined
    if (!category) {
      needsManualReview.push(finding)
      continue
    }
    const purpose = finding.category as CookiePurpose
    const defaults = COOKIE_PURPOSE_DEFAULTS[purpose]
    const cookie: Cookie = { purpose, listenGpc: defaults.listenGpc }
    if (defaults.cpraCategory) cookie.cpraCategory = defaults.cpraCategory
    cookies[finding.id] = cookie
    category.cookies.push(finding.id)
  }

  // An empty "Analytics" category is meaningful on a hand-authored template (a placeholder for
  // later) but is just noise on a scan-derived one, where every category is a claim "we found
  // trackers of this kind" — drop the ones nothing landed in.
  for (const [catId, cat] of Object.entries(categories)) {
    if (cat.cookies.length === 0) delete categories[catId]
  }

  return {
    template: { name: `Suggested — ${new URL(report.startUrl).hostname}`, cookies, categories },
    needsManualReview,
  }
}

function toTemplateButtons(buttons: Record<string, EmbeddedButton>): TemplateButtonMap {
  const result: TemplateButtonMap = {}
  for (const [id, btn] of Object.entries(buttons)) {
    result[id] = { type: btn.style, action: btn.action, ...(btn.cookies ? { cookies: btn.cookies } : {}) }
  }
  return result
}

export interface SuggestedUiTemplate {
  name: string
  mainBanner: TemplateBannerDef
  gpcBanner?: TemplateGpcBannerDef
  preferenceModal: TemplateModalDef
}

/** UI templates own layout/behavior only, never visitor-facing text (see `TemplateButtonDef`'s
 * doc comment in `@consenti/types`) — text is authored on the profile instead, in
 * {@link buildSuggestedProfile}. */
function buildSuggestedUiTemplate(report: ScanReport, group: ComplianceGroupId): SuggestedUiTemplate {
  const base = DEFAULT_PROFILES[group]
  const t = getBaseTranslations(base)
  const name = `Suggested — ${new URL(report.startUrl).hostname}`

  const template: SuggestedUiTemplate = {
    name,
    mainBanner: {
      position: t.mainBanner.position,
      buttons: toTemplateButtons(t.mainBanner.buttons),
      ...(t.mainBanner.showClose !== undefined ? { showClose: t.mainBanner.showClose } : {}),
      ...(t.mainBanner.showLocaleSwitcher !== undefined
        ? { showLocaleSwitcher: t.mainBanner.showLocaleSwitcher }
        : {}),
    },
    preferenceModal: {
      buttons: toTemplateButtons(t.preferenceModal.buttons),
      ...(t.preferenceModal.position !== undefined ? { position: t.preferenceModal.position } : {}),
      ...(t.preferenceModal.persistent !== undefined ? { persistent: t.preferenceModal.persistent } : {}),
    },
  }
  if (t.gpcBanner) {
    template.gpcBanner = {
      position: t.gpcBanner.position,
      buttons: toTemplateButtons(t.gpcBanner.buttons),
      ...(t.gpcBanner.showClose !== undefined ? { showClose: t.gpcBanner.showClose } : {}),
      ...(t.gpcBanner.showLocaleSwitcher !== undefined
        ? { showLocaleSwitcher: t.gpcBanner.showLocaleSwitcher }
        : {}),
    }
  }
  return template
}

/** The profile owns the text (heading/htmlText/category copy) that pairs with the UI template's
 * layout, plus the `consentTemplateId`/`uiTemplateId` join keys — placeholder values here, filled
 * in once the suggested consent/UI templates above have actually been imported into the
 * dashboard. */
function buildSuggestedProfile(
  report: ScanReport,
  group: ComplianceGroupId,
  categories: CategoryMap
): Omit<ProfileConfig, 'id'> {
  const base = DEFAULT_PROFILES[group]
  const t = getBaseTranslations(base)

  const profile: Omit<ProfileConfig, 'id'> = {
    defaultLocale: base.defaultLocale,
    ...(base.expiryDays !== undefined ? { expiryDays: base.expiryDays } : {}),
    complianceGroup: group,
    consentTemplateId: '<paste-imported-consent-template-id>',
    uiTemplateId: '<paste-imported-ui-template-id>',
    mainBanner: {
      position: t.mainBanner.position,
      htmlText: t.mainBanner.htmlText,
      buttons: t.mainBanner.buttons as ButtonMap,
      ...(t.mainBanner.heading !== undefined ? { heading: t.mainBanner.heading } : {}),
      ...(t.mainBanner.showClose !== undefined ? { showClose: t.mainBanner.showClose } : {}),
      ...(t.mainBanner.showLocaleSwitcher !== undefined
        ? { showLocaleSwitcher: t.mainBanner.showLocaleSwitcher }
        : {}),
    },
    preferenceModal: {
      heading: t.preferenceModal.heading,
      htmlText: t.preferenceModal.htmlText ?? '',
      buttons: t.preferenceModal.buttons as ButtonMap,
      categories,
      ...(t.preferenceModal.position !== undefined ? { position: t.preferenceModal.position } : {}),
      ...(t.preferenceModal.persistent !== undefined ? { persistent: t.preferenceModal.persistent } : {}),
      ...(t.preferenceModal.subheading ? { subheading: t.preferenceModal.subheading } : {}),
    },
  }
  if (t.gpcBanner) {
    profile.gpcBanner = {
      position: t.gpcBanner.position,
      htmlText: t.gpcBanner.htmlText,
      buttons: t.gpcBanner.buttons as ButtonMap,
      ...(t.gpcBanner.heading !== undefined ? { heading: t.gpcBanner.heading } : {}),
      ...(t.gpcBanner.showClose !== undefined ? { showClose: t.gpcBanner.showClose } : {}),
      ...(t.gpcBanner.showLocaleSwitcher !== undefined
        ? { showLocaleSwitcher: t.gpcBanner.showLocaleSwitcher }
        : {}),
    }
  }
  return profile
}

/** The frontend-only ("no backend") equivalent of the consent-template/UI-template/profile
 * trio above: one self-contained `ConsentiProfile` config with cookies, categories, and UI
 * content all inline — no `consentTemplateId`/`uiTemplateId` join, because there's no dashboard
 * behind it. See `apps/ui`'s "Local profile (no backend)" docs for the runtime shape this
 * mirrors. */
function buildFrontendOnlyProfile(
  report: ScanReport,
  group: ComplianceGroupId,
  cookies: CookieMap,
  categories: CategoryMap
): RegisterableProfileConfig {
  const { consentTemplateId: _consentTemplateId, uiTemplateId: _uiTemplateId, ...rest } = buildSuggestedProfile(
    report,
    group,
    categories
  )
  return {
    id: `scan-suggested-${new URL(report.startUrl).hostname}`,
    cookies,
    ...rest,
  }
}

export interface SuggestedSetup {
  complianceGroup: ComplianceGroupId
  complianceRationale: string
  consentTemplate: SuggestedConsentTemplate
  uiTemplate: SuggestedUiTemplate
  profile: Omit<ProfileConfig, 'id'>
  frontendOnlyProfile: RegisterableProfileConfig
  needsManualReview: TrackerFinding[]
}

/** Builds a suggested consent template, UI template, and profile from a scan report — a starting
 * point for the dashboard, never applied automatically (this tool never writes to a live profile
 * itself; see README.md). Every tracker that couldn't be confidently classified is surfaced in
 * `needsManualReview` instead of being guessed into a category. */
export function buildSuggestedSetup(report: ScanReport): SuggestedSetup {
  const findings = dedupeFindings(report)
  const { group, rationale } = suggestComplianceGroup(report, findings)
  const { template: consentTemplate, needsManualReview } = buildSuggestedConsentTemplate(report, findings, group)
  const uiTemplate = buildSuggestedUiTemplate(report, group)
  const profile = buildSuggestedProfile(report, group, consentTemplate.categories)
  const frontendOnlyProfile = buildFrontendOnlyProfile(
    report,
    group,
    consentTemplate.cookies,
    consentTemplate.categories
  )

  return {
    complianceGroup: group,
    complianceRationale: rationale,
    consentTemplate,
    uiTemplate,
    profile,
    frontendOnlyProfile,
    needsManualReview,
  }
}
