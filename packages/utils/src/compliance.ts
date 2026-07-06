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

// ─── Compliance Validation Rules ──────────────────────────────────────────────
// check() returns true when a violation exists (i.e., the rule is broken)

export const COMPLIANCE_VALIDATION_RULES: Record<string, {
  errors: Array<{
    rule: string
    field: string
    check: (cookie: Record<string, unknown>) => boolean
    message: (cookieId: string) => string
  }>
  warnings: Array<{
    rule: string
    field: string
    check: (cookie: Record<string, unknown>) => boolean
    message: (cookieId: string) => string
    suggestion: string
  }>
}> = {
  'opt-in': {
    errors: [
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Cookie "${id}" must have a legal basis set (Consent, Legitimate Interest, or Strictly Necessary) for GDPR compliance.`,
      },
      {
        rule: 'li-description-required',
        field: 'legitimateInterest.description',
        check: (c) => c['legalBasis'] === 'legitimate_interest' && !(c['legitimateInterest'] as Record<string, unknown> | undefined)?.['description'],
        message: (id) => `Cookie "${id}" uses Legitimate Interest but has no balancing test description. GDPR requires documenting your LI assessment.`,
      },
    ],
    warnings: [
      {
        rule: 'li-description-recommended',
        field: 'legitimateInterest.description',
        check: (c) => c['legalBasis'] === 'legitimate_interest' && !(c['legitimateInterest'] as Record<string, unknown> | undefined)?.['description'],
        message: (id) => `Cookie "${id}": adding a Legitimate Interest description improves transparency and is a GDPR best practice.`,
        suggestion: 'Add a brief description of your legitimate interest balancing test.',
      },
    ],
  },

  'opt-out': {
    errors: [],
    warnings: [
      {
        rule: 'gpc-recommended',
        field: 'listenGpc',
        check: (c) => c['legalBasis'] !== 'mandatory' && !c['listenGpc'],
        message: (id) => `Cookie "${id}" does not listen for the GPC signal. US state privacy laws require honoring GPC for opt-out of sale/sharing.`,
        suggestion: 'Enable "Listen for GPC signal" on this cookie.',
      },
    ],
  },

  'opt-out-strict': {
    errors: [
      {
        rule: 'cpra-category-required',
        field: 'cpraCategory',
        check: (c) => c['legalBasis'] !== 'mandatory' && !c['cpraCategory'],
        message: (id) => `Cookie "${id}" must have a CPRA category (Sale, Sharing, or Sensitive) assigned. Required under CPRA for all non-necessary cookies.`,
      },
    ],
    warnings: [
      {
        rule: 'gpc-strict-required',
        field: 'listenGpc',
        check: (c) => c['legalBasis'] !== 'mandatory' && !c['listenGpc'],
        message: (id) => `Cookie "${id}" does not listen for the GPC signal. Under CPRA, non-mandatory cookies must honor GPC as a Do Not Sell/Share signal.`,
        suggestion: 'Enable "Listen for GPC signal" on this cookie.',
      },
    ],
  },

  'opt-in-dpdpa': {
    errors: [
      {
        rule: 'no-li-allowed',
        field: 'legalBasis',
        check: (c) => c['legalBasis'] === 'legitimate_interest',
        message: (id) => `Cookie "${id}" uses Legitimate Interest, which is not a valid legal basis under India's DPDPA. Use Consent or Strictly Necessary.`,
      },
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Cookie "${id}" must have a legal basis set (Consent or Strictly Necessary) for DPDPA compliance.`,
      },
    ],
    warnings: [],
  },

  'opt-in-china': {
    errors: [
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Cookie "${id}" must have a legal basis set for China PIPL compliance. Consent is the primary valid basis.`,
      },
    ],
    warnings: [
      {
        rule: 'li-limited-under-pipl',
        field: 'legalBasis',
        check: (c) => c['legalBasis'] === 'legitimate_interest',
        message: (id) => `Cookie "${id}" uses Legitimate Interest. Under China's PIPL, LI is narrowly scoped and data processing purposes must be strictly documented.`,
        suggestion: 'Consider using Consent for this cookie to ensure PIPL compliance. Document the specific legitimate interest basis if retaining LI.',
      },
    ],
  },

  'opt-in-brazil': {
    errors: [
      {
        rule: 'legal-basis-required',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Cookie "${id}" must have a legal basis set. Brazil's LGPD requires one of ten legal bases; Consent or Legitimate Interest are most common for cookies.`,
      },
    ],
    warnings: [
      {
        rule: 'li-description-recommended',
        field: 'legitimateInterest.description',
        check: (c) => c['legalBasis'] === 'legitimate_interest' && !(c['legitimateInterest'] as Record<string, unknown> | undefined)?.['description'],
        message: (id) => `Cookie "${id}" uses Legitimate Interest. LGPD requires documenting the basis and conducting an impact assessment.`,
        suggestion: 'Add a Legitimate Interest description to document the LGPD basis and your impact assessment.',
      },
    ],
  },

  'general-privacy-consent': {
    errors: [],
    warnings: [
      {
        rule: 'legal-basis-recommended',
        field: 'legalBasis',
        check: (c) => !c['legalBasis'],
        message: (id) => `Cookie "${id}" has no legal basis documented. While a strict cookie banner may not be legally required in this jurisdiction, documenting legal basis is a privacy best practice.`,
        suggestion: 'Set a legal basis to improve compliance documentation and future-proof against stricter enforcement.',
      },
    ],
  },

  'notice-only': {
    errors: [],
    warnings: [],
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
    AT: { name: 'Austria', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Austria (GDPR)', locales: ['de-AT'] },
    BE: { name: 'Belgium', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Belgium (GDPR)', locales: ['nl-BE', 'fr-BE'] },
    BG: { name: 'Bulgaria', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Bulgaria (GDPR)', locales: ['bg-BG'] },
    HR: { name: 'Croatia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Croatia (GDPR)', locales: ['hr-HR'] },
    CY: { name: 'Cyprus', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Cyprus (GDPR)', locales: ['el-CY'] },
    CZ: { name: 'Czechia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Czechia (GDPR)', locales: ['cs-CZ'] },
    DK: { name: 'Denmark', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Denmark (GDPR)', locales: ['da-DK'] },
    EE: { name: 'Estonia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Estonia (GDPR)', locales: ['et-EE'] },
    FI: { name: 'Finland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Finland (GDPR)', locales: ['fi-FI'] },
    FR: { name: 'France', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'France (GDPR)', locales: ['fr-FR'] },
    DE: { name: 'Germany', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Germany (GDPR)', locales: ['de-DE'] },
    GR: { name: 'Greece', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Greece (GDPR)', locales: ['el-GR'] },
    HU: { name: 'Hungary', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Hungary (GDPR)', locales: ['hu-HU'] },
    IE: { name: 'Ireland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Ireland (GDPR)', locales: ['en'] },
    IT: { name: 'Italy', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Italy (GDPR)', locales: ['it-IT'] },
    LV: { name: 'Latvia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Latvia (GDPR)', locales: ['lv-LV'] },
    LT: { name: 'Lithuania', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Lithuania (GDPR)', locales: ['lt-LT'] },
    LU: { name: 'Luxembourg', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Luxembourg (GDPR)', locales: ['fr-LU', 'de-LU'] },
    MT: { name: 'Malta', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Malta (GDPR)', locales: ['mt-MT', 'en'] },
    NL: { name: 'Netherlands', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Netherlands (GDPR)', locales: ['nl-NL'] },
    PL: { name: 'Poland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Poland (GDPR)', locales: ['pl-PL'] },
    PT: { name: 'Portugal', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Portugal (GDPR)', locales: ['pt-PT'] },
    RO: { name: 'Romania', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Romania (GDPR)', locales: ['ro-RO'] },
    SK: { name: 'Slovakia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Slovakia (GDPR)', locales: ['sk-SK'] },
    SI: { name: 'Slovenia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Slovenia (GDPR)', locales: ['sl-SI'] },
    ES: { name: 'Spain', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Spain (GDPR)', locales: ['es-ES'] },
    SE: { name: 'Sweden', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Sweden (GDPR)', locales: ['sv-SE'] },
    // ─── Europe — EEA non-EU ──────────────────────────────────────────────────
    IS: { name: 'Iceland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Iceland (GDPR via EEA)', locales: ['is-IS'] },
    LI: { name: 'Liechtenstein', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Liechtenstein (GDPR via EEA)', locales: ['de-LI'] },
    NO: { name: 'Norway', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Norway (GDPR via EEA)', locales: ['nb-NO'] },
    // ─── Europe — GDPR-aligned candidate/observer countries ──────────────────
    AD: { name: 'Andorra', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Andorra (GDPR-aligned)', locales: ['ca-AD'] },
    AL: { name: 'Albania', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Albania (GDPR-aligned)', locales: ['sq-AL'] },
    BA: { name: 'Bosnia and Herzegovina', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Bosnia and Herzegovina (GDPR-aligned)', locales: ['bs-BA', 'sr-Latn-BA'] },
    GG: { name: 'Guernsey', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Guernsey (DPA based on GDPR)', locales: ['en'] },
    GI: { name: 'Gibraltar', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Gibraltar (DPA based on UK GDPR)', locales: ['en'] },
    GL: { name: 'Greenland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Greenland (Danish GDPR implementation)', locales: ['da-GL'] },
    MC: { name: 'Monaco', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Monaco (GDPR-aligned)', locales: ['fr-MC'] },
    ME: { name: 'Montenegro', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Montenegro (GDPR-aligned)', locales: ['sr-Latn-ME'] },
    MK: { name: 'North Macedonia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'North Macedonia (GDPR-aligned)', locales: ['mk-MK'] },
    RS: { name: 'Serbia', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Serbia (GDPR-aligned)', locales: ['sr-RS'] },
    SM: { name: 'San Marino', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'San Marino (GDPR-aligned)', locales: ['it-SM'] },
    TR: { name: 'Türkiye', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Türkiye (KVKK)', locales: ['tr-TR'] },
    // ─── North America ────────────────────────────────────────────────────────
    CA: {
      name: 'Canada',
      type: 'country',
      complianceGroup: 'general-privacy-consent',
      default: 'general-privacy-consent',
      description: 'Canada (PIPEDA / Law 25)',
      locales: ['en', 'fr-CA'],
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
    AR: { name: 'Argentina', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Argentina (LPDP)', locales: ['es-AR'] },
    BO: { name: 'Bolivia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Bolivia', locales: ['es-BO'] },
    BR: { name: 'Brazil', type: 'country', complianceGroup: 'opt-in-brazil', default: 'opt-in-brazil', description: 'Brazil (LGPD)', locales: ['pt-BR'] },
    CL: { name: 'Chile', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Chile (Law 19.628)', locales: ['es-CL'] },
    CO: { name: 'Colombia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Colombia (Law 1581)', locales: ['es-CO'] },
    CR: { name: 'Costa Rica', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Costa Rica (LPDP)', locales: ['es-CR'] },
    DO: { name: 'Dominican Republic', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Dominican Republic', locales: ['es-DO'] },
    EC: { name: 'Ecuador', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Ecuador (LOPDP)', locales: ['es-EC'] },
    GF: { name: 'French Guiana', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'French Guiana', locales: ['fr-GF'] },
    GT: { name: 'Guatemala', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guatemala', locales: ['es-GT'] },
    GY: { name: 'Guyana', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guyana', locales: ['en'] },
    HN: { name: 'Honduras', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Honduras', locales: ['es-HN'] },
    HT: { name: 'Haiti', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Haiti', locales: ['fr-HT'] },
    JM: { name: 'Jamaica', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Jamaica', locales: ['en'] },
    MX: { name: 'Mexico', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Mexico (LFPDPPP)', locales: ['es-MX'] },
    NI: { name: 'Nicaragua', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Nicaragua', locales: ['es-NI'] },
    PA: { name: 'Panama', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Panama', locales: ['es-PA'] },
    PE: { name: 'Peru', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Peru (LPDP)', locales: ['es-PE'] },
    PY: { name: 'Paraguay', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Paraguay', locales: ['es-PY'] },
    SR: { name: 'Suriname', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Suriname', locales: ['nl-SR'] },
    SV: { name: 'El Salvador', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'El Salvador', locales: ['es-SV'] },
    TT: { name: 'Trinidad and Tobago', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Trinidad and Tobago', locales: ['en'] },
    UY: { name: 'Uruguay', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Uruguay (Law 18.331)', locales: ['es-UY'] },
    VE: { name: 'Venezuela', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Venezuela', locales: ['es-VE'] },
    // ─── Caribbean ────────────────────────────────────────────────────────────
    AG: { name: 'Antigua and Barbuda', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Antigua and Barbuda', locales: ['en'] },
    BB: { name: 'Barbados', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Barbados', locales: ['en'] },
    BL: { name: 'Saint Barthélemy', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Barthélemy', locales: ['fr-BL'] },
    BM: { name: 'Bermuda', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Bermuda', locales: ['en'] },
    BS: { name: 'Bahamas', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Bahamas', locales: ['en'] },
    CU: { name: 'Cuba', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cuba', locales: ['es-CU'] },
    DM: { name: 'Dominica', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Dominica', locales: ['en'] },
    GD: { name: 'Grenada', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Grenada', locales: ['en'] },
    KN: { name: 'Saint Kitts and Nevis', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Kitts and Nevis', locales: ['en'] },
    LC: { name: 'Saint Lucia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Lucia', locales: ['en'] },
    PM: { name: 'Saint Pierre and Miquelon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Pierre and Miquelon', locales: ['fr-PM'] },
    PR: { name: 'Puerto Rico', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Puerto Rico', locales: ['es-PR', 'en'] },
    VC: { name: 'Saint Vincent and the Grenadines', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Saint Vincent and the Grenadines', locales: ['en'] },
    // ─── Asia — India ─────────────────────────────────────────────────────────
    IN: { name: 'India', type: 'country', complianceGroup: 'opt-in-dpdpa', default: 'opt-in-dpdpa', description: 'India (DPDPA)', locales: ['hi-IN', 'en', 'bn-IN', 'ta-IN'] },
    // ─── Asia — China ─────────────────────────────────────────────────────────
    CN: { name: 'China', type: 'country', complianceGroup: 'opt-in-china', default: 'opt-in-china', description: 'China (PIPL + DSL + CSL)', locales: ['zh-CN'] },
    // ─── Asia — Southeast Asia ────────────────────────────────────────────────
    BN: { name: 'Brunei', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Brunei (Personal Data Protection Order)', locales: ['ms-BN', 'en'] },
    ID: { name: 'Indonesia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Indonesia (PDP Law)', locales: ['id-ID'] },
    KH: { name: 'Cambodia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cambodia', locales: ['km-KH'] },
    LA: { name: 'Laos', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Laos', locales: ['lo-LA'] },
    MM: { name: 'Myanmar', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Myanmar', locales: ['my-MM'] },
    MY: { name: 'Malaysia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Malaysia (PDPA)', locales: ['ms-MY', 'zh-MY', 'en'] },
    PH: { name: 'Philippines', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Philippines (DPA)', locales: ['fil-PH', 'en'] },
    SG: { name: 'Singapore', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Singapore (PDPA)', locales: ['zh-SG', 'ms-SG', 'ta-SG', 'en'] },
    TH: { name: 'Thailand', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Thailand (PDPA — GDPR-style opt-in)', locales: ['th-TH'] },
    TL: { name: 'Timor-Leste', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Timor-Leste', locales: ['pt-TL'] },
    VN: { name: 'Vietnam', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Vietnam (PDPD)', locales: ['vi-VN'] },
    // ─── Asia — East Asia ─────────────────────────────────────────────────────
    HK: { name: 'Hong Kong', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Hong Kong SAR (PDPO)', locales: ['zh-HK'] },
    JP: { name: 'Japan', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Japan (APPI)', locales: ['ja-JP'] },
    KP: { name: 'North Korea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'North Korea', locales: ['ko-KP'] },
    KR: { name: 'South Korea', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'South Korea (PIPA)', locales: ['ko-KR'] },
    MN: { name: 'Mongolia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mongolia', locales: ['mn-MN'] },
    MO: { name: 'Macau', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Macau SAR (PDPA)', locales: ['zh-MO', 'pt-MO'] },
    TW: { name: 'Taiwan', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Taiwan (PDPL)', locales: ['zh-TW'] },
    // ─── Asia — South Asia ────────────────────────────────────────────────────
    AF: { name: 'Afghanistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Afghanistan', locales: ['fa-AF'] },
    BD: { name: 'Bangladesh', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Bangladesh', locales: ['bn-BD'] },
    BT: { name: 'Bhutan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Bhutan', locales: ['dz-BT'] },
    IO: { name: 'British Indian Ocean Territory', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'British Indian Ocean Territory', locales: ['en'] },
    LK: { name: 'Sri Lanka', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Sri Lanka', locales: ['si-LK', 'ta-LK'] },
    MV: { name: 'Maldives', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Maldives', locales: ['dv-MV'] },
    NP: { name: 'Nepal', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Nepal', locales: ['ne-NP'] },
    PK: { name: 'Pakistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Pakistan', locales: ['ur-PK', 'en'] },
    // ─── Asia — Central Asia ──────────────────────────────────────────────────
    AM: { name: 'Armenia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Armenia', locales: ['hy-AM'] },
    AZ: { name: 'Azerbaijan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Azerbaijan', locales: ['az-AZ'] },
    GE: { name: 'Georgia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Georgia', locales: ['ka-GE'] },
    KG: { name: 'Kyrgyzstan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Kyrgyzstan', locales: ['ky-KG', 'ru-KG'] },
    KZ: { name: 'Kazakhstan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Kazakhstan', locales: ['kk-KZ', 'ru-KZ'] },
    TJ: { name: 'Tajikistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Tajikistan', locales: ['tg-TJ'] },
    TM: { name: 'Turkmenistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Turkmenistan', locales: ['tk-TM'] },
    UZ: { name: 'Uzbekistan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Uzbekistan', locales: ['uz-UZ'] },
    // ─── Middle East ──────────────────────────────────────────────────────────
    AE: { name: 'United Arab Emirates', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'United Arab Emirates (UAE PDPL / DIFC DPL / ADGM DPR)', locales: ['ar-AE'] },
    BH: { name: 'Bahrain', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Bahrain (PDPL)', locales: ['ar-BH'] },
    IL: { name: 'Israel', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Israel (Privacy Protection Law)', locales: ['he-IL', 'ar-IL'] },
    IQ: { name: 'Iraq', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Iraq', locales: ['ar-IQ'] },
    IR: { name: 'Iran', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Iran', locales: ['fa-IR'] },
    JO: { name: 'Jordan', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Jordan', locales: ['ar-JO'] },
    KW: { name: 'Kuwait', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Kuwait', locales: ['ar-KW'] },
    LB: { name: 'Lebanon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Lebanon', locales: ['ar-LB'] },
    OM: { name: 'Oman', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Oman (PDPL)', locales: ['ar-OM'] },
    PS: { name: 'Palestine', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Palestine', locales: ['ar-PS'] },
    QA: { name: 'Qatar', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Qatar (PDPL)', locales: ['ar-QA'] },
    SA: { name: 'Saudi Arabia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Saudi Arabia (PDPL)', locales: ['ar-SA'] },
    SY: { name: 'Syria', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Syria', locales: ['ar-SY'] },
    YE: { name: 'Yemen', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Yemen', locales: ['ar-YE'] },
    // ─── Africa — West ────────────────────────────────────────────────────────
    BF: { name: 'Burkina Faso', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Burkina Faso', locales: ['fr-BF'] },
    BJ: { name: 'Benin', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Benin', locales: ['fr-BJ'] },
    CI: { name: "Côte d'Ivoire", type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: "Côte d'Ivoire", locales: ['fr-CI'] },
    CM: { name: 'Cameroon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cameroon', locales: ['fr-CM', 'en'] },
    CV: { name: 'Cabo Verde', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Cabo Verde', locales: ['pt-CV'] },
    GA: { name: 'Gabon', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Gabon', locales: ['fr-GA'] },
    GH: { name: 'Ghana', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Ghana (DPA)', locales: ['en'] },
    GM: { name: 'Gambia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Gambia', locales: ['en'] },
    GN: { name: 'Guinea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guinea', locales: ['fr-GN'] },
    GQ: { name: 'Equatorial Guinea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Equatorial Guinea', locales: ['es-GQ', 'fr-GQ'] },
    GW: { name: 'Guinea-Bissau', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Guinea-Bissau', locales: ['pt-GW'] },
    LR: { name: 'Liberia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Liberia', locales: ['en'] },
    ML: { name: 'Mali', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mali', locales: ['fr-ML'] },
    MR: { name: 'Mauritania', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mauritania', locales: ['ar-MR'] },
    NE: { name: 'Niger', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Niger', locales: ['fr-NE'] },
    NG: { name: 'Nigeria', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Nigeria (NDPA)', locales: ['en'] },
    SL: { name: 'Sierra Leone', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Sierra Leone', locales: ['en'] },
    SN: { name: 'Senegal', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Senegal', locales: ['fr-SN'] },
    TG: { name: 'Togo', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Togo', locales: ['fr-TG'] },
    // ─── Africa — East ────────────────────────────────────────────────────────
    BI: { name: 'Burundi', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Burundi', locales: ['fr-BI'] },
    DJ: { name: 'Djibouti', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Djibouti', locales: ['fr-DJ', 'ar-DJ'] },
    ER: { name: 'Eritrea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Eritrea', locales: ['ti-ER'] },
    ET: { name: 'Ethiopia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Ethiopia', locales: ['am-ET'] },
    KE: { name: 'Kenya', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Kenya (DPA)', locales: ['sw-KE', 'en'] },
    KM: { name: 'Comoros', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Comoros', locales: ['ar-KM', 'fr-KM'] },
    MG: { name: 'Madagascar', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Madagascar', locales: ['fr-MG'] },
    MU: { name: 'Mauritius', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Mauritius (DPA)', locales: ['en', 'fr-MU'] },
    MW: { name: 'Malawi', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Malawi', locales: ['en'] },
    MZ: { name: 'Mozambique', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Mozambique', locales: ['pt-MZ'] },
    RW: { name: 'Rwanda', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Rwanda (DPA)', locales: ['rw-RW', 'en'] },
    SC: { name: 'Seychelles', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Seychelles', locales: ['fr-SC', 'en'] },
    SO: { name: 'Somalia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Somalia', locales: ['so-SO'] },
    SS: { name: 'South Sudan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'South Sudan', locales: ['en'] },
    ST: { name: 'São Tomé and Príncipe', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'São Tomé and Príncipe', locales: ['pt-ST'] },
    TZ: { name: 'Tanzania', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Tanzania', locales: ['sw-TZ', 'en'] },
    UG: { name: 'Uganda', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Uganda (DPA)', locales: ['en'] },
    // ─── Africa — Southern ────────────────────────────────────────────────────
    AO: { name: 'Angola', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Angola', locales: ['pt-AO'] },
    BW: { name: 'Botswana', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Botswana (DPA)', locales: ['en'] },
    LS: { name: 'Lesotho', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Lesotho', locales: ['en'] },
    NA: { name: 'Namibia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Namibia', locales: ['en'] },
    SZ: { name: 'Eswatini', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Eswatini', locales: ['en'] },
    ZA: { name: 'South Africa', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'South Africa (POPIA)', locales: ['en', 'af-ZA'] },
    ZM: { name: 'Zambia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Zambia (DPA)', locales: ['en'] },
    ZW: { name: 'Zimbabwe', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Zimbabwe (DPA)', locales: ['en'] },
    // ─── Africa — North ───────────────────────────────────────────────────────
    DZ: { name: 'Algeria', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Algeria', locales: ['ar-DZ', 'fr-DZ'] },
    EG: { name: 'Egypt', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Egypt (DPA)', locales: ['ar-EG'] },
    LY: { name: 'Libya', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Libya', locales: ['ar-LY'] },
    MA: { name: 'Morocco', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Morocco', locales: ['ar-MA', 'fr-MA'] },
    SD: { name: 'Sudan', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Sudan', locales: ['ar-SD'] },
    TN: { name: 'Tunisia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Tunisia (DPA)', locales: ['ar-TN', 'fr-TN'] },
    // ─── Africa — Central ─────────────────────────────────────────────────────
    CD: { name: 'DR Congo', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'DR Congo', locales: ['fr-CD'] },
    CF: { name: 'Central African Republic', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Central African Republic', locales: ['fr-CF'] },
    CG: { name: 'Republic of Congo', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Republic of Congo', locales: ['fr-CG'] },
    TD: { name: 'Chad', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Chad', locales: ['fr-TD', 'ar-TD'] },
    // ─── Europe — Eastern ─────────────────────────────────────────────────────
    BY: { name: 'Belarus', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Belarus', locales: ['be-BY', 'ru-BY'] },
    MD: { name: 'Moldova', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Moldova', locales: ['ro-MD'] },
    RU: { name: 'Russia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Russia', locales: ['ru-RU'] },
    UA: { name: 'Ukraine', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Ukraine', locales: ['uk-UA'] },
    VA: { name: 'Holy See', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Holy See', locales: ['it-VA'] },
    // ─── Oceania ──────────────────────────────────────────────────────────────
    AU: { name: 'Australia', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'Australia (Privacy Act)', locales: ['en'] },
    FJ: { name: 'Fiji', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Fiji', locales: ['en'] },
    FM: { name: 'Micronesia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Micronesia', locales: ['en'] },
    KI: { name: 'Kiribati', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Kiribati', locales: ['en'] },
    MH: { name: 'Marshall Islands', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Marshall Islands', locales: ['en'] },
    MP: { name: 'Northern Mariana Islands', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Northern Mariana Islands', locales: ['en'] },
    NC: { name: 'New Caledonia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'New Caledonia', locales: ['fr-NC'] },
    NF: { name: 'Norfolk Island', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Norfolk Island', locales: ['en'] },
    NR: { name: 'Nauru', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Nauru', locales: ['en'] },
    NU: { name: 'Niue', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Niue', locales: ['en'] },
    NZ: { name: 'New Zealand', type: 'country', complianceGroup: 'general-privacy-consent', default: 'general-privacy-consent', description: 'New Zealand (Privacy Act)', locales: ['en'] },
    PF: { name: 'French Polynesia', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'French Polynesia', locales: ['fr-PF'] },
    PG: { name: 'Papua New Guinea', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Papua New Guinea', locales: ['en'] },
    PW: { name: 'Palau', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Palau', locales: ['en'] },
    SB: { name: 'Solomon Islands', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Solomon Islands', locales: ['en'] },
    TO: { name: 'Tonga', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Tonga', locales: ['en'] },
    TV: { name: 'Tuvalu', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Tuvalu', locales: ['en'] },
    VU: { name: 'Vanuatu', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Vanuatu', locales: ['fr-VU', 'en'] },
    WS: { name: 'Samoa', type: 'country', complianceGroup: 'notice-only', default: 'notice-only', description: 'Samoa', locales: ['en'] },
    // ─── Europe — GDPR-equivalent / adequacy ─────────────────────────────────
    UK: { name: 'United Kingdom', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'United Kingdom (UK GDPR + PECR)', locales: ['en'] },
    CH: { name: 'Switzerland', type: 'country', complianceGroup: 'opt-in', default: 'opt-in', description: 'Switzerland (revFADP)', locales: ['de-CH', 'fr-CH', 'it-CH'] },
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
