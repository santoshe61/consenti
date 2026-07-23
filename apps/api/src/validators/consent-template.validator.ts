import { COOKIE_PURPOSE_IDS } from '@consenti/utils'

export interface TemplateValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

const LEGAL_BASES = ['mandatory', 'consent', 'legitimate_interest']
const CPRA_CATEGORIES = ['sale', 'sharing', 'sensitive']

export function validateTemplateCookies(cookies: unknown): TemplateValidationResult {
  if (!cookies || typeof cookies !== 'object' || Array.isArray(cookies)) {
    return { valid: false, error: 'cookies must be an object keyed by parameter id' }
  }
  for (const [id, cookie] of Object.entries(cookies as Record<string, unknown>)) {
    if (!id.trim()) return { valid: false, error: 'cookie id must be non-empty' }
    if (!cookie || typeof cookie !== 'object') return { valid: false, error: `cookies["${id}"] must be an object` }
    const c = cookie as Record<string, unknown>
    if (!COOKIE_PURPOSE_IDS.includes(c['purpose'] as never)) {
      return { valid: false, error: `cookies["${id}"].purpose must be one of: ${COOKIE_PURPOSE_IDS.join(', ')}` }
    }
    if (typeof c['listenGpc'] !== 'boolean') {
      return { valid: false, error: `cookies["${id}"].listenGpc must be a boolean` }
    }
    if (c['preGrant'] !== undefined && typeof c['preGrant'] !== 'boolean') {
      return { valid: false, error: `cookies["${id}"].preGrant must be a boolean` }
    }
    if (c['cpraCategory'] !== undefined && !CPRA_CATEGORIES.includes(c['cpraCategory'] as string)) {
      return { valid: false, error: `cookies["${id}"].cpraCategory must be one of: ${CPRA_CATEGORIES.join(', ')}` }
    }
  }
  return { valid: true }
}

export function validateTemplateCategories(categories: unknown): TemplateValidationResult {
  if (!categories || typeof categories !== 'object' || Array.isArray(categories)) {
    return { valid: false, error: 'categories must be an object keyed by category id' }
  }
  const entries = Object.entries(categories as Record<string, unknown>)
  if (entries.length === 0) {
    return { valid: false, error: 'at least one category is required' }
  }
  for (const [id, category] of entries) {
    if (!category || typeof category !== 'object') return { valid: false, error: `categories["${id}"] must be an object` }
    const cat = category as Record<string, unknown>
    if (typeof cat['heading'] !== 'string' || !cat['heading'].trim()) {
      return { valid: false, error: `categories["${id}"].heading is required` }
    }
    if (typeof cat['htmlText'] !== 'string') {
      return { valid: false, error: `categories["${id}"].htmlText is required` }
    }
    if (!LEGAL_BASES.includes(cat['legalBasis'] as string)) {
      return { valid: false, error: `categories["${id}"].legalBasis must be one of: ${LEGAL_BASES.join(', ')}` }
    }
    if (!Array.isArray(cat['cookies'])) {
      return { valid: false, error: `categories["${id}"].cookies must be an array of parameter ids` }
    }
  }
  return { valid: true }
}

/** Enforces that every parameter id belongs to exactly one category — required for legal-basis derivation to be well-defined. */
export function validateExactlyOneCategoryPerCookie(
  cookies: Record<string, unknown>,
  categories: Record<string, { cookies: string[] }>,
): TemplateValidationResult {
  const membershipCount = new Map<string, number>()
  for (const cookieId of Object.keys(cookies)) membershipCount.set(cookieId, 0)
  for (const category of Object.values(categories)) {
    for (const cookieId of category.cookies) {
      membershipCount.set(cookieId, (membershipCount.get(cookieId) ?? 0) + 1)
    }
  }
  for (const [cookieId, count] of membershipCount) {
    if (count === 0) return { valid: false, error: `Parameter "${cookieId}" is not assigned to any category` }
    if (count > 1) return { valid: false, error: `Parameter "${cookieId}" is assigned to more than one category` }
  }
  return { valid: true }
}

/**
 * Purpose ↔ legal basis sanity check. A parameter with a non-`necessary` purpose sitting
 * in a `mandatory` category is a hard error (grants a tracking parameter with no consent
 * gate). A `necessary`-purpose parameter sitting outside a `mandatory` category is only a
 * warning — safer-but-broken direction (risks breaking site functionality), not itself illegal.
 */
export function validatePurposeLegalBasisAlignment(
  cookies: Record<string, { purpose?: string }>,
  categories: Record<string, { legalBasis: string; cookies: string[] }>,
): TemplateValidationResult {
  const categoryIdByCookie = new Map<string, string>()
  for (const [categoryId, category] of Object.entries(categories)) {
    for (const cookieId of category.cookies) categoryIdByCookie.set(cookieId, categoryId)
  }

  const warnings: string[] = []
  for (const [cookieId, cookie] of Object.entries(cookies)) {
    const categoryId = categoryIdByCookie.get(cookieId)
    if (!categoryId) continue
    const legalBasis = categories[categoryId]!.legalBasis
    const purpose = cookie.purpose

    if (legalBasis === 'mandatory' && purpose !== 'necessary') {
      return {
        valid: false,
        error: `Parameter "${cookieId}" has purpose "${purpose ?? 'unknown'}" but is assigned to a Strictly Necessary category — this grants a tracking parameter with no consent gate.`,
      }
    }
    if (legalBasis !== 'mandatory' && purpose === 'necessary') {
      warnings.push(`Parameter "${cookieId}" has purpose "necessary" but is assigned to a non-mandatory category — this may break site functionality since it can be denied.`)
    }
  }
  return { valid: true, ...(warnings.length > 0 ? { warnings } : {}) }
}

/** Full save-time validation for a Consent Template: shape checks, exactly-one-category membership, purpose/legal-basis alignment. */
export function validateConsentTemplate(cookies: unknown, categories: unknown): TemplateValidationResult {
  const cookiesResult = validateTemplateCookies(cookies)
  if (!cookiesResult.valid) return cookiesResult
  const categoriesResult = validateTemplateCategories(categories)
  if (!categoriesResult.valid) return categoriesResult

  const cookiesMap = cookies as Record<string, { purpose?: string }>
  const categoriesMap = categories as Record<string, { legalBasis: string; cookies: string[] }>

  const membershipResult = validateExactlyOneCategoryPerCookie(cookiesMap, categoriesMap)
  if (!membershipResult.valid) return membershipResult

  return validatePurposeLegalBasisAlignment(cookiesMap, categoriesMap)
}
