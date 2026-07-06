export interface ReadabilityWarning {
  field: string
  code: 'heading_too_long' | 'avg_sentence_too_long' | 'total_words_too_long'
  value: number
}

/** Strips HTML tags and returns plain text. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function sentenceCount(text: string): number {
  return (text.match(/[.!?]+/g) ?? []).length || 1
}

function wordCount(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/**
 * Advisory readability checks. None block saving — all are surface-level dashboard warnings.
 * Returns an array of warnings (empty = all clear).
 */
export function checkReadability(fields: {
  heading?: string
  htmlText?: string
}): ReadabilityWarning[] {
  const warnings: ReadabilityWarning[] = []

  if (fields.heading && fields.heading.length > 80) {
    warnings.push({ field: 'heading', code: 'heading_too_long', value: fields.heading.length })
  }

  if (fields.htmlText) {
    const plain = stripHtml(fields.htmlText)
    const words = wordCount(plain)
    const sentences = sentenceCount(plain)
    const avgWords = words.length / sentences

    if (avgWords > 25) {
      warnings.push({ field: 'htmlText', code: 'avg_sentence_too_long', value: Math.round(avgWords) })
    }

    if (words.length > 150) {
      warnings.push({ field: 'htmlText', code: 'total_words_too_long', value: words.length })
    }
  }

  return warnings
}
