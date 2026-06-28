// Structured content format: produced by the admin editor, consumed by the widget renderer.
// Stored in the DB as a compact JSON string. Safer than raw HTML: the renderer
// only emits a known whitelist of tags, preventing XSS.

export type ContentNode = TextNode | InlineNode | BlockNode | LinkNode | BrNode

export interface TextNode { t: 'text'; v: string }
export interface InlineNode { t: 'b' | 'i' | 'u'; c: ContentNode[] }
export interface BlockNode { t: 'p' | 'ul' | 'ol' | 'li'; c: ContentNode[] }
export interface LinkNode { t: 'a'; href: string; c: ContentNode[] }
export interface BrNode { t: 'br' }

export type ContentDoc = ContentNode[]

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

// Render ContentDoc to HTML string (for editor display / export)
export function jsonToHtml(doc: ContentDoc): string {
  return doc.map(renderNode).join('')
}

function renderNode(node: ContentNode): string {
  if (node.t === 'text') return escHtml(node.v)
  if (node.t === 'br') return '<br>'
  if (node.t === 'a') return `<a href="${escAttr(node.href)}">${node.c.map(renderNode).join('')}</a>`
  return `<${node.t}>${node.c.map(renderNode).join('')}</${node.t}>`
}

// Convert an HTML string (from contenteditable or import) to ContentDoc
export function htmlToJson(html: string): ContentDoc {
  if (!html || !html.trim()) return []
  const container = document.createElement('div')
  container.innerHTML = html
  return collectNodes([...container.childNodes])
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

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
