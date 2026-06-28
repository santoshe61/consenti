/**
 * Client-side profile builder for API-less deployments.
 *
 * `ConsentiProfile` provides a type-safe way to define consent profiles directly
 * in application code, without running a backend. Each instance is registered in
 * the module-level profile registry so `ConsentiSetup` can resolve it by ID.
 *
 * IDs are auto-assigned starting from 1000 to avoid conflicts with API-backed profiles
 * (which use small sequential integers assigned by the database).
 *
 * @example
 * ```ts
 * import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'
 *
 * const profile = new ConsentiProfile({
 *   cookies: [
 *     { id: 'necessary', mandatory: true },
 *     { id: 'analytics' },
 *   ],
 *   defaultLocale: 'en',
 *   translations: {
 *     en: {
 *       mainBanner: {
 *         position: 'bottom',
 *         htmlText: 'We use cookies.',
 *         buttons: [{ text: 'Accept All', type: 'primary', cookies: '*' }],
 *       },
 *       preferenceModal: {
 *         categories: [],
 *         buttons: [{ text: 'Save', type: 'submit' }],
 *       },
 *     },
 *   },
 * })
 *
 * const widget = new ConsentiSetup({ core: { profileId: profile.getId() } })
 * ```
 */

import type { ProfileConfig } from '../types'
import { registerProfile } from '../core/profile-resolver'

/** Starting point for auto-assigned local profile IDs. */
let nextLocalId = 1000

/**
 * Defines a local consent profile and registers it for use by `ConsentiSetup`.
 */
export class ConsentiProfile {
  private id: number

  /**
   * @param config - Full profile configuration including cookies, locales, and UI text.
   */
  constructor(private config: ProfileConfig) {
    this.id = nextLocalId++
    registerProfile(this.id, config)
  }

  /** Returns the auto-assigned numeric profile ID. Pass this to `core.profileId`. */
  getId(): number {
    return this.id
  }

  /** Returns the raw `ProfileConfig` passed to the constructor. */
  toJSON(): ProfileConfig {
    return this.config
  }
}
