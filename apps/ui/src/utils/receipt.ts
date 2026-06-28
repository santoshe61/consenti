/**
 * Consent receipt generation and download.
 *
 * When `core.allowReceipt: true`, the preference modal shows an opt-in checkbox.
 * If the user checks it before saving, `downloadReceipt()` is called after
 * `submitConsent()` to download a JSON file to their device.
 *
 * The receipt is a portable record of the user's choices at a specific point in time.
 * If `core.signCookies` is enabled, the receipt also includes the HMAC signature as
 * tamper evidence.
 */

import type { ConsentReceipt, ConsentValue } from '../types'

/** Parameters required to construct a consent receipt. */
export interface ReceiptParams {
  /** Visitor UUID from the `consenti_uid` cookie. */
  visitorId: string
  /** Numeric profile ID. */
  profileId: number
  /** Profile schema version at the time of consent. */
  profileVersion: number
  /** Locale active when consent was given. */
  locale: string
  /** The full consent map. */
  consent: ConsentValue
  /** HMAC-SHA256 hex signature, if `core.signCookies` is enabled. */
  signature?: string | undefined
}

/**
 * Builds a `ConsentReceipt` from the given parameters.
 * Sets `version: '1.0'` and `issuedAt` to the current time.
 *
 * @param params - Receipt content. See `ReceiptParams`.
 */
export function generateReceipt(params: ReceiptParams): ConsentReceipt {
  const receipt: ConsentReceipt = {
    version: '1.0',
    issuedAt: new Date().toISOString(),
    visitorId: params.visitorId,
    profileId: params.profileId,
    profileVersion: params.profileVersion,
    locale: params.locale,
    consent: params.consent,
  }
  if (params.signature) receipt.signature = params.signature
  return receipt
}

/**
 * Triggers a browser file download of the receipt as a pretty-printed JSON file.
 *
 * The filename is `consenti-receipt-{YYYY-MM-DD}.json`.
 * Uses `Blob` + `URL.createObjectURL` + a synthetic anchor click —
 * this approach is supported in all ES2020 target browsers.
 *
 * Silently returns when called in an SSR context.
 *
 * @param receipt - The receipt object returned by `generateReceipt()`.
 */
export function downloadReceipt(receipt: ConsentReceipt): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const json = JSON.stringify(receipt, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `consenti-receipt-${receipt.issuedAt.slice(0, 10)}.json`
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
