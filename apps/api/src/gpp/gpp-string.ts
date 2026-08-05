/**
 * Spec-correct IAB GPP (Global Privacy Platform) US National ("usnat") section encoding.
 *
 * Requires the optional `@iabgpp/cmpapi` peer dependency. Dynamically imported so
 * `@consenti/api` stays dependency-free for the majority of installs that never enable GPP,
 * matching the existing optional-peer-dependency pattern used for `@iabtechlabtcf/core` (TCF)
 * and the Mongo/Postgres/MySQL storage adapters. Unlike TCF's split (real encoder needs the
 * fetched GVL, so the widget can never use it), GPP's USNat section needs no vendor list — the
 * *only* reason this stays server-only is that `@iabgpp/cmpapi` itself (every GPP section's
 * encoder plus a GVL class) is large enough that bundling it into `@consenti/ui` would cost every
 * site loading the widget, not just ones using GPP. The widget's `window.__gpp` stub
 * (`apps/ui/src/core/gpp-stub.ts`) and this file's fallback both use the same simplified format
 * from `@consenti/utils`'s `encodeGppString` when this dependency isn't installed.
 *
 * Field-mapping simplifications, deliberately conservative rather than guessed:
 * - `TargetedAdvertisingOptOut` mirrors `SharingOptOut` — CPRA defines "sharing" as cross-context
 *   behavioural advertising, which is what USNat's targeted-advertising opt-out covers.
 * - `SensitiveDataProcessing` (a 16-topic array) and `KnownChildSensitiveDataConsents` (a 3-topic
 *   array) are left at the library's own defaults (0 = not applicable) rather than mapped from
 *   Consenti's single `cpraCategory: 'sensitive'` cookie flag — that flag doesn't distinguish
 *   which of the 16 GPP sensitive-data topics (health, race, immigration status, etc.) applies,
 *   so guessing per-topic values would fabricate a precision Consenti's cookie schema doesn't
 *   have. Deployments that need per-topic accuracy should encode this section themselves.
 */
import { encodeGppString as encodeSimplifiedGppString, type GppStringInput } from '@consenti/utils'

export type { GppStringInput }

type IabgppModule = typeof import('@iabgpp/cmpapi')

let importAttempted = false
let iabgppModule: IabgppModule | null = null
let warnedMissingDependency = false

async function loadIabgpp(): Promise<IabgppModule | null> {
  if (importAttempted) return iabgppModule
  importAttempted = true
  try {
    iabgppModule = await import('@iabgpp/cmpapi')
  } catch {
    iabgppModule = null
  }
  return iabgppModule
}

export async function isRealGppEncodingAvailable(): Promise<boolean> {
  return (await loadIabgpp()) !== null
}

// IAB's tri-state field convention for Notice/OptOut fields: 0 = not applicable,
// 1 = notice given / opted out (the more privacy-protective outcome),
// 2 = notice not given / did not opt out.
const NOT_APPLICABLE = 0
const YES_OR_OPTED_OUT = 1
const NO_OR_DID_NOT_OPT_OUT = 2

function noticeValue(applicable: boolean): number {
  return applicable ? YES_OR_OPTED_OUT : NOT_APPLICABLE
}

function optOutValue(applicable: boolean, optedOut: boolean): number {
  if (!applicable) return NOT_APPLICABLE
  return optedOut ? YES_OR_OPTED_OUT : NO_OR_DID_NOT_OPT_OUT
}

async function encodeRealGppString(input: GppStringInput): Promise<string | null> {
  const mod = await loadIabgpp()
  if (!mod) return null

  const { GppModel } = mod
  const model = new GppModel()

  model.setFieldValue('usnat', 'SharingNotice', noticeValue(input.sharingApplicable))
  model.setFieldValue('usnat', 'SaleOptOutNotice', noticeValue(input.saleApplicable))
  model.setFieldValue('usnat', 'SharingOptOutNotice', noticeValue(input.sharingApplicable))
  model.setFieldValue('usnat', 'TargetedAdvertisingOptOutNotice', noticeValue(input.sharingApplicable))

  model.setFieldValue('usnat', 'SaleOptOut', optOutValue(input.saleApplicable, input.saleOptOut))
  model.setFieldValue('usnat', 'SharingOptOut', optOutValue(input.sharingApplicable, input.sharingOptOut))
  // Targeted-advertising opt-out mirrors sharing opt-out — see file-level doc comment.
  model.setFieldValue('usnat', 'TargetedAdvertisingOptOut', optOutValue(input.sharingApplicable, input.sharingOptOut))

  model.setFieldValue('usnat', 'MspaCoveredTransaction', input.mspaCoveredTransaction ? 1 : 2)
  model.setFieldValue('usnat', 'MspaOptOutOptionMode', input.mspaOptOutOptionMode)
  model.setFieldValue('usnat', 'MspaServiceProviderMode', input.mspaServiceProviderMode)

  if (input.gpcDetected !== undefined) {
    model.setFieldValue('usnat', 'GpcSegmentIncluded', true)
    model.setFieldValue('usnat', 'Gpc', input.gpcDetected)
  }

  return model.encode()
}

/**
 * Encodes a GPP string carrying only the USNat section — the spec-correct binary encoding when
 * `@iabgpp/cmpapi` is installed, falling back to `@consenti/utils`'s simplified (non-spec)
 * encoder otherwise. Never throws.
 */
export async function encodeGppString(input: GppStringInput): Promise<string> {
  const real = await encodeRealGppString(input)
  if (real) return real

  if (!warnedMissingDependency) {
    warnedMissingDependency = true
    console.warn(
      '[consenti] GPP is enabled but the optional "@iabgpp/cmpapi" dependency is not installed. ' +
      'Falling back to a simplified, non-spec-compliant GPP string. Run ' +
      '`npm install @iabgpp/cmpapi` to produce real IAB-spec binary GPP strings.',
    )
  }
  return encodeSimplifiedGppString(input)
}
