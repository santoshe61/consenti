import type { Metadata } from 'next'
import Link from 'next/link'
import { COMPLIANCE_GROUP_IDS, COMPLIANCE_GROUPS } from '@consenti/utils'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Compliance Groups',
  description:
    'What a Compliance Group is in Consenti, and how each of the 8 built-in Compliance Groups maps to real regulations (GDPR, CCPA, CPRA, DPDPA, PIPL, LGPD, and more) — plus how to add your own.',
  keywords: [
    'Compliance Group',
    'compliance group',
    'GDPR opt-in',
    'CCPA opt-out',
    'CPRA opt-out-strict',
    'consent management model',
  ],
  alternates: { canonical: 'https://consenti.dev/docs/compliance/compliance-groups' },
  openGraph: {
    title: 'Compliance Groups — Consenti',
    description:
      'What a Compliance Group is in Consenti, and how each of the 8 built-in Compliance Groups maps to real regulations — plus how to add your own.',
    url: 'https://consenti.dev/docs/compliance/compliance-groups',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compliance Groups — Consenti',
    description:
      'What a Compliance Group is in Consenti, and how each of the 8 built-in Compliance Groups maps to real regulations — plus how to add your own.',
    images: ['/og-image.jpg'],
  },
}

/** Regulation ids (from `COMPLIANCE_GROUPS[group].compliances`) that have their own docs page,
 * plus COPPA — editorially filed under `general-privacy-consent` but not tied to a single
 * country, so it doesn't appear in that group's `compliances` list. TCF/GPP registration is
 * cross-cutting (not tied to any one compliance group), so it's linked from the sidebar's
 * top-level Compliances section instead — see /docs/compliance/tcf-and-gpp-registration/. */
const REGULATION_DOCS: Record<string, { label: string; href: string }> = {
  'gdpr': { label: 'GDPR (EU / EEA)', href: '/docs/compliance/gdpr/' },
  'uk-gdpr': { label: 'UK GDPR', href: '/docs/compliance/uk-gdpr/' },
  'kvkk': { label: 'KVKK (Turkey)', href: '/docs/compliance/kvkk/' },
  'pdpa-th': { label: 'PDPA (Thailand)', href: '/docs/compliance/pdpa-th/' },
  'ccpa': { label: 'CCPA / US States', href: '/docs/compliance/ccpa/' },
  'cpra': { label: 'CPRA (California 2023)', href: '/docs/compliance/cpra/' },
  'dpdpa': { label: 'DPDPA (India 2023)', href: '/docs/compliance/dpdpa/' },
  'pipl': { label: 'PIPL (China 2021)', href: '/docs/compliance/pipl/' },
  'lgpd': { label: 'LGPD (Brazil)', href: '/docs/compliance/lgpd/' },
  'pipeda': { label: 'PIPEDA / Law 25 (Canada)', href: '/docs/compliance/pipeda/' },
  'popia': { label: 'POPIA (South Africa)', href: '/docs/compliance/popia/' },
  'appi': { label: 'APPI (Japan)', href: '/docs/compliance/appi/' },
}

/** Extras filed under `general-privacy-consent` editorially — not regulation ids in
 * `COMPLIANCE_GROUPS`, so listed separately rather than merged into `compliances`. */
const GROUP_EXTRA_DOCS: Partial<Record<string, Array<{ label: string; href: string }>>> = {
  'general-privacy-consent': [
    { label: 'COPPA', href: '/docs/compliance/coppa/' },
  ],
  'notice-only': [{ label: 'Notice Only', href: '/docs/compliance/notice-only/' }],
}

/** A few regulation pages recommend a stricter manual override than the group their country
 * defaults to automatically (e.g. PIPEDA/POPIA/APPI's pages recommend configuring `opt-in`
 * explicitly, even though the automatic geo-router's default for those countries is the more
 * permissive `general-privacy-consent`) — flagged here so this page doesn't silently disagree
 * with what those pages themselves say. */
const GROUP_NOTES: Partial<Record<string, string>> = {
  'general-privacy-consent': 'PIPEDA, POPIA, and APPI resolve here by default automatically, but each has its own docs page recommending a stricter opt-in override — check the linked page for the specific recommendation.',
  'opt-out': "Colorado is a per-region exception within this group: cookies tagged cpraCategory:'sensitive' default to denied there (requiresSensitiveOptIn), same as the sale/share carve-out below, while the rest of the group's cookies still default to granted. Only takes effect with a geoip/maxmind geoDataProvider — see the CCPA/CPRA guide.",
}

/** Display order — matches the docs sidebar's compliance-group grouping, not
 * `COMPLIANCE_GROUPS`' own key insertion order. */
const DISPLAY_ORDER = [
  'opt-in', 'opt-out', 'opt-out-strict', 'opt-in-dpdpa',
  'opt-in-china', 'opt-in-brazil', 'general-privacy-consent', 'notice-only',
] as const satisfies readonly (typeof COMPLIANCE_GROUP_IDS[number])[]

function gpcNote(defaultGpc: string, autoHonor: boolean): string {
  if (defaultGpc === 'strict') return 'GPC signal silently denies all non-mandatory cookies — no banner shown.'
  if (autoHonor) return 'GPC signal is auto-honored — a GPC-specific banner variant is shown once.'
  return 'GPC signal is ignored by default (can be changed per profile).'
}

export default function ConsentModelsPage() {
  return (
    <div className="prose max-w-none">
      <h1>Compliance Groups</h1>
      <p className="lead">
        A <strong>Compliance Group</strong> is how Consenti groups jurisdictions that share the same
        consent compliance rules — how consent must be collected, what &quot;opt-out&quot; needs to look
        like, whether GPC must be auto-honored, and so on. Right now that&apos;s{' '}
        <strong>8 built-in Compliance Groups</strong>, covering every jurisdiction in the{' '}
        <Link href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</Link> —
        but it&apos;s not fixed to 8: extend it with your own via a custom Compliance Group (see{' '}
        <Link href="/docs/ui/advanced-profiles/#compliancegroupsoverride">complianceGroupsOverride</Link>{' '}
        below).
      </p>

      <Callout type="info">
        Publicly, we call these <strong>Compliance Groups</strong> (<code>ComplianceGroupId</code>{' '}
        in <code>@consenti/types</code>). In code and everywhere else in
        these docs, you may find them referred to as <strong>Consent Model</strong>  — same 8 things, two names.
      </Callout>

      <h2>The 8 built-in Compliance Groups</h2>

      {DISPLAY_ORDER.map((id) => {
        const group = COMPLIANCE_GROUPS[id]
        const compliances = group.compliances;

        const regDocs: { label: string; href: string }[] = [];
        const unDocs: string[] = [];

        compliances.forEach(c => {
          let reg = REGULATION_DOCS[c];
          if (reg) regDocs.push(reg);
          else unDocs.push(c)
        })
        // .filter((d): d is { label: string; href: string } => !!d)

        const extraDocs = GROUP_EXTRA_DOCS[id] ?? []
        const allDocs = [...regDocs, ...extraDocs]
        const undocumented = group.compliances.length - regDocs.length

        return (
          <div key={id} className="not-prose my-6 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
            <h3 className="mt-0 mb-1 text-lg font-semibold text-slate-800 dark:text-gray-100">
              {group.label} <code className="text-sm font-normal text-brand-600">{id}</code>
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">{group.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {allDocs.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="text-xs font-medium px-2 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 cursor-pointer"
                >
                  {d.label}
                </Link>
              ))}
              {
                unDocs.map((c) => (
                  <span
                    className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400">
                    {c}
                  </span>
                ))
              }
            </div>

            <ul className="text-sm text-slate-600 dark:text-gray-400 space-y-1 mb-0">
              <li>{gpcNote(group.defaultGpc, group.gpcAutoHonor)}</li>
              <li>
                {group.allowsLegitimateInterest
                  ? 'Legitimate interest is a valid legal basis alongside consent.'
                  : 'Consent is the only valid legal basis — no legitimate-interest fallback.'}
              </li>
              {group.requiresCpraCategory && <li>Requires CPRA sale/share/sensitive-data categories.</li>}
              {group.requiresDpdpaDisclosure && <li>Requires DPDPA data-fiduciary disclosure.</li>}
              {group.allowsTcf && <li>Compatible with IAB TCF v2.3 vendor consent.</li>}
            </ul>
            {GROUP_NOTES[id] && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 mb-0">{GROUP_NOTES[id]}</p>
            )}
          </div>
        )
      })}

      <h2>Extending beyond the 8</h2>
      <p>
        Not every jurisdiction fits one of the 8 built-in groups exactly — and you might want
        different banner text, buttons, or cookies per country even within a group. Two options,
        both first-class (neither is a workaround):
      </p>
      <ul>
        <li>
          <strong>A custom Compliance Group</strong> — author a profile with a free-form{' '}
          <code>customComplianceGroup</code> id instead of one of the 8 built-in ones, then target
          it with <code>compliance: {'{ type: '}&apos;your-group-id&apos;{' }'}</code> or register
          it locally with <code>registerProfile()</code>. Route visitors to it automatically by
          having your <code>geoDataProvider</code> resolve to that group id for the countries you
          want.
        </li>
        <li>
          <strong><code>complianceGroupsOverride</code></strong> — keep the 8 built-in groups (or
          your custom ones), but override text/buttons/cookies per group from a single config
          object instead of authoring a separate profile for each. See the full guide in{' '}
          <Link href="/docs/ui/advanced-profiles/#compliancegroupsoverride">
            complianceGroupsOverride — per-group content, one config object
          </Link>.
        </li>
      </ul>

      <p>
        For the full country → group mapping (which is what actually decides which Compliance Group
        a given visitor gets), see the{' '}
        <Link href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</Link>.
      </p>
    </div>
  )
}
