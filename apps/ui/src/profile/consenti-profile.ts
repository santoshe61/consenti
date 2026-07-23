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
 *   cookies: {
 *     necessary: {},
 *     analytics: {},
 *   },
 *   defaultLocale: 'en',
 *   translations: {
 *     en: {
 *       mainBanner: {
 *         position: 'bottom',
 *         htmlText: 'We use cookies.',
 *         buttons: { 'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' } },
 *       },
 *       preferenceModal: {
 *         categories: {
 *           necessary: { heading: 'Necessary', htmlText: '...', legalBasis: 'mandatory', cookies: ['necessary'] },
 *         },
 *         buttons: { save: { text: 'Save', style: 'primary', action: 'submit' } },
 *       },
 *     },
 *   },
 * })
 *
 * const widget = new ConsentiSetup({ core: { profileId: profile.getType() } })
 * ```
 *
 * To instead patch one of Consenti's built-in profiles for a given `complianceGroup`
 * (rather than defining a full standalone profile), pass `complianceGroup` and
 * `deepMerge: true` with only the fields you want to override — see
 * `RegisterableProfileConfig` and the `complianceGroup`/`deepMerge` resolver behavior
 * in `profile-resolver.ts`.
 */

import type { ProfileConfig, RegisterableProfileConfig } from '../types'
import { registerProfile } from '../core/profile-resolver'

/** Starting point for auto-assigned local profile IDs. */
let nextLocalId = 1000

/**
 * Defines a local consent profile and registers it for use by `ConsentiSetup`.
 */
export class ConsentiProfile {
  private type: Symbol

  /**
   * @param config - Full profile configuration including cookies, locales, and UI text,
   *                 or a `{ complianceGroup, deepMerge: true, ... }` partial overlay to
   *                 patch a built-in profile instead of defining a standalone one.
   */
  constructor(private config: RegisterableProfileConfig) {
    this.type = Symbol((config as ProfileConfig).id ?? nextLocalId++)
    registerProfile(this.type, config)
  }

  /** Returns the auto-assigned numeric profile ID. Pass this to `core.profileId`. */
  getType(): Symbol {
    return this.type
  }

  /** Returns the raw config passed to the constructor. */
  toJSON(): RegisterableProfileConfig {
    return this.config
  }
}
