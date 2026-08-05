import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Frontend-Only Mode — the full widget, no backend required',
  description:
    "Run @consenti/ui standalone with zero backend and you still get 31 API methods, 8 DOM events, native React/Vue/Angular hooks, six built-in analytics integrations, and full accessibility/i18n — a different tier of widget than most banner-only open-source tools.",
  keywords: [
    'frontend-only cookie consent',
    'open source banner tool alternative',
    'cookie consent widget API',
    'consent management widget',
  ],
  alternates: { canonical: '/guides/frontend-only-mode' },
  openGraph: {
    title: 'Frontend-Only Mode — the full widget, no backend required',
    description:
      '@consenti/ui standalone: 31 methods, 8 events, native framework hooks, six analytics integrations, full a11y/i18n — zero backend required.',
    url: 'https://consenti.dev/guides/frontend-only-mode',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frontend-Only Mode — the full widget, no backend required',
    description:
      '@consenti/ui standalone: 31 methods, 8 events, native framework hooks, six analytics integrations, full a11y/i18n — zero backend required.',
    images: ['/og-image.jpg'],
  },
}

const CAPABILITY_ROWS: Array<{ label: string; consenti: string; typical: string }> = [
  { label: 'Widget API methods', consenti: '31 — getConsent, hasConsent, showModal, reConsent, setProfile, switchLocale, and more', typical: 'A handful — usually just accept/reject/show' },
  { label: 'DOM events', consenti: '8 — bannerInitialized, consentSubmitted, forgotten, parentalConsentRequired, and more', typical: 'None, or a single callback option' },
  { label: 'Framework integration', consenti: 'Native React hooks, Vue composables, Angular services — plus Vanilla ESM/UMD', typical: 'Vanilla script tag; framework wrapping is on you' },
  { label: 'Analytics/tag-manager mappers', consenti: 'GTM/Consent Mode v2, Adobe, Meta, Microsoft Clarity, Twilio Segment, generic purpose/category — typed, built in', typical: 'Usually none — you write the mapping code yourself' },
  { label: 'Accessibility', consenti: 'Focus trap, ARIA roles, keyboard nav, screen-reader announcements, targeting WCAG 2.x AA', typical: 'Varies widely, rarely a stated target' },
  { label: 'i18n', consenti: 'Per-locale translations with BCP 47 resolution (exact → language prefix → default)', typical: 'Manual string replacement, if supported at all' },
  { label: 'Global Privacy Control (GPC)', consenti: 'Built in, with `true` / `\'strict\'` modes', typical: 'Rarely built in' },
  { label: 'Cross-tab sync', consenti: 'Built in via BroadcastChannel', typical: 'Not typically handled' },
  { label: 'Cookie auto-discovery', consenti: '`@consenti/scanner` — local CLI crawler, run on demand or in CI', typical: 'Not included — declare cookies by hand' },
  { label: 'Runtime dependencies', consenti: 'Zero — browser built-ins only', typical: 'Usually also zero — this one is a tie' },
]

export default function FrontendOnlyModePage() {
  return (
    <div className="prose max-w-none">
      <h1>Frontend-Only Mode</h1>
      <p className="lead">
        Most open-source cookie consent tools are frontend-only by design — a banner script, a
        preference toggle, done. <code>@consenti/ui</code> works exactly the same way when you run
        it standalone: <code>npm install @consenti/ui</code>, zero backend, zero runtime
        dependencies. The difference is what you get once it's running — a widget API surface,
        event system, and integration ecosystem closer to what a hosted SaaS CMP offers, not what a
        banner-only widget offers.
      </p>

      <Callout type="info">
        Everything on this page works with <code>@consenti/ui</code> alone — no{' '}
        <code>@consenti/api</code>, no server, no account. Add the backend later, any time, without
        changing your widget config, if you want server-side consent records or a dashboard. See{' '}
        <Link href="/guides/what-is-consenti/">Consenti, What-Why-How?</Link> for how the two
        packages relate.
      </Callout>

      <h2>Why frontend-only Consenti is a different tier</h2>
      <p>
        Compared to banner-only widgets, Consenti is genuinely good at
        the one thing they do — standalone widget covers a lot more ground:
      </p>
      <div className="not-prose overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700 my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Capability</th>
              <th className="text-left py-3 px-4 font-bold text-brand-600">Consenti (frontend-only)</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Typical banner-only widget</th>
            </tr>
          </thead>
          <tbody>
            {CAPABILITY_ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : ''}>
                <td className="py-2.5 px-4 text-slate-700 dark:text-gray-300 font-medium align-top">{row.label}</td>
                <td className="py-2.5 px-4 align-top">{row.consenti}</td>
                <td className="py-2.5 px-4 text-slate-500 dark:text-gray-400 align-top">{row.typical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Get started</h2>
      <ul>
        <li><Link href="/docs/ui/installation/">Installation</Link> — package install, ESM/UMD/subpath exports</li>
        <li><Link href="/guides/frontend/minimal-setup/">Minimal Setup</Link> — smallest possible working config</li>
        <li><Link href="/guides/frontend/consent-flow/">How Consent Flow Works</Link></li>
        <li><Link href="/guides/frontend/auto-detection/">How Auto-Detection Works</Link> — jurisdiction resolved client-side, no network call</li>
      </ul>

      <h2>API surface</h2>
      <ul>
        <li><Link href="/docs/ui/methods/">API Methods</Link> — all 31 methods: state (<code>getConsent</code>, <code>hasConsent</code>, <code>isCategoryGranted</code>...), UI control (<code>showModal</code>, <code>hideBanner</code>...), lifecycle (<code>reConsent</code>, <code>forgetMe</code>, <code>destroy</code>...)</li>
        <li><Link href="/docs/ui/events/">DOM Events</Link> — all 8 events, plus <code>ConsentScript</code>/<code>CategoryScript</code>/<code>ConsentAction</code>/<code>BannerTrigger</code> helpers and declarative <code>data-consenti-*</code> attribute-based script gating, no hand-written JS required</li>
        <li><Link href="/docs/ui/plugins/">Plugin API</Link> — <code>ConsentiWidgetAPI</code> reference, lifecycle hooks, example plugins</li>
      </ul>

      <h2>Framework integrations</h2>
      <ul>
        <li><Link href="/docs/ui/frameworks/">Framework Guides</Link> — React, Vue, Angular, Next.js, Nuxt</li>
        <li><Link href="/guides/frontend/frameworks/">Framework Integrations guide</Link> — hooks, composables, services in context</li>
      </ul>

      <h2>Analytics &amp; tag-manager integrations</h2>
      <p>Typed consent mappers ship in <code>@consenti/ui</code> for each of these — no hand-rolled mapping code:</p>
      <ul>
        <li><Link href="/guides/frontend/gtm/">GTM &amp; Google Consent Mode v2</Link></li>
        <li><Link href="/guides/frontend/adobe/">Adobe Analytics &amp; Experience Platform</Link></li>
        <li><Link href="/guides/frontend/meta/">Meta Pixel &amp; Conversions API</Link></li>
        <li><Link href="/guides/frontend/clarity/">Microsoft Clarity</Link></li>
        <li><Link href="/guides/frontend/segment/">Twilio Segment</Link></li>
        <li><Link href="/guides/frontend/hotjar/">Hotjar &amp; Others</Link></li>
      </ul>

      <h2>Theming &amp; configuration</h2>
      <ul>
        <li><Link href="/guides/frontend/themes/">Custom Themes &amp; Dark Mode</Link> — CSS custom properties, no Shadow DOM</li>
        <li><Link href="/docs/ui/themes/">Themes reference</Link></li>
        <li><Link href="/docs/ui/configuration/">Configuration Reference</Link></li>
        <li><Link href="/docs/ui/advanced-configuration/">Advanced Configuration</Link></li>
        <li><Link href="/docs/ui/profiles/">Profiles (Appearance &amp; Text)</Link> and <Link href="/docs/ui/advanced-profiles/">Advanced Profiles</Link></li>
      </ul>

      <h2>Cookie discovery</h2>
      <p>
        No crawler ships inside the widget itself — that would bloat the bundle for a task you only
        need occasionally. Instead, <code>@consenti/scanner</code> is a separate, local CLI: it
        crawls your site under none/reject-all/accept-all consent states and reports undeclared
        third-party trackers, fully offline. Run it once during setup, or wire it into CI.
      </p>

      <FAQ
        items={[
          {
            question: 'Do any of these features require the backend?',
            answer: (
              <p className="m-0">
                No. Everything on this page — the 31 methods, 8 events, framework hooks, analytics
                mappers, theming, i18n, GPC, accessibility, and <code>@consenti/scanner</code> — works
                with <code>@consenti/ui</code> alone. The backend only adds server-side consent
                records, an admin dashboard, and dashboard-authored profiles.
              </p>
            ),
          },
          {
            question: 'Can I add @consenti/api later without breaking my frontend-only setup?',
            answer: (
              <p className="m-0">
                Yes — set <code>api.enabled: true</code> and point it at your deployed backend; the
                widget config you already wrote keeps working. See{' '}
                <Link href="/guides/backend/minimal-setup/">Backend Minimal Setup</Link>.
              </p>
            ),
          },
          {
            question: 'Is frontend-only mode really free forever, with no pageview cap?',
            answer: (
              <p className="m-0">
                Yes — Apache 2.0, self-hosted, no per-pageview or per-domain metering. You run the
                code; there's no vendor in the loop to bill you.
              </p>
            ),
          },
        ]}
      />

      <RelatedDocs
        items={[
          {
            href: '/guides/what-is-consenti/',
            label: 'Consenti, What-Why-How?',
            desc: 'How the frontend-only and backend-attached modes relate',
          },
          {
            href: '/guides/hot-topics/open-source-alternatives-to-cookiebot/',
            label: 'Open-source alternatives to Cookiebot',
            desc: 'The full feature comparison, including backend and TCF/GPP rows out of scope here',
          },
          {
            href: '/guides/hot-topics/self-hosting-a-cmp/',
            label: 'Self-hosting a CMP',
            desc: 'The four pieces a self-hosted stack needs',
          },
        ]}
      />
    </div>
  )
}
