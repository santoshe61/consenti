/** ISO 639-1 prefixes of languages conventionally written right-to-left. */
const RTL_LANGUAGE_PREFIXES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi']

/**
 * Resolves the text direction for a locale. `override` (an explicit `core.dir` config value)
 * always wins; `'auto'` (or omitted) derives the direction from the locale's language prefix.
 */
export function resolveTextDirection(locale: string, override?: 'ltr' | 'rtl' | 'auto'): 'ltr' | 'rtl' {
  if (override === 'ltr' || override === 'rtl') return override
  const prefix = locale.slice(0, 2).toLowerCase()
  return RTL_LANGUAGE_PREFIXES.includes(prefix) ? 'rtl' : 'ltr'
}
