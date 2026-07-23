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
export { ConsentAction } from './utils/consent-action'
export { CategoryAction } from './utils/category-action'
export { CategoryScript } from './utils/category-script'
export { BannerTrigger } from './utils/banner-trigger'
export { scanConsentScripts } from './utils/script-scanner'

export type { ConsentScriptOptions } from './utils/consent-script'
export type { ConsentActionOptions, ConsentActionParams } from './utils/consent-action'
export type { CategoryActionOptions, CategoryActionParams } from './utils/category-action'
export type { CategoryScriptOptions } from './utils/category-script'
export type { BannerTriggerOptions } from './utils/banner-trigger'

export type {
  ConsentiConfig,
  CoreConfig,
  ApiConfig,
  GtmConfig,
  UtilsConfig,
  ThemeConfig,
  Cookie,
  CookieMap,
  Button,
  ButtonStyle,
  ButtonAction,
  MainBanner,
  GpcBanner,
  PreferenceModal,
  Category,
  CategoryMap,
  ProfileConfig,
  RegisterableProfileConfig,
  ProfileTranslations,
  LocaleTranslations,
  ConsentValue,
  ConsentStatus,
  /** The 'accept_all' | 'reject_all' | 'custom' | 'update' submission classification — renamed on export to avoid colliding with the `ConsentAction` class above. */
  ConsentAction as ConsentActionType,
  ConsentRecord,
  ConsentReceipt,
  ConsentEvent,
  ParsedConsent,
  CookieOptions,
  ConsentiMessage,
  ResolvedProfile,
  ConsentiWidgetAPI,
  ConsentiEventName,
  ComplianceWidgetConfig,
  AgeGateWidgetConfig,
  TcfWidgetConfig,
  ParentalConsentRequiredDetail,
} from './types'
