/**
 * Server-Side Rendering (SSR) guards.
 *
 * Every access to browser globals (`window`, `document`, `navigator`) must go through
 * these helpers. `new ConsentiSetup(config)` called during SSR — e.g. in a Next.js or
 * Nuxt server render — silently no-ops because `isClient()` returns `false` and the
 * constructor returns early before touching any DOM API.
 */

/**
 * Returns `true` when running in a browser environment with `window` and `document`
 * available. Returns `false` in Node.js, Deno, edge runtimes, and test environments
 * that do not provide a DOM.
 */
export const isClient = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'

/**
 * Returns the `window` object when running client-side, or `null` in SSR contexts.
 * Prefer this over bare `window` access in code that might run during SSR.
 */
export const safeWindow = (): (Window & typeof globalThis) | null =>
  isClient() ? window : null

/**
 * Returns the `document` object when running client-side, or `null` in SSR contexts.
 */
export const safeDocument = (): Document | null =>
  isClient() ? document : null

/**
 * Returns the `navigator` object when running client-side and `navigator` is defined,
 * or `null` otherwise. Some non-browser environments expose `window` but not `navigator`.
 */
export const safeNavigator = (): Navigator | null =>
  isClient() && typeof navigator !== 'undefined' ? navigator : null
