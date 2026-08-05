import { COMPLIANCE_GROUP_IDS } from '@consenti/utils'

/**
 * Full jurisdiction list, sourced from the same data `apps/ui/src/core/profile-resolver.ts`
 * ultimately derives its groups from — not a hand-maintained parallel list, so this can't
 * silently drift out of sync with what the resolver actually supports.
 */
export const ALL_JURISDICTIONS: readonly string[] = COMPLIANCE_GROUP_IDS
