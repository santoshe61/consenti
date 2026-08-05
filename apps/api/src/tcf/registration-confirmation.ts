import { createHash } from 'node:crypto'
import type { RegistrationConfirmation } from '@consenti/types'

/** Hashes the fields that identify a specific CMP registration (`cmpId`/`cmpVersion`, plus
 * whatever else the caller passes — TCF also includes `publisherCC` since it changes which
 * TC-string encoder path runs). Never hash/store the raw values in the DB — only this hash,
 * compared against a fresh hash of the live static config on every check. */
export function hashRegistrationFields(fields: Record<string, string | number | undefined>): string {
  const normalized = Object.keys(fields).sort().map(k => `${k}=${fields[k] ?? ''}`).join('&')
  return createHash('sha256').update(normalized).digest('hex')
}

/** Whether the live static config's registration fields match the last-confirmed hash.
 * `enabled: false` always counts as confirmed — turning a framework off needs no proof of
 * registration. A missing confirmation (never confirmed) or a hash mismatch (fields changed
 * since the last confirmation) both count as unconfirmed. */
export function isRegistrationConfirmed(
  enabled: boolean | undefined,
  liveFields: Record<string, string | number | undefined>,
  confirmation: RegistrationConfirmation | undefined,
): boolean {
  if (!enabled) return true
  if (!confirmation) return false
  return confirmation.configHash === hashRegistrationFields(liveFields)
}
