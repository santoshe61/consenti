import type { MainBanner, GpcBanner, PreferenceModal, ContentValidationError, ContentValidationResult } from '@consenti/types'
import { hasVisibleText } from '@consenti/utils'

/**
 * Mandatory-content backstop — the actual enforcement for bulk CSV/JSON import, which bypasses
 * the dashboard wizard's step-by-step gating entirely. Validates already-resolved content (the
 * shape the dashboard now sends per `StoredProfileJson`/`LocaleContentInput` — see
 * `plans/PENDING-profile-storage-buttons-wizard-revamp.md` Phase 3/4), not raw author input.
 *
 * Rules (heading is intentionally optional everywhere — only body text, button labels, and
 * category headings are mandatory):
 * - Main Banner / GPC Banner: `htmlText` mandatory (`hasVisibleText`), every button's `text` mandatory.
 * - Preference Modal: `heading` mandatory, every button's `text` mandatory, every category's `heading` mandatory.
 *
 * Trusts the submitted button/category id set as authoritative (matches this codebase's existing
 * `validateProfileCompliance` convention of validating submitted values, not re-fetching templates
 * to cross-check the id set) — the dashboard always submits one button entry per template button
 * by construction (see `ProfileEditor.tsx` `resolveLocaleContent()`), so a blank `text` on a
 * submitted entry is exactly the case this needs to catch.
 */
function validateBanner(locale: string, section: 'mainBanner' | 'gpcBanner', banner: MainBanner | GpcBanner): ContentValidationError[] {
  const errors: ContentValidationError[] = []
  if (!hasVisibleText(banner.htmlText)) {
    errors.push({ locale, section, field: 'htmlText', message: 'Body text is required' })
  }
  for (const [buttonId, btn] of Object.entries(banner.buttons)) {
    if (!btn.text?.trim()) {
      errors.push({ locale, section, field: `buttons.${buttonId}`, message: `Label for button "${buttonId}" is required` })
    }
  }
  return errors
}

function validateModal(locale: string, modal: PreferenceModal): ContentValidationError[] {
  const errors: ContentValidationError[] = []
  if (!modal.heading?.trim()) {
    errors.push({ locale, section: 'preferenceModal', field: 'heading', message: 'Heading is required' })
  }
  for (const [buttonId, btn] of Object.entries(modal.buttons)) {
    if (!btn.text?.trim()) {
      errors.push({ locale, section: 'preferenceModal', field: `buttons.${buttonId}`, message: `Label for button "${buttonId}" is required` })
    }
  }
  for (const [categoryId, category] of Object.entries(modal.categories)) {
    if (!category.heading?.trim()) {
      errors.push({ locale, section: 'preferenceModal', field: `categories.${categoryId}.heading`, message: `Heading for category "${categoryId}" is required` })
    }
  }
  return errors
}

/**
 * Validates every locale in `localeContents` (default locale + any non-default locales from
 * `localeContent`) against the mandatory-content matrix. GPC banner rules only apply to a locale
 * that actually submitted `gpcBanner` content — a profile with `gpcMode: 'ignore'` (or a locale
 * nobody's authored a GPC variant for) simply omits it, which isn't itself an error.
 */
export function validateProfileContent(
  localeContents: Record<string, { mainBanner: MainBanner; gpcBanner?: GpcBanner; preferenceModal: PreferenceModal }>,
): ContentValidationResult {
  const errors: ContentValidationError[] = []
  for (const [locale, content] of Object.entries(localeContents)) {
    errors.push(...validateBanner(locale, 'mainBanner', content.mainBanner))
    if (content.gpcBanner) errors.push(...validateBanner(locale, 'gpcBanner', content.gpcBanner))
    errors.push(...validateModal(locale, content.preferenceModal))
  }
  return { valid: errors.length === 0, errors }
}
