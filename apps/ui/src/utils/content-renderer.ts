// Safe renderer for Consenti structured content JSON.
// Accepts the JSON string produced by the admin editor and outputs sanitised HTML.
// Only a fixed whitelist of tags is emitted — no user-supplied attributes survive
// except 'href' on anchors (which is further sanitised to safe schemes).

type CNode = { t: string; v?: string; c?: CNode[]; href?: string }

export function renderContentJson(jsonValue: string): string {
  if (!jsonValue || !jsonValue.trim()) return ''
  const trimmed = jsonValue.trim()
  if (!trimmed.startsWith('[')) return ''
  try {
    const nodes = JSON.parse(trimmed) as unknown[]
    return nodes.map(n => renderNode(n as CNode)).join('')
  } catch {
    return ''
  }
}

const SAFE_WRAP = new Set(['b', 'i', 'u', 'p', 'ul', 'ol', 'li'])

function renderNode(node: CNode): string {
  if (node.t === 'text') return escHtml(String(node.v ?? ''))
  if (node.t === 'br') return '<br>'
  const inner = (node.c ?? []).map(n => renderNode(n as CNode)).join('')
  if (SAFE_WRAP.has(node.t)) return `<${node.t}>${inner}</${node.t}>`
  if (node.t === 'a') {
    const href = sanitizeHref(String(node.href ?? ''))
    return href ? `<a href="${escAttr(href)}" rel="noopener noreferrer">${inner}</a>` : inner
  }
  // Unknown node type: render children only (safe fallback)
  return inner
}

function sanitizeHref(href: string): string {
  const trimmed = href.trim()
  return /^(https?:|mailto:|\/|#)/.test(trimmed) ? trimmed : ''
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;')
}
