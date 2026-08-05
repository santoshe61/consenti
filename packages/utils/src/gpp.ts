// Simplified GPP (Global Privacy Platform) US National ("usnat") string encoder/decoder.
// Stores a base64url-encoded JSON payload, not the real IAB binary bit-string encoding —
// deliberately, not just unfinished: `@consenti/api` ships a spec-correct encoder using the
// optional `@iabgpp/cmpapi` peer dependency (see `apps/api/src/gpp/gpp-string.ts`), used
// automatically when it's installed. This simplified encoder is the fallback for everyone else,
// and the only option in `@consenti/ui`'s `window.__gpp` stub — unlike TCF, GPP's USNat section
// doesn't need a multi-megabyte Global Vendor List to encode correctly, but `@iabgpp/cmpapi`
// itself (all ~20 section encoders, GVL class, etc.) is large enough that bundling it into the
// widget would defeat "zero-dependency" for every site, not just ones using GPP — so it stays a
// server-only optional dependency, same bundle-size reasoning TCF already established.
//
// Implemented with the same manual base64url codec as `tcf.ts` (no `Buffer`), so this file works
// identically in Node (`@consenti/api`) and the browser (`@consenti/ui`) without a runtime dependency.

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function base64UrlEncode(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0
    const b1 = i + 1 < bytes.length ? bytes[i + 1] ?? 0 : 0
    const b2 = i + 2 < bytes.length ? bytes[i + 2] ?? 0 : 0
    out += B64_CHARS[b0 >> 2]
    out += B64_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)]
    if (i + 1 < bytes.length) out += B64_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)]
    if (i + 2 < bytes.length) out += B64_CHARS[b2 & 0x3f]
  }
  return out
}

function base64UrlDecode(str: string): Uint8Array {
  const lookup = new Map(B64_CHARS.split('').map((c, idx) => [c, idx]))
  const cleaned = str.replace(/[^A-Za-z0-9\-_]/g, '')
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i += 4) {
    const c0 = lookup.get(cleaned[i] ?? '') ?? 0
    const c1 = lookup.get(cleaned[i + 1] ?? '') ?? 0
    const c2 = cleaned[i + 2] !== undefined ? lookup.get(cleaned[i + 2] as string) : undefined
    const c3 = cleaned[i + 3] !== undefined ? lookup.get(cleaned[i + 3] as string) : undefined
    bytes.push((c0 << 2) | (c1 >> 4))
    if (c2 !== undefined) bytes.push(((c1 & 0x0f) << 4) | (c2 >> 2))
    if (c3 !== undefined) bytes.push(((c2 ?? 0) & 0x03) << 6 | c3)
  }
  return new Uint8Array(bytes)
}

// IAB's tri-state field convention: 0 = not applicable, 1 = opted out, 2 = did not opt out.
const NOT_APPLICABLE = 0
const OPTED_OUT = 1
const DID_NOT_OPT_OUT = 2

function optOutValue(applicable: boolean, optedOut: boolean): number {
  if (!applicable) return NOT_APPLICABLE
  return optedOut ? OPTED_OUT : DID_NOT_OPT_OUT
}

export interface GppStringInput {
  cmpId: number
  cmpVersion: number
  mspaCoveredTransaction: boolean
  mspaOptOutOptionMode: 0 | 1 | 2
  mspaServiceProviderMode: 0 | 1 | 2
  /** Whether the visitor opted out of sale-category cookies (cpraCategory: 'sale'). */
  saleOptOut: boolean
  /** Whether any cookie in the profile is tagged cpraCategory: 'sale'. */
  saleApplicable: boolean
  sharingOptOut: boolean
  sharingApplicable: boolean
  gpcDetected?: boolean
}

export function encodeGppString(input: GppStringInput): string {
  const payload = {
    v: 1,
    ts: Math.floor(Date.now() / 100),
    cmpId: input.cmpId,
    cmpV: input.cmpVersion,
    sect: 'usnat',
    saleOO: optOutValue(input.saleApplicable, input.saleOptOut),
    shareOO: optOutValue(input.sharingApplicable, input.sharingOptOut),
    // Targeted-advertising opt-out mirrors sharing opt-out — CPRA defines "sharing" as
    // cross-context behavioural advertising, which is what USNat's field covers.
    taOO: optOutValue(input.sharingApplicable, input.sharingOptOut),
    mspaCT: input.mspaCoveredTransaction ? 1 : 2,
    mspaOOM: input.mspaOptOutOptionMode,
    mspaSPM: input.mspaServiceProviderMode,
    ...(input.gpcDetected !== undefined ? { gpc: input.gpcDetected } : {}),
  }
  return base64UrlEncode(utf8Encode(JSON.stringify(payload)))
}

export interface DecodedGppString {
  version: number
  cmpId: number
  cmpVersion: number
  saleOptOut: number
  sharingOptOut: number
  targetedAdvertisingOptOut: number
  gpc?: boolean
  created: number
}

export function decodeGppString(gppString: string): DecodedGppString | null {
  try {
    const raw = JSON.parse(utf8Decode(base64UrlDecode(gppString))) as {
      v: number; cmpId: number; cmpV: number
      saleOO: number; shareOO: number; taOO: number; gpc?: boolean; ts: number
    }
    return {
      version: raw.v,
      cmpId: raw.cmpId,
      cmpVersion: raw.cmpV,
      saleOptOut: raw.saleOO,
      sharingOptOut: raw.shareOO,
      targetedAdvertisingOptOut: raw.taOO,
      ...(raw.gpc !== undefined ? { gpc: raw.gpc } : {}),
      created: raw.ts * 100,
    }
  } catch {
    return null
  }
}
