/**
 * Locale resolution and deep-merge utilities.
 *
 * Consenti resolves translations in three steps:
 *  1. Exact match          — `'fr-CA'` → use `translations['fr-CA']`
 *  2. Language prefix      — `'fr-CA'` → try `translations['fr']` if `'fr-CA'` is absent
 *  3. Default locale       — fall back to `translations[defaultLocale]`
 *
 * Missing keys in the resolved locale are filled from the default locale via `deepMerge`,
 * so partial translations are safe — only the keys that differ need to be specified.
 */

import type { ProfileTranslations, LocaleTranslations } from '../types'

/**
 * Resolves the best-matching `LocaleTranslations` for a requested locale.
 *
 * The result is a deep merge of the default locale (base) and the resolved locale
 * (override), so any missing keys in the override are inherited from the base.
 *
 * @param translations  - All available locale translations from a `ProfileConfig`.
 * @param requested     - The desired locale (e.g. `'fr-CA'`).
 * @param defaultLocale - The fallback locale key (e.g. `'en'`). Must exist in `translations`.
 * @throws `Error` if `defaultLocale` is not found in `translations`.
 */
export function resolveLocale(
  translations: ProfileTranslations,
  requested: string,
  defaultLocale: string,
): LocaleTranslations {
  const base = translations[defaultLocale]
  if (!base) {
    throw new Error(`[Consenti] No translations found for defaultLocale "${defaultLocale}"`)
  }

  // 1. Exact match
  if (translations[requested]) {
    return deepMerge(base, translations[requested] as Partial<LocaleTranslations>)
  }

  // 2. Language prefix (e.g. 'fr' from 'fr-CA')
  const lang = requested.split('-')[0] ?? ''
  if (lang !== requested && translations[lang]) {
    return deepMerge(base, translations[lang] as Partial<LocaleTranslations>)
  }

  // 3. Default locale fallback
  return base
}

/**
 * Recursively merges `override` into `base`, returning a new object.
 *
 * Rules:
 * - `undefined` and `null` values in `override` are skipped (base values are kept).
 * - Arrays are replaced wholesale — individual array items are not merged.
 * - Plain objects are merged recursively.
 * - All other values are replaced by the override value.
 *
 * @param base     - The base object (default locale translations).
 * @param override - The partial override (requested locale translations).
 */
export function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base } as Record<string, unknown>

  for (const key in override) {
    const overrideVal = override[key]
    if (overrideVal === undefined || overrideVal === null) continue

    if (
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as object, overrideVal as Partial<object>)
    } else {
      result[key] = overrideVal
    }
  }

  return result as T
}
