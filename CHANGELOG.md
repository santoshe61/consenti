# Changelog

All notable changes to Consenti are listed here in reverse chronological order.
Each entry is a summary of diff, migration notes, and breaking-changes.

For unreleased in-progress work, see the raw files in [`./changelog/`](./changelog/).

---
<!-- Changelpg entries here -->
## [0.3.0] - 2026-07-24

### Summary
The largest batch since 0.2.0: a full consent-authoring revamp (Cookie Templates + Categories
replaced by a single Consent Template, legal basis moved to the category, keyed `CookieMap`/
`CategoryMap` everywhere), profile edit history (`version`, on-disk snapshots, archived-profile
recovery, atomic symlink-based activation), a wave of enterprise/scale features (Reports
dashboard, signed consent records, full-text search + real pagination, declarative indexing
across all 7 storage adapters, audit-log retention, connection-pool hardening), a first-run
setup wizard with a consolidated single source of truth for default compliance-profile content,
and finally the three real, previously-missing widget features: a TCF v2.2 `__tcfapi` stub, RTL
support, and an age-gate / parental-consent flow. Along the way this batch found and fixed a long
tail of real, user-facing bugs — several dating from before 0.2.0 — including: every storage
adapter silently dropping `ageVerified`/`parentalConsentToken`/`tcfString` on consent creation,
`new ConsentiSetup({})` (the widget's own advertised minimal config) crashing in a real browser,
the published npm package shipping a broken `node:sqlite` driver, a `node-sqlite3-wasm` selection
silently falling back to the JSON driver, a superadmin role-name typo hiding entire sidebar
sections from real superadmins, rich-text profile content being served to visitors as raw JSON
instead of rendered HTML, consent-export downloads 401ing, and a nondeterministic `@consenti/ui`
build race that could drop `react.js`/`vue.js`/`angular.js` from a production build.
Also in this batch: buttons moved to the same keyed-map convention as cookies/categories (with
`profileOverride` null-delete support, so a single button/category/cookie can be removed via
override without repeating the rest of the set), backend + dashboard mandatory-content validation
on profile save, a profile-storage rework that stops keeping a full multi-locale content blob on
the DB row (fixing non-default locales never actually persisting distinct content, a real
pre-existing bug), admin sessions moved to a sliding 30-minute inactivity timeout, and the
first-run setup wizard is now enforced as truly one-time.

### Added

#### `@consenti/ui`
- Compact `consenti_data` cookie format — single-letter keys, per-submission consent UUID, GPC
  signal flag, source tracking, profile id (`s`) and profile version (`v: number`) tracked
  separately. Transparent auto-migration from the legacy `consenti_{profileId}` cookie name.
- `getConsent(type?)` — 7 vendor-ready output formats: raw, `google-gtm`, `category`, `adobe`,
  `meta`, `microsoft-clarity`, `twilio-segment` (`consent-mapper.ts`); `getGTMConsent()` deprecated
  in favor of `getConsent('google-gtm')`.
- Real Google Consent Mode v2 signalling when `utils.gtm` is configured — a `gtag('consent',
  'default', …)` call at init (standard stub-queue pattern, works regardless of gtag.js load
  order) and `gtag('consent', 'update', …)` on every submission; `gtm.containerId` injects the GTM
  library, `gtm.verbose` mirrors every `consenti:*` event to the dataLayer.
- `ConsentAction`/`CategoryAction` — callback-based primitives for third-party SDKs with their own
  opt-in/opt-out method (Segment, Mixpanel, Sentry, …); `CategoryScript` (like `ConsentScript`,
  gated on a whole category's rollup consent); `BannerTrigger` (renamed from `CookieTrigger`);
  `scanConsentScripts()` — declarative `data-consenti-consent-script`/`-category-script`/`-bind`
  DOM-scan, runs automatically once per `init()` cycle.
- Preference modal redesign: one toggle per parameter inside each category, plus a 3-state
  category master toggle (`role="checkbox"`, `aria-checked` true/false/mixed); a category's
  parameter list collapses behind the same "Show more" control as its description; legitimate-
  interest toggles show a distinct "objected" icon instead of a plain cross. `receiptLabel`/
  `receiptDescription` are now authorable and localized per profile.
- `enhanceAccessibility` (WCAG 2.1 AA button sizing/focus styles), `showFooterMetadata` (Consent
  ID/Date/Version/Privacy Settings strip), `stackButtonsOnBreakpoint`, `trapFocus` (keyboard focus
  trap while banner/modal is open). `.consenti-root` is now a class applied to every mount point
  (never the `#consenti-root` ID) so custom CSS can target it consistently; the preference modal
  now mounts inside the widget's own root instead of as a sibling of it.
- `compliance.type` accepts any string, not just the 8 built-in groups — targets a profile
  authored against a `customComplianceGroup` in the dashboard.
- Embedded pre-built profiles are sourced from `@consenti/utils/profiles` (single source of truth
  shared with `apps/api`) via `adaptEmbeddedProfile()`, instead of separately duplicated data.
- **TCF v2.2 client stub** — `compliance.tcf: { enabled, cmpId, cmpVersion }` installs
  `window.__tcfapi` (`ping`, `getTCData`, `addEventListener`, `removeEventListener`), the standard
  IAB queue-command convention, yielding to an existing CMP/instance rather than overwriting it.
- **Age gate** — `compliance.ageGate: { enabled, minimumAge, requireParentalConsent }` shows a
  Yes/No age-confirmation prompt before any other consent UI. Confirmed → normal flow resumes,
  every subsequent submission carries `ageVerified: true`. Declined → immediate deny-all
  (mandatory cookies still granted); with `requireParentalConsent: true`, also mints a
  `parentalConsentToken` and fires `consenti:parentalConsentRequired` as the hook for the site
  owner's own out-of-band verification (no email-sending infrastructure exists in this
  zero-dependency package to build a full flow here).
- **RTL / `core.dir`** — `'ltr' | 'rtl' | 'auto'` (default `'auto'`, derived from `locale` via a
  known RTL-language prefix list). CSS logical properties + `[dir="rtl"]` overrides handle
  everything direction-sensitive; explicit banner/modal position variants are deliberately not
  mirrored, since those are screen positions the author chose independent of text direction.
- `ComplianceWidgetConfig`, `AgeGateWidgetConfig`, `TcfWidgetConfig`, `ParentalConsentRequiredDetail`
  now exported from the package root.
- `profileOverride`/`setProfile()` deep-merge now supports deleting a key by setting it to `null`
  (JSON Merge Patch / RFC 7396 semantics) — e.g. `{ preferenceModal: { categories: { marketing:
  null } } }` removes the `marketing` category entirely. Previously both `undefined` and `null`
  were treated as "keep base value," so there was no way to remove a single entry from a keyed map
  (`CategoryMap`, `CookieMap`, `ButtonMap`) via an override without knowing and repeating its
  remaining contents.

#### `@consenti/api`
- **Consent Template** replaces Cookie Template + Categories: `POST`/`GET`/`PUT`/`DELETE
  /admin/consent-templates` (+ `:id/copy`, `:id/profile-usage`), body `{ name, cookies: CookieMap,
  categories: CategoryMap }`. `Category` is now the single owner of legal basis
  (`mandatory`/`consent`/`legitimate_interest`, flattened `legitimateInterestDescription`);
  parameters carry a required `purpose` (`necessary`/`functional`/`preferences`/`analytics`/
  `marketing`) that pre-fills legal basis/GPC/CPRA defaults and auto-detects from known Google
  Consent Mode IDs. Save-time validation enforces one category per parameter and flags
  purpose/category mismatches.
- **Profile edit history** — every edit mutates the profile in place and increments `version:
  number`; resolved-JSON snapshots are written per version to disk (`profiles/{tenantId}/{id}/
  {version}/`). `GET /profiles/:id/versions` (+ `:entryId`) lists/reads history; the dashboard's
  Version History page gained a git-style, syntax-highlighted diff between any two versions, with
  audit-log create/update rows linking straight into it.
- **Archived Profiles** — `ProfileService.listArchivedProfiles()`/`GET /profiles/archived` finds
  version directories on disk with no matching DB row (e.g. a deleted profile) and a dedicated
  dashboard view lets you browse their full version history.
- **Atomic profile activation** — `${complianceGroup}/` is now a directory symlink (junction on
  Windows) pointed at `${profileId}/${version}/`, repointed via a single atomic rename instead of
  a per-file copy loop; fixes a real bug where a locale removed from a profile kept being served
  stale forever. S3 sync now writes a single `pointer.json` (`{ profileId, version }`) instead of
  mirroring every locale file a second time.
- `POST /profiles/:id/copy` — real backend-side profile duplication (previously reconstructed
  client-side).
- `cookiesOverride`/`categoriesOverride`/`uiOverride` on `ProfileConfig` — per-profile parameter
  deltas without forking the Consent Template (`cookiesOverride` fully applied at resolve time;
  the other two reserved for a later phase). The dashboard's Step 2 "Pre Grant" column is now an
  editable per-profile checkbox on top of this, with compliance-group-driven auto-defaulting.
- `customComplianceGroup` — profiles that don't fit one of the 8 built-in groups can be addressed
  by the widget's `compliance.type` the same way a built-in group is.
- Profile content import/export reworked around a shared flat dot-path key schema: JSON export
  covers every supported locale (not just authored ones); CSV is a single multi-locale file with
  every BCP 47 locale pre-populated as a row. `renderContentText()` (moved to `@consenti/utils`)
  converts the compact rich-text JSON format to real HTML — previously the served `htmlText` was
  the raw JSON string on every profile with formatted body text.
- **Signed consent records (opt-in)** — `consentSigningKey` config HMAC-SHA256 signs every
  consent record at create/update; `GET /consent/:visitorId/verify` checks it and flags
  `hmac_invalid` on mismatch; signature status shown in exports and the dashboard detail modal.
- **Reports dashboard page** — opt-in trend, category/locale breakdowns, powered by the
  previously-unused `/stats/categories`/`/analytics/opt-in` endpoints, cached through a new bounded
  TTL `StatsService`.
- Free-text search (`q`) and real numbered pagination (`PagedResult<T>` — `{ items, total, page,
  limit }`) across Consents/Visitors/Audit Log, all 7 storage adapters; column projection so list
  queries no longer pull `consentJson`/`oldData`/`newData` for every row (`GET /consents/:id`/
  `GET /audit/:id` fetch the full record on demand); shared `DataTable`/`RecordDetailModal`
  components; page state synced into the route hash.
- **Declarative indexing** — `seed-data.ts`'s `TableDef` gained an `idx` field; the same source
  generates `CREATE INDEX` for SQLite/Postgres/MySQL and feeds MongoDB's `createIndexes()`.
  Previously only SQLite had real secondary indexes; Postgres/MySQL/Mongo had none beyond primary
  keys. Search across consents/visitors/audit switched from `%value%` to index-friendly `value%`.
- Audit log retention (`dataRetention.auditLogPurgeAfterDays`, `purgeExpiredAuditLogs` on all 7
  adapters) and Postgres/MySQL connection-pool hardening (`poolMax`, `statementTimeoutMs`,
  `idleInTransactionTimeoutMs`, all opt-in).
- API key lifecycle: optional `expireBy`, `createdBy`/`updatedAt` tracking, lazy expiration (no
  cron — checked and flipped on next use or dashboard list), `POST /apikeys/:id/reactivate` and
  `DELETE /apikeys/:id/permanent`.
- Local-auth password reset in the dashboard Users editor (`super_admin` only).
- Non-IAB tracker/cookie knowledge base (`@consenti/utils`'s `TRACKER_KNOWLEDGE_BASE`, ~40 entries
  — GA4, Meta Pixel, Hotjar, Segment, Intercom, HubSpot, Mixpanel, and more) powering autocomplete
  and auto-categorization when defining a new cookie parameter.
- `ConsentAction`/`CategoryAction` server-side hooks — event-bus-driven counterparts to the
  widget's primitives, watching `consent.created`/`consent.updated` per parameter or category.
- Tenant-wide `Settings` resource (`tenant_settings` table) — `allowedOrigins` and
  `adminAllowedOrigins` (the latter enforced centrally on every `/consenti/admin/*` route except
  the unauthenticated `widget.js`/`widget.css`); fixes a bug where full-URL allowlist entries
  (`https://example.com`) never actually matched.
- **First-run setup wizard** (`#/setup`, one-time per tenant) — Welcome → read-only view of the
  fully resolved server config (secrets redacted) → default compliance-profile seeding (accordion
  of all 8 groups) → confirmation with a production-readiness panel (JSON-storage/default-
  credentials warnings, previously console-only). New `GET /setup/status`, `GET /setup/config`,
  `GET /setup/compliance-groups`, `POST /setup/seed-profiles`, `POST /setup/complete` routes.
- `castCreateConsent` now accepts `ageVerified`/`parentalConsentToken` off the request body.
- Docker image + `docker-compose.yml` (zero-install `node:sqlite` default, `pg`/`mysql2`/`mongodb`
  peer deps bundled) and a community-reference Helm chart + Terraform module.
- Mandatory-content validation on profile save (`POST`/`PUT /profiles`): body text, every button's
  label, the preference modal's heading, and every category's heading can no longer be saved blank
  (banner/GPC-banner heading and the modal's intro text remain optional). Enforced both in the
  dashboard wizard (hard-blocks Next/Save, jumps to the offending locale tab; a soft dismissible
  nudge on the optional fields) and in the backend (`profile-content-validator.service.ts`, the
  real enforcement backstop since bulk CSV/JSON import bypasses the wizard entirely) — returns
  `422` with which locale/section/field failed.
- `POST /admin/auth/refresh` — reissues a fresh admin JWT from the current (still-valid) one, used
  by the dashboard's sliding-session behavior (see Changed).

#### `@consenti/types`
- `ConsentType`, `ConsentShortValue`, `ConsentSource`, `ConsentCookieData`, `CookiePurpose`.
- `MainBanner.stackButtonsOnBreakpoint`, `MainBanner.trapFocus`, `ProfileConfig.showFooterMetadata`,
  `ProfileConfig.enhanceAccessibility`, `ProfileConfig.expiryDays`, `Cookie.preGrant`.
- `ApiKey`/`CreateApiKeyInput`: `createdBy`, `expireBy`, `updatedAt`. `ArchivedProfileSummary`.
- `ComplianceWidgetConfig`, `AgeGateWidgetConfig`, `TcfWidgetConfig`, `ParentalConsentRequiredDetail`.
- `ConsentiConfig.core` is now optional (every field of `CoreConfig` already was).
- `ButtonMap`, `TemplateButtonMap` (keyed button maps, see Changed). `DeepPartial<T>` now allows
  `| null` on every object key, backing `profileOverride` null-delete support.
- `PublicProfileResponse` gained `dpdpa`, `showFooterMetadata`, `enhanceAccessibility`;
  `ResolvedProfile` gained `hidePoweredBy` — declared but never actually populated before the
  profile-wide-settings fix (see Fixed).

#### `@consenti/utils`
- 8 embedded English compliance profiles (`DEFAULT_PROFILES`) with a `@consenti/utils/profiles`
  subpath export, now consolidated as the **single source of truth** for default profile content
  — consumed identically by server-side seeding, the dashboard's "Load Defaults", and the widget's
  embedded fallback (English only there). `resolveLocaleTranslation(group, locale)` merges a
  locale overlay onto the English base by category key (fixing a bug where non-English seeded
  profiles had mismatched category keys and were missing required fields).
- `COOKIE_PURPOSE_IDS`/`COOKIE_PURPOSES`/`COOKIE_PURPOSE_DEFAULTS`/`KNOWN_COOKIE_PURPOSES`/
  `inferCookiePurpose()`, `TRACKER_KNOWLEDGE_BASE`/`matchTrackerKnowledge`.
- `encodeTcString`/`decodeTcString` (moved here from `apps/api`, Buffer-free so it also works in
  the browser) and `resolveTextDirection()` — both shared between `@consenti/ui` and `@consenti/api`.
- `hasVisibleText(value)` — checks whether a stored `htmlText`-style field (the compact rich-text
  `ContentDoc` JSON, or a legacy plain-HTML string) has any actual visible text, not just a
  non-empty string; a naively-empty rich-text editor can still serialize to a non-blank-looking
  JSON string (e.g. an empty paragraph node), which a plain `.length > 0` check would wrongly treat
  as filled in. Shared between the dashboard's client-side wizard validation and the backend
  validator so both agree on exactly what counts as "blank."

#### Docs / Infra
- Four new `apps/docs` guide pages (`/guides/backend/server-side-enforcement`, `webhooks`,
  `policy-engine-mapping`); `utm_source`/`utm_medium`/`utm_campaign` on every real outbound link to
  consenti.dev from the widget and dashboard.
- Full documentation pass for TCF/RTL/age-gate across `apps/ui`/`apps/api` READMEs and every
  relevant `apps/docs` page, correcting several pages that had documented a config shape or
  server-side behavior ahead of (and different from) what actually shipped.

### Changed
- Legitimate-interest handling is driven purely by `legalBasis === 'legitimate_interest'` — the
  separate "LI enabled" toggle is gone.
- UI Template buttons carry a machine `id` (not display text) end-to-end — from the editor, through
  profile resolution, to `id="consenti-btn-{id}"` on the rendered `<button>` — so integrators can
  target specific buttons without relying on text content or DOM position.
- `profileContentDefaults.ts` ("Load Defaults" in the dashboard) is now a pure adapter over
  `@consenti/utils/profiles` — locale-aware (previously English-only regardless of the active tab)
  and falls back to `general-privacy-consent`'s real content for a custom compliance group.
- Collapsed every SQL storage adapter's `migrate()` to a single fresh-install schema application —
  pre-1.0, no installation predates this schema, so the incremental `ALTER TABLE` ladders that had
  accumulated were dead weight. `schema_version`/`PRAGMA user_version` tracking is kept as the
  hook for whenever a real future migration is actually needed.
- `apps/ui/tsup.config.ts`/`package.json`: removed a per-entry `clean: true` that raced concurrent
  builds of the `react`/`vue`/`angular`/`testing` entries, nondeterministically deleting their
  freshly-written output; `dist/` is now cleaned once, before tsup runs, via a new `clean` script.
- **Buttons are now a keyed map** (`Record<string, Button>` / `ButtonMap`) everywhere they appear —
  `MainBanner.buttons`, `GpcBanner.buttons`, `PreferenceModal.buttons`,
  `TemplateBannerDef.buttons`/`TemplateModalDef.buttons` (now `TemplateButtonMap`) — instead of an
  array with an inline `id` field; the same keying convention `CookieMap`/`CategoryMap` already
  used, extended to buttons for consistency. `LocaleTextContent`'s per-locale `buttonLabels` fields
  changed from a positional `string[]` (matched to `buttons[i]` by array index) to
  `Record<string, string>` keyed by the same button id — robust against a UI Template's buttons
  being reordered, which previously could silently misalign a translated label to the wrong
  button. `@consenti/utils/profiles` embedded default profiles and the dashboard's UI Template
  editor, profile editor, and CSV/JSON locale export/import all updated to the keyed shape.
- `DeepPartial<T>` (`@consenti/types`) now allows `| null` on every object key, backing the
  `profileOverride` null-delete support above.
- Admin sessions now use a sliding 30-minute inactivity timeout instead of a flat 1-hour expiry
  from login: the dashboard silently refreshes the token while the user is active (via
  `POST /admin/auth/refresh`) and logs out automatically once 30 minutes pass with no
  mouse/keyboard/scroll/touch activity, rather than the token quietly lapsing in the background
  with no visible effect until the next page refresh.
- First-run setup wizard (`#/setup`) is now a true one-time flow, matching its original design:
  once `tenant_settings.setup_completed` is `true`, navigating to `#/setup` redirects to the
  dashboard instead of re-rendering the wizard, and `POST /setup/seed-profiles`/
  `POST /setup/complete` both reject with `409` if setup has already been completed. Read-only
  setup routes (`status`, `config`, `compliance-groups`) remain reachable.
- **Profile storage no longer keeps a full multi-locale `translations`/`localeContents` blob in
  the DB row.** The stored shape (`StoredProfileJson`) now holds only the default locale's own
  resolved `mainBanner`/`gpcBanner`/`preferenceModal` directly on the row, plus a `locales: string[]`
  list; every other locale's content lives only in its per-version on-disk file
  (`profiles/{tenant}/{id}/{version}/{locale}.json` — same directory layout as before, only the
  DB row's content shrank). Fixes unbounded per-profile row growth with many locales.
  `CreateProfileInput`/`UpdateProfileInput` gain a sibling `localeContent` field (resolved content
  for non-default locales touched by that save, never persisted in the DB row); a locale already on
  the profile but not present in `localeContent` for a given update is carried forward unchanged
  from the previous version, not silently dropped. `ProfileService.getResolved()` no longer does
  live UI/Consent Template resolution for banner/modal content — the default locale's content is
  read directly off the row, any other locale directly from its on-disk file (cookie resolution via
  `consentTemplateId`/`cookiesOverride` is unchanged).
- Template edits (`PUT` on a UI/Consent Template) no longer auto-regenerate every profile that
  references them — affected profiles are still listed (`GET /:id/profile-usage`), but picking up
  the new template shape now requires manually reopening and resaving each one.
- Audit log entries for profile create/update/delete now store a small reference
  (`profileId`/`version`/`complianceGroup`) instead of the full before/after `Profile` object — the
  on-disk version snapshots are already the audit trail for profile content.
- `core/profile-engine.ts` removed (dead code once live per-request locale merging was removed).
- Dashboard: resolution of a locale's authored content against its UI/Consent Templates moved from
  the server into the dashboard (`ProfileEditor.tsx`'s `resolveLocaleContent()`) — the save payload
  now sends already-resolved content, matching what the server stores; loading an existing profile
  fetches the default locale's content directly off the profile row and every other locale via a
  separate per-locale request, de-resolved back into editable form (`deresolveLocaleContent()`).
  The default locale's tab now always shows first, and re-sorts to first automatically if the
  operator changes which locale is the default.

### Fixed
- Every storage adapter silently dropped `ageVerified`/`parentalConsentToken`/`tcfString` on
  `createConsent` — computed correctly, never persisted (MongoDB additionally never read them at
  all). This means TCF and age-gate data has never actually persisted on any installation before
  this release, regardless of client-side config.
- `new ConsentiSetup({})` — the widget's own advertised minimal config — crashed in a real browser
  because `core` was a required field despite every one of its own fields being optional.
- The published npm package shipped a broken `node:sqlite` driver (build tooling was stripping the
  `node:` prefix from a dynamic `import()`, so selecting it always failed regardless of Node
  version) and silently fell back to the JSON driver whenever `node-sqlite3-wasm` was selected
  (a missing `return` in the adapter factory's `switch`).
- A `Sidebar.tsx` role-name typo (`'superadmin'` vs. the real `'super_admin'`) hid the **Sites**
  and **API** sidebar sections from every real superadmin account since they shipped.
- Rich-text profile content (main banner, GPC banner, preference modal, category descriptions) was
  served to real visitor-facing widgets as the raw stored JSON string instead of rendered HTML.
- The dashboard's CSV/XLSX export put the JWT in the URL query string, which the backend never
  actually read — every export silently 401'd; now an authenticated header request with a
  Blob/object-URL download, no token ever touches the URL.
- Consent submission and the standalone `PUT /consent/:visitorId` path threw or silently no-opted
  for any dashboard-created profile referencing a Consent Template (as opposed to an embedded
  default profile) — `ConsentService` now resolves cookies/categories from the template
  (`cookiesOverride` applied) the same way `ProfileService.getResolved()` already did.
- Consent reset (`DELETE /consent/:visitorId`) 403'd because the widget's locally-tracked visitor
  id never matched what the server had stored the ownership cookie against; also fixed the
  underlying cross-origin cookie plumbing (`credentials: 'include'`, CORS credentials header,
  `SameSite=None; Secure` in production) this exposed.
- A nondeterministic `@consenti/ui` build failure (tsup `clean: true` racing concurrent entries)
  that intermittently dropped `react.js`/`vue.js`/`angular.js`/`testing.js` from `dist/` — this is
  what was breaking `apps/docs`'s production build.
- Non-default locales' resolved content was never actually written to their on-disk JSON files:
  `ProfileService.getResolved()` computed each locale's translated content internally but never
  attached it to the object handed to the file-writing worker, so every non-default locale's
  version file silently ended up as a copy of the default locale's content with only the
  `currentLocale` field relabeled — a real, pre-existing bug affecting any profile with more than
  one locale, not just seeded ones.
- Profiles seeded via `seedDefaultProfile()`/`seedAllDefaults()` (no `uiTemplateId`) previously
  couldn't pick up a locale added later through the dashboard at all — `getResolved()`'s
  translation rebuild was gated on `uiTemplateId` being set.
- **Profile-wide settings never reached a visitor's widget through the API-backed path** — found
  during a post-implementation audit of the profile-storage rework above. `gpcMode`,
  `hidePoweredBy`, `allowReceipt`, `darkMode`, `enhanceAccessibility`, `showFooterMetadata`,
  `complianceGroup`, and `dpdpa` were declared on `PublicProfileResponse`/`ResolvedProfile` and
  actively read by the widget, but nothing ever populated them: `ProfileService.getResolved()`'s
  in-memory fallback response omitted them, and — more importantly — the profile-json-worker's
  on-disk `doc` object (the file the widget's public route serves directly) never carried them
  either. A profile with `darkMode`/`gpcMode`/`complianceGroup` etc. configured in the dashboard
  silently had none of that reach a real visitor. Fixed with a shared `profileWideFields()` helper
  on each side of the write (`ProfileService` and the profile-json-worker).
- Fixed a bug where an expired admin session left the dashboard in a broken, unresponsive state
  until the user manually refreshed the page. Root cause: the API client's 401 handler cleared
  `localStorage` and force-navigated to `#/login` directly without updating `AuthContext`'s React
  state, so the router's still-truthy (stale) `user` state immediately redirected back away from
  the login screen, fighting the API client's own redirect on every subsequent action. The 401
  handler now dispatches an event `AuthProvider` listens for, so session state, storage, and the
  route all update together through one path.
- Setup wizard: clicking "Go to Dashboard" / "See How Consenti Works" on the confirmation step
  could bounce back to wizard step 1 instead of exiting, for the same underlying reason as above —
  the router's `setupCompleted` state was never updated after `POST /setup/complete` succeeded, so
  it forced a redirect back to `#/setup` (remounting the wizard fresh) the instant the hash changed
  away from it.

### Breaking changes
- Every REST payload and stored JSON shape involving `cookies`/`categories` changes from array to
  keyed map (`CookieMap`/`CategoryMap`). `Cookie.legalBasis`/`Cookie.expiry` are gone (legal basis
  moved to `Category`; expiry is profile-wide via `expiryDays`). `/admin/cookie-templates/*` routes
  are gone — use `/admin/consent-templates/*`.
- `Category.legitimateInterest` is gone; use the flat `Category.legitimateInterestDescription`.
- UI Template button definitions: `text` → `id`, and buttons are now a keyed map
  (`Record<string, Button>`/`ButtonMap`) rather than an array — `Button.id`/`TemplateButtonDef.id`
  are gone, the map key is the id. `LocaleTextContent`'s `buttonLabels` fields changed from a
  positional array to a `Record<string, string>` keyed the same way. Templates loaded through the
  dashboard SPA migrate automatically; direct API consumers with their own stored templates must
  migrate them.
- The public `consenti_data` cookie schema changed — external tooling reading it directly (not
  through `@consenti/ui`) must read `s` for the profile id and treat `v` as an integer version.
- `/resolve-profile`'s response shape changed (`path`/`found` instead of a bare file path); the
  widget handles this automatically, direct callers must update their parsing.
- `#consenti-root` is no longer styled by an ID selector — any custom CSS targeting it directly
  must switch to `.consenti-root`.
- `StorageAdapter.getConsents`/`getVisitors`/`getLogs` now return `PagedResult<T>` instead of a
  bare array; `getAuditLogById` and `purgeExpiredAuditLogs` are new required `StorageAdapter`
  methods — a custom adapter implementing the interface needs all of these.
- `StorageAdapter.getSettings`/`updateSettings` must round-trip the new optional
  `TenantSettings.setupCompleted` field.
- Profile/locale export file formats changed (flat dot-path JSON keys; CSV is one multi-locale
  file instead of one per locale) — re-export from the current dashboard to get the new format.
- Self-hosted installs with `s3Api.enabled: true` and custom tooling reading the old mirrored
  `${complianceGroup}/${locale}.json` S3 keys must switch to reading the new `pointer.json` and
  fetching the versioned key it names.
- Stored profile JSON (`StoredProfileJson`) no longer carries a full multi-locale
  `translations`/`localeContents` blob — only the default locale's resolved content plus a
  `locales: string[]` list; non-default locale content lives only in its per-version on-disk file.
  Direct DB consumers reading a profile row for non-default-locale content must read the on-disk
  version file instead. `CreateProfileInput`/`UpdateProfileInput` gain `localeContent`.
- Audit log rows for profile create/update/delete now store a small reference
  (`profileId`/`version`/`complianceGroup`) instead of the full before/after `Profile` object —
  direct consumers of raw audit-log JSON relying on the full object must read the on-disk version
  snapshot instead.
- None of the above affect `ConsentiConfig.core` becoming optional — that change only loosens
  the type.

### Migration
No real installations predate any of this batch's schema changes (see `seed-data.ts`'s "no
installation predates this schema" convention) — every new/changed column ships directly in the
fresh-install `CREATE TABLE`/`migrate()` path for every dialect, gated behind the same one-time
`schema_version`/`PRAGMA user_version` check as everything else, never a retroactive `ALTER TABLE`.
Cookie/consent data itself needs no migration: the legacy consent cookie format auto-upgrades on
first read, and profile/consent-template content is reshaped by the dashboard on next save, not
destructively converted in place. If you maintain a custom `StorageAdapter`, see "Breaking
changes" above for the full list of interface methods and fields it now needs to implement.

---

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
- `@consenti/ui`: Default banner button label changed from `"Reject Optional"` → `"Reject Optional"` and `"Manage Preferences"` → `"Customize"`
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
