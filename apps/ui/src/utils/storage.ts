/**
 * Unified storage abstraction for consent data.
 *
 * `ConsentStorage` normalises `document.cookie` and `localStorage` behind a single
 * `read / write / remove` interface so the rest of the codebase does not need to
 * know which persistence backend is active.
 *
 * `'cookie'` is the default and recommended mode — consent written to a cookie is
 * visible across subdomains when a `Domain` attribute is set.
 * `'localStorage'` is origin-scoped and cannot be shared with subdomains; it is also
 * incompatible with API mode (which sets consent via `Set-Cookie` on the server).
 */

import type { CookieOptions } from '../types'
import { isClient } from './ssr'
import { getCookie, setCookie, deleteCookie } from './cookie'

/** The two supported storage backends. */
export type StorageMode = 'cookie' | 'localStorage'

/**
 * Abstraction layer over `document.cookie` and `localStorage`.
 *
 * All operations are SSR-safe — they return early without throwing when `isClient()` is `false`.
 */
export class ConsentStorage {
  /**
   * @param mode - `'cookie'` (default) or `'localStorage'`. Falls back to `'cookie'` if
   *               `localStorage` is requested but unavailable in the current environment.
   */
  constructor(private mode: StorageMode) {
    if (mode === 'localStorage' && isClient() && typeof localStorage === 'undefined') {
      console.warn('[Consenti] localStorage is not available, falling back to cookie storage')
      this.mode = 'cookie'
    }
  }

  /**
   * Reads a value from storage.
   *
   * @param key - Cookie name or localStorage key.
   * @returns The stored string value, or `null` if absent or SSR context.
   */
  read(key: string): string | null {
    if (!isClient()) return null
    if (this.mode === 'localStorage') {
      return localStorage.getItem(key)
    }
    return getCookie(key)
  }

  /**
   * Writes a value to storage.
   *
   * @param key   - Cookie name or localStorage key.
   * @param value - String value to persist.
   * @param opts  - Cookie attributes (ignored in localStorage mode).
   */
  write(key: string, value: string, opts: CookieOptions = {}): void {
    if (!isClient()) return
    if (this.mode === 'localStorage') {
      localStorage.setItem(key, value)
    } else {
      setCookie(key, value, opts)
    }
  }

  /**
   * Removes a value from storage.
   *
   * @param key  - Cookie name or localStorage key.
   * @param opts - Cookie `path` / `domain` attributes (must match the original write call).
   */
  remove(key: string, opts: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    if (!isClient()) return
    if (this.mode === 'localStorage') {
      localStorage.removeItem(key)
    } else {
      deleteCookie(key, opts)
    }
  }
}
