// Compliance-group keys and locale codes become directory / file names under `profiles/<tenant>/`,
// so they must be safe on every OS the API runs on — not just the one it was developed on.

const GROUP_KEY = /^[a-z0-9][a-z0-9_-]{0,63}$/
const LOCALE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/

// Reserved device names on Windows, whatever the extension (`con.json` is still the console).
const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

/** Version snapshots live in `profiles/<tenant>/<profileId>/`, the live copy in `profiles/<tenant>/<group>/`
 * — one namespace. A group named like a profile id would make the live-copy swap clobber its history. */
const PROFILE_ID_PREFIX = 'prof_'

export function isSafeGroupKey(value: unknown): value is string {
  return typeof value === 'string'
    && GROUP_KEY.test(value)
    && !WINDOWS_RESERVED.test(value)
    && !value.startsWith(PROFILE_ID_PREFIX)
}

export function isSafeLocale(value: unknown): value is string {
  return typeof value === 'string' && LOCALE.test(value) && !WINDOWS_RESERVED.test(value)
}

export const GROUP_KEY_RULE =
  'must be 1-64 lowercase letters, digits, "-" or "_", start with a letter or digit, and not be a reserved name or start with "prof_"'
export const LOCALE_RULE = 'must be a language tag such as "en" or "pt-BR"'

/** First problem found in a profile's path-forming fields, or null. Every field is optional —
 * a partial update only has to be valid for what it sends. */
export function findUnsafePathSegment(fields: {
  defaultLocale?: unknown
  complianceGroup?: unknown
  customComplianceGroup?: unknown
  locales?: unknown
  localeContentKeys?: string[]
}): string | null {
  const { defaultLocale, complianceGroup, customComplianceGroup, locales, localeContentKeys } = fields
  if (defaultLocale !== undefined && !isSafeLocale(defaultLocale)) return `defaultLocale ${LOCALE_RULE}`
  for (const [name, value] of [['complianceGroup', complianceGroup], ['customComplianceGroup', customComplianceGroup]] as const) {
    if (value !== undefined && value !== null && value !== '' && !isSafeGroupKey(value)) return `${name} ${GROUP_KEY_RULE}`
  }
  const all: unknown[] = [...(Array.isArray(locales) ? locales : []), ...(localeContentKeys ?? [])]
  if (locales !== undefined && !Array.isArray(locales)) return 'locales must be an array'
  const bad = all.find(l => !isSafeLocale(l))
  if (bad !== undefined) return `locale ${JSON.stringify(bad)} ${LOCALE_RULE}`
  // Windows and macOS file systems are case-insensitive: "en-US.json" and "en-us.json" are one file.
  const seen = new Set<string>()
  for (const l of Array.isArray(locales) ? locales as string[] : []) {
    const key = l.toLowerCase()
    if (seen.has(key)) return `locale "${l}" is listed twice (locale codes are compared case-insensitively)`
    seen.add(key)
  }
  return null
}
