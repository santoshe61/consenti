/**
 * Public API entry point for `@consenti/ui`.
 *
 * This file is the only entry point for the ESM (`dist/index.mjs`) and UMD
 * (`dist/index.umd.js`) bundles. It exports exactly what end-users should import.
 *
 * React and Vue integrations are in separate subpath exports to enable full tree-shaking:
 *  - `@consenti/ui/react` — `useConsent()` hook for Next.js
 *  - `@consenti/ui/vue`   — `useConsent()` composable for Nuxt
 *
 * Importing from `@consenti/ui` never pulls in React or Vue code.
 */

export { ConsentiSetup } from './core/consenti-setup'
export { ConsentiPlugin } from './plugins/plugin.base'
export { ConsentiProfile } from './profile/consenti-profile'
export { ConsentScript } from './utils/consent-script'
export { CookieTrigger } from './utils/cookie-trigger'

export type { ConsentScriptOptions } from './utils/consent-script'
export type { CookieTriggerOptions } from './utils/cookie-trigger'

export type {
  ConsentiConfig,
  CoreConfig,
  ApiConfig,
  GtmConfig,
  UtilsConfig,
  ThemeConfig,
  Cookie,
  Button,
  ButtonStyle,
  ButtonAction,
  MainBanner,
  GpcBanner,
  PreferenceModal,
  Category,
  ProfileConfig,
  ProfileTranslations,
  LocaleTranslations,
  ConsentValue,
  ConsentStatus,
  ConsentAction,
  ConsentRecord,
  ConsentReceipt,
  ConsentEvent,
  ParsedConsent,
  CookieOptions,
  ConsentiMessage,
  ResolvedProfile,
  ConsentiWidgetAPI,
} from './types'
