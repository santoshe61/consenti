// Structured rich-text format shared between the admin dashboard's editor and the server:
// stored in the DB as a compact JSON string, safer than raw HTML since the renderer only ever
// emits a known whitelist of tags. `htmlToJson` (HTML → ContentDoc, needs a DOM parser) stays
// dashboard-only — everything here is DOM-independent so it also runs server-side, where
// `renderContentText` converts a stored field to the real HTML the widget's `innerHTML` expects.

export type ContentNode = TextNode | InlineNode | BlockNode | LinkNode | BrNode

export interface TextNode { t: 'text'; v: string }
export interface InlineNode { t: 'b' | 'i' | 'u'; c: ContentNode[] }
export interface BlockNode { t: 'p' | 'ul' | 'ol' | 'li'; c: ContentNode[] }
export interface LinkNode { t: 'a'; href: string; c: ContentNode[] }
export interface BrNode { t: 'br' }

export type ContentDoc = ContentNode[]

/** Render a `ContentDoc` to an HTML string (only ever emits the whitelisted tags above). */
export function jsonToHtml(doc: ContentDoc): string {
  return doc.map(renderNode).join('')
}

function renderNode(node: ContentNode): string {
  if (node.t === 'text') return escHtml(node.v)
  if (node.t === 'br') return '<br>'
  if (node.t === 'a') return `<a href="${escAttr(node.href)}">${node.c.map(renderNode).join('')}</a>`
  return `<${node.t}>${node.c.map(renderNode).join('')}</${node.t}>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * Converts a stored `htmlText`-style field to the real HTML the widget's `innerHTML` expects.
 * Handles both formats a field can be in: the compact `ContentDoc` JSON (current editor output)
 * and a legacy/embedded-profile plain HTML string (used as-is — already real HTML, and possibly
 * containing tags outside the whitelist that a JSON round-trip would otherwise drop).
 */
export function renderContentText(value: string | undefined | null): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.startsWith('[')) {
    try {
      return jsonToHtml(JSON.parse(trimmed) as ContentDoc)
    } catch { /* not actually JSON — fall through and treat as HTML */ }
  }
  return value
}

function nodeHasVisibleText(node: ContentNode): boolean {
  if (node.t === 'text') return node.v.trim().length > 0
  if (node.t === 'br') return false
  return node.c.some(nodeHasVisibleText)
}

/** Strips HTML tags to check for leftover visible text — used only as a fallback for the
 * legacy/embedded-profile plain-HTML-string case `renderContentText` also handles. */
function stripTagsHasVisibleText(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').trim().length > 0
}

/**
 * Whether a stored `htmlText`-style field has any actual visible text — used to enforce
 * mandatory-content rules (body text, category descriptions that must not be blank). A naive
 * `value.length > 0` check is not enough: an empty rich-text editor can still serialize to a
 * non-empty-looking `ContentDoc` JSON string (e.g. `"[]"` or a paragraph node with an empty text
 * node), which would pass a length check while rendering nothing. Mirrors `renderContentText`'s
 * two input shapes (`ContentDoc` JSON, or a legacy plain-HTML string) so client-side wizard
 * validation and the backend validator agree on exactly what counts as "blank."
 */
export function hasVisibleText(value: string | undefined | null): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('[')) {
    try {
      const doc = JSON.parse(trimmed) as ContentDoc
      return doc.some(nodeHasVisibleText)
    } catch { /* not actually JSON — fall through and treat as HTML/plain text */ }
  }
  return stripTagsHasVisibleText(trimmed)
}
