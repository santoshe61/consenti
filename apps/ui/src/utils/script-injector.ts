/**
 * Shared `<script>` element injection/removal logic used by `ConsentScript` and
 * `CategoryScript`. Centralized so the src/attribute security validation
 * (`javascript:` URL rejection, inline event-handler attribute stripping) can't
 * silently diverge between the two.
 */

import { logger } from './console'

export interface ScriptInjectorOptions {
  /** Remote script `src` URL to inject. */
  src?: string
  /**
   * Inline JavaScript to inject (e.g. a GTM snippet).
   * WARNING: assigned directly to `script.innerHTML` — only pass a static, trusted literal.
   */
  unsafeInnerHTML?: string
  /** Additional HTML attributes applied to the injected `<script>` element. */
  attributes?: Record<string, string>
  /** Prefix used in rejection warnings (e.g. `'ConsentScript'`, `'CategoryScript'`). */
  warnPrefix: string
}

/** Builds and appends a `<script>` element to `<head>`, or returns `null` if rejected (unsafe `src`). */
export function injectScript(options: ScriptInjectorOptions): HTMLScriptElement | null {
  const script = document.createElement('script')
  if (options.src) {
    // Reject javascript: URLs — only allow http(s)/protocol-relative/relative paths.
    const src = options.src.trim()
    if (/^javascript:/i.test(src)) {
      logger.warn(`${options.warnPrefix}: rejected src with javascript: protocol`)
      return null
    }
    script.src = src
  }
  // unsafeInnerHTML is an intentional escape hatch for inline scripts (e.g. GTM snippet).
  // The content is the caller's responsibility — only pass trusted, static strings.
  if (options.unsafeInnerHTML) script.innerHTML = options.unsafeInnerHTML
  for (const [key, value] of Object.entries(options.attributes ?? {})) {
    // Strip inline event handler attributes (on*) — they bypass CSP and are never
    // a legitimate need here since the caller can use onLoad/onRevoke callbacks.
    if (/^on/i.test(key)) {
      logger.warn(`${options.warnPrefix}: rejected attribute "${key}" (inline event handlers are not allowed)`)
      continue
    }
    script.setAttribute(key, value)
  }
  document.head.appendChild(script)
  return script
}

/** Removes a previously injected `<script>` element, if present. */
export function revokeScript(scriptEl: HTMLScriptElement | null): void {
  scriptEl?.remove()
}
