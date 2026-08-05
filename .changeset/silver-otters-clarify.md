---
'@consenti/types': minor
'@consenti/ui': minor
---

`getConsent('category')` now returns real per-category consent — keyed by your authored `preferenceModal.categories` IDs, using the standard `'granted' | 'denied' | 'objected'` values ('granted' only when every parameter in the category is granted) — instead of the fixed purpose taxonomy it silently returned before. Added `getConsent('purpose')` for the old purpose-keyed output (`necessary`/`functional`/`preferences`/`analytics`/`marketing`).

### Breaking changes
`getConsent('category')`'s output shape changed. Callers relying on the old purpose-keyed output must switch to `getConsent('purpose')`.
