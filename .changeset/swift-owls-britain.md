---
'@consenti/api': patch
'@consenti/ui': patch
---

Fix UK visitors never matching a compliance group in `compliance.type: 'auto'` — geo providers, the timezone table and `en-GB` language tags all produce ISO `GB`, but the embedded compliance map keys the United Kingdom as `UK`, so `/resolve-profile` returned `found: false` and the widget showed the default layout. `GB` and `UK` now both resolve (also for operator-supplied `complianceMap`s keyed either way).

New `override` key on a `compliance.complianceMap` document (server): `true` (default, unchanged behaviour) replaces the embedded map; `false` merges your countries over it, so changing one country no longer means re-declaring all of them. The widget's standalone-mode `complianceMap` accepts the same key; there `override: true` opts in to strict replace (unlisted countries get the strictest group) and the default stays merge-like, as it always was.

A custom `geoDataProvider` now receives the full browser hints — server: `{ ip, timezone, language, languages, locale }` (previously `{ ip, timezone, language }`); widget (standalone mode): `({ timezone, language, languages, locale })` (previously no arguments). Additive — existing providers keep working.
