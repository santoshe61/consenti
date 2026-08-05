# Consenti Ecosystem

This document lists official packages, first-party integrations, and community-built tools around Consenti.

---

## Official Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@consenti/ui` | Browser widget — banner, modal, events, GPC, i18n | [![npm](https://img.shields.io/npm/v/@consenti/ui.svg)](https://www.npmjs.com/package/@consenti/ui) |
| `@consenti/api` | Node.js backend — consent store, REST API, admin dashboard | [![npm](https://img.shields.io/npm/v/@consenti/api.svg)](https://www.npmjs.com/package/@consenti/api) |

---

## Framework Adapters

Built into `@consenti/ui` as subpath exports — no separate install needed.

| Framework | Import path | Status |
|-----------|------------|--------|
| React | `@consenti/ui/react` | `useConsent()` hook — available |
| Vue | `@consenti/ui/vue` | `useConsent()` composable — available |
| Angular | `@consenti/ui/angular` | `useConsent()` service — available |
| Svelte | `@consenti/ui/svelte` | planned |

---

## Analytics & Data Warehouse Plugins

Consenti ships a plugin API for forwarding consent events to analytics platforms. The following plugins are documented in `apps/docs/src/app/docs/api/plugins/` and `apps/docs/src/app/docs/ui/plugins/`.

| Plugin | Destination | Docs |
|--------|------------|------|
| BigQuery | Google BigQuery | [plugins-bigquery](apps/docs/src/app/docs/api/plugins/bigquery/page.tsx) |
| Segment | Twilio Segment | [plugins-segment](apps/docs/src/app/docs/api/plugins/segment/page.tsx) |
| Snowflake | Snowflake Data Cloud | [plugins-snowflake](apps/docs/src/app/docs/api/plugins/snowflake/page.tsx) |

All plugins are implemented via the `PluginBase` class. See `plans/api/feature-plugin-system.md` for the full plugin authoring spec.

---

## Storage Adapters

`@consenti/api` ships with a zero-dependency SQLite adapter and optional adapters for larger deployments.

| Driver | Config key | Notes |
|--------|-----------|-------|
| SQLite | `'sqlite'` | Default. Uses `node:sqlite` built-in. Zero deps. |
| PostgreSQL | `'pg'` | Requires `pg` peer dep. |
| MySQL | `'mysql'` | Requires `mysql2` peer dep. |
| MongoDB | `'mongodb'` | Requires `mongodb` peer dep. |

---

## Tag Management

Consenti integrates with tag managers and consent signal protocols without additional packages.

| Integration | How |
|------------|-----|
| Google Tag Manager | Built-in `dataLayer` push on consent change |
| Google Consent Mode v2 | Built-in — pushes `consent` command with all GCM keys |
| IAB TCF v2.3 | Built-in TC string generation and `__tcfapi` stub — Partial: spec-correct binary encoding needs `publisherCC` config + the optional `@iabtechlabtcf/core` peer dependency, simplified format otherwise. Only relevant for programmatic/RTB ad monetization — see the [TCF & GPP Registration Guide](https://consenti.dev/docs/compliance/tcf-and-gpp-registration) |
| IAB GPP (US National section) | Built-in GPP string generation and `__gpp` stub — Partial: spec-correct binary encoding needs the optional `@iabgpp/cmpapi` peer dependency, simplified format otherwise. Same registration-only-for-programmatic-ads caveat as TCF |
| Global Privacy Control (GPC) | Built-in `navigator.globalPrivacyControl` detection |
| Automated cookie/tracker scanning | `@consenti/scanner` — local CLI, crawls a site under none/reject-all/accept-all consent states, reports undeclared trackers, fully offline |

---

## Compliance Regulations Covered

Status reflects how confidently we track ongoing legal changes, not just whether code exists.
"Maintained" = actively tracked as the law changes. "In development" = supported today, encoding
or rollout still being finished. "Supported" (no currency claim) = code is complete and stable,
but not tracked as closely as the maintained tier.

| Regulation | Region | Status |
|-----------|--------|--------|
| GDPR | EU / EEA | Maintained |
| UK-GDPR | United Kingdom | Maintained |
| CCPA | California, USA | Maintained |
| CPRA | California, USA | Maintained |
| LGPD | Brazil | Maintained |
| DPDPA | India | In development — tracking India's phased 2025–2027 rules rollout |
| PIPEDA / Law 25 | Canada / Quebec | Supported |
| POPIA | South Africa | Supported |
| PDPA-TH | Thailand | Supported |
| APPI | Japan | Supported |
| KVKK | Turkey | Supported |
| IAB TCF v2.3 | Global (programmatic) | Partial — spec-correct binary TC-string encoding available (set `publisherCC` + install optional `@iabtechlabtcf/core`); simplified format otherwise. Registration only needed if you monetize via programmatic/RTB ads — see the [TCF & GPP Registration Guide](https://consenti.dev/docs/compliance/tcf-and-gpp-registration) |
| IAB GPP (US National section) | Global (programmatic, US MSPA) | Partial — spec-correct binary GPP-string encoding available (install optional `@iabgpp/cmpapi`); simplified format otherwise. Same registration-only-for-programmatic-ads caveat as TCF |

---

## Community Tools

> Have you built a tool or integration for Consenti? Open a PR to add it here.

| Tool | Description | Author |
|------|-------------|--------|
| *(none yet)* | | |

---

## Adding to This List

To list your tool or integration:

1. Open a pull request editing this file.
2. Include: tool name, brief description, link, and your GitHub handle.
3. The tool must be publicly available and work with the current stable release.
