/**
 * Profile resolution — fetches or looks up the active consent profile.
 *
 * Resolution order:
 *  1. **API mode** (`config.api.enabled = true`)
 *     → Fetch `GET /consenti/api/v1/profile/{id}?locale={locale}` from the backend.
 *       The server resolves locale and returns a flat `ResolvedProfile`.
 *       Falls through to step 2 on network failure.
 *  2. **Local registry** (`config.core.profileId > 0`)
 *     → Look up a profile registered via `new ConsentiProfile(config)`.
 *       Locale resolution is performed client-side via `resolveLocale()`.
 *  3. **Built-in default** (`config.core.profileId === 0`)
 *     → Return the minimal English GDPR profile with necessary/analytics/marketing cookies.
 */

import type { ConsentiConfig, ResolvedProfile, ProfileConfig, PublicProfileResponse } from '../types'
import { httpRequest } from '../utils/http'
import { resolveLocale } from '../utils/locale'

/** Module-level registry populated by `ConsentiProfile` constructor calls. */
const profileRegistry = new Map<number, ProfileConfig>()

/**
 * Registers a local profile so it can be resolved by `resolveProfile()`.
 * Called automatically by `ConsentiProfile` — consumers do not call this directly.
 *
 * @param id     - The numeric profile ID.
 * @param config - The `ProfileConfig` to register.
 */
export function registerProfile(id: number, config: ProfileConfig): void {
  profileRegistry.set(id, config)
}

/**
 * Returns a previously registered local profile, or `undefined` if not found.
 *
 * @param id - The numeric profile ID to look up.
 */
export function getRegisteredProfile(id: number): ProfileConfig | undefined {
  return profileRegistry.get(id)
}

/**
 * Built-in default profile — used when `core.profileId === 0` (or omitted) and no API
 * is configured. Covers the four Google Consent Mode v2 purposes plus a necessary
 * functional bucket, giving a realistic starting point for any GTM-backed site.
 */
export const DEFAULT_PROFILE: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  cookies: [
    { id: 'functionality_storage', mandatory: true },
    {
      id: 'analytics_storage',
      listenGpc: true,
      expiry: 365,
    },
    {
      id: 'ad_storage',
      listenGpc: true,
      expiry: 365,
    },
    {
      id: 'ad_user_data',
      listenGpc: true,
      expiry: 365,
    },
    {
      id: 'ad_personalization',
      listenGpc: true,
      expiry: 365,
    },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'We value your privacy',
    htmlText:
      'We use cookies to enhance your browsing experience, serve personalised ads or content, ' +
      'and analyse our traffic. By clicking <strong>Accept All</strong> you consent to our use ' +
      'of cookies. You may change your preferences at any time.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject All', cookies: '!', style: 'primary', action: 'custom' },
      { text: 'Manage Preferences', style: 'secondary', action: 'manage' },
    ],
  },
  preferenceModal: {
    heading: 'Cookie Preferences',
    subheading: 'Choose which cookies you allow us to use.',
    htmlText:
      'We use different types of cookies to optimise your experience. You can choose to ' +
      'enable or disable each category below. Necessary cookies cannot be disabled as they ' +
      'are required for core site functionality.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are essential for the website to function correctly. ' +
          'They include authentication, security, and accessibility features. ' +
          'They cannot be disabled.',
        mandatory: true,
        cookies: ['functionality_storage'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'These cookies help us understand how visitors interact with our website by ' +
          'collecting and reporting information anonymously. This allows us to improve the ' +
          'site over time. (e.g. Google Analytics)',
        cookies: ['analytics_storage'],
      },
      {
        id: 'cat-advertising',
        heading: 'Advertising',
        htmlText:
          'These cookies are used to deliver advertisements more relevant to you and your ' +
          'interests. They are also used to limit the number of times you see an ad and to ' +
          'help measure the effectiveness of advertising campaigns. ' +
          '(e.g. Google Ads, Meta Pixel)',
        cookies: ['ad_storage', 'ad_user_data', 'ad_personalization'],
      },
    ],
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Save Preferences', style: 'primary', action: 'submit' },
      { text: 'Reject All', cookies: '!', style: 'primary', action: 'custom' },
    ],
  },
}

/**
 * Resolves the active `ResolvedProfile` for the given widget configuration.
 *
 * @param config - The full `ConsentiConfig` from `new ConsentiSetup(config)`.
 * @returns      A fully resolved profile ready for rendering.
 * @throws       `Error` if `profileId > 0` and the profile is not registered nor reachable via API.
 */
export async function resolveProfile(config: ConsentiConfig): Promise<ResolvedProfile> {
  const locale = config.core.locale ?? 'en'
  const profileId = config.core.profileId ?? 0

  if (config.api?.enabled) {
    try {
      const base = config.api.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')
      const url = `${base}/consenti/api/v1/profiles/${profileId}/${encodeURIComponent(locale)}`
      const apiProfile = await httpRequest<PublicProfileResponse>(url, {}, config.api.authToken)
      return {
        id: profileId,
        version: apiProfile.version,
        defaultLocale: apiProfile.defaultLocale,
        locales: apiProfile.locales,
        cookies: apiProfile.cookies,
        mainBanner: apiProfile.mainBanner,
        preferenceModal: apiProfile.preferenceModal,
        ...(apiProfile.gpcBanner != null ? { gpcBanner: apiProfile.gpcBanner } : {}),
      }
    } catch {
      console.warn('[Consenti] API profile fetch failed, falling back to local profile')
    }
  }

  if (profileId > 0) {
    const local = profileRegistry.get(profileId)
    if (local) {
      const resolved = resolveLocale(local.translations ?? {}, locale, local.defaultLocale)
      return {
        id: profileId,
        version: 1,
        defaultLocale: local.defaultLocale,
        locales: Object.keys(local.translations ?? {}),
        cookies: local.cookies ?? [],
        mainBanner: resolved.mainBanner,
        ...(resolved.gpcBanner ? { gpcBanner: resolved.gpcBanner } : {}),
        preferenceModal: resolved.preferenceModal,
        ...(local.darkMode !== undefined ? { darkMode: local.darkMode } : {}),
      }
    }
    throw new Error(
      `[Consenti] Profile ${profileId} not found. ` +
      `Register it with ConsentiProfile or enable the API.`,
    )
  }

  return DEFAULT_PROFILE
}
