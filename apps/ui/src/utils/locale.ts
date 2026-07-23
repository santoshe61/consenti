import { DeepPartial } from '@consenti/types';

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
    return deepMerge(base, translations[requested])
  }

  // 2. Language prefix (e.g. 'fr' from 'fr-CA')
  const lang = requested.split('-')[0] ?? ''
  if (lang !== requested && translations[lang]) {
    return deepMerge(base, translations[lang])
  }

  // 3. Default locale fallback
  return base
}

/**
 * Recursively merges `override` into `base`, returning a new object.
 *
 * Rules:
 * - `undefined` values in `override` are skipped (base values are kept).
 * - `null` values in `override` delete the corresponding key from the merged
 *   result (JSON Merge Patch / RFC 7396 semantics) — e.g. `{ marketing: null }`
 *   removes the `marketing` entry from a `CategoryMap`/`CookieMap`.
 * - Arrays are merged by index — individual array items are merged, not replaced wholesale.
 * - Plain objects are merged recursively.
 * - All other values are replaced by the override value.
 *
 * @param base     - The base object (default locale translations).
 * @param override - The partial override (requested locale translations).
 */
/**
 * Returns the best locale match from `availableLocales` for the given browser language list.
 * Uses the same 3-step algorithm as `resolveLocale`: exact → language-prefix → undefined.
 */
export function detectUserLocale(
  browserLanguages: readonly string[],
  availableLocales: string[],
): string | undefined {
  for (const lang of browserLanguages) {
    if (availableLocales.includes(lang)) return lang
    const prefix = lang.split('-')[0] ?? ''
    const prefixMatch = availableLocales.find(l => l === prefix || l.startsWith(`${prefix}-`))
    if (prefixMatch) return prefixMatch
  }
  return undefined
}

type Primitive = string | number | boolean | bigint | symbol | null | undefined

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function mergeValue(base: unknown, override: unknown): unknown {
  if (override === undefined) {
    return base
  }

  // JSON Merge Patch (RFC 7396): an explicit `null` deletes the key from the
  // parent object — handled in the object-merge branch below, where the key
  // can actually be removed from the result. Reaching here means `null` was
  // passed as a top-level/array value with no parent key to delete, so it's
  // treated as a plain override value.
  if (override === null) {
    return base
  }

  // Merge arrays by index
  if (Array.isArray(base) && Array.isArray(override)) {
    const length = Math.max(base.length, override.length)

    return Array.from({ length }, (_, i) => {
      if (i >= override.length) return base[i]
      if (i >= base.length) return override[i]

      return mergeValue(base[i], override[i])
    })
  }

  // Merge plain objects
  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = { ...base }

    for (const key of Object.keys(override)) {
      const overrideValue = override[key]
      if (overrideValue === null) {
        delete result[key]
        continue
      }
      result[key] = mergeValue(base[key], overrideValue)
    }

    return result
  }

  // Primitive or incompatible types -> override wins
  return override
}

export function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  return mergeValue(base, override) as T
}