import type { Metadata } from 'next'
import {
  COMPLIANCE_GROUP_IDS,
  COMPLIANCE_GROUPS,
  EMBEDDED_COMPLIANCE_MAP,
  LOCALES,
} from '@consenti/utils'
import { Callout } from '@/components/Callout'
import { SortableTable, type SortableTableRow } from '@/components/SortableTable'

export const metadata: Metadata = {
  title: 'Jurisdiction Coverage Map',
  description:
    'Every country and region Consenti maps out of the box, the law(s) that apply, and which of the 8 built-in compliance groups it resolves to — plus every supported locale.',
  alternates: { canonical: 'https://consenti.dev/docs/compliance/jurisdiction-coverage-map' },
  openGraph: {
    title: 'Jurisdiction Coverage Map',
    description:
      'Every country and region Consenti maps out of the box, the law(s) that apply, and which of the 8 built-in compliance groups it resolves to — plus every supported locale.',
    url: 'https://consenti.dev/docs/compliance/jurisdiction-coverage-map',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jurisdiction Coverage Map',
    description:
      'Every country and region Consenti maps out of the box, the law(s) that apply, and which of the 8 built-in compliance groups it resolves to — plus every supported locale.',
    images: ['/og-image.jpg'],
  },
}

interface RegionEntry {
  name: string
  type: 'region'
  complianceGroup: string
  description: string
}

interface CountryEntry {
  name: string
  type: 'country'
  complianceGroup: string
  default: string
  description: string
  locales: readonly string[]
  compliance: readonly string[]
  timezones: readonly string[]
  overriddenRegions?: Record<string, RegionEntry>
}

const countries = Object.entries(EMBEDDED_COMPLIANCE_MAP.countries) as Array<[string, CountryEntry]>
const totalCountries = countries.length
const totalLocales = Object.keys(LOCALES).length

function lawList(compliance: readonly string[]): string {
  return compliance.length ? compliance.map(c => c.toUpperCase()).join(', ') : '—'
}

const countryRows: SortableTableRow[] = countries.map(([code, entry]) => ({
  id: code,
  country: entry.name,
  code,
  regulations: lawList(entry.compliance),
  locales: entry.locales.join(', '),
  complianceGroup: entry.complianceGroup,
}))

const overrideRows: SortableTableRow[] = countries.flatMap(([countryCode, entry]) => {
  if (!entry.overriddenRegions) return []
  return Object.entries(entry.overriddenRegions).map(([regionCode, region]) => ({
    id: `${countryCode}-${regionCode}`,
    country: entry.name,
    region: region.name,
    code: regionCode,
    complianceGroup: region.complianceGroup,
    note: region.description,
  }))
})

const COUNTRY_TABLE_COLUMNS = [
  { key: 'country', label: 'Country / territory' },
  { key: 'code', label: 'Code', mono: true },
  { key: 'regulations', label: 'Regulation(s)' },
  { key: 'locales', label: 'Locale(s)', className: 'text-xs' },
  { key: 'complianceGroup', label: 'Compliance group', mono: true },
]

const OVERRIDE_TABLE_COLUMNS = [
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'code', label: 'Code', mono: true },
  { key: 'complianceGroup', label: 'Compliance group', mono: true },
  { key: 'note', label: 'Note', className: 'text-xs' },
]

export default function JurisdictionCoverageMapPage() {
  return (
    <div className="prose max-w-none">
      <h1>Jurisdiction Coverage Map</h1>
      <p>
        Consenti ships an embedded map of{' '}
        <strong>{totalCountries} countries and territories</strong>, each pre-assigned to one of the
        8 built-in <strong>compliance groups</strong> — the model that decides opt-in vs. opt-out
        behaviour, GPC handling, and legitimate-interest rules. It's the reference for the{' '}
        <code>type</code> field in <a href="/docs/ui/advanced-configuration/#compliance">UI</a> /{' '}
        <a href="/docs/api/advanced-configuration/#compliance">Backend</a> configuration, and for
        the <code>compliance</code> array shown on every{' '}
        <a href="/docs/compliance/gdpr/">compliance guide</a>.
      </p>

      <Callout type="info">
        The 8 groups and the map below are convenience defaults, tuned for the most common
        regulatory shapes so most sites never need to touch them. They're not a ceiling: any site
        can author its own profile — banner copy, categories, GPC handling, everything — against a{' '}
        <a href="#custom-compliance-groups">custom compliance group</a> (see item 9 below) and route
        to it explicitly with <code>compliance.type</code>, no built-in group required. See the{' '}
        <a href="/guides/backend/geo-routing/">Geo-Routing &amp; Auto-Detection guide</a> for how
        country resolution feeds into this map.
      </Callout>

      <h2>Compliance Groups</h2>
      <ol>
        {COMPLIANCE_GROUP_IDS.map(groupId => {
          const group = COMPLIANCE_GROUPS[groupId]
          return (
            <li key={groupId}>
              <strong>{group.label}</strong> — <code>{groupId}</code>
              <p>{group.description}</p>
            </li>
          )
        })}
        <li id="custom-compliance-groups">
          <strong>Custom compliance groups</strong>
          <p>
            The 8 groups above cover every country in the map, but a profile is not limited to them.
            Every profile has an optional <code>customComplianceGroup</code> field — a free-form,
            lower-kebab-case string that stands in for <code>complianceGroup</code> when a site
            needs a consent model that doesn't map to any built-in group (a bespoke internal policy,
            a jurisdiction not yet in the map, an A/B test variant, etc.).
          </p>
          <table>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Behaviour</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Where it's set</td>
                <td>
                  Admin dashboard profile wizard, Step 1 — choose <strong>None / Custom</strong>{' '}
                  instead of one of the 8 built-in radio options, then type the identifier. See the{' '}
                  <a href="/docs/api/dashboard/">Admin Dashboard</a> guide.
                </td>
              </tr>
              <tr>
                <td>How it's targeted</td>
                <td>
                  Set the widget's <code>compliance.type</code> to the same string. Consenti
                  resolves it exactly like a built-in group, fetching whichever profile is active
                  for that name.
                </td>
              </tr>
              <tr>
                <td>Requirement</td>
                <td>
                  <strong>API mode only</strong> (<code>api.enabled: true</code>). There is no
                  pre-built/offline fallback for a custom group name — resolution throws if nothing
                  is active for it server-side.
                </td>
              </tr>
              <tr>
                <td>Validation</td>
                <td>
                  None of the <code>COMPLIANCE_VALIDATION_RULES</code> (legal-basis requirements,
                  GPC recommendations, CPRA categories) apply to a custom group — you own
                  correctness.
                </td>
              </tr>
            </tbody>
          </table>
          <Callout type="tip">
            A related but distinct mechanism: instead of a new custom group, you can also{' '}
            <em>override</em> one of the 8 built-in groups everywhere it's resolved — geo-detected
            or fixed — by registering a <code>ConsentiProfile</code> with a matching{' '}
            <code>complianceGroup</code> (optionally <code>deepMerge: true</code> to patch instead
            of replace). See{' '}
            <a href="/docs/ui/advanced-profiles/#complianceGroup-override">
              Overriding a built-in compliance group
            </a>
            .
          </Callout>
        </li>
      </ol>

      <hr />

      <h2>Jurisdiction Coverage Map</h2>
      <p>Click a column header to sort.</p>
      <SortableTable columns={COUNTRY_TABLE_COLUMNS} rows={countryRows} defaultSortKey="country" />

      <h3>Regional overrides</h3>
      <p>
        Some countries route sub-nationally instead of by country alone — most notably the United
        States (state-level laws) and Canada (Quebec's Law 25). When a resolver returns a{' '}
        <code>region</code>, Consenti checks this table before falling back to the country's base
        group above.
      </p>
      <SortableTable
        columns={OVERRIDE_TABLE_COLUMNS}
        rows={overrideRows}
        defaultSortKey="country"
      />

      <hr />

      <h2>Supported locales</h2>
      <p>
        <strong>{totalLocales} locale codes</strong> appear across the map above (BCP 47, e.g.{' '}
        <code>fr-CA</code>, <code>zh-CN</code>). A profile's <code>translations</code> map can use
        any of these — or any locale at all; the map only reflects what each country typically
        needs. Resolution order at runtime: exact locale match → language prefix →{' '}
        <code>defaultLocale</code>.
      </p>
      <div className="not-prose flex flex-wrap gap-1.5">
        {Object.keys(LOCALES)
          .sort((a, b) => a.localeCompare(b))
          .map(locale => (
            <code
              key={locale}
              className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300"
            >
              {locale}
            </code>
          ))}
      </div>
    </div>
  )
}
