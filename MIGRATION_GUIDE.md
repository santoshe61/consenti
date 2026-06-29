# Migration Guide

This guide covers every breaking change in Consenti, with before/after code examples and step-by-step migration instructions.

Entries are in reverse chronological order. If you are upgrading across multiple versions, apply each section in order from oldest to newest.

---

## 2026-06-25 — Button API: `style` + `action` split

**Source:** [changelog/2026-06-25-V2.md](./changelog/2026-06-25-V2.md)

### What changed

`Button.type` was a single field serving two unrelated purposes (visual style and click behaviour). It has been split into:

- `style: 'primary' | 'secondary' | 'text' | 'accent'` — controls visual appearance
- `action: 'submit' | 'manage' | 'close' | 'custom' | 'link'` — controls what happens on click

Both fields are now **required**.

### CSS / theme tokens

| Before | After |
|--------|-------|
| `ThemeConfig.rejectColor` | `ThemeConfig.accentColor` |
| `ThemeConfig.rejectTextColor` | `ThemeConfig.accentTextColor` |
| `--consenti-color-reject` | `--consenti-color-accent` |
| `--consenti-color-reject-text` | `--consenti-color-accent-text` |
| `.consenti-btn--reject` | `.consenti-btn--accent` |

### Migration

```ts
// Before
{ text: 'Accept All',          cookies: '*', type: 'primary' }
{ text: 'Customize',               type: 'manage' }
{ text: 'Save Preferences',                 type: 'submit' }
{ text: 'Decline',             cookies: '!', type: 'reject' }

// After
{ text: 'Accept All',          cookies: '*', style: 'primary',   action: 'custom' }
{ text: 'Customize',               style: 'secondary', action: 'manage' }
{ text: 'Save Preferences',                 style: 'primary',   action: 'submit' }
{ text: 'Decline',             cookies: '!', style: 'accent',    action: 'custom' }
```

If you override CSS variables or class names in your stylesheet, find and replace the old names with the new ones.

---

## 2026-06-25 — `apps/demo` removed

**Source:** [changelog/2026-06-25-V3.md](./changelog/2026-06-25-V3.md)

### What changed

The standalone `apps/demo` workspace has been removed. The demo playground and backend admin intro now live inside `apps/docs`.

### Migration

| Before | After |
|--------|-------|
| `npm run dev --workspace=apps/demo` | `npm run dev --workspace=apps/docs` |
| Playground at `/playground` | Playground at `/demo/frontend` |
| Backend admin at separate port | Backend admin at `/demo/backend` |
| Docs on port 3002, static export | Docs on port 3000, SSR |

Update any local scripts, bookmarks, or CI steps that reference `apps/demo`.

---

## 2026-06-24 — Public profile response shape change

**Source:** [changelog/2026-06-24-V5.md](./changelog/2026-06-24-V5.md)

### What changed

`GET /api/v1/profiles/:id` and `GET /api/v1/profiles/:id/:locale` no longer return a raw `translations` map. The response now returns fully-resolved locale content.

| Before | After |
|--------|-------|
| `response.translations[locale].mainBanner` | `response.mainBanner` |
| `response.translations[locale].preferenceModal` | `response.preferenceModal` |
| No `currentLocale` or `locales` field | `response.currentLocale`, `response.locales` |

### Migration

```ts
// Before — you had to pick the locale yourself
const banner = response.translations['en'].mainBanner

// After — resolved for you; use the locale endpoint for a specific locale
const banner = response.mainBanner

// To enumerate available locales:
const available = response.locales   // string[]

// To fetch a specific locale:
// GET /api/v1/profiles/:id/en  → response.currentLocale === 'en'
```

No database migration needed. This is an API response shape change only.

---

## 2026-06-24 — Public profile endpoint renamed to plural

**Source:** [changelog/2026-06-24-V3.md](./changelog/2026-06-24-V3.md)

### What changed

The public profile REST endpoints changed from singular to plural path segments.

| Before | After |
|--------|-------|
| `GET /consenti/api/v1/profile/:id` | `GET /consenti/api/v1/profiles/:id` |
| `GET /consenti/api/v1/profile/:id/:locale` | `GET /consenti/api/v1/profiles/:id/:locale` |

### Migration

Search your frontend code for `/api/v1/profile/` and replace with `/api/v1/profiles/`. If you are using the `@consenti/ui` widget with `api.enabled: true`, update to the latest widget version — the path is resolved internally and is already corrected.

---

## Future Versions

Breaking changes in upcoming versions will be documented here before release. Check [PRE_RELEASE_CHANGELOG.md](./PRE_RELEASE_CHANGELOG.md) for pre-release breaking changes.
