# @consenti/types

## 0.4.0

### Minor Changes

- ed19d6b: compliance.complianceMap config merge + implementation, userId identity (getUserId/setUserId/consenti:listener:identify), Intl.Locale-based auto text direction, and full ThemeConfig CSS variable parity (breaking rename)
- ed19d6b: Removed the `auditLogPurgeAfterDays` retention option (`DataRetentionConfig`) and the corresponding `purgeExpiredAuditLogs` method from the `StorageAdapter` interface and all seven storage adapters. `audit_logs` is now unconditionally append-only — never deleted by Consenti under any configuration.

  ### Breaking changes

  Any config setting `compliance.dataRetention.auditLogPurgeAfterDays` is now a no-op (the field no longer exists on the type) and any custom `StorageAdapter` implementation that relied on `purgeExpiredAuditLogs` being called will no longer see it invoked. Operators who need shorter audit-log retention must do so manually against their own database — this is intentionally outside Consenti's supported paths. `compliance.dataRetention.purgeAfterDays` (consent records) is unaffected.

- ed19d6b: Added `getVisitor()` to the widget API — a snapshot of the current visitor's identity: the stable per-browser `visitorId` (`null` until a consent decision has actually happened; it's never minted just to answer this call), whether they're `'authenticated'` or `'anonymous'`, and the app `userId` (same value as `getUserId()`). Wired into the React/Vue/Angular integrations alongside the existing `getUserId`/`setUserId`.

  Also documented `getUserId()`/`setUserId()`/`getVisitor()` on the `/docs/ui/methods` page — they were implemented but missing from the docs.

- ed19d6b: `getConsent('category')` now returns real per-category consent — keyed by your authored `preferenceModal.categories` IDs, using the standard `'granted' | 'denied' | 'objected'` values ('granted' only when every parameter in the category is granted) — instead of the fixed purpose taxonomy it silently returned before. Added `getConsent('purpose')` for the old purpose-keyed output (`necessary`/`functional`/`preferences`/`analytics`/`marketing`).

  ### Breaking changes

  `getConsent('category')`'s output shape changed. Callers relying on the old purpose-keyed output must switch to `getConsent('purpose')`.

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
