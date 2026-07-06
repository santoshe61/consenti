import type { Cookie, ComplianceValidationResult, ComplianceViolation, ComplianceWarningItem } from '@consenti/types'
import { COMPLIANCE_VALIDATION_RULES } from '@consenti/utils'

export function validateProfileCompliance(
  cookies: Cookie[],
  complianceGroup: string,
): ComplianceValidationResult {
  const rules = COMPLIANCE_VALIDATION_RULES[complianceGroup]
  if (!rules) return { valid: true, errors: [], warnings: [] }

  const errors: ComplianceViolation[] = []
  const warnings: ComplianceWarningItem[] = []

  for (const cookie of cookies) {
    const c = cookie as unknown as Record<string, unknown>

    for (const rule of rules.errors) {
      if (rule.check(c)) {
        errors.push({
          cookieId: cookie.id,
          field: rule.field,
          message: rule.message(cookie.id),
          rule: rule.rule,
        })
      }
    }

    for (const rule of rules.warnings) {
      if (rule.check(c)) {
        warnings.push({
          cookieId: cookie.id,
          field: rule.field,
          message: rule.message(cookie.id),
          suggestion: rule.suggestion,
        })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
