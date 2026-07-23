/**
 * Single source of truth for all compliance groups, regulations, and country mappings.
 *
 * This is DATA, not types. The `Compliance` and `ComplianceGroupId` literal types
 * derived from the ID arrays below live in @consenti/types (packages/types/src/compliance.ts),
 * via a type-only import — that keeps @consenti/types free of runtime code.
 *
 * ─── HOW TO UPDATE ────────────────────────────────────────────────────────────
 *
 * ADD A NEW REGULATION:
 *   1. Add regulation ID string to `COMPLIANCE_REGULATION_IDS` below
 *      (the `Compliance` type in @consenti/types auto-updates from it).
 *   2. Add it to the appropriate group's `compliances` array below.
 *   3. Add / update the country entry in `EMBEDDED_COMPLIANCE_MAP` below.
 *   That is all — no other files need touching.
 *
 * ADD A NEW COMPLIANCE GROUP:
 *   1. Add the kebab-case ID to `COMPLIANCE_GROUP_IDS` below.
 *   2. Add a full group entry to `COMPLIANCE_GROUPS` below (label, compliances, flags).
 *   3. Add a validation rule set to `COMPLIANCE_VALIDATION_RULES` below.
 *   4. Map affected countries in `EMBEDDED_COMPLIANCE_MAP` to the new group.
 *
 * ADD OR UPDATE A COUNTRY:
 *   Edit the entry in `EMBEDDED_COMPLIANCE_MAP.countries` below. That is the ONLY
 *   place that needs changing for country-level jurisdiction updates.
 */

// ─── Regulation IDs ───────────────────────────────────────────────────────────

export const COMPLIANCE_REGULATION_IDS = [
  // European Union
  'gdpr', 'eprivacy',
  // United Kingdom
  'uk-gdpr', 'pecr',
  // Switzerland
  'revfadp',
  // Turkey
  'kvkk',
  // North America — Canada
  'pipeda', 'law25',
  // North America — US (California)
  'ccpa', 'cpra',
  // North America — US state laws
  'vcdpa', 'cpa-co', 'ctdpa', 'ucpa', 'icdpa-ia', 'icdpa-in', 'tipa',
  'mcdpa-mt', 'mcdpa-mn', 'ocpa', 'tdpsa', 'dpdpa-de', 'njdpa', 'nhpa',
  'ndpa-ne', 'modpa', 'kcdpa', 'ridtpa',
  // Latin America
  'lgpd', 'lfpdppp', 'lpdp-ar', 'lpdp-pe', 'law1581-co', 'law18331-uy',
  'law19628-cl', 'lopdp-ec', 'lpdp-cr', 'data-protection-pa', 'data-protection-do',
  // Asia — India
  'dpdpa',
  // Asia — China
  'pipl', 'dsl-cn', 'csl-cn',
  // Asia — Pacific
  'appi', 'pipa-kr', 'pdpa-sg', 'pdpa-th', 'pdpa-my', 'dpa-ph', 'pdp-id',
  'pdpd-vn', 'privacy-au', 'privacy-nz', 'pdpl-hk', 'pdpa-mo', 'pdpl-tw',
  'privacy-bn', 'privacy-lk', 'privacy-np',
  // Middle East
  'pdpl-sa', 'uae-pdpl', 'difc-dpl', 'adgm-dpr', 'qpdl-qa', 'pdpl-bh',
  'pdpl-om', 'privacy-kw', 'privacy-il',
  // Africa
  'popia', 'ndpa-ng', 'dpa-ke', 'dpa-gh', 'dpa-ug', 'dpa-rw', 'dpa-mu',
  'dpa-bw', 'dpa-zm', 'dpa-zw', 'dpa-eg', 'dpa-ma', 'dpa-tn', 'dpa-dz',
  // Oceania
  'privacy-fj', 'privacy-pg',
] as const

// ─── Compliance Group IDs ─────────────────────────────────────────────────────

export const COMPLIANCE_GROUP_IDS = [
  'opt-in',
  'opt-out',
  'opt-out-strict',
  'opt-in-dpdpa',
  'opt-in-china',
  'opt-in-brazil',
  'general-privacy-consent',
  'notice-only',
] as const

// Local alias for the shape checks below. The public `ComplianceGroupId` type
// (derived from the same array) is re-exported from @consenti/types.
type ComplianceGroupId = typeof COMPLIANCE_GROUP_IDS[number]

// Local alias for the shape checks below. The public `Compliance` type
// (derived from the same array) is re-exported from @consenti/types.
type Compliance = typeof COMPLIANCE_REGULATION_IDS[number]

// ─── Compliance Groups ────────────────────────────────────────────────────────

export const COMPLIANCE_GROUPS = {
  'opt-out-strict': {
    label: 'Opt-out Strict (CPRA / California)',
    description: 'California CPRA: opt-out with sale/sharing/sensitive categories required. GPC must be honored. Stricter than general US state laws.',
    compliances: ['cpra'],
    defaultGpc: 'honor',
    gpcAutoHonor: true,
    allowsLegitimateInterest: false,
    allowsTcf: false,
    requiresCpraCategory: true,
    requiresDpdpaDisclosure: false,
  },
  'opt-out': {
    label: 'Opt-out (US State Laws)',
    description: 'US state privacy laws. Collect first, allow opt-out of sale/share. Covers CCPA and all state-level equivalents.',
    compliances: [
      'ccpa',
      'vcdpa', 'cpa-co', 'ctdpa', 'ucpa', 'icdpa-ia', 'icdpa-in', 'tipa',
      'mcdpa-mt', 'mcdpa-mn', 'ocpa', 'tdpsa', 'dpdpa-de', 'njdpa', 'nhpa',
      'ndpa-ne', 'modpa', 'kcdpa', 'ridtpa',
    ],
    defaultGpc: 'honor',
    gpcAutoHonor: true,
    allowsLegitimateInterest: false,
    allowsTcf: false,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: false,
  },
  'notice-only': {
    label: 'Notice Only',
    description: 'A privacy notice is generally sufficient. No dedicated cookie banner law is encoded for this jurisdiction.',
    compliances: ['privacy-fj', 'privacy-pg'],
    defaultGpc: 'ignore',
    gpcAutoHonor: false,
    allowsLegitimateInterest: true,
    allowsTcf: false,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: false,
  },
  'opt-in': {
    label: 'Standard Opt-in (GDPR)',
    description: 'GDPR / ePrivacy style: prior consent required before non-essential cookies. Granular consent, easy reject, easy withdrawal.',
    compliances: [
      'gdpr', 'eprivacy', 'uk-gdpr', 'pecr', 'revfadp', 'kvkk', 'pdpa-th',
      'pdpl-sa', 'uae-pdpl', 'difc-dpl', 'adgm-dpr', 'qpdl-qa', 'pdpl-bh', 'pdpl-om',
      'law25',
    ],
    defaultGpc: 'ignore',
    gpcAutoHonor: false,
    allowsLegitimateInterest: true,
    allowsTcf: true,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: false,
  },
  'opt-in-dpdpa': {
    label: 'Opt-in (India DPDPA)',
    description: "India's Digital Personal Data Protection Act. Opt-in consent with data fiduciary disclosure. No legitimate interest basis.",
    compliances: ['dpdpa'],
    defaultGpc: 'ignore',
    gpcAutoHonor: false,
    allowsLegitimateInterest: false,
    allowsTcf: false,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: true,
  },
  'opt-in-china': {
    label: 'Opt-in (China PIPL / DSL)',
    description: 'China PIPL + DSL + CSL: strict opt-in with purpose specification, data minimisation, and cross-border transfer controls.',
    compliances: ['pipl', 'dsl-cn', 'csl-cn'],
    defaultGpc: 'ignore',
    gpcAutoHonor: false,
    allowsLegitimateInterest: false,
    allowsTcf: false,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: false,
  },
  'opt-in-brazil': {
    label: 'Opt-in (Brazil LGPD)',
    description: 'Brazil LGPD: opt-in consent required. Legitimate interest is a valid basis. Analytics and advertising may differ in treatment.',
    compliances: ['lgpd'],
    defaultGpc: 'ignore',
    gpcAutoHonor: false,
    allowsLegitimateInterest: true,
    allowsTcf: false,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: false,
  },
  'general-privacy-consent': {
    label: 'General Privacy Consent',
    description: 'Privacy notice or consent rules exist but the jurisdiction does not have a GDPR/PECR-style strict cookie banner law. Documenting legal basis is best practice.',
    compliances: [
      'pipeda',
      'popia', 'appi', 'pipa-kr',
      'pdpa-sg', 'pdpa-my', 'dpa-ph', 'pdp-id', 'pdpd-vn',
      'privacy-au', 'privacy-nz', 'pdpl-hk', 'pdpa-mo', 'pdpl-tw',
      'privacy-bn', 'privacy-lk', 'privacy-np', 'privacy-kw', 'privacy-il',
      'ndpa-ng', 'dpa-ke', 'dpa-gh', 'dpa-ug', 'dpa-rw', 'dpa-mu',
      'dpa-bw', 'dpa-zm', 'dpa-zw', 'dpa-eg', 'dpa-ma', 'dpa-tn', 'dpa-dz',
      'lfpdppp', 'lpdp-ar', 'lpdp-pe', 'law1581-co', 'law18331-uy',
      'law19628-cl', 'lopdp-ec', 'lpdp-cr', 'data-protection-pa', 'data-protection-do',
    ],
    defaultGpc: 'ignore',
    gpcAutoHonor: false,
    allowsLegitimateInterest: true,
    allowsTcf: false,
    requiresCpraCategory: false,
    requiresDpdpaDisclosure: false,
  },
} satisfies Record<ComplianceGroupId, {
  label: string
  description: string
  compliances: readonly string[]
  defaultGpc: 'ignore' | 'honor' | 'strict'
  gpcAutoHonor: boolean
  allowsLegitimateInterest: boolean
  allowsTcf: boolean
  requiresCpraCategory: boolean
  requiresDpdpaDisclosure: boolean
}>

// ─── GPC Options ──────────────────────────────────────────────────────────────

export const GPC_OPTIONS = [
  { value: 'ignore', label: 'Ignore', description: 'Do not check or respond to the GPC browser signal.' },
  { value: 'honor', label: 'Honor', description: 'Respect GPC as a valid opt-out signal. Show GPC variant banner once.' },
  { value: 'strict', label: 'Strict', description: 'Silently deny all non-mandatory cookies when GPC is detected. No banner shown.' },
]

// ─── Legal Basis Options ──────────────────────────────────────────────────────

export const LEGAL_BASIS_OPTIONS = [
  { value: 'mandatory', label: 'Strictly Necessary', description: 'Required for the service to function. No consent needed.' },
  { value: 'consent', label: 'Consent', description: 'Requires explicit user agreement. User can withdraw at any time.' },
  { value: 'legitimate_interest', label: 'Legitimate Interest', description: 'Based on legitimate business interest. User has the right to object.' },
]

// ─── CPRA Categories ──────────────────────────────────────────────────────────

export const CPRA_CATEGORIES = [
  { value: 'sale', label: 'Sale', description: 'Sale of personal data to third parties for their own use.' },
  { value: 'sharing', label: 'Sharing', description: 'Sharing for cross-context behavioral advertising (even without payment).' },
  { value: 'sensitive', label: 'Sensitive', description: 'Sensitive personal information (geolocation, health, race, biometrics, etc.). Requires opt-in even in California.' },
]

// ─── Cookie Purposes ──────────────────────────────────────────────────────────
// The `CookiePurpose` literal type derived from this array lives in
// @consenti/types (packages/types/src/ui.ts) via a type-only import.

export const COOKIE_PURPOSE_IDS = ['necessary', 'functional', 'preferences', 'analytics', 'marketing'] as const

type CookiePurposeId = typeof COOKIE_PURPOSE_IDS[number]

export const COOKIE_PURPOSES = [
  { value: 'necessary', label: 'Necessary', description: 'Strictly required to deliver the service or ensure security/compliance. Always granted.' },
  { value: 'functional', label: 'Functional', description: 'Optional features that enhance functionality but are not essential.' },
  { value: 'preferences', label: 'Preferences', description: 'Remember user choices and personalize the experience ("Remember me").' },
  { value: 'analytics', label: 'Analytics', description: 'Measure usage and performance to improve the product.' },
  { value: 'marketing', label: 'Marketing', description: 'Advertising, profiling, cross-site tracking, retargeting, ad personalization.' },
]

export const COOKIE_PURPOSE_DEFAULTS: Record<CookiePurposeId, {
  legalBasis: 'mandatory' | 'consent' | 'legitimate_interest'
  listenGpc: boolean
  cpraCategory?: 'sale' | 'sharing' | 'sensitive'
}> = {
  necessary: { legalBasis: 'mandatory', listenGpc: false },
  functional: { legalBasis: 'legitimate_interest', listenGpc: false },
  preferences: { legalBasis: 'legitimate_interest', listenGpc: false },
  analytics: { legalBasis: 'consent', listenGpc: true },
  marketing: { legalBasis: 'consent', listenGpc: true, cpraCategory: 'sharing' },
}

export const KNOWN_COOKIE_PURPOSES: Record<string, CookiePurposeId> = {
  security_storage: 'necessary',
  functionality_storage: 'functional',
  personalization_storage: 'preferences',
  analytics_storage: 'analytics',
  ad_storage: 'marketing',
  ad_user_data: 'marketing',
  ad_personalization: 'marketing',
}

/** Legal basis no longer lives on Cookie (it's derived from category membership), so unknown IDs default to 'functional' rather than guessing from a legal-basis hint. */
export function inferCookiePurpose(cookie: { id: string }): CookiePurposeId {
  return KNOWN_COOKIE_PURPOSES[cookie.id] ?? 'functional'
}

// ─── TCF Purposes (IAB TCF 2.2) ──────────────────────────────────────────────

export const TCF_PURPOSES = [
  { id: 1, name: 'Store and/or access information on a device', description: "Cookies, device identifiers, or other information can be stored or accessed on your device." },
  { id: 2, name: 'Select basic ads', description: "Ads can be shown based on the content you're viewing, the app you're using, or your approximate location." },
  { id: 3, name: 'Create a personalised ads profile', description: "A profile can be built about you and your interests to show you personalised ads." },
  { id: 4, name: 'Select personalised ads', description: "Personalised ads can be shown to you based on a profile about you." },
  { id: 5, name: 'Create a personalised content profile', description: "A profile can be built about you and your interests to show you personalised content." },
  { id: 6, name: 'Select personalised content', description: "Personalised content can be shown to you based on a profile about you." },
  { id: 7, name: 'Measure ad performance', description: "The performance and effectiveness of ads that you see or interact with can be measured." },
  { id: 8, name: 'Measure content performance', description: "The performance and effectiveness of content that you see or interact with can be measured." },
  { id: 9, name: 'Apply market research to generate audience insights', description: "Market research can be used to learn more about the audiences who visit sites or use apps." },
  { id: 10, name: 'Develop and improve products', description: "Your data can be used to improve existing systems and software, and to develop new products." },
  { id: 11, name: 'Use limited data to select content', description: "Content can be selected based on limited data such as the website you are visiting." },
]

export const TCF_SPECIAL_FEATURES = [
  { id: 1, name: 'Use precise geolocation data', description: "Your precise location (within a radius of less than 500 metres) can be used." },
  { id: 2, name: 'Actively scan device characteristics for identification', description: "Your device can be identified based on a scan of your device's unique combination of characteristics." },
]

// ─── Category ↔ Cookie legal-basis derivation ─────────────────────────────────
// Legal basis lives on Category (single source of truth); a Cookie/parameter's
// effective legal basis is derived from whichever category lists its id in
// `cookies`. Local, minimal shapes here — packages/utils has no dependency on
// @consenti/types (types depends on utils for data, not the other way), so
// these are structurally compatible with `Category` from packages/types/src/ui.ts
// rather than importing it.

type LegalBasisValue = 'mandatory' | 'consent' | 'legitimate_interest'

interface CategoryLike {
  legalBasis: LegalBasisValue
  cookies: string[]
}

/** Linear scan for a single lookup. For repeated lookups against the same category set, build an index with {@link buildCookieCategoryIndex} once instead. */
export function findCategoryForCookie<T extends CategoryLike>(
  cookieId: string,
  categories: Record<string, T>,
): T | undefined {
  for (const category of Object.values(categories)) {
    if (category.cookies.includes(cookieId)) return category
  }
  return undefined
}

/** Builds a cookie-id → category lookup once per profile load; reuse it across every consent-engine call rather than rebuilding per call. */
export function buildCookieCategoryIndex<T extends CategoryLike>(
  categories: Record<string, T>,
): Map<string, T> {
  const index = new Map<string, T>()
  for (const category of Object.values(categories)) {
    for (const cookieId of category.cookies) index.set(cookieId, category)
  }
  return index
}

/** Falls back to 'consent' only if the exactly-one-category-per-parameter authoring rule was somehow bypassed. */
export function getCookieLegalBasis(cookieId: string, index: Map<string, CategoryLike>): LegalBasisValue {
  return index.get(cookieId)?.legalBasis ?? 'consent'
}

export function isMandatoryCookie(cookieId: string, index: Map<string, CategoryLike>): boolean {
  return getCookieLegalBasis(cookieId, index) === 'mandatory'
}

// ─── Compliance Validation Rules ──────────────────────────────────────────────
// check() returns true when a violation exists (i.e., the rule is broken).
// Legal-basis/LI rules run against Category records (legalBasis now lives there).
// GPC/CPRA/preGrant rules stay Cookie-level but receive the cookie's *derived*
// legalBasis (via getCookieLegalBasis/buildCookieCategoryIndex) as a second
// argument instead of reading a (now nonexistent) cookie.legalBasis field.

interface RuleEntry<TSubject> {
  rule: string
  field: string
  check: (subject: Record<string, unknown>, legalBasis: TSubject) => boolean
  message: (id: string) => string
}
interface WarningEntry<TSubject> extends RuleEntry<TSubject> {
  suggestion: string
}

export const COMPLIANCE_VALIDATION_RULES: Record<string, {
  /** Checked once per category, keyed by category id. */
  categoryErrors: Array<RuleEntry<void>>
  categoryWarnings: Array<WarningEntry<void>>
  /** Checked once per cookie/parameter, keyed by cookie id. Receives the parameter's derived legal basis. */
  cookieErrors: Array<RuleEntry<LegalBasisValue>>
  cookieWarnings: Array<WarningEntry<LegalBasisValue>>
}> = {
  'opt-in': {
    categoryErrors: [
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Category "${id}" must have a legal basis set (Consent, Legitimate Interest, or Strictly Necessary) for GDPR compliance.`,
      },
    ],
    categoryWarnings: [],
    cookieErrors: [],
    cookieWarnings: [
      {
        rule: 'pre-grant-opt-in-risk',
        field: 'preGrant',
        check: (c, legalBasis) => legalBasis === 'consent' && c['preGrant'] === true,
        message: (id) => `Parameter "${id}" is pre-granted, which may violate GDPR's opt-in requirement. Only use "Pre Grant" on custom profiles targeting jurisdictions where pre-granted consent is valid.`,
        suggestion: 'Disable "Pre Grant" unless this profile specifically targets a jurisdiction that permits pre-granted consent.',
      },
    ],
  },

  'opt-out': {
    categoryErrors: [],
    categoryWarnings: [],
    cookieErrors: [],
    cookieWarnings: [
      {
        rule: 'gpc-recommended',
        field: 'listenGpc',
        check: (c, legalBasis) => legalBasis !== 'mandatory' && !c['listenGpc'],
        message: (id) => `Parameter "${id}" does not listen for the GPC signal. US state privacy laws require honoring GPC for opt-out of sale/sharing.`,
        suggestion: 'Enable "Listen for GPC signal" on this parameter.',
      },
    ],
  },

  'opt-out-strict': {
    categoryErrors: [],
    categoryWarnings: [],
    cookieErrors: [
      {
        rule: 'cpra-category-required',
        field: 'cpraCategory',
        check: (c, legalBasis) => legalBasis !== 'mandatory' && !c['cpraCategory'],
        message: (id) => `Parameter "${id}" must have a CPRA category (Sale, Sharing, or Sensitive) assigned. Required under CPRA for all non-necessary parameters.`,
      },
    ],
    cookieWarnings: [
      {
        rule: 'gpc-strict-required',
        field: 'listenGpc',
        check: (c, legalBasis) => legalBasis !== 'mandatory' && !c['listenGpc'],
        message: (id) => `Parameter "${id}" does not listen for the GPC signal. Under CPRA, non-mandatory parameters must honor GPC as a Do Not Sell/Share signal.`,
        suggestion: 'Enable "Listen for GPC signal" on this parameter.',
      },
    ],
  },

  'opt-in-dpdpa': {
    categoryErrors: [
      {
        rule: 'no-li-allowed',
        field: 'legalBasis',
        check: (c) => c['legalBasis'] === 'legitimate_interest',
        message: (id) => `Category "${id}" uses Legitimate Interest, which is not a valid legal basis under India's DPDPA. Use Consent or Strictly Necessary.`,
      },
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Category "${id}" must have a legal basis set (Consent or Strictly Necessary) for DPDPA compliance.`,
      },
    ],
    categoryWarnings: [],
    cookieErrors: [],
    cookieWarnings: [
      {
        rule: 'pre-grant-opt-in-risk',
        field: 'preGrant',
        check: (c, legalBasis) => legalBasis === 'consent' && c['preGrant'] === true,
        message: (id) => `Parameter "${id}" is pre-granted, which may violate DPDPA's opt-in requirement. Only use "Pre Grant" on custom profiles targeting jurisdictions where pre-granted consent is valid.`,
        suggestion: 'Disable "Pre Grant" unless this profile specifically targets a jurisdiction that permits pre-granted consent.',
      },
    ],
  },

  'opt-in-china': {
    categoryErrors: [
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Category "${id}" must have a legal basis set for China PIPL compliance. Consent is the primary valid basis.`,
      },
    ],
    categoryWarnings: [
      {
        rule: 'li-limited-under-pipl',
        field: 'legalBasis',
        check: (c) => c['legalBasis'] === 'legitimate_interest',
        message: (id) => `Category "${id}" uses Legitimate Interest. Under China's PIPL, LI is narrowly scoped and data processing purposes must be strictly documented.`,
        suggestion: 'Consider using Consent for this category to ensure PIPL compliance. Document the specific legitimate interest basis if retaining LI.',
      },
    ],
    cookieErrors: [],
    cookieWarnings: [
      {
        rule: 'pre-grant-opt-in-risk',
        field: 'preGrant',
        check: (c, legalBasis) => legalBasis === 'consent' && c['preGrant'] === true,
        message: (id) => `Parameter "${id}" is pre-granted, which may violate PIPL's opt-in requirement. Only use "Pre Grant" on custom profiles targeting jurisdictions where pre-granted consent is valid.`,
        suggestion: 'Disable "Pre Grant" unless this profile specifically targets a jurisdiction that permits pre-granted consent.',
      },
    ],
  },

  'opt-in-brazil': {
    categoryErrors: [
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Category "${id}" must have a legal basis set. Brazil's LGPD requires one of ten legal bases; Consent or Legitimate Interest are most common for parameters.`,
      },
    ],
    categoryWarnings: [],
    cookieErrors: [],
    cookieWarnings: [
      {
        rule: 'pre-grant-opt-in-risk',
        field: 'preGrant',
        check: (c, legalBasis) => legalBasis === 'consent' && c['preGrant'] === true,
        message: (id) => `Parameter "${id}" is pre-granted, which may violate LGPD's opt-in requirement. Only use "Pre Grant" on custom profiles targeting jurisdictions where pre-granted consent is valid.`,
        suggestion: 'Disable "Pre Grant" unless this profile specifically targets a jurisdiction that permits pre-granted consent.',
      },
    ],
  },

  'general-privacy-consent': {
    categoryErrors: [],
    categoryWarnings: [
      {
        rule: 'legal-basis-recommended',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Category "${id}" has no legal basis documented. While a strict cookie banner may not be legally required in this jurisdiction, documenting legal basis is a privacy best practice.`,
        suggestion: 'Set a legal basis to improve compliance documentation and future-proof against stricter enforcement.',
      },
    ],
    cookieErrors: [],
    cookieWarnings: [],
  },

  'notice-only': {
    categoryErrors: [],
    categoryWarnings: [],
    cookieErrors: [],
    cookieWarnings: [],
  },
}

// ─── Embedded Jurisdiction → Compliance Group Map ─────────────────────────────
// Version tag: update when regulations or mappings change materially.
// HOW TO UPDATE: edit or add a country entry below. That is the ONLY file change needed.
//
// locales: BCP 47 tags for the most commonly used web/IT locales in that country.
// Only well-supported, widely-used locales are listed. English-speaking countries
// use 'en' (no country suffix). No country-specific English variants (en-XX) anywhere.

export const EMBEDDED_COMPLIANCE_MAP = {
  version: '2026-07',
  countries: {
    // ─── Europe — EU 27 ───────────────────────────────────────────────────────
    AT: { name: 'Austria', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Austria (GDPR)', locales: ['de-AT'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Vienna'] },
    BE: { name: 'Belgium', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Belgium (GDPR)', locales: ['nl-BE', 'fr-BE'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Brussels'] },
    BG: { name: 'Bulgaria', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Bulgaria (GDPR)', locales: ['bg-BG'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Sofia'] },
    HR: { name: 'Croatia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Croatia (GDPR)', locales: ['hr-HR'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Zagreb'] },
    CY: { name: 'Cyprus', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Cyprus (GDPR)', locales: ['el-CY'], compliance: ['gdpr', 'eprivacy'], timezones: ['Asia/Nicosia'] },
    CZ: { name: 'Czechia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Czechia (GDPR)', locales: ['cs-CZ'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Prague'] },
    DK: { name: 'Denmark', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Denmark (GDPR)', locales: ['da-DK'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Copenhagen'] },
    EE: { name: 'Estonia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Estonia (GDPR)', locales: ['et-EE'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Tallinn'] },
    FI: { name: 'Finland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Finland (GDPR)', locales: ['fi-FI'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Helsinki'] },
    FR: { name: 'France', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'France (GDPR)', locales: ['fr-FR'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Paris'] },
    DE: { name: 'Germany', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Germany (GDPR)', locales: ['de-DE'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Berlin'] },
    GR: { name: 'Greece', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Greece (GDPR)', locales: ['el-GR'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Athens'] },
    HU: { name: 'Hungary', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Hungary (GDPR)', locales: ['hu-HU'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Budapest'] },
    IE: { name: 'Ireland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Ireland (GDPR)', locales: ['en'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Dublin'] },
    IT: { name: 'Italy', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Italy (GDPR)', locales: ['it-IT'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Rome'] },
    LV: { name: 'Latvia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Latvia (GDPR)', locales: ['lv-LV'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Riga'] },
    LT: { name: 'Lithuania', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Lithuania (GDPR)', locales: ['lt-LT'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Vilnius'] },
    LU: { name: 'Luxembourg', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Luxembourg (GDPR)', locales: ['fr-LU', 'de-LU'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Luxembourg'] },
    MT: { name: 'Malta', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Malta (GDPR)', locales: ['mt-MT', 'en'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Malta'] },
    NL: { name: 'Netherlands', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Netherlands (GDPR)', locales: ['nl-NL'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Amsterdam'] },
    PL: { name: 'Poland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Poland (GDPR)', locales: ['pl-PL'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Warsaw'] },
    PT: { name: 'Portugal', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Portugal (GDPR)', locales: ['pt-PT'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores'] },
    RO: { name: 'Romania', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Romania (GDPR)', locales: ['ro-RO'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Bucharest'] },
    SK: { name: 'Slovakia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Slovakia (GDPR)', locales: ['sk-SK'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Bratislava'] },
    SI: { name: 'Slovenia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Slovenia (GDPR)', locales: ['sl-SI'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Ljubljana'] },
    ES: { name: 'Spain', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Spain (GDPR)', locales: ['es-ES'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary'] },
    SE: { name: 'Sweden', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Sweden (GDPR)', locales: ['sv-SE'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Stockholm'] },
    // ─── Europe — EEA non-EU ──────────────────────────────────────────────────
    IS: { name: 'Iceland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Iceland (GDPR via EEA)', locales: ['is-IS'], compliance: ['gdpr', 'eprivacy'], timezones: ['Atlantic/Reykjavik'] },
    LI: { name: 'Liechtenstein', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Liechtenstein (GDPR via EEA)', locales: ['de-LI'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Vaduz'] },
    NO: { name: 'Norway', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Norway (GDPR via EEA)', locales: ['nb-NO'], compliance: ['gdpr', 'eprivacy'], timezones: ['Europe/Oslo', 'Arctic/Longyearbyen'] },
    // ─── Europe — GDPR-aligned candidate/observer countries ──────────────────
    AD: { name: 'Andorra', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Andorra (GDPR-aligned)', locales: ['ca-AD'], compliance: ['gdpr'], timezones: ['Europe/Andorra'] },
    AL: { name: 'Albania', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Albania (GDPR-aligned)', locales: ['sq-AL'], compliance: ['gdpr'], timezones: ['Europe/Tirane'] },
    BA: { name: 'Bosnia and Herzegovina', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Bosnia and Herzegovina (GDPR-aligned)', locales: ['bs-BA', 'sr-Latn-BA'], compliance: ['gdpr'], timezones: ['Europe/Sarajevo'] },
    GG: { name: 'Guernsey', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Guernsey (DPA based on GDPR)', locales: ['en'], compliance: ['gdpr'], timezones: ['Europe/Guernsey'] },
    GI: { name: 'Gibraltar', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Gibraltar (DPA based on UK GDPR)', locales: ['en'], compliance: ['uk-gdpr'], timezones: ['Europe/Gibraltar'] },
    GL: { name: 'Greenland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Greenland (Danish GDPR implementation)', locales: ['da-GL'], compliance: ['gdpr'], timezones: ['America/Nuuk', 'America/Danmarkshavn', 'America/Scoresbysund', 'America/Thule'] },
    MC: { name: 'Monaco', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Monaco (GDPR-aligned)', locales: ['fr-MC'], compliance: ['gdpr'], timezones: ['Europe/Monaco'] },
    ME: { name: 'Montenegro', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Montenegro (GDPR-aligned)', locales: ['sr-Latn-ME'], compliance: ['gdpr'], timezones: ['Europe/Podgorica'] },
    MK: { name: 'North Macedonia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'North Macedonia (GDPR-aligned)', locales: ['mk-MK'], compliance: ['gdpr'], timezones: ['Europe/Skopje'] },
    RS: { name: 'Serbia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Serbia (GDPR-aligned)', locales: ['sr-RS'], compliance: ['gdpr'], timezones: ['Europe/Belgrade'] },
    SM: { name: 'San Marino', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'San Marino (GDPR-aligned)', locales: ['it-SM'], compliance: ['gdpr'], timezones: ['Europe/San_Marino'] },
    TR: { name: 'Türkiye', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Türkiye (KVKK)', locales: ['tr-TR'], compliance: ['kvkk'], timezones: ['Europe/Istanbul'] },
    // ─── North America ────────────────────────────────────────────────────────
    CA: {
      name: 'Canada',
      type: 'country',
      complianceGroup: 'general-privacy-consent',
      default: 'general-privacy-consent',
      description: 'Canada (PIPEDA / Law 25)',
      locales: ['en', 'fr-CA'],
      compliance: ['pipeda', 'law25'],
      timezones: ['America/St_Johns', 'America/Halifax', 'America/Toronto', 'America/Winnipeg', 'America/Edmonton', 'America/Vancouver'],
      overriddenRegions: {
        QC: { name: 'Quebec', type: 'region', complianceGroup: 'opt-in', description: 'Quebec — Law 25 (GDPR-style opt-in)' },
      },
    },
    US: {
      name: 'United States',
      type: 'country',
      // complianceGroup: base when state known but has no specific law
      // default: used when state CANNOT be detected (use most strict = opt-out-strict)
      complianceGroup: 'opt-out',
      default: 'opt-out-strict',
      description: 'United States — opt-out-strict (CPRA) used when state cannot be detected',
      locales: ['en', 'es-US'],
      compliance: ['ccpa', 'cpra', 'vcdpa', 'cpa-co', 'ctdpa', 'ucpa', 'icdpa-ia', 'icdpa-in', 'tipa', 'mcdpa-mt', 'mcdpa-mn', 'ocpa', 'tdpsa', 'dpdpa-de', 'njdpa', 'nhpa', 'ndpa-ne', 'modpa', 'kcdpa', 'ridtpa'],
      timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
      overriddenRegions: {
        CA: { name: 'California', type: 'region', complianceGroup: 'opt-out-strict', description: 'California — CPRA/CCPA' },
        VA: { name: 'Virginia', type: 'region', complianceGroup: 'opt-out', description: 'Virginia — VCDPA' },
        CO: { name: 'Colorado', type: 'region', complianceGroup: 'opt-out', description: 'Colorado — CPA' },
        CT: { name: 'Connecticut', type: 'region', complianceGroup: 'opt-out', description: 'Connecticut — CTDPA' },
        UT: { name: 'Utah', type: 'region', complianceGroup: 'opt-out', description: 'Utah — UCPA' },
        TX: { name: 'Texas', type: 'region', complianceGroup: 'opt-out', description: 'Texas — TDPSA' },
        DE: { name: 'Delaware', type: 'region', complianceGroup: 'opt-out', description: 'Delaware — DPDPA' },
        NJ: { name: 'New Jersey', type: 'region', complianceGroup: 'opt-out', description: 'New Jersey — NJDPA' },
        OR: { name: 'Oregon', type: 'region', complianceGroup: 'opt-out', description: 'Oregon — OCPA' },
        MN: { name: 'Minnesota', type: 'region', complianceGroup: 'opt-out', description: 'Minnesota — MCDPA' },
        MD: { name: 'Maryland', type: 'region', complianceGroup: 'opt-out', description: 'Maryland — MODPA' },
        KY: { name: 'Kentucky', type: 'region', complianceGroup: 'opt-out', description: 'Kentucky — KCDPA' },
        TN: { name: 'Tennessee', type: 'region', complianceGroup: 'opt-out', description: 'Tennessee — TIPA' },
        NE: { name: 'Nebraska', type: 'region', complianceGroup: 'opt-out', description: 'Nebraska — NDPA' },
        IA: { name: 'Iowa', type: 'region', complianceGroup: 'opt-out', description: 'Iowa — ICDPA' },
        IN: { name: 'Indiana', type: 'region', complianceGroup: 'opt-out', description: 'Indiana — ICDPA' },
        MT: { name: 'Montana', type: 'region', complianceGroup: 'opt-out', description: 'Montana — MCDPA' },
        NH: { name: 'New Hampshire', type: 'region', complianceGroup: 'opt-out', description: 'New Hampshire — NHPA' },
        RI: { name: 'Rhode Island', type: 'region', complianceGroup: 'opt-out', description: 'Rhode Island — RIDTPA' },
      },
    },
    // ─── Latin America ────────────────────────────────────────────────────────
    AR: { name: 'Argentina', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Argentina (LPDP)', locales: ['es-AR'], compliance: ['lpdp-ar'], timezones: ['America/Argentina/Buenos_Aires'] },
    BO: { name: 'Bolivia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Bolivia', locales: ['es-BO'], compliance: [], timezones: ['America/La_Paz'] },
    BR: { name: 'Brazil', type: 'country', complianceGroup: 'opt-in-brazil', default: 'opt-in-brazil', description: 'Brazil (LGPD)', locales: ['pt-BR'], compliance: ['lgpd'], timezones: ['America/Noronha', 'America/Sao_Paulo', 'America/Manaus', 'America/Rio_Branco'] },
    CL: { name: 'Chile', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Chile (Law 19.628)', locales: ['es-CL'], compliance: ['law19628-cl'], timezones: ['America/Santiago', 'Pacific/Easter'] },
    CO: { name: 'Colombia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Colombia (Law 1581)', locales: ['es-CO'], compliance: ['law1581-co'], timezones: ['America/Bogota'] },
    CR: { name: 'Costa Rica', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Costa Rica (LPDP)', locales: ['es-CR'], compliance: ['lpdp-cr'], timezones: ['America/Costa_Rica'] },
    DO: { name: 'Dominican Republic', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Dominican Republic', locales: ['es-DO'], compliance: ['data-protection-do'], timezones: ['America/Santo_Domingo'] },
    EC: { name: 'Ecuador', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Ecuador (LOPDP)', locales: ['es-EC'], compliance: ['lopdp-ec'], timezones: ['America/Guayaquil', 'Pacific/Galapagos'] },
    GF: { name: 'French Guiana', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'French Guiana', locales: ['fr-GF'], compliance: [], timezones: ['America/Cayenne'] },
    GT: { name: 'Guatemala', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guatemala', locales: ['es-GT'], compliance: [], timezones: ['America/Guatemala'] },
    GY: { name: 'Guyana', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guyana', locales: ['en'], compliance: [], timezones: ['America/Guyana'] },
    HN: { name: 'Honduras', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Honduras', locales: ['es-HN'], compliance: [], timezones: ['America/Tegucigalpa'] },
    HT: { name: 'Haiti', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Haiti', locales: ['fr-HT'], compliance: [], timezones: ['America/Port-au-Prince'] },
    JM: { name: 'Jamaica', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Jamaica', locales: ['en'], compliance: [], timezones: ['America/Jamaica'] },
    MX: { name: 'Mexico', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Mexico (LFPDPPP)', locales: ['es-MX'], compliance: ['lfpdppp'], timezones: ['America/Mexico_City', 'America/Cancun', 'America/Chihuahua', 'America/Hermosillo', 'America/Tijuana'] },
    NI: { name: 'Nicaragua', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Nicaragua', locales: ['es-NI'], compliance: [], timezones: ['America/Managua'] },
    PA: { name: 'Panama', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Panama', locales: ['es-PA'], compliance: ['data-protection-pa'], timezones: ['America/Panama'] },
    PE: { name: 'Peru', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Peru (LPDP)', locales: ['es-PE'], compliance: ['lpdp-pe'], timezones: ['America/Lima'] },
    PY: { name: 'Paraguay', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Paraguay', locales: ['es-PY'], compliance: [], timezones: ['America/Asuncion'] },
    SR: { name: 'Suriname', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Suriname', locales: ['nl-SR'], compliance: [], timezones: ['America/Paramaribo'] },
    SV: { name: 'El Salvador', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'El Salvador', locales: ['es-SV'], compliance: [], timezones: ['America/El_Salvador'] },
    TT: { name: 'Trinidad and Tobago', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Trinidad and Tobago', locales: ['en'], compliance: [], timezones: ['America/Port_of_Spain'] },
    UY: { name: 'Uruguay', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Uruguay (Law 18.331)', locales: ['es-UY'], compliance: ['law18331-uy'], timezones: ['America/Montevideo'] },
    VE: { name: 'Venezuela', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Venezuela', locales: ['es-VE'], compliance: [], timezones: ['America/Caracas'] },
    // ─── Caribbean ────────────────────────────────────────────────────────────
    AG: { name: 'Antigua and Barbuda', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Antigua and Barbuda', locales: ['en'], compliance: [], timezones: ['America/Antigua'] },
    BB: { name: 'Barbados', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Barbados', locales: ['en'], compliance: [], timezones: ['America/Barbados'] },
    BL: { name: 'Saint Barthélemy', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Barthélemy', locales: ['fr-BL'], compliance: [], timezones: ['America/St_Barthelemy'] },
    BM: { name: 'Bermuda', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Bermuda', locales: ['en'], compliance: [], timezones: ['Atlantic/Bermuda'] },
    BS: { name: 'Bahamas', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Bahamas', locales: ['en'], compliance: [], timezones: ['America/Nassau'] },
    CU: { name: 'Cuba', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cuba', locales: ['es-CU'], compliance: [], timezones: ['America/Havana'] },
    DM: { name: 'Dominica', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Dominica', locales: ['en'], compliance: [], timezones: ['America/Dominica'] },
    GD: { name: 'Grenada', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Grenada', locales: ['en'], compliance: [], timezones: ['America/Grenada'] },
    KN: { name: 'Saint Kitts and Nevis', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Kitts and Nevis', locales: ['en'], compliance: [], timezones: ['America/St_Kitts'] },
    LC: { name: 'Saint Lucia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Lucia', locales: ['en'], compliance: [], timezones: ['America/St_Lucia'] },
    PM: { name: 'Saint Pierre and Miquelon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Pierre and Miquelon', locales: ['fr-PM'], compliance: [], timezones: ['America/Miquelon'] },
    PR: { name: 'Puerto Rico', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Puerto Rico', locales: ['es-PR', 'en'], compliance: [], timezones: ['America/Puerto_Rico'] },
    VC: { name: 'Saint Vincent and the Grenadines', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Vincent and the Grenadines', locales: ['en'], compliance: [], timezones: ['America/St_Vincent'] },
    // ─── Asia — India ─────────────────────────────────────────────────────────
    IN: { name: 'India', type: 'country', complianceGroup: 'opt-in-dpdpa', default: 'opt-in-dpdpa', description: 'India (DPDPA)', locales: ['hi-IN', 'en', 'bn-IN', 'ta-IN'], compliance: ['dpdpa'], timezones: ['Asia/Kolkata', 'Asia/Calcutta'] },
    // ─── Asia — China ─────────────────────────────────────────────────────────
    CN: { name: 'China', type: 'country', complianceGroup: 'opt-in-china', default: 'opt-in-china', description: 'China (PIPL + DSL + CSL)', locales: ['zh-CN'], compliance: ['pipl', 'dsl-cn', 'csl-cn'], timezones: ['Asia/Shanghai'] },
    // ─── Asia — Southeast Asia ────────────────────────────────────────────────
    BN: { name: 'Brunei', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Brunei (Personal Data Protection Order)', locales: ['ms-BN', 'en'], compliance: ['privacy-bn'], timezones: ['Asia/Brunei'] },
    ID: { name: 'Indonesia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Indonesia (PDP Law)', locales: ['id-ID'], compliance: ['pdp-id'], timezones: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] },
    KH: { name: 'Cambodia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cambodia', locales: ['km-KH'], compliance: [], timezones: ['Asia/Phnom_Penh'] },
    LA: { name: 'Laos', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Laos', locales: ['lo-LA'], compliance: [], timezones: ['Asia/Vientiane'] },
    MM: { name: 'Myanmar', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Myanmar', locales: ['my-MM'], compliance: [], timezones: ['Asia/Yangon'] },
    MY: { name: 'Malaysia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Malaysia (PDPA)', locales: ['ms-MY', 'zh-MY', 'en'], compliance: ['pdpa-my'], timezones: ['Asia/Kuala_Lumpur', 'Asia/Kuching'] },
    PH: { name: 'Philippines', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Philippines (DPA)', locales: ['fil-PH', 'en'], compliance: ['dpa-ph'], timezones: ['Asia/Manila'] },
    SG: { name: 'Singapore', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Singapore (PDPA)', locales: ['zh-SG', 'ms-SG', 'ta-SG', 'en'], compliance: ['pdpa-sg'], timezones: ['Asia/Singapore'] },
    TH: { name: 'Thailand', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Thailand (PDPA — GDPR-style opt-in)', locales: ['th-TH'], compliance: ['pdpa-th'], timezones: ['Asia/Bangkok'] },
    TL: { name: 'Timor-Leste', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Timor-Leste', locales: ['pt-TL'], compliance: [], timezones: ['Asia/Dili'] },
    VN: { name: 'Vietnam', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Vietnam (PDPD)', locales: ['vi-VN'], compliance: ['pdpd-vn'], timezones: ['Asia/Ho_Chi_Minh'] },
    // ─── Asia — East Asia ─────────────────────────────────────────────────────
    HK: { name: 'Hong Kong', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Hong Kong SAR (PDPO)', locales: ['zh-HK'], compliance: ['pdpl-hk'], timezones: ['Asia/Hong_Kong'] },
    JP: { name: 'Japan', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Japan (APPI)', locales: ['ja-JP'], compliance: ['appi'], timezones: ['Asia/Tokyo'] },
    KP: { name: 'North Korea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'North Korea', locales: ['ko-KP'], compliance: [], timezones: ['Asia/Pyongyang'] },
    KR: { name: 'South Korea', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'South Korea (PIPA)', locales: ['ko-KR'], compliance: ['pipa-kr'], timezones: ['Asia/Seoul'] },
    MN: { name: 'Mongolia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mongolia', locales: ['mn-MN'], compliance: [], timezones: ['Asia/Ulaanbaatar', 'Asia/Hovd'] },
    MO: { name: 'Macau', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Macau SAR (PDPA)', locales: ['zh-MO', 'pt-MO'], compliance: ['pdpa-mo'], timezones: ['Asia/Macau'] },
    TW: { name: 'Taiwan', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Taiwan (PDPL)', locales: ['zh-TW'], compliance: ['pdpl-tw'], timezones: ['Asia/Taipei'] },
    // ─── Asia — South Asia ────────────────────────────────────────────────────
    AF: { name: 'Afghanistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Afghanistan', locales: ['fa-AF'], compliance: [], timezones: ['Asia/Kabul'] },
    BD: { name: 'Bangladesh', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Bangladesh', locales: ['bn-BD'], compliance: [], timezones: ['Asia/Dhaka'] },
    BT: { name: 'Bhutan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Bhutan', locales: ['dz-BT'], compliance: [], timezones: ['Asia/Thimphu'] },
    IO: { name: 'British Indian Ocean Territory', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'British Indian Ocean Territory', locales: ['en'], compliance: [], timezones: ['Indian/Chagos'] },
    LK: { name: 'Sri Lanka', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Sri Lanka', locales: ['si-LK', 'ta-LK'], compliance: ['privacy-lk'], timezones: ['Asia/Colombo'] },
    MV: { name: 'Maldives', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Maldives', locales: ['dv-MV'], compliance: [], timezones: ['Indian/Maldives'] },
    NP: { name: 'Nepal', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Nepal', locales: ['ne-NP'], compliance: ['privacy-np'], timezones: ['Asia/Kathmandu'] },
    PK: { name: 'Pakistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Pakistan', locales: ['ur-PK', 'en'], compliance: [], timezones: ['Asia/Karachi'] },
    // ─── Asia — Central Asia ──────────────────────────────────────────────────
    AM: { name: 'Armenia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Armenia', locales: ['hy-AM'], compliance: [], timezones: ['Asia/Yerevan'] },
    AZ: { name: 'Azerbaijan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Azerbaijan', locales: ['az-AZ'], compliance: [], timezones: ['Asia/Baku'] },
    GE: { name: 'Georgia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Georgia', locales: ['ka-GE'], compliance: [], timezones: ['Asia/Tbilisi'] },
    KG: { name: 'Kyrgyzstan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Kyrgyzstan', locales: ['ky-KG', 'ru-KG'], compliance: [], timezones: ['Asia/Bishkek'] },
    KZ: { name: 'Kazakhstan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Kazakhstan', locales: ['kk-KZ', 'ru-KZ'], compliance: [], timezones: ['Asia/Almaty', 'Asia/Aqtobe'] },
    TJ: { name: 'Tajikistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Tajikistan', locales: ['tg-TJ'], compliance: [], timezones: ['Asia/Dushanbe'] },
    TM: { name: 'Turkmenistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Turkmenistan', locales: ['tk-TM'], compliance: [], timezones: ['Asia/Ashgabat'] },
    UZ: { name: 'Uzbekistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Uzbekistan', locales: ['uz-UZ'], compliance: [], timezones: ['Asia/Tashkent', 'Asia/Samarkand'] },
    // ─── Middle East ──────────────────────────────────────────────────────────
    AE: { name: 'United Arab Emirates', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'United Arab Emirates (UAE PDPL / DIFC DPL / ADGM DPR)', locales: ['ar-AE'], compliance: ['uae-pdpl', 'difc-dpl', 'adgm-dpr'], timezones: ['Asia/Dubai'] },
    BH: { name: 'Bahrain', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Bahrain (PDPL)', locales: ['ar-BH'], compliance: ['pdpl-bh'], timezones: ['Asia/Bahrain'] },
    IL: { name: 'Israel', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Israel (Privacy Protection Law)', locales: ['he-IL', 'ar-IL'], compliance: ['privacy-il'], timezones: ['Asia/Jerusalem'] },
    IQ: { name: 'Iraq', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Iraq', locales: ['ar-IQ'], compliance: [], timezones: ['Asia/Baghdad'] },
    IR: { name: 'Iran', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Iran', locales: ['fa-IR'], compliance: [], timezones: ['Asia/Tehran'] },
    JO: { name: 'Jordan', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Jordan', locales: ['ar-JO'], compliance: [], timezones: ['Asia/Amman'] },
    KW: { name: 'Kuwait', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Kuwait', locales: ['ar-KW'], compliance: ['privacy-kw'], timezones: ['Asia/Kuwait'] },
    LB: { name: 'Lebanon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Lebanon', locales: ['ar-LB'], compliance: [], timezones: ['Asia/Beirut'] },
    OM: { name: 'Oman', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Oman (PDPL)', locales: ['ar-OM'], compliance: ['pdpl-om'], timezones: ['Asia/Muscat'] },
    PS: { name: 'Palestine', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Palestine', locales: ['ar-PS'], compliance: [], timezones: ['Asia/Gaza', 'Asia/Hebron'] },
    QA: { name: 'Qatar', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Qatar (PDPL)', locales: ['ar-QA'], compliance: ['qpdl-qa'], timezones: ['Asia/Qatar'] },
    SA: { name: 'Saudi Arabia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Saudi Arabia (PDPL)', locales: ['ar-SA'], compliance: ['pdpl-sa'], timezones: ['Asia/Riyadh'] },
    SY: { name: 'Syria', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Syria', locales: ['ar-SY'], compliance: [], timezones: ['Asia/Damascus'] },
    YE: { name: 'Yemen', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Yemen', locales: ['ar-YE'], compliance: [], timezones: ['Asia/Aden'] },
    // ─── Africa — West ────────────────────────────────────────────────────────
    BF: { name: 'Burkina Faso', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Burkina Faso', locales: ['fr-BF'], compliance: [], timezones: ['Africa/Ouagadougou'] },
    BJ: { name: 'Benin', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Benin', locales: ['fr-BJ'], compliance: [], timezones: ['Africa/Porto-Novo'] },
    CI: { name: "Côte d'Ivoire", type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: "Côte d'Ivoire", locales: ['fr-CI'], compliance: [], timezones: ['Africa/Abidjan'] },
    CM: { name: 'Cameroon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cameroon', locales: ['fr-CM', 'en'], compliance: [], timezones: ['Africa/Douala'] },
    CV: { name: 'Cabo Verde', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cabo Verde', locales: ['pt-CV'], compliance: [], timezones: ['Atlantic/Cape_Verde'] },
    GA: { name: 'Gabon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Gabon', locales: ['fr-GA'], compliance: [], timezones: ['Africa/Libreville'] },
    GH: { name: 'Ghana', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Ghana (DPA)', locales: ['en'], compliance: ['dpa-gh'], timezones: ['Africa/Accra'] },
    GM: { name: 'Gambia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Gambia', locales: ['en'], compliance: [], timezones: ['Africa/Banjul'] },
    GN: { name: 'Guinea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guinea', locales: ['fr-GN'], compliance: [], timezones: ['Africa/Conakry'] },
    GQ: { name: 'Equatorial Guinea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Equatorial Guinea', locales: ['es-GQ', 'fr-GQ'], compliance: [], timezones: ['Africa/Malabo'] },
    GW: { name: 'Guinea-Bissau', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guinea-Bissau', locales: ['pt-GW'], compliance: [], timezones: ['Africa/Bissau'] },
    LR: { name: 'Liberia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Liberia', locales: ['en'], compliance: [], timezones: ['Africa/Monrovia'] },
    ML: { name: 'Mali', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mali', locales: ['fr-ML'], compliance: [], timezones: ['Africa/Bamako'] },
    MR: { name: 'Mauritania', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mauritania', locales: ['ar-MR'], compliance: [], timezones: ['Africa/Nouakchott'] },
    NE: { name: 'Niger', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Niger', locales: ['fr-NE'], compliance: [], timezones: ['Africa/Niamey'] },
    NG: { name: 'Nigeria', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Nigeria (NDPA)', locales: ['en'], compliance: ['ndpa-ng'], timezones: ['Africa/Lagos'] },
    SL: { name: 'Sierra Leone', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Sierra Leone', locales: ['en'], compliance: [], timezones: ['Africa/Freetown'] },
    SN: { name: 'Senegal', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Senegal', locales: ['fr-SN'], compliance: [], timezones: ['Africa/Dakar'] },
    TG: { name: 'Togo', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Togo', locales: ['fr-TG'], compliance: [], timezones: ['Africa/Lome'] },
    // ─── Africa — East ────────────────────────────────────────────────────────
    BI: { name: 'Burundi', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Burundi', locales: ['fr-BI'], compliance: [], timezones: ['Africa/Bujumbura'] },
    DJ: { name: 'Djibouti', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Djibouti', locales: ['fr-DJ', 'ar-DJ'], compliance: [], timezones: ['Africa/Djibouti'] },
    ER: { name: 'Eritrea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Eritrea', locales: ['ti-ER'], compliance: [], timezones: ['Africa/Asmara'] },
    ET: { name: 'Ethiopia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Ethiopia', locales: ['am-ET'], compliance: [], timezones: ['Africa/Addis_Ababa'] },
    KE: { name: 'Kenya', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Kenya (DPA)', locales: ['sw-KE', 'en'], compliance: ['dpa-ke'], timezones: ['Africa/Nairobi'] },
    KM: { name: 'Comoros', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Comoros', locales: ['ar-KM', 'fr-KM'], compliance: [], timezones: ['Indian/Comoro'] },
    MG: { name: 'Madagascar', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Madagascar', locales: ['fr-MG'], compliance: [], timezones: ['Indian/Antananarivo'] },
    MU: { name: 'Mauritius', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Mauritius (DPA)', locales: ['en', 'fr-MU'], compliance: ['dpa-mu'], timezones: ['Indian/Mauritius'] },
    MW: { name: 'Malawi', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Malawi', locales: ['en'], compliance: [], timezones: ['Africa/Blantyre'] },
    MZ: { name: 'Mozambique', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mozambique', locales: ['pt-MZ'], compliance: [], timezones: ['Africa/Maputo'] },
    RW: { name: 'Rwanda', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Rwanda (DPA)', locales: ['rw-RW', 'en'], compliance: ['dpa-rw'], timezones: ['Africa/Kigali'] },
    SC: { name: 'Seychelles', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Seychelles', locales: ['fr-SC', 'en'], compliance: [], timezones: ['Indian/Mahe'] },
    SO: { name: 'Somalia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Somalia', locales: ['so-SO'], compliance: [], timezones: ['Africa/Mogadishu'] },
    SS: { name: 'South Sudan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'South Sudan', locales: ['en'], compliance: [], timezones: ['Africa/Juba'] },
    ST: { name: 'São Tomé and Príncipe', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'São Tomé and Príncipe', locales: ['pt-ST'], compliance: [], timezones: ['Africa/Sao_Tome'] },
    TZ: { name: 'Tanzania', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Tanzania', locales: ['sw-TZ', 'en'], compliance: [], timezones: ['Africa/Dar_es_Salaam'] },
    UG: { name: 'Uganda', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Uganda (DPA)', locales: ['en'], compliance: ['dpa-ug'], timezones: ['Africa/Kampala'] },
    // ─── Africa — Southern ────────────────────────────────────────────────────
    AO: { name: 'Angola', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Angola', locales: ['pt-AO'], compliance: [], timezones: ['Africa/Luanda'] },
    BW: { name: 'Botswana', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Botswana (DPA)', locales: ['en'], compliance: ['dpa-bw'], timezones: ['Africa/Gaborone'] },
    LS: { name: 'Lesotho', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Lesotho', locales: ['en'], compliance: [], timezones: ['Africa/Maseru'] },
    NA: { name: 'Namibia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Namibia', locales: ['en'], compliance: [], timezones: ['Africa/Windhoek'] },
    SZ: { name: 'Eswatini', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Eswatini', locales: ['en'], compliance: [], timezones: ['Africa/Mbabane'] },
    ZA: { name: 'South Africa', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'South Africa (POPIA)', locales: ['en', 'af-ZA'], compliance: ['popia'], timezones: ['Africa/Johannesburg'] },
    ZM: { name: 'Zambia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Zambia (DPA)', locales: ['en'], compliance: ['dpa-zm'], timezones: ['Africa/Lusaka'] },
    ZW: { name: 'Zimbabwe', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Zimbabwe (DPA)', locales: ['en'], compliance: ['dpa-zw'], timezones: ['Africa/Harare'] },
    // ─── Africa — North ───────────────────────────────────────────────────────
    DZ: { name: 'Algeria', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Algeria', locales: ['ar-DZ', 'fr-DZ'], compliance: ['dpa-dz'], timezones: ['Africa/Algiers'] },
    EG: { name: 'Egypt', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Egypt (DPA)', locales: ['ar-EG'], compliance: ['dpa-eg'], timezones: ['Africa/Cairo'] },
    LY: { name: 'Libya', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Libya', locales: ['ar-LY'], compliance: [], timezones: ['Africa/Tripoli'] },
    MA: { name: 'Morocco', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Morocco', locales: ['ar-MA', 'fr-MA'], compliance: ['dpa-ma'], timezones: ['Africa/Casablanca'] },
    SD: { name: 'Sudan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Sudan', locales: ['ar-SD'], compliance: [], timezones: ['Africa/Khartoum'] },
    TN: { name: 'Tunisia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Tunisia (DPA)', locales: ['ar-TN', 'fr-TN'], compliance: ['dpa-tn'], timezones: ['Africa/Tunis'] },
    // ─── Africa — Central ─────────────────────────────────────────────────────
    CD: { name: 'DR Congo', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'DR Congo', locales: ['fr-CD'], compliance: [], timezones: ['Africa/Kinshasa', 'Africa/Lubumbashi'] },
    CF: { name: 'Central African Republic', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Central African Republic', locales: ['fr-CF'], compliance: [], timezones: ['Africa/Bangui'] },
    CG: { name: 'Republic of Congo', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Republic of Congo', locales: ['fr-CG'], compliance: [], timezones: ['Africa/Brazzaville'] },
    TD: { name: 'Chad', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Chad', locales: ['fr-TD', 'ar-TD'], compliance: [], timezones: ['Africa/Ndjamena'] },
    // ─── Europe — Eastern ─────────────────────────────────────────────────────
    BY: { name: 'Belarus', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Belarus', locales: ['be-BY', 'ru-BY'], compliance: [], timezones: ['Europe/Minsk'] },
    MD: { name: 'Moldova', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Moldova', locales: ['ro-MD'], compliance: [], timezones: ['Europe/Chisinau'] },
    RU: { name: 'Russia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Russia', locales: ['ru-RU'], compliance: [], timezones: ['Europe/Kaliningrad', 'Europe/Moscow', 'Europe/Samara', 'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka'] },
    UA: { name: 'Ukraine', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Ukraine', locales: ['uk-UA'], compliance: [], timezones: ['Europe/Kyiv'] },
    VA: { name: 'Holy See', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Holy See', locales: ['it-VA'], compliance: [], timezones: ['Europe/Vatican'] },
    // ─── Oceania ──────────────────────────────────────────────────────────────
    AU: { name: 'Australia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Australia (Privacy Act)', locales: ['en'], compliance: ['privacy-au'], timezones: ['Australia/Sydney', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart'] },
    FJ: { name: 'Fiji', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Fiji', locales: ['en'], compliance: ['privacy-fj'], timezones: ['Pacific/Fiji'] },
    FM: { name: 'Micronesia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Micronesia', locales: ['en'], compliance: [], timezones: ['Pacific/Chuuk', 'Pacific/Pohnpei', 'Pacific/Kosrae'] },
    KI: { name: 'Kiribati', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Kiribati', locales: ['en'], compliance: [], timezones: ['Pacific/Tarawa', 'Pacific/Enderbury', 'Pacific/Kiritimati'] },
    MH: { name: 'Marshall Islands', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Marshall Islands', locales: ['en'], compliance: [], timezones: ['Pacific/Majuro', 'Pacific/Kwajalein'] },
    MP: { name: 'Northern Mariana Islands', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Northern Mariana Islands', locales: ['en'], compliance: [], timezones: ['Pacific/Saipan'] },
    NC: { name: 'New Caledonia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'New Caledonia', locales: ['fr-NC'], compliance: [], timezones: ['Pacific/Noumea'] },
    NF: { name: 'Norfolk Island', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Norfolk Island', locales: ['en'], compliance: [], timezones: ['Pacific/Norfolk'] },
    NR: { name: 'Nauru', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Nauru', locales: ['en'], compliance: [], timezones: ['Pacific/Nauru'] },
    NU: { name: 'Niue', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Niue', locales: ['en'], compliance: [], timezones: ['Pacific/Niue'] },
    NZ: { name: 'New Zealand', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'New Zealand (Privacy Act)', locales: ['en'], compliance: ['privacy-nz'], timezones: ['Pacific/Auckland', 'Pacific/Chatham'] },
    PF: { name: 'French Polynesia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'French Polynesia', locales: ['fr-PF'], compliance: [], timezones: ['Pacific/Tahiti', 'Pacific/Marquesas', 'Pacific/Gambier'] },
    PG: { name: 'Papua New Guinea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Papua New Guinea', locales: ['en'], compliance: ['privacy-pg'], timezones: ['Pacific/Port_Moresby', 'Pacific/Bougainville'] },
    PW: { name: 'Palau', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Palau', locales: ['en'], compliance: [], timezones: ['Pacific/Palau'] },
    SB: { name: 'Solomon Islands', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Solomon Islands', locales: ['en'], compliance: [], timezones: ['Pacific/Guadalcanal'] },
    TO: { name: 'Tonga', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Tonga', locales: ['en'], compliance: [], timezones: ['Pacific/Tongatapu'] },
    TV: { name: 'Tuvalu', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Tuvalu', locales: ['en'], compliance: [], timezones: ['Pacific/Funafuti'] },
    VU: { name: 'Vanuatu', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Vanuatu', locales: ['fr-VU', 'en'], compliance: [], timezones: ['Pacific/Efate'] },
    WS: { name: 'Samoa', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Samoa', locales: ['en'], compliance: [], timezones: ['Pacific/Apia'] },
    // ─── Europe — GDPR-equivalent / adequacy ─────────────────────────────────
    UK: { name: 'United Kingdom', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'United Kingdom (UK GDPR + PECR)', locales: ['en'], compliance: ['uk-gdpr', 'pecr'], timezones: ['Europe/London'] },
    CH: { name: 'Switzerland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Switzerland (revFADP)', locales: ['de-CH', 'fr-CH', 'it-CH'], compliance: ['revfadp'], timezones: ['Europe/Zurich'] },
  },
} satisfies {
  version: string
  countries: Record<string, {
    name: string
    type: 'country'
    complianceGroup: ComplianceGroupId
    default: ComplianceGroupId
    description: string
    locales: readonly string[]
    compliance: readonly Compliance[]
    timezones: readonly string[]
    overriddenRegions?: Record<string, {
      name: string
      type: 'region'
      complianceGroup: ComplianceGroupId
      description: string
    }>
  }>
}

export const COUNTRY_CODES = Object.entries(EMBEDDED_COMPLIANCE_MAP.countries).reduce(function (acc, [c, d]) {
  acc[c] = d.name;
  return acc;
}, {} as Record<string, string>);

export const LOCALES = Object.values(EMBEDDED_COMPLIANCE_MAP.countries).reduce(function (acc, c) {
  c.locales.forEach(l => {
    acc[l] = c.name;
  })
  return acc;
}, {} as Record<string, string>);
