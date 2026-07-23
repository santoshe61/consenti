import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'How Auto-Detection Works — Frontend Guide — Consenti',
  description:
    "Understand how Consenti maps a visitor's browser timezone and language to the right compliance group.",
  alternates: { canonical: '/guides/frontend/auto-detection' },
  openGraph: {
    title: 'How Auto-Detection Works — Frontend Guide — Consenti',
    description:
      "Understand how Consenti maps a visitor's browser timezone and language to the right compliance group.",
    url: 'https://consenti.dev/guides/frontend/auto-detection',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Auto-Detection Works — Frontend Guide — Consenti',
    description:
      "Understand how Consenti maps a visitor's browser timezone and language to the right compliance group.",
    images: ['/og-image.jpg'],
  },
}

export default function FrontendAutoDetectionGuide() {
  return (
    <div className="prose max-w-none">
      <h1>How Auto-Detection Works</h1>
      <p className="lead">
        Consenti can automatically show the right banner for each visitor&apos;s jurisdiction — GDPR
        for EU visitors, CCPA for Californians, LGPD for Brazilians — without you writing any
        geo-detection code. This guide explains the three resolution scenarios and when to use each.
      </p>

      <h2>The three scenarios</h2>
      <p>
        Which scenario runs depends on two settings: whether <code>api.enabled</code> is true, and
        what <code>compliance.type</code> is set to.
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Scenario
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                api.enabled
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                compliance.type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                How it resolves
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
            <tr className="bg-white dark:bg-gray-900">
              <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">1A</td>
              <td className="px-4 py-3">
                <code>false</code>
              </td>
              <td className="px-4 py-3">
                <code>&apos;auto&apos;</code>
              </td>
              <td className="px-4 py-3">
                Browser timezone + <code>navigator.language</code> → compliance group → pre-built
                profile
              </td>
            </tr>
            <tr className="bg-slate-50 dark:bg-gray-800">
              <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">1B</td>
              <td className="px-4 py-3">
                <code>false</code>
              </td>
              <td className="px-4 py-3">fixed group ID</td>
              <td className="px-4 py-3">
                Loads the matching pre-built profile directly — no geo-detection at all
              </td>
            </tr>
            <tr className="bg-white dark:bg-gray-900">
              <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">2A</td>
              <td className="px-4 py-3">
                <code>true</code>
              </td>
              <td className="px-4 py-3">
                <code>&apos;auto&apos;</code>
              </td>
              <td className="px-4 py-3">
                <code>GET /resolve-profile?tz&amp;lang&amp;locale</code> → backend geo-resolves →
                returns profile URL
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Scenario 1A — Client-side auto (no backend)</h2>
      <p>
        This is the default when you omit the <code>api</code> config entirely. The widget reads two
        browser signals:
      </p>
      <ol>
        <li>
          <code>Intl.DateTimeFormat().resolvedOptions().timeZone</code> — e.g.{' '}
          <code>Europe/Paris</code>
        </li>
        <li>
          <code>navigator.language</code> — e.g. <code>fr-FR</code>
        </li>
      </ol>
      <p>
        These are matched against an embedded 195-country map to derive a compliance group. A
        visitor with timezone <code>Europe/Paris</code> gets the <code>opt-in</code> (GDPR) group. A
        visitor with timezone <code>America/Los_Angeles</code> gets <code>opt-out</code> (CCPA).
      </p>

      <CodeBlock
        lang="typescript"
        code={`// Scenario 1A — fully client-side, zero network calls except the profile chunk
new ConsentiSetup({
  // compliance.type defaults to 'auto' when omitted
  // api defaults to { enabled: false }
})`}
      />

      <Callout type="warning">
        Timezone detection is a heuristic. A visitor using a VPN or travelling internationally may
        trigger the wrong compliance group. For higher accuracy, use Scenario 2A with a server-side
        geo resolver.
      </Callout>

      <h2>Scenario 1B — Fixed compliance group</h2>
      <p>
        When you want the same regulation for every visitor (e.g. you only serve EU users, or you
        want to apply GDPR globally as the strictest baseline), set <code>compliance.type</code> to
        a specific group ID. No geo-detection happens at all.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'GDPR for all',
            lang: 'typescript',
            code: `new ConsentiSetup({ compliance: { type: 'opt-in' } })`,
          },
          {
            label: 'CCPA for all',
            lang: 'typescript',
            code: `new ConsentiSetup({ compliance: { type: 'opt-out' } })`,
          },
          {
            label: 'CPRA for all',
            lang: 'typescript',
            code: `new ConsentiSetup({ compliance: { type: 'opt-out-strict' } })`,
          },
          {
            label: 'Notice-only for all',
            lang: 'typescript',
            code: `new ConsentiSetup({ compliance: { type: 'notice-only' } })`,
          },
        ]}
      />

      <h2>Scenario 2A — Server-side geo-resolution</h2>
      <p>
        When you have a Consenti backend running, the widget delegates geo-resolution entirely to
        the server. This is more accurate because your backend can use real IP geolocation (MaxMind,
        geoip-lite, ipinfo.io) rather than relying on timezone heuristics.
      </p>
      <p>On page load the widget sends one request:</p>

      <CodeBlock
        lang="text"
        code={`GET /consenti/api/v1/resolve-profile?tz=Europe%2FParis&lang=fr-FR&locale=fr-FR`}
      />

      <p>The backend responds with:</p>
      <CodeBlock
        lang="json"
        code={`{
  "path": "/consenti/api/v1/profiles/default/opt-in/fr-FR",
  "resolvedLocale": "fr-FR",
  "resolvedComplianceGroup": "opt-in",
  "profileId": "gdpr-profile-uuid",
  "version": 3
}`}
      />

      <p>
        The widget then fetches the profile JSON directly from the returned <code>path</code>. This
        second request is served from disk (zero DB) and is CDN-cacheable.
      </p>

      <CodeBlock
        lang="typescript"
        code={`// Scenario 2A — server geo-resolves the compliance group
new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://consent.example.com',
  },
  compliance: { type: 'auto' },
})`}
      />

      <Callout type="tip">
        The <code>/resolve-profile</code> response is cached in <code>sessionStorage</code> for the
        tab&apos;s lifetime. Navigating between pages never re-fetches it.
      </Callout>

      <h2>The 8 built-in compliance groups</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Group ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Region / Law
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Model
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                GPC default
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
            {[
              ['opt-in', 'EU / EEA — GDPR', 'Opt-in', 'honor'],
              ['opt-out', 'California — CCPA', 'Opt-out', 'honor'],
              ['opt-out-strict', 'California — CPRA', 'Strict opt-out', 'strict'],
              ['opt-in-dpdpa', 'India — DPDPA', 'Opt-in', 'honor'],
              ['opt-in-china', 'China — PIPL', 'Opt-in', 'ignore'],
              ['opt-in-brazil', 'Brazil — LGPD', 'Opt-in', 'honor'],
              ['general-privacy-consent', 'Global / general', 'Opt-in', 'honor'],
              ['notice-only', 'Informational', 'Notice', 'ignore'],
            ].map(([id, region, model, gpc], i) => (
              <tr
                key={id}
                className={
                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800'
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">
                  {id}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-gray-300">{region}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-gray-300">{model}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-gray-400">
                  {gpc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'api.enabled, compliance.type, and every geo/detection option',
          },
          {
            href: '/docs/ui/advanced-profiles/',
            label: 'Advanced Profiles',
            desc: 'ConsentiProfile, complianceGroup, and deepMerge overrides',
          },
          {
            href: '/docs/compliance/jurisdiction-coverage-map/',
            label: 'Jurisdiction Coverage Map',
            desc: 'The full 195-country → compliance-group table',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'widget.setConfig() and other runtime methods',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: "What if the visitor's timezone doesn't match their country?",
            answer: (
              <p className="m-0">
                Timezone-based detection is a best-effort heuristic. VPN users, travellers, and
                misconfigured systems can yield incorrect groups. For high-accuracy production
                deployments, use Scenario 2A with a real IP geo resolver on the backend (
                <code>geoDataProvider: &apos;geoip&apos;</code> or <code>&apos;maxmind&apos;</code>
                ). The backend geo resolver uses actual IP addresses, not browser signals.
              </p>
            ),
          },
          {
            question: 'Can I override the detected compliance group at runtime?',
            answer: (
              <p className="m-0">
                Two ways. For a fully standalone profile: create a <code>ConsentiProfile</code>{' '}
                instance, register it with a custom key, and set <code>compliance.type</code> to
                that key — geo-detection is bypassed entirely. For the more common case — you still
                want geo-detection (or an explicit group) to pick <em>which</em> group applies, but
                want your own profile used instead of Consenti&apos;s built-in one for that specific
                group — register a <code>ConsentiProfile</code> with{' '}
                <code>complianceGroup: &apos;opt-in&apos;</code> (etc.) set. It&apos;s then
                automatically preferred over the built-in embedded profile whenever detection
                resolves to that group, whether via <code>&apos;auto&apos;</code> or an explicit{' '}
                <code>compliance.type</code>. Add <code>deepMerge: true</code> to patch just the
                fields you supply onto the built-in profile instead of fully replacing it. You can
                also call <code>widget.setConfig()</code> after instantiation to change settings —
                though this does not re-run geo-detection.
              </p>
            ),
          },
          {
            question: 'How do I test a specific region locally?',
            answer: (
              <>
                <p className="m-0 mb-2">Two easy approaches:</p>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    Set <code>compliance.type</code> to a fixed group ID in your dev config — e.g.{' '}
                    <code>type: &apos;opt-out&apos;</code> to test the CCPA flow.
                  </li>
                  <li>
                    Change your browser&apos;s timezone in DevTools (Sensors panel → Location) and
                    reload. The client-side resolver picks it up immediately.
                  </li>
                </ul>
              </>
            ),
          },
          {
            question: 'What happens if the resolve-profile request fails?',
            answer: (
              <p className="m-0">
                Consenti falls back gracefully. If <code>/resolve-profile</code> times out or
                returns an error, the widget loads the matching pre-built profile for the
                client-side detected group. If that also fails, it falls back to the{' '}
                <code>DEFAULT_PROFILE</code> (the opt-in GDPR profile). The banner always appears —
                consent is never silently skipped.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
