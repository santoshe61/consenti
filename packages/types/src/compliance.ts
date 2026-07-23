/**
 * Compliance-related literal types, derived from the regulation/group ID data
 * that lives in @consenti/utils (packages/utils/src/compliance.ts).
 *
 * This import is type-only and fully erased at compile time — @consenti/types
 * has no runtime dependency on @consenti/utils. The actual data (COMPLIANCE_GROUPS,
 * EMBEDDED_COMPLIANCE_MAP, COMPLIANCE_VALIDATION_RULES, GPC_OPTIONS, etc.) lives in
 * @consenti/utils; import it from there.
 *
 * HOW TO ADD A NEW REGULATION OR COMPLIANCE GROUP: see the header comment in
 * packages/utils/src/compliance.ts — these types auto-update from that data.
 */
import type { COMPLIANCE_REGULATION_IDS, COMPLIANCE_GROUP_IDS } from '@consenti/utils'

export type Compliance = typeof COMPLIANCE_REGULATION_IDS[number]

export type ComplianceGroupId = typeof COMPLIANCE_GROUP_IDS[number]

/**
 * `(string & {})` (rather than plain `string`) keeps IDE autocomplete for the
 * known `ComplianceGroupId` literals while still allowing any other string —
 * used to target a profile authored against a custom (non-built-in)
 * `customComplianceGroup` instead of one of the 8 built-in groups.
 */
export type ComplianceType = 'auto' | ComplianceGroupId | (string & {}) | Symbol