export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Generates a Stripe-style prefixed ID (e.g. `cons_...`, `visi_...`) so the ID's type is
 * readable at a glance in events, receipts, and support tickets — mirrors the prefixes the
 * API already uses for its own record IDs (`randomConsentId`/`randomVisitorId` in
 * apps/api/src/utils/crypto.ts). `pcon` (parental consent token) is client-only — the
 * server just stores it as an opaque string, no matching server-side prefix exists.
 */
export function generatePrefixedId(prefix: 'cons' | 'visi' | 'pcon'): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}
