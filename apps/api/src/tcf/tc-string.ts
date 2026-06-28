// Simplified TC string encoder/decoder.
// This implementation stores a base64url-encoded JSON payload for basic compatibility.
// For full IAB TCF v2.2 compliance (binary bitfield encoding), use the iabtcf-core npm package.

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
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
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
    const raw = JSON.parse(Buffer.from(tcString, 'base64url').toString('utf8')) as {
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
