import type { CookieMap, CategoryMap, ComplianceValidationResult, ComplianceViolation, ComplianceWarningItem } from '@consenti/types'
import { COMPLIANCE_VALIDATION_RULES, buildCookieCategoryIndex, getCookieLegalBasis } from '@consenti/utils'

export function validateProfileCompliance(
  cookies: CookieMap,
  categories: CategoryMap,
  complianceGroup: string,
): ComplianceValidationResult {
  const rules = COMPLIANCE_VALIDATION_RULES[complianceGroup]
  if (!rules) return { valid: true, errors: [], warnings: [] }

  const errors: ComplianceViolation[] = []
  const warnings: ComplianceWarningItem[] = []
  const categoryIndex = buildCookieCategoryIndex(categories)

  for (const [categoryId, category] of Object.entries(categories)) {
    const c = category as unknown as Record<string, unknown>

    for (const rule of rules.categoryErrors) {
      if (rule.check(c, undefined)) {
        errors.push({
          cookieId: categoryId,
          field: rule.field,
          message: rule.message(categoryId),
          rule: rule.rule,
        })
      }
    }

    for (const rule of rules.categoryWarnings) {
      if (rule.check(c, undefined)) {
        warnings.push({
          cookieId: categoryId,
          field: rule.field,
          message: rule.message(categoryId),
          suggestion: rule.suggestion,
        })
      }
    }
  }

  for (const [cookieId, cookie] of Object.entries(cookies)) {
    const c = cookie as unknown as Record<string, unknown>
    const legalBasis = getCookieLegalBasis(cookieId, categoryIndex)

    for (const rule of rules.cookieErrors) {
      if (rule.check(c, legalBasis)) {
        errors.push({
          cookieId,
          field: rule.field,
          message: rule.message(cookieId),
          rule: rule.rule,
        })
      }
    }

    for (const rule of rules.cookieWarnings) {
      if (rule.check(c, legalBasis)) {
        warnings.push({
          cookieId,
          field: rule.field,
          message: rule.message(cookieId),
          suggestion: rule.suggestion,
        })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
