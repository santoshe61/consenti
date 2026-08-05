/**
 * Single entry point for every classification dataset the scanner uses. Scanner code should
 * never import knowledge-base data or matchers from anywhere else — not from `@consenti/utils`
 * directly, not from a scattered local file. See `README.md` in this directory for the schema
 * and how to add or update an entry.
 *
 * `TRACKER_KNOWLEDGE_BASE`/`matchTrackerKnowledge` (cookie/storage *name* matching) are
 * re-exported here rather than duplicated: they're canonically owned by `@consenti/utils`
 * because the dashboard's cookie editor (`apps/api/src/dashboard`) also consumes them for
 * autocomplete when someone hand-defines a parameter — moving that data under this directory
 * would make a shared package depend on data living inside an app, backwards for this monorepo's
 * dependency direction. `@consenti/utils` is a private, unpublished workspace package (like
 * `@consenti/browser-engine`), so re-exporting its data here costs nothing at runtime — tsup
 * bundles it straight into `dist/` the same way it already does today.
 */
export type { CookiePurpose, DomainKnowledgeEntry, MatchConfidence } from './types.js'
export { DOMAIN_KNOWLEDGE_BASE, isSameSite, matchDomainKnowledge, registrableDomainOf } from './domains.js'
export { TRACKER_KNOWLEDGE_BASE, matchTrackerKnowledge, type TrackerKnowledgeEntry } from '@consenti/utils'
