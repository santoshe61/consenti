// Structured content format: produced by the admin editor, consumed by the widget renderer.
// Stored in the DB as a compact JSON string. Safer than raw HTML: the renderer
// only emits a known whitelist of tags, preventing XSS.
//
// `ContentNode`/`ContentDoc`/`jsonToHtml` live in `@consenti/utils` (DOM-independent, so the
// server can render the same format) — re-exported here so existing dashboard imports are
// unaffected. `htmlToJson` needs a DOM parser, so it stays dashboard-only.

import type { ContentNode, ContentDoc } from '@consenti/utils'
import { jsonToHtml } from '@consenti/utils'

export type { ContentNode, ContentDoc } from '@consenti/utils'
export { jsonToHtml } from '@consenti/utils'

// Parse a stored value: JSON (new format) or legacy HTML string
export function parseContent(value: string): ContentDoc {
  if (!value || !value.trim()) return []
  const trimmed = value.trim()
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed) as ContentDoc } catch { /* fall through */ }
  }
  return htmlToJson(value)
}

// Serialize ContentDoc back to compact JSON string
export function serializeContent(doc: ContentDoc): string {
  if (!doc.length) return ''
  return JSON.stringify(doc)
}

// Convert an HTML string (from contenteditable or import) to ContentDoc
export function htmlToJson(html: string): ContentDoc {
  if (!html || !html.trim()) return []
  // DOMParser does not execute scripts or event handlers during parsing,
  // unlike setting innerHTML which can fire onerror/onload before the whitelist filter runs.
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return collectNodes([...doc.body.childNodes])
}

function collectNodes(nodes: ChildNode[]): ContentNode[] {
  const result: ContentNode[] = []
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) result.push({ t: 'text', v: text })
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      result.push(...fromElement(node as Element))
    }
  }
  return result
}

function fromElement(el: Element): ContentNode[] {
  const tag = el.tagName.toLowerCase()
  const children = collectNodes([...el.childNodes])

  switch (tag) {
    case 'br': return [{ t: 'br' }]
    case 'b': case 'strong': return [{ t: 'b', c: children }]
    case 'i': case 'em': return [{ t: 'i', c: children }]
    case 'u': return [{ t: 'u', c: children }]
    case 'ul': return [{ t: 'ul', c: children }]
    case 'ol': return [{ t: 'ol', c: children }]
    case 'li': return [{ t: 'li', c: children }]
    case 'a': return [{ t: 'a', href: el.getAttribute('href') ?? '', c: children }]
    case 'p': case 'div': case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      // Avoid wrapping a single block-level child in <p> again
      if (children.length === 1 && 'c' in children[0]! && (children[0].t === 'p' || children[0].t === 'ul' || children[0].t === 'ol'))
        return children
      return [{ t: 'p', c: children }]
    case 'span': {
      // execCommand may generate <span style="..."> for bold/italic/underline
      const s = (el as HTMLElement).style
      let nodes: ContentNode[] = children
      if (s.textDecoration?.includes('underline')) nodes = [{ t: 'u', c: nodes }]
      if (s.fontStyle === 'italic') nodes = [{ t: 'i', c: nodes }]
      if (s.fontWeight === 'bold' || s.fontWeight >= '700') nodes = [{ t: 'b', c: nodes }]
      return nodes
    }
    default:
      return children // unknown tag: pass through children
  }
}
