// Simplified TC string encoder/decoder.
// This implementation stores a base64url-encoded JSON payload for basic compatibility.
// For full IAB TCF v2.2 compliance (binary bitfield encoding), use the iabtcf-core npm package.
//
// Implemented with a manual base64url codec over Uint8Array (no `Buffer`) so this file works
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

export interface TcStringInput {
  cmpId: number
  cmpVersion: number
  consentScreen: number
  consentLanguage: string
  vendorListVersion: number
  purposeConsents: number[]
  vendorConsents: number[]
}

export function encodeTcString(input: TcStringInput): string {
  const payload = {
    v: 2,
    ts: Math.floor(Date.now() / 100),
    cmpId: input.cmpId,
    cmpV: input.cmpVersion,
    cs: input.consentScreen,
    lang: input.consentLanguage.toUpperCase().slice(0, 2),
    vlV: input.vendorListVersion,
    pc: input.purposeConsents,
    vc: input.vendorConsents,
  }
  return base64UrlEncode(utf8Encode(JSON.stringify(payload)))
}

export interface DecodedTcString {
  version: number
  cmpId: number
  consentLanguage: string
  purposeConsents: number[]
  vendorConsents: number[]
  created: number
}

export function decodeTcString(tcString: string): DecodedTcString | null {
  try {
    const raw = JSON.parse(utf8Decode(base64UrlDecode(tcString))) as {
      v: number; cmpId: number; lang: string; pc: number[]; vc: number[]; ts: number
    }
    return {
      version: raw.v,
      cmpId: raw.cmpId,
      consentLanguage: raw.lang,
      purposeConsents: Array.isArray(raw.pc) ? raw.pc : [],
      vendorConsents: Array.isArray(raw.vc) ? raw.vc : [],
      created: raw.ts * 100,
    }
  } catch {
    return null
  }
}
