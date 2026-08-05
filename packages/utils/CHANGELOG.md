# @consenti/utils

## 0.4.0

### Minor Changes

- ed19d6b: compliance.complianceMap config merge + implementation, userId identity (getUserId/setUserId/consenti:listener:identify), Intl.Locale-based auto text direction, and full ThemeConfig CSS variable parity (breaking rename)
- ed19d6b: Compliance-gap batch: salted/masked `hashIp()` (`compliance.dataSigningHash`), TCF v2.3, configurable `core.cookieName`, `buildSyncGpcSnippet()` for pre-mount GPC freezing, per-region `requiresSensitiveOptIn` carve-out (Colorado), equal accept/reject button prominence on the default opt-in profile, and supporting docs (TCF disclaimer, HMAC spoofability warning, PIPL/FZ-152 residency note).
- ed19d6b: Setup-wizard hardening (`/setup/complete` requires `/setup/seed-profiles` to have run first), TCF `cmpId`/`cmpVersion` registration governance (hash-based confirmation against IAB's CMP List, fails closed when unconfirmed), and new GPP (US National section) support with the same fail-closed governance shape, self-attestation only.

## 0.3.0

### Minor Changes

- ee33430: consent-authoring revamp, profile history, and TCF/RTL/age-gate widget features (0.3.0)

## 0.2.0

### Minor Changes

- e22b457: chore: New compliances, ui and api methods introduced

### Patch Changes

- e22b457: remove /author page, rebuild footer with SEO grid, update compliance and UI docs pages
