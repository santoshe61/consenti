# Changelog

All notable changes to Consenti are listed here in reverse chronological order.
Each entry is a summary of diff, migration notes, and breaking-changes.

For unreleased in-progress work, see the raw files in [`./changelog/`](./changelog/).

---
<!-- Changelpg entries here -->
## [0.2.0] - 2026-07-05

### Summary
White-label dashboard branding, geo-based compliance routing, full i18n/a11y sweep of the admin dashboard SPA, expanded `@consenti/ui` public API (10 new methods), security hardening, minified production builds, dashboard config injection via `window.__CONSENTI_CONFIG__`, consent category toggle redesign, UITemplateEditor and ProfileEditor wizard flows, "How Consenti Works" dashboard page, modal scroll-lock, show/hide password toggle on login, locale switcher fix, and Algolia DocSearch integration.

### Added

#### `@consenti/ui`
- `isCookieGranted(cookieId, requestValue?)` — single-cookie grant check; returns `boolean` or raw `ConsentStatus` when `requestValue = true`
- `isCategoryGranted(categoryId, requestValue?)` — category-level grant check; returns `boolean` (ALL cookies must be granted) or per-cookie status records when `requestValue = true`
- `grantAll(onlyMandatory?)` — programmatically accept all cookies; pass `true` to grant only mandatory and deny the rest
- `denyAll(includingMandatory?)` — programmatically reject non-mandatory cookies; pass `true` to deny all including mandatory (logs a warning)
- `on(event, handler)` / `off(event, handler)` — typed event subscription API; `consenti:` prefix is optional on event names
- `version()` — returns `{ package, profileVersion, consentVersion }` for debugging and diagnostics
- `setDarkMode(enable?)` — toggle or set dark mode at runtime without re-initialising
- `setTheme(theme)` — hot-swap CSS token overrides at runtime (merges into current theme)
- `setConfig(config)` — deep-merge a partial config at runtime; re-applies theme and dark mode side-effects
- `setProfile(override)` — merge a partial profile override and re-render visible UI without a network call
- `ConsentScript` `bind` option — `bind: false` disables the automatic remove/re-inject listener (evaluate consent once at construction only)
- Preference modal now locks page scroll when open (overlay or mobile full-screen); restored on close or destroy
- `hidePoweredBy?: boolean` on `ConsentiConfig` — suppresses the "Powered by Consenti" attribution in banner and modal
- Toggle now renders inline SVG check (✓) and cross (✕) icons inside the track — check fades in on the left when ON, cross fades in on the right when OFF

#### `@consenti/api`
- `branding` config block (`appName`, `appLogoPath`, `hidePoweredBy`) on `ConsentiServerConfig` — dashboard login page, sidebar logo, and "Powered by Consenti" badge driven by this config
- `BrandingConfig` type exported from the package
- `createConsenti()` now returns a `ready: Promise<void>` that resolves after storage connects and the admin user is bootstrapped
- Dashboard config injection via `window.__CONSENTI_CONFIG__` — server-side inline script replaces the old `fetch('./consentiConfig.json')` mechanism; config is built once at startup and injected before `</head>` in all HTML responses
- `compliance.type` — `'auto'` (default) geo-resolves compliance group per visitor; a fixed `ComplianceGroupId` applies one group globally
- `compliance.geoDataProvider` — `'language' | 'timezone' | 'geoip' | 'hosted-geoip-lite' | CountryResolverFn`; defaults to `'timezone'`; `'geoip'` requires optional peer dep `geoip-lite`
- `compliance.autoComplianceMap` — `'default'` (embedded 2026-07 map), operator-supplied object, or `'auto'` (remote fetch from `complianceMapUrl`)
- `GET /api/profiles/auto/:locale?tz=<iana-tz>` — geo-resolves compliance group, finds active profile tagged to that group, returns `resolvedComplianceGroup` in response
- `POST /admin/profiles/validate` — standalone compliance validation endpoint
- `GET /admin/compliance-coverage` — active profile (or null) per compliance group; powers coverage panel in dashboard
- `GET /admin/export/translations/:profileId` — CSV export of all translatable fields for all locales
- `POST /admin/profiles` + `PUT /admin/profiles/:id` now run server-side compliance validation; 422 on errors, 200 + `warnings` array on soft warnings
- `src/data/compliance-constants.ts` — `COMPLIANCE_GROUPS`, `GPC_OPTIONS`, `LEGAL_BASIS_OPTIONS`, `CPRA_CATEGORIES`, `TCF_PURPOSES` (P1–P11), `TCF_SPECIAL_FEATURES` (SF1–SF2), `COMPLIANCE_VALIDATION_RULES`, `EMBEDDED_COMPLIANCE_MAP` (EU27 + EEA + US states + IN + BR + CA + APAC)
- `src/data/timezone-country.ts` — IANA timezone → ISO-3166-1 alpha-2 lookup (~400 entries, zero deps)
- `GeoResolverService` — 4 built-in strategies + `CountryResolverFn` adaptor; correct 3-step lookup: region override → base country group → country default (most strict)
- `validateProfileCompliance(cookies, complianceGroup)` — shared validator used by both server routes and dashboard SPA
- `LocaleJsonCacheService` — file-based locale JSON cache; read before DB on `getResolved`, write on miss, invalidate on profile update/delete
- `safeJsonWrite` — atomic file write: bak→tmp→validate-schema→rename; restores backup on failure
- `StorageAdapter.findActiveProfileByComplianceGroup()` — native `json_extract` query in SQLite adapters; in-memory filter for other adapters
- `geoip-lite >= 1.4.0` added as optional peer dependency
- Event bus now emits `profile.created`, `profile.updated`, `profile.deleted` from `ProfileService`
- Event bus now emits `visitor.created` from `VisitorService`
- Event bus now emits `consent.erased` from `ConsentService.erase()`
- Full i18n (internationalisation) — `apps/api/locale/en.json` with ~290 flat-key translations covering all dashboard pages and components
- `apps/api/src/dashboard/src/utils/t.ts` — typed translation resolver; `TranslationKey` excludes `_section_*` keys; supports `{{var}}` interpolation
- `apps/api/src/dashboard/src/context/locale.tsx` — `LocaleProvider`, `useLocale()`, `useT()` hooks; locale persisted in `localStorage('dashboard-locale')`; `LocaleSwitcher` component (Globe icon + `<select>`) in top nav
- Locale files for de, es, fr, ja, zh-CN added alongside en
- `UITemplateEditor` — tabs replaced with a 3-step wizard (Main Banner → GPC Banner → Preference Modal); submit button appears only on final step; Back/Next navigation; preview pane tracks active step
- i18n keys `uiTemplates.editor.wizard.stepOf`, `uiTemplates.editor.wizard.next`, `uiTemplates.editor.wizard.back` added to all 6 locale files
- `ProfileEditor` content step split into a 3-step wizard (steps 3–5: Main Banner, GPC Banner, Pref Modal)
- `profileContentDefaults.ts` utility — compliance-aware English content defaults for all 8 compliance groups
- "Load Defaults" button on each content step fills that section with English defaults derived from the selected compliance group and UI template button structure
- Step 4 (GPC Banner) is visually disabled and auto-skipped when GPC mode is Ignore or compliance group does not use GPC
- Compliance group selection in step 1 auto-sets GPC Mode and toggles Allow Receipt based on whether the group requires consent records
- New `HowItWorks` dashboard page at `#/how-it-works` — covers the 5-step setup workflow, feature reference for every sidebar section, end-to-end consent flow (6 steps), profile resolution algorithm (5 steps), all 8 compliance groups with applicable laws and country coverage, and key values reference (legalBasis, ConsentStatus, geoDataProvider enums)
- `nav.howItWorks` sidebar entry (below Settings) with `HelpCircle` icon
- `howItWorks.*` i18n keys (60+) added to all 6 locale files
- Show/hide password toggle on the Login page using Eye/EyeOff icons; `login.showPassword` / `login.hidePassword` locale keys added
- `resolveJsonModule: true` in dashboard `tsconfig.json` for typed JSON imports
- `apps/api/src/dashboard/src/env.d.ts` — TypeScript `Window` augmentation typing `window.__CONSENTI_CONFIG__` as `Readonly<ConsentiRuntimeConfig>`
- a11y improvements across all dashboard pages: `scope="col"` on table headers; `role="alert"` on error messages; `role="status" aria-live="polite"` on loading states; `for`/`id` linkage on all form inputs; `aria-required`, `aria-invalid`, `aria-pressed`, `aria-current`, `autocomplete` attributes; `aria-hidden="true"` on decorative icons; `aria-current="page"` on active sidebar links; `aria-expanded` on group toggles

#### `@consenti/types`
- `ConsentiEventName` type exported for typed event name references
- `Compliance`, `ComplianceGroupId`, `CountryResolverFn`, `ComplianceMapOverride`, `ComplianceMapData`, `CountryComplianceEntry`, `ComplianceViolation`, `ComplianceWarningItem`, `ComplianceValidationResult`
- `Cookie.legalBasis: 'mandatory' | 'consent' | 'legitimate_interest'`
- `Cookie.tcfSpecialFeatures?: number[]`
- `ProfileConfig.complianceGroup?`, `ProfileConfig.gpcCompliance?`, `ProfileConfig.isActive?`
- `PublicProfileResponse.resolvedComplianceGroup?`
- `ConsentiRuntimeConfig` interface (injected at serve time into the dashboard SPA)

#### `apps/docs`
- Algolia DocSearch replacing the non-functional search input in the navbar (appId: GDG4X2Y3FZ, indexName: Consenti Doc)
- SaaS request form — conditional feedback textarea: "What went well?" for scores ≥ 4, "What should be improved?" for scores < 4; character counter (max 200)
- SaaS request form — stricter email regex requiring a dot in the domain; HTML-tag and control-character stripping on all free-text fields; per-field length caps enforced server-side

### Changed

#### `@consenti/ui`
- Toggle colors updated — OFF: `#9ca3af` (neutral gray), ON: `#253a5e` (dark navy); dark-mode OFF updated to `#6b7280`
- Toggle dimensions increased from `44×24 px` to `52×28 px` to accommodate icons
- All tsup build targets now emit minified output (`minify: true`)
- Internal `buildHandlers` now delegates to private `_buildGrantAllConsent` / `_buildDenyAllConsent` helpers (no behaviour change)
- `destroy()` now cleans up all `on()` event listeners registered via the typed API

#### `@consenti/api`
- `ComplianceConfig` — `gdpr` and `ccpa` deprecated (kept for backward compat); `gpc` extended to `boolean | 'strict'`; new fields `type`, `geoDataProvider`, `autoComplianceMap`, `complianceMapUrl`
- `ProfileService` now accepts optional `LocaleJsonCacheService`; cache is invalidated on update/delete; legacy `mandatory`/`type` on `Cookie` normalised to `legalBasis` on read
- `buildProfileRoutes` now accepts optional `GeoResolverService`
- tsup build now emits minified output (`minify: true`)
- All dashboard pages and components — all hardcoded English strings replaced with `t()` calls
- `ProfileEditor` — `StepBar` now accepts `labels: string[]` prop; `CookiePreviewTable` now accepts `labels: Record<string, string>` for translated column headers
- `Sidebar` — NAV items use `key: TranslationKey` instead of `label: string`
- `profileEditor.templates.uiTemplateHint` updated to reference Steps 3–5 instead of Step 3
- Compliance group selection in step 1 now auto-sets GPC Mode to the group's default and toggles Allow Receipt
- DPDPA special fields now correctly appear when compliance group is `opt-in-dpdpa`
- `STEPS` constant renamed to `WORKFLOW_STEPS` in `HowItWorks.tsx` for clarity
- `apps/api/src/dashboard/src/api/client.ts` — `BASE` now reads `basePath` from `window.__CONSENTI_CONFIG__` instead of being hardcoded to `/consenti`
- `apps/api/src/dashboard/src/context/branding.tsx` — removed `useEffect` + `fetch`; now reads `window.__CONSENTI_CONFIG__` synchronously at mount time
- `apps/api/src/dashboard/vite.config.ts` — added `resolve.alias` for `@consenti/ui/src/` imports
- `apps/api/src/dashboard/src/components/PreviewPane.tsx` — CSS import changed from `@consenti/ui/dist/index.css?raw` to `CONSENTI_CSS` string constant from source (survives `tsup --watch` dist cleans)

#### `apps/docs`
- `getConsenti()` now awaits `instance.ready` before caching the instance, fixing "Invalid credentials" on cold-start login requests that raced storage initialization
- `SaasRequestBadge` — toggling "Tried Consenti?" now resets satisfaction score and feedback to avoid stale state
- `DemoCredentials` copy button now swallows Clipboard API errors silently (non-HTTPS contexts)
- SaaS request form email regex tightened to require a dot in the domain
- Dev-mode singleton reset in `apps/docs/src/lib/consenti.ts` — `g._consenti` cache cleared on module re-evaluation so branding/config changes take effect after Next.js hot-reload

### Fixed

- `@consenti/ui`: `ConsentScript.inject()` now rejects `javascript:` src URLs and strips `on*` event-handler attributes to prevent script injection via configuration options
- `@consenti/api`: Dashboard login no longer returns "Invalid credentials" on first load — JSON storage file is read and admin user created before any auth request is processed
- `@consenti/api`: `ProfileList` — page title was incorrectly showing "DashboardProfiles"; now uses `t('profiles.title')`
- `@consenti/api`: ES2020 `replaceAll` incompatibility in interpolation resolved using `split().join()` pattern
- `@consenti/api`: Wired all non-English lazy loaders in `LAZY_LOADERS` (es, fr, de, ja, zh-CN) — previously the map was empty so every locale switch fell back to English
- `@consenti/api`: Renamed `locale/jp.json` → `locale/ja.json` to match the `'ja'` locale code used in the switcher
- `@consenti/api`: Users could previously submit a UI template after only filling Main Banner — wizard enforces progression through all three sections before submitting
- `@consenti/api`: DPDPA data fiduciary fields were never displayed from compliance group selection alone; fixed condition to use `requiresDpdpaDisclosure` flag from compliance constants
- `apps/docs`: SaaS request form frontend email validation now correctly rejects addresses without a domain dot (e.g. `ddd@ddd`)

### Breaking changes
- `@consenti/ui`: `ConsentScriptOptions.innerHTML` renamed to `ConsentScriptOptions.unsafeInnerHTML` to make the XSS risk explicit at the call site.

### Migration
```ts
// Before
new ConsentScript({ cookieId: 'analytics', widget, innerHTML: '...' })

// After
new ConsentScript({ cookieId: 'analytics', widget, unsafeInnerHTML: '...' })
```

Old `Cookie.mandatory` and `Cookie.type` fields are deprecated but still read correctly — no migration required for existing profile data.

---

## [0.1.1] - 2026-06-30

### Summary
Mobile responsiveness improvements across `@consenti/ui` (banner, modal, toggle styles) and the admin dashboard SPA; a new Change Password page in the dashboard; a Vite-based dev harness for the UI package; default button label updates for clearer UX; and new docs site features including a SaaS request form, author page, and improved mobile navigation.

### Added
- `@consenti/ui`: Vite-based dev server harness (`apps/ui/dev/`) with HMR for rapid widget development — `npm run dev` now runs Vite alongside tsup watch
- `@consenti/ui`: Default `gpcBanner` config added to `DEFAULT_PROFILE` in `profile-resolver.ts`
- `@consenti/ui`: Mobile-fullscreen modal mode — modal switches to `consenti-modal--fullscreen` on screens ≤ `mobileFullScreenBreakpoint` (default 576 px)
- `@consenti/api`: **Change Password** page (`/settings/change-password`) in the admin dashboard SPA — users can update their password with 12-character minimum validation
- `apps/docs`: `SaasRequestBadge` component — sticky side badge + modal form for collecting SaaS interest (email, org, current tool, satisfaction score); stores submissions with anonymized IP
- `apps/docs`: `/api/saas-request` Next.js API route — persists SaaS interest form submissions to `db/consenti-saas-requests.json` with IPv4/IPv6 address masking
- `apps/docs`: `/author` page — author profile, support links (Razorpay, Ko-fi, PayPal), and GitHub/portfolio links
- `apps/docs`: `DemoCredentials` component — reusable credential display with one-click copy

### Changed
- `@consenti/ui`: Default banner button label changed from `"Reject All"` → `"Reject Optional"` and `"Manage Preferences"` → `"Customize"`
- `@consenti/ui`: Banner mobile layout — floating banners (`left-bottom`, `right-bottom`) collapse to full-width at ≤ 576 px; buttons stack responsively; text container `min-width` reduced from 500 px to 0 on mobile
- `@consenti/ui`: Modal footer padding reduced (`padding-x` removed) for tighter mobile fit
- `@consenti/ui`: Toggle label text color updated from `#4b5563` → `#949dab` (lighter, reduced visual weight)
- `@consenti/api`: Dashboard `Layout` now collapses sidebar by default on mobile (`< 768 px`) and auto-collapses on hash navigation
- `@consenti/api`: Dashboard `Table` changed from `w-full` to `min-w-full` to fix horizontal overflow in narrow containers
- `@consenti/api`: Dashboard `Settings` page now shows a "Change Password" link
- `@consenti/api`: Default template button labels updated to match `@consenti/ui` defaults (`"Reject Optional"`, `"Customize"`)
- `@consenti/api`: Dev dependencies bumped — `@types/node` → `^26`, `mongodb` → `^7`, `postcss` → `^8.5.16`, `tailwindcss` → `^4`, `typescript` → `^6`, `vite` → `^8`
- `apps/docs`: Navbar reworked — mobile menu now self-managed (removed dependency on `useDocsMenu`), toggles with X/Menu icon, closes on route change and `Escape` key; "Demo & Playground" renamed to "Playground"
- `apps/docs`: Docs layout sidebar toggle moved into the content area on mobile; sidebar uses `fixed` positioning properly
- `apps/docs`: Footer npm link corrected to `npmjs.com/org/consenti`; "Customize" button added to open the consent modal
- `AGENTS.md`: Checklist note clarified — changelog/README updates not required for `apps/docs`-only changes
- `MIGRATION_GUIDE.md`: Updated example button label from `"Manage Preferences"` → `"Customize"` to match new defaults

### Fixed
- `@consenti/ui`: Banner `--top`/`--bottom` layout no longer applies incorrect `margin-left: 2vw` that caused misalignment on constrained viewports
- `@consenti/api`: Dashboard sidebar visibility on mobile no longer requires a full page reload to collapse

### Breaking changes
None.

### Migration
None.

## [0.1.0] - 2026-06-28

### Summary
Initial public release of Consenti — an open-source, zero-external-dependency GDPR Consent Management Platform shipping as two independently installable npm packages: `@consenti/ui` (browser widget) and `@consenti/api` (Node.js backend). Includes a full admin dashboard SPA, multi-regulation compliance support, pluggable storage adapters, and an interactive documentation site with live playground.

### Added

#### `@consenti/ui`
- `ConsentiSetup` — main widget class; call `new ConsentiSetup(config)` to mount the banner and preference modal
- Cookie consent banner with four position variants: `top`, `bottom`, `left-bottom`, `right-bottom`, `middle`
- GPC banner — dedicated display when a Global Privacy Control signal is detected
- Preference modal with `center`, `right`, and `fullscreen` positions; full WCAG AAA focus-trap
- Button system — configurable `style` (`primary` | `secondary` | `accent` | `text`) and `action` (`submit` | `manage` | `close` | `custom`) per button
- Cookie category toggles with mandatory/optional distinction
- Locale switcher — runtime language switching with `defaultLocale` + `locales[]` config
- Consent storage — `'cookie'` (default) or ``localStorage``, with HMAC signing support
- Cross-tab sync — `BroadcastChannel`-based sync so consent state propagates instantly across open tabs
- GPC auto-honour mode (`autoHonorGPC: true`) — automatically denies non-mandatory cookies when GPC signal detected
- `ConsentiProfile` — fetch and cache profiles from the API; hydrate widget config remotely
- `CookieTrigger` — fire callbacks when a named cookie's consent status changes
- `ConsentScript` — lazy-load `<script>` tags after consent is granted for a specific category
- Consent receipt — downloadable JSON receipt of the user's consent state
- Framework integrations — `useConsent()` React hook (`@consenti/ui/react`); `useConsent()` Vue composable (`@consenti/ui/vue`); Angular service (`@consenti/ui/angular`)
- `ConsentiPlugin` base class — extend to hook into `onConsentSubmit`, `onBannerShow`, `onModalShow` lifecycle events
- DOM events: `consenti:bannerInitialized`, `consenti:bannerVisibility`, `consenti:modalVisibility`, `consenti:consentBeingSubmitted`, `consenti:consentSubmitted`
- Testing utilities (`@consenti/ui/testing`) — `ConsentiTestHelper` for simulating consent in unit/integration tests
- Full SCSS theming via CSS custom properties; `disableCssTemplate: true` opt-out for BYO styles
- SSR guard on every browser-global access — silent no-op when called server-side (Next.js, Nuxt, etc.)
- ESM + UMD dual build; zero external runtime dependencies; ES2020 browser target (Chrome 80+, Firefox 74+, Safari 13.1+)

#### `@consenti/api`
- `createConsenti(config)` — single function that returns a framework-agnostic router (mount into Express, Fastify, raw `http`, etc.)
- **Storage adapters** (pluggable):
  - `node:sqlite` — Node 22.5+ built-in, zero install
  - `node-sqlite3-wasm` — WASM SQLite, zero compilation, Node 20+
  - `better-sqlite3` — native, optional peer dep
  - PostgreSQL (`pg`)
  - MySQL (`mysql2`)
  - MongoDB (`mongodb`)
  - JSON file adapter (development/testing)
- **Auth modes**: `local` (scrypt passwords, no external dep), JWT, OIDC, SAML, custom
- TOTP / 2FA support via `node:crypto`
- RBAC — role-based access control with per-route permission checks
- **Multi-regulation compliance**: GDPR, CCPA/CPRA, GPC, TCF v2.2, DPDPA (India), LGPD (Brazil), PDPA (Thailand), PIPEDA (Canada), APPI (Japan), KVKK (Turkey), POPIA (South Africa), UK-GDPR
- Public REST API: `GET /profile/:id`, `POST /consent`, `GET /consent/:uid`
- Admin REST API: profiles, consent records, visitors, users, roles, audit logs, stats, export, API keys, tenants, cookie templates, UI templates, TCF configuration
- OpenAPI spec (public + admin) served at `/api-docs`
- **Admin dashboard SPA** (Preact + Tailwind CSS, Vite build) served at `basePath` — full GUI for managing profiles, templates, users, roles, consent records, visitors, audit logs, API keys, tenants, and TCF vendors
- Dashboard: UITemplateEditor with live banner/modal preview; ProfileEditor; CookieTemplateEditor
- Dashboard: dark mode toggle, sidebar navigation, table component with pagination
- Append-only `audit_logs` — GDPR-compliant evidence trail; never UPDATE/DELETE
- IP addresses stored as SHA-256 hashes only — never raw IPs
- `ConsentStatus`: three-value `'granted' | 'denied' | 'objected'` (Legal Interest support)
- Plugin engine with hook execution and event bus (`consent.created`, etc.)
- Zero external runtime dependencies; Node 20+ required

#### `apps/docs`
- Next.js 15 documentation site deployed at `consenti.dev`
- Getting Started, Quick Start, and full API reference docs
- Interactive frontend playground — configure and preview the widget live in-browser
- Backend demo — live admin dashboard with demo credentials
- Docs covering: UI configuration, events, methods, profiles, themes, frameworks, plugins, accessibility, installation
- API docs covering: public routes, admin routes, storage adapters, auth, GDPR compliance, TCF, all supported regulations
- Support page
- `AskAIButton` — AI-assisted docs search
- Dark mode support throughout

#### Monorepo / tooling
- Turborepo monorepo with npm workspaces
- `@consenti/types` — shared type package (`packages/types`)
- tsup dual build (ESM + UMD for `ui`; CJS + ESM for `api`)
- TypeScript strict mode across all packages
- `.github/` — CI workflow, publish workflow, Dependabot config, issue templates, PR template, CODEOWNERS
- Apache 2.0 license
- `MIGRATION_GUIDE.md`, `SECURITY.md`, `THREATMODEL.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `ECOSYSTEM.md`

### Changed
None — initial release.

### Fixed
None — initial release.

### Breaking changes
None — initial release.

### Migration
None — initial release.

---

#### Changelog template
```markdown
## [x.x.x] - YYYY-MM-DD
### Summary
Here we would put all summary of changes.
### Added
- `@consenti/ui`: feature 1 added
- `@consenti/api`: feature 6 added
### Changed
- 
### Fixed
- `@consenti/ui`: ui color fixed
### Breaking changes
None.
### Migration
None.
```

*Consenti packages are versioned independently with semver. See [AGENTS.md](./AGENTS.md) for the full release strategy.*
