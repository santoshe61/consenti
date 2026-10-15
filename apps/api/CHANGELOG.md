# @consenti/api

## 0.6.0

### Minor Changes

- 179a39b: **ACTION REQUIRED — MANUAL DATA MIGRATION for PostgreSQL, MySQL/MariaDB and MongoDB: 0.6.0 renames every table/collection to `consenti_*` and does NOT migrate existing data automatically. Back up, stop the app, then run `node node_modules/@consenti/api/scripts/migrate-to-consenti-prefix.mjs` (dry run) and `… --apply` (rename) before starting 0.6.0. Until then the app refuses to start; nothing is lost. SQLite and the JSON store are not affected. See CHANGELOG 0.6.0 → Migration.**

  Minor release: automatic database schema upgrade (v2), new per-consent `profileVersion`, and stricter profile-name validation, alongside the geo-routing and Windows fixes below.

  Fix UK visitors never matching a compliance group in `compliance.type: 'auto'` — geo providers, the timezone table and `en-GB` language tags all produce ISO `GB`, but the embedded compliance map keys the United Kingdom as `UK`, so `/resolve-profile` returned `found: false` and the widget showed the default layout. `GB` and `UK` now both resolve (also for operator-supplied `complianceMap`s keyed either way).

  New `override` key on a `compliance.complianceMap` document (server): `true` (default, unchanged behaviour) replaces the embedded map; `false` merges your countries over it, so changing one country no longer means re-declaring all of them. The widget's standalone-mode `complianceMap` accepts the same key; there `override: true` opts in to strict replace (unlisted countries get the strictest group) and the default stays merge-like, as it always was.

  A custom `geoDataProvider` now receives the full browser hints — server: `{ ip, timezone, language, languages, locale }` (previously `{ ip, timezone, language }`); widget (standalone mode): `({ timezone, language, languages, locale })` (previously no arguments). Additive — existing providers keep working.

  Fix saving/activating a profile on Windows failing with `EPERM: operation not permitted, rename '...\profiles\<tenant>\<group>.new-xxxxxxxx' -> '...\profiles\<tenant>\<group>'` (HTTP 500). Windows can't rename over an existing junction, so the live compliance-group directory is now removed just before the swap there (macOS/Linux keep the single atomic rename); a failed swap also cleans up its temporary junction.

  Fix the `json` storage adapter on Windows: it derived its parent directory with a `/`-only regex, so on a backslash path it created a directory named `consenti-data.json`, every write silently failed, and data was lost on restart.

  Fix `DELETE /profiles/:id` failing with a foreign-key error (HTTP 500) on MariaDB 10.5+, PostgreSQL and SQLite once a profile had any consent or notice records: `consent_records.profile_id` / `notice_shown.profile_id` no longer reference `profiles`, because a consent record is evidence and must outlive its profile. Existing databases are upgraded automatically to schema v2 on the next start (MariaDB/MySQL, PostgreSQL, SQLite; MongoDB and the JSON store need nothing). The upgrade changes table structure only, never rows; the database user needs `ALTER` (MySQL/MariaDB) or table ownership (PostgreSQL), SQLite saves a `.pre-v2-*.bak` copy first and refuses to rebuild a table with columns it doesn't know — take your usual backup first for production.

  Each consent and consent-history row now records the `profileVersion` it was given (also in the CSV/XLSX exports and the OpenAPI schema), so `GET /consent/:visitorId/verify` can resolve a deleted profile's record to the exact archived snapshot. The `profile:deleted` audit entry records the profile's name, compliance group and whether it was active, and profile create/copy/update/delete/activate/deactivate are attributed to the acting admin.

  Compliance-group and locale names are now validated as safe directory/file names (lowercase `a-z 0-9 - _` group keys, language-tag locales); a bad name previously could point the live-profile swap outside the profiles folder. `POST`/`PUT /profiles` return `400` for a violation, and the worker refuses unsafe names even if validation is bypassed.

  PostgreSQL, MySQL/MariaDB and MongoDB tables/collections are now prefixed `consenti_` (`consenti_users`, `consenti_profiles`, …) so Consenti never collides with another app's tables in a shared database. **Existing installs must rename them once** with `node node_modules/@consenti/api/scripts/migrate-to-consenti-prefix.mjs --apply` (dry run without `--apply`; renames only, no data is touched) — until then the adapter refuses to start with a message saying so. SQLite and the JSON store are unchanged.

  Connection pools now default to 5 (`storage.poolMax`; was 10 for PostgreSQL/MySQL and the driver's 100 for MongoDB) for shared hosts with per-user connection caps. A MySQL/MariaDB first start that died halfway is now resumable, and concurrent first starts no longer race on any driver. Dashboard search (consents, visitors, audit log) works again on PostgreSQL and MySQL/MariaDB, and `createTenant` works on MySQL/MariaDB strict mode.

## 0.5.0

### Patch Changes

- 4507552: MySQL/MariaDB, PostgreSQL and MongoDB adapters: implement template CRUD, profile summaries and opt-in stats — fixes setup wizard `POST /setup/seed-profiles` failing with "Not implemented"; MySQL 8.x fresh installs no longer fail on JSON column defaults

## 0.4.0

### Minor Changes

- ed19d6b: compliance.complianceMap config merge + implementation, userId identity (getUserId/setUserId/consenti:listener:identify), Intl.Locale-based auto text direction, and full ThemeConfig CSS variable parity (breaking rename)
- ed19d6b: Removed the `auditLogPurgeAfterDays` retention option (`DataRetentionConfig`) and the corresponding `purgeExpiredAuditLogs` method from the `StorageAdapter` interface and all seven storage adapters. `audit_logs` is now unconditionally append-only — never deleted by Consenti under any configuration.

  ### Breaking changes

  Any config setting `compliance.dataRetention.auditLogPurgeAfterDays` is now a no-op (the field no longer exists on the type) and any custom `StorageAdapter` implementation that relied on `purgeExpiredAuditLogs` being called will no longer see it invoked. Operators who need shorter audit-log retention must do so manually against their own database — this is intentionally outside Consenti's supported paths. `compliance.dataRetention.purgeAfterDays` (consent records) is unaffected.

- ed19d6b: Compliance-gap batch: salted/masked `hashIp()` (`compliance.dataSigningHash`), TCF v2.3, configurable `core.cookieName`, `buildSyncGpcSnippet()` for pre-mount GPC freezing, per-region `requiresSensitiveOptIn` carve-out (Colorado), equal accept/reject button prominence on the default opt-in profile, and supporting docs (TCF disclaimer, HMAC spoofability warning, PIPL/FZ-152 residency note).
- ed19d6b: Setup-wizard hardening (`/setup/complete` requires `/setup/seed-profiles` to have run first), TCF `cmpId`/`cmpVersion` registration governance (hash-based confirmation against IAB's CMP List, fails closed when unconfirmed), and new GPP (US National section) support with the same fail-closed governance shape, self-attestation only.
- ed19d6b: Added an optional `complianceGroup` field to a custom `compliance.geoDataProvider`'s return value, on both the server (`GeoResult`, `@consenti/api`) and the widget (`WidgetCountryResolverFn`, `@consenti/ui`). When a provider returns `complianceGroup`, it's used directly — skipping the country/region jurisdiction-map lookup entirely — for providers that already carry legal-grade jurisdiction data and need to route a visitor into an operator-defined custom group. Omitting the field preserves existing country/region-map resolution exactly as before.

  Also wired up `apps/ui`'s standalone-mode `compliance.geoDataProvider` config for the first time — the type existed but was never actually consumed by the profile resolver, so a configured custom provider was silently ignored. It now runs (in `compliance.type: 'auto'`, standalone/no-API mode), resolving a compliance group from its returned `country`/`region` against the same embedded/override compliance map the built-in timezone/language heuristic uses (including region-level `overriddenRegions` carve-outs), with `complianceGroup` as the direct-override escape hatch described above.

## 0.3.0

### Minor Changes

- ee33430: consent-authoring revamp, profile history, and TCF/RTL/age-gate widget features (0.3.0)

## 0.2.0

### Minor Changes

- e22b457: chore: New compliances, ui and api methods introduced

### Patch Changes

- e22b457: fix: mobile modal layout, scroll lock, security hardening, and deep profileOverride merge

  - Restructure modal header to column layout with absolutely-positioned controls
    so heading and subheading stack correctly on narrow screens
  - Lock body scroll (save/restore overflow) when modal opens in overlay or
    fullscreen mode; restore on close and destroy
  - Move subheading into header and htmlText/receipt into body div for correct
    DOM order
  - Sanitize DPDPA grievance email to prevent XSS in modal innerHTML
  - Reject javascript: src URLs and on\* event-handler attributes in ConsentScript
  - Replace shallow profileOverride merge with deepMerge so nested profile
    keys (e.g. cookies, theme) are properly overridden
  - Add changeset config, sync-root-version script, and updated CI/publish workflows
  - Add banner and logo assets; update COLLABORATOR_GUIDE, tsconfig, and lockfile

- e22b457: remove /author page, rebuild footer with SEO grid, update compliance and UI docs pages
