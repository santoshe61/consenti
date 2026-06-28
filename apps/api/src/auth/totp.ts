import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buf: Buffer): string {
  let result = ''
  let bits = 0
  let value = 0
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 0x1f]
  return result
}

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
  const bytes: number[] = []
  let bits = 0
  let value = 0
  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8)
  let c = counter
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff
    c = Math.floor(c / 256)
  }
  const hmac = createHmac('sha1', secret).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

export function generateTotp(secret: string, time = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(time / 30_000))
}

const usedTokens = new Map<string, number>() // token → expiresAt

setInterval(() => {
  const now = Date.now()
  for (const [token, expiresAt] of usedTokens) {
    if (now >= expiresAt) usedTokens.delete(token)
  }
}, 90_000).unref()

export function verifyTotp(secret: string, token: string, window = 1): boolean {
  if (usedTokens.has(token)) return false
  const counter = Math.floor(Date.now() / 30_000)
  const secretBuf = base32Decode(secret)
  const tokenBuf = Buffer.from(token)
  for (let i = -window; i <= window; i++) {
    const expected = Buffer.from(hotp(secretBuf, counter + i))
    if (expected.length === tokenBuf.length && timingSafeEqual(expected, tokenBuf)) {
      usedTokens.set(token, Date.now() + 90_000)
      return true
    }
  }
  return false
}

export function totpQrUrl(secret: string, email: string, issuer = 'Consenti'): string {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${label}?${params.toString()}`
}
