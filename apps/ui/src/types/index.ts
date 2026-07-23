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
  ConsentShortValue,
  ConsentSource,
  ConsentCookieData,
  ConsentType,
  ConsentAction,
  Cookie,
  CookieMap,
  CookiePurpose,
  LegalBasis,
  ButtonStyle,
  ButtonAction,
  Button,
  MainBanner,
  GpcBanner,
  Category,
  CategoryMap,
  PreferenceModal,
  LocaleTranslations,
  ProfileTranslations,
  ProfileConfig,
  RegisterableProfileConfig,
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
  ConsentiMessage,
  ConsentiWidgetAPI,
  DeepPartial,
  NonEmptyArray,
  WidgetCountryResolverFn,
  ComplianceWidgetConfig,
  AgeGateWidgetConfig,
  TcfWidgetConfig,
  GpcMode,
  ComplianceType,
  ComplianceGroupId,
  ConsentEvent,
  ConsentiEventName,
  ConsentBeingSubmitted,
  ConsentDbRecord,
  ParentalConsentRequiredDetail
} from '@consenti/types'

export { ConsentiPlugin } from '@consenti/types'
