/** ISO 639-1 prefixes of languages conventionally written right-to-left. Fallback for engines
 * without `Intl.Locale(...).getTextInfo()` support — this project's floor is Firefox 74+, and
 * `getTextInfo()` is a recent addition not yet universal. */
const RTL_LANGUAGE_PREFIXES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi']

/**
 * Resolves the text direction for a locale. `override` (an explicit `core.dir` config value)
 * always wins; `'auto'` (or omitted) derives the direction from `Intl.Locale(...).getTextInfo()`
 * when the engine supports it, falling back to a hand-maintained RTL-language-prefix table.
 */
export function resolveTextDirection(locale: string, override?: 'ltr' | 'rtl' | 'auto'): 'ltr' | 'rtl' {
  if (override === 'ltr' || override === 'rtl') return override
  try {
    const dir = new Intl.Locale(locale).getTextInfo?.().direction
    if (dir === 'ltr' || dir === 'rtl') return dir
  } catch {
    // Invalid/unparseable locale string, or Intl.Locale/getTextInfo unsupported — fall through.
  }
  const prefix = locale.slice(0, 2).toLowerCase()
  return RTL_LANGUAGE_PREFIXES.includes(prefix) ? 'rtl' : 'ltr'
}
