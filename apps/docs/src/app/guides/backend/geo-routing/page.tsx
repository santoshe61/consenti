import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Geo-Routing & Auto-Detection — Backend Guide — Consenti',
  description:
    "How Consenti maps a visitor's IP and timezone to the right compliance group using four built-in geo resolvers.",
  alternates: { canonical: '/guides/backend/geo-routing' },
  openGraph: {
    title: 'Geo-Routing & Auto-Detection — Backend Guide — Consenti',
    description:
      "How Consenti maps a visitor's IP and timezone to the right compliance group using four built-in geo resolvers.",
    url: 'https://consenti.dev/guides/backend/geo-routing',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Geo-Routing & Auto-Detection — Backend Guide — Consenti',
    description:
      "How Consenti maps a visitor's IP and timezone to the right compliance group using four built-in geo resolvers.",
    images: ['/og-image.jpg'],
  },
}

export default function BackendGeoRoutingGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Geo-Routing & Auto-Detection</h1>
      <p className="lead">
        When a widget calls <code>/resolve-profile</code>, the backend maps the visitor to a
        compliance group — GDPR for EU visitors, CCPA for Californians, and so on. Consenti ships
        four geo resolver options. This guide explains how each works and when to use it.
      </p>

      <h2>How the resolution pipeline works</h2>
      <p>The widget sends:</p>
      <CodeBlock
        lang="text"
        code={`GET /consenti/api/v1/resolve-profile?tz=Europe%2FParis&lang=fr-FR&locale=fr-FR`}
      />

      <p>The backend runs this pipeline:</p>
      <ol>
        <li>
          Call the configured <code>geoDataProvider</code> with{' '}
          <code>{'{ ip, timezone, language }'}</code>.
        </li>
        <li>
          Resolver returns <code>{'{ country, region, locale }'}</code>.
        </li>
        <li>
          Country/region is matched against the compliance map (195 countries and territories → 8
          compliance groups).
        </li>
        <li>Response returns the file path to the active profile JSON for that group.</li>
      </ol>

      <h2>The four built-in resolvers</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Resolver
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Extra install?
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Accuracy
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Outbound traffic?
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
            {[
              ['default', 'No', 'Low (heuristic)', 'No'],
              ['hosted-geoip-lite', 'No', 'Medium', 'Yes — calls ipinfo.io'],
              ['geoip', 'Yes — npm install geoip-lite', 'High', 'No (local DB)'],
              ['maxmind', 'Yes — npm install maxmind', 'Highest', 'No (local .mmdb)'],
            ].map(([r, install, acc, outbound], i) => (
              <tr
                key={r}
                className={
                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800'
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">
                  {r}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{install}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{acc}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{outbound}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeTabs
        tabs={[
          {
            label: 'default',
            lang: 'typescript',
            code: `createConsenti({
  compliance: {
    type: 'auto',
    geoDataProvider: 'default',   // timezone + Accept-Language heuristic
  },
})`,
          },
          {
            label: 'hosted-geoip-lite',
            lang: 'typescript',
            code: `// No install — calls ipinfo.io using node:https
// Requires outbound internet access from your server
createConsenti({
  compliance: {
    type: 'auto',
    geoDataProvider: 'hosted-geoip-lite',
  },
})`,
          },
          {
            label: 'geoip (local DB)',
            lang: 'typescript',
            code: `// npm install geoip-lite
// Bundles the MaxMind GeoLite2 DB locally — no outbound traffic
createConsenti({
  compliance: {
    type: 'auto',
    geoDataProvider: 'geoip',
  },
})`,
          },
          {
            label: 'maxmind (official)',
            lang: 'typescript',
            code: `// npm install maxmind
// Requires a MaxMind .mmdb file (GeoLite2 or GeoIP2)
// Most accurate — recommended for production at scale
createConsenti({
  compliance: {
    type: 'auto',
    geoDataProvider: 'maxmind',
  },
})`,
          },
          {
            label: 'Custom resolver',
            lang: 'typescript',
            code: `import type { CountryResolverFn } from '@consenti/api'

const myResolver: CountryResolverFn = async ({ ip, timezone, language }) => {
  const result = await myGeoDatabase.lookup(ip)
  return {
    country: result.countryCode ?? null,  // ISO 3166-1 alpha-2
    region: result.subdivision ?? null,    // e.g. 'CA' for California
    locale: language ?? null,
  }
}

createConsenti({
  compliance: {
    type: 'auto',
    geoDataProvider: myResolver,
  },
})`,
          },
        ]}
      />

      <h2>The compliance map</h2>
      <p>
        Countries are mapped to compliance groups via an embedded, <strong>fixed</strong> map of
        195+ countries and territories, maintained by the Consenti project — see the full list on
        the <a href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</a>.
        There is currently no config option to supply your own map; <code>geoDataProvider</code> is
        the only customization point in the pipeline — it decides which country/region gets looked
        up, not what group that country resolves to.
      </p>

      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  compliance: {
    type: 'auto',
    geoDataProvider: 'geoip', // resolves { country, region } — the map does the rest
  },
})`}
      />

      <Callout type="info">
        US state-level routing (California → <code>opt-out-strict</code>, other states →{' '}
        <code>opt-out</code>) requires a resolver that returns a <code>region</code> value. The{' '}
        <code>geoip</code> and <code>maxmind</code> resolvers both provide subdivision data. The{' '}
        <code>default</code> and <code>hosted-geoip-lite</code> resolvers return country only.
      </Callout>

      <Callout type="tip">
        Need a jurisdiction to resolve differently than the map says? Don't try to override the map
        — pin <code>compliance.type</code> to a fixed group for the whole deployment, or author a
        profile against a <code>customComplianceGroup</code> and target it explicitly. Both are
        covered on the{' '}
        <a href="/docs/compliance/jurisdiction-coverage-map/#custom-compliance-groups">
          Jurisdiction Coverage Map
        </a>
        .
      </Callout>

      <h2>Trusted proxies</h2>
      <p>
        If your server is behind a load balancer or reverse proxy, the <code>X-Forwarded-For</code>{' '}
        header contains the real client IP. Tell Consenti which proxies to trust:
      </p>

      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  trustedProxies: ['10.0.0.0/8', '172.16.0.0/12'], // your LB IP ranges
  compliance: { type: 'auto', geoDataProvider: 'geoip' },
})`}
      />

      <RelatedDocs
        items={[
          {
            href: '/docs/api/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'Full geoDataProvider and trustedProxies option reference',
          },
          {
            href: '/docs/api/routes/public/',
            label: 'Public Routes',
            desc: 'The /resolve-profile endpoint used by the widget',
          },
          {
            href: '/docs/compliance/jurisdiction-coverage-map/',
            label: 'Jurisdiction Coverage Map',
            desc: 'Every country, its law(s), and its compliance group',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Which resolver should I use for production?',
            answer: (
              <>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    <strong>Low traffic / simple needs</strong>: <code>hosted-geoip-lite</code> —
                    zero install, calls ipinfo.io, medium accuracy.
                  </li>
                  <li>
                    <strong>Medium traffic / no outbound allowed</strong>: <code>geoip</code> —
                    install <code>geoip-lite</code>, local MaxMind GeoLite2 DB, fast, no outbound.
                  </li>
                  <li>
                    <strong>High traffic / highest accuracy</strong>: <code>maxmind</code> —
                    official MaxMind SDK, requires a paid or free GeoLite2 <code>.mmdb</code> file,
                    most accurate for US state-level routing.
                  </li>
                </ul>
              </>
            ),
          },
          {
            question: 'Can I use my own IP geolocation database?',
            answer: (
              <p className="m-0">
                Yes. Pass a custom <code>CountryResolverFn</code> to <code>geoDataProvider</code>.
                Your function receives <code>{'{ ip, timezone, language }'}</code> and must return{' '}
                <code>{'{ country, region, locale }'}</code>. You can use any database or API inside
                it.
              </p>
            ),
          },
          {
            question: 'How do I test geo-routing without changing my actual location?',
            answer: (
              <>
                <p className="m-0 mb-2">Three approaches:</p>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    Call <code>/resolve-profile</code> directly with a fake <code>tz</code> query
                    param: <code>?tz=America/Los_Angeles</code>. The default resolver falls back to
                    timezone when IP is unavailable.
                  </li>
                  <li>
                    Set <code>compliance.type</code> to a fixed group ID in your dev config —
                    bypasses geo-routing entirely.
                  </li>
                  <li>
                    Write a custom resolver that maps specific test IPs to specific countries.
                  </li>
                </ul>
              </>
            ),
          },
          {
            question: 'What happens if geo-resolution fails or is uncertain?',
            answer: (
              <p className="m-0">
                If the resolver returns <code>null</code> for country, Consenti falls back to the
                <code>general-privacy-consent</code> group — a permissive opt-in profile suitable
                for visitors whose jurisdiction cannot be determined. The widget then falls back
                again to the pre-built profile for that group if no active profile is found.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
