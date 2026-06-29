# Changelog

All notable changes to Consenti are listed here in reverse chronological order.
Each entry is a summary of diff, migration notes, and breaking-changes.

For unreleased in-progress work, see the raw files in [`./changelog/`](./changelog/).

---
<!-- Changelpg entries here -->
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
