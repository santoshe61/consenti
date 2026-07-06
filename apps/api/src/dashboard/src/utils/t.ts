import en from '../../../../locale/en.json'

export type TranslationDict = typeof en
export type TranslationKey = Exclude<keyof TranslationDict, `_section_${string}`>

export function resolve(
  dict: TranslationDict,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let str = (dict as Record<string, string>)[key] ?? key
  if (!vars) return str
  for (const [k, v] of Object.entries(vars)) {
    str = str.split(`{{${k}}}`).join(String(v))
  }
  return str
}
