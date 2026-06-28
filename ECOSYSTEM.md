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
| Vue | `@consenti/ui/vue` | Planned |
| Angular | `@consenti/ui/angular` | Planned |
| Svelte | `@consenti/ui/svelte` | Planned |

---

## Analytics & Data Warehouse Plugins

Consenti ships a plugin API for forwarding consent events to analytics platforms. The following plugins are documented in `apps/docs/plugins-*.md`.

| Plugin | Destination | Docs |
|--------|------------|------|
| BigQuery | Google BigQuery | [plugins-bigquery.md](./apps/docs/plugins-bigquery.md) |
| Segment | Twilio Segment | [plugins-segment.md](./apps/docs/plugins-segment.md) |
| Snowflake | Snowflake Data Cloud | [plugins-snowflake.md](./apps/docs/plugins-snowflake.md) |

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
| IAB TCF v2.2 | Built-in TC string generation and `__tcfapi` stub |
| Global Privacy Control (GPC) | Built-in `navigator.globalPrivacyControl` detection |

---

## Compliance Regulations Covered

| Regulation | Region | Status |
|-----------|--------|--------|
| GDPR | EU / EEA | Supported |
| UK-GDPR | United Kingdom | Supported |
| CCPA | California, USA | Supported |
| CPRA | California, USA | Supported |
| LGPD | Brazil | Supported |
| DPDPA | India | Supported |
| PIPEDA / Law 25 | Canada / Quebec | Supported |
| POPIA | South Africa | Supported |
| PDPA-TH | Thailand | Supported |
| APPI | Japan | Supported |
| KVKK | Turkey | Supported |
| IAB TCF v2.2 | Global (programmatic) | Supported |

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
