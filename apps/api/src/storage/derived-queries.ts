import type { Profile, ProfileSummary, ComplianceGroupId, StoredProfileJson, ConsentValue, OptInStats } from '@consenti/types'

type TemplateIdFields = { customComplianceGroup?: string; consentTemplateId?: string; uiTemplateId?: string }

// Template ids live inside profile_json, so adapters without portable JSON-in-SQL (MySQL vs
// MariaDB, Mongo) assemble summaries here instead of joining in the database.
export function buildProfileSummaries(
  profiles: Profile[],
  consentTemplateNames: ReadonlyMap<string, string>,
  uiTemplateNames: ReadonlyMap<string, string>,
): ProfileSummary[] {
  return profiles.map(p => {
    const pj = p.profileJson as StoredProfileJson & TemplateIdFields
    return {
      id: p.id,
      name: p.name,
      defaultLocale: p.defaultLocale,
      complianceGroup: (pj.complianceGroup ?? null) as ComplianceGroupId | null,
      customComplianceGroup: pj.customComplianceGroup ?? null,
      isActive: pj.isActive === true,
      consentTemplateName: pj.consentTemplateId ? consentTemplateNames.get(pj.consentTemplateId) ?? null : null,
      uiTemplateName: pj.uiTemplateId ? uiTemplateNames.get(pj.uiTemplateId) ?? null : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }
  })
}

export interface OptInRow { locale: string; day: string; consentJson: ConsentValue }

type Bucket = { total: number; granted: number; denied: number; managed: number }

/** A record counts as granted/denied when ≥90% of its categories agree, otherwise "managed". */
export function tallyOptIn(rows: readonly OptInRow[]): OptInStats {
  const empty = (): Bucket => ({ total: 0, granted: 0, denied: 0, managed: 0 })
  const overall = empty()
  const byLocale: Record<string, Bucket> = {}
  const byDay = new Map<string, Bucket>()

  for (const r of rows) {
    const statuses = Object.values(r.consentJson) as string[]
    const share = (status: string) => statuses.length > 0 ? statuses.filter(s => s === status).length / statuses.length : 0
    const outcome = share('granted') >= 0.9 ? 'granted' : share('denied') >= 0.9 ? 'denied' : 'managed'
    if (!byDay.has(r.day)) byDay.set(r.day, empty())
    byLocale[r.locale] ??= empty()
    for (const b of [overall, byLocale[r.locale]!, byDay.get(r.day)!]) { b.total++; b[outcome]++ }
  }

  const pct = (n: number) => overall.total > 0 ? Math.round((n / overall.total) * 1000) / 10 : 0
  return {
    ...overall,
    grantedPct: pct(overall.granted),
    deniedPct: pct(overall.denied),
    managedPct: pct(overall.managed),
    byLocale,
    byDate: Array.from(byDay, ([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
  }
}
