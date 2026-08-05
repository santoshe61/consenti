---
'@consenti/types': minor
'@consenti/api': minor
'@consenti/ui': minor
---

Added an optional `complianceGroup` field to a custom `compliance.geoDataProvider`'s return value, on both the server (`GeoResult`, `@consenti/api`) and the widget (`WidgetCountryResolverFn`, `@consenti/ui`). When a provider returns `complianceGroup`, it's used directly — skipping the country/region jurisdiction-map lookup entirely — for providers that already carry legal-grade jurisdiction data and need to route a visitor into an operator-defined custom group. Omitting the field preserves existing country/region-map resolution exactly as before.

Also wired up `apps/ui`'s standalone-mode `compliance.geoDataProvider` config for the first time — the type existed but was never actually consumed by the profile resolver, so a configured custom provider was silently ignored. It now runs (in `compliance.type: 'auto'`, standalone/no-API mode), resolving a compliance group from its returned `country`/`region` against the same embedded/override compliance map the built-in timezone/language heuristic uses (including region-level `overriddenRegions` carve-outs), with `complianceGroup` as the direct-override escape hatch described above.
