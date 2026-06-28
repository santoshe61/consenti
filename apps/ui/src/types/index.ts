/**
 * Re-exports all shared types from `@consenti/types`.
 *
 * All domain types live in the shared package so they can be imported by both
 * `@consenti/ui` and `@consenti/api` without duplication.
 *
 * Internal modules in `apps/ui/src/` import from `'../types'` (this file).
 * End-users import from `'@consenti/ui'` (the package root).
 */
export type {
  ConsentStatus,
  ConsentValue,
  ConsentAction,
  Cookie,
  ButtonStyle,
  ButtonAction,
  Button,
  MainBanner,
  GpcBanner,
  Category,
  PreferenceModal,
  LocaleTranslations,
  ProfileTranslations,
  ProfileConfig,
  PublicProfileResponse,
  ResolvedProfile,
  GtmConfig,
  UtilsConfig,
  ApiConfig,
  ThemeConfig,
  CoreConfig,
  ConsentiConfig,
  CookieOptions,
  ParsedConsent,
  ConsentRecord,
  ConsentReceipt,
  ConsentEvent,
  ConsentiMessage,
  ConsentiWidgetAPI,
} from '@consenti/types'

export { ConsentiPlugin } from '@consenti/types'
