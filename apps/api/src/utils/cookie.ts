import type { ConsentDbRecord, ConsentValue } from '@consenti/types'

function buildCookieValue(consentJson: ConsentValue, timestamp: string): string {
  const entries = Object.entries(consentJson)
    .map(([k, v]) => `${k}:${v}`)
    .join('|')
  return `ConsentTimestamp:${timestamp}::${entries}`
}

export function buildConsentSetCookie(record: ConsentDbRecord): string {
  const name = `consenti_${record.visitorId}_${record.profileId}`
  const value = buildCookieValue(record.consentJson, record.createdAt)
  const secure = process.env['NODE_ENV'] === 'production' ? '; Secure' : ''
  return `${name}=${value}; SameSite=Lax${secure}; Path=/; Max-Age=31536000`
}

export function buildExpireSetCookie(visitorId: string, profileId: string): string {
  const name = `consenti_${visitorId}_${profileId}`
  const secure = process.env['NODE_ENV'] === 'production' ? '; Secure' : ''
  return `${name}=; SameSite=Lax${secure}; Path=/; Max-Age=0`
}
