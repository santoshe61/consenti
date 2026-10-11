const MAX_LANGUAGES = 20
const MAX_TAG_LENGTH = 35

function cleanTag(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const tag = value.trim()
  return tag.length > 0 && tag.length <= MAX_TAG_LENGTH ? tag : undefined
}

/** Untrusted `languages` from the widget's `data` hint — non-strings and oversized tags are dropped, count is capped. */
export function sanitizeLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const tags: string[] = []
  for (const item of value) {
    const tag = cleanTag(item)
    if (tag) tags.push(tag)
    if (tags.length === MAX_LANGUAGES) break
  }
  return tags
}

/** `en-GB,en;q=0.9,de;q=0.8` → `['en-GB', 'en', 'de']`, in header order. */
export function parseAcceptLanguage(header: string): string[] {
  return sanitizeLanguages(header.split(',').map(part => part.split(';')[0]))
}

export function sanitizeLocale(value: unknown): string {
  return cleanTag(value) ?? ''
}
