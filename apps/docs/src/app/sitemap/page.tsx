import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'A complete index of all pages on the Consenti documentation site.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/sitemap' },
  openGraph: {
    title: 'Sitemap',
    description: 'A complete index of all pages on the Consenti documentation site.',
    url: 'https://consenti.dev/sitemap',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sitemap',
    description: 'A complete index of all pages on the Consenti documentation site.',
    images: ['/og-image.jpg'],
  },
}

interface SitemapGroup {
  title: string
  links: { href: string; label: string; desc?: string }[]
}

const GROUPS: SitemapGroup[] = [
  {
    title: 'General',
    links: [
      { href: '/', label: 'Home', desc: 'Overview, features, and quick start' },
      {
        href: '/docs/getting-started/',
        label: 'Introduction',
        desc: 'What Consenti is and how it works',
      },
      {
        href: '/docs/getting-started/quick-start/',
        label: 'Quick Start',
        desc: 'Install and initialise in under 5 minutes',
      },
      {
        href: '/demo-playground/frontend',
        label: 'Frontend Playground',
        desc: 'Interactive widget demo',
      },
      {
        href: '/demo-playground/backend',
        label: 'Backend Demo',
        desc: 'Admin dashboard and API explorer',
      },
      { href: '/docs/changelog/', label: 'Changelog', desc: 'Release history and version notes' },
      {
        href: '/support/',
        label: 'Support Consenti',
        desc: 'Sponsor or contribute to the project',
      },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy/', label: 'Privacy Policy', desc: 'What consenti.dev collects and why' },
      { href: '/terms/', label: 'Terms of Use', desc: 'Terms for the site and the software' },
      { href: '/license/', label: 'License', desc: 'Apache 2.0 summary and compliance disclaimer' },
    ],
  },
  {
    title: 'UI Widget (@consenti/ui)',
    links: [
      { href: '/docs/ui/', label: 'Overview', desc: 'What the UI widget does and how to use it' },
      {
        href: '/docs/ui/installation/',
        label: 'Installation',
        desc: 'npm install and import setup',
      },
      {
        href: '/docs/ui/profiles/',
        label: 'Profile',
        desc: 'Quick start — pre-built profiles and profileOverride',
      },
      {
        href: '/docs/ui/advanced-profiles/',
        label: 'Advanced Profile',
        desc: 'ConsentiProfile, multi-locale, full type reference',
      },
      {
        href: '/docs/ui/configuration/',
        label: 'Configuration',
        desc: 'Quick start — the options most sites need',
      },
      {
        href: '/docs/ui/advanced-configuration/',
        label: 'Advanced Configuration',
        desc: 'Full ConsentiSetup options reference',
      },
      { href: '/docs/ui/events/', label: 'Events', desc: 'DOM events fired by the widget' },
      { href: '/docs/ui/methods/', label: 'API Methods', desc: 'Widget instance methods' },
      {
        href: '/docs/ui/themes/',
        label: 'Themes & CSS',
        desc: 'CSS custom properties and styling',
      },
      {
        href: '/docs/ui/frameworks/',
        label: 'Framework Guides',
        desc: 'React, Vue, Angular, Next.js, Nuxt',
      },
      { href: '/docs/ui/plugins/', label: 'UI Plugins', desc: 'Extend the widget with plugins' },
    ],
  },
  {
    title: 'Backend API (@consenti/api)',
    links: [
      { href: '/docs/api/', label: 'Overview', desc: 'What the backend module does' },
      {
        href: '/docs/api/installation/',
        label: 'Installation',
        desc: 'Setup with Express, Fastify, Hono, or raw Node HTTP',
      },
      {
        href: '/docs/api/configuration/',
        label: 'Configuration',
        desc: 'Quick start — the options most deployments need',
      },
      {
        href: '/docs/api/advanced-configuration/',
        label: 'Advanced Configuration',
        desc: 'Full createConsenti() options reference',
      },
      { href: '/docs/api/routes/', label: 'API Routes', desc: 'All REST routes overview' },
      {
        href: '/docs/api/routes/public/',
        label: 'Public Routes',
        desc: 'Consent submission and profile resolution',
      },
      {
        href: '/docs/api/routes/admin/',
        label: 'Admin Routes',
        desc: 'RBAC-protected management endpoints',
      },
      {
        href: '/docs/api/dashboard/',
        label: 'Admin Dashboard',
        desc: 'Built-in Preact SPA at /consenti/',
      },
      {
        href: '/docs/api/plugins/',
        label: 'API Plugins',
        desc: 'Lifecycle hooks and official plugins',
      },
      {
        href: '/docs/api/plugins/bigquery/',
        label: 'BigQuery Plugin',
        desc: 'Stream consent events to BigQuery',
      },
      {
        href: '/docs/api/plugins/segment/',
        label: 'Segment Plugin',
        desc: 'Forward consent to Segment',
      },
      {
        href: '/docs/api/plugins/snowflake/',
        label: 'Snowflake Plugin',
        desc: 'Load consent records into Snowflake',
      },
    ],
  },
  {
    title: 'Guides',
    links: [
      {
        href: '/guides/',
        label: 'Overview',
        desc: 'Task-oriented guides for frontend and backend',
      },
      {
        href: '/guides/frontend/minimal-setup/',
        label: 'Minimal Setup (Frontend)',
        desc: 'Get the widget running with the least config',
      },
      {
        href: '/guides/frontend/consent-flow/',
        label: 'Consent Flow (Frontend)',
        desc: 'How consent is requested, stored, and re-shown',
      },
      {
        href: '/guides/frontend/auto-detection/',
        label: 'Auto Detection',
        desc: 'Automatic jurisdiction and profile detection',
      },
      {
        href: '/guides/frontend/frameworks/',
        label: 'Frontend Frameworks',
        desc: 'Integrating with React, Vue, Angular, and more',
      },
      {
        href: '/guides/frontend/gtm/',
        label: 'Google Tag Manager',
        desc: 'Wiring consent state into GTM',
      },
      { href: '/guides/frontend/themes/', label: 'Theming', desc: 'Customising widget appearance' },
      {
        href: '/guides/backend/minimal-setup/',
        label: 'Minimal Setup (Backend)',
        desc: 'Get the API running with the least config',
      },
      {
        href: '/guides/backend/consent-flow/',
        label: 'Consent Flow (Backend)',
        desc: 'How the backend records and serves consent',
      },
      {
        href: '/guides/backend/geo-routing/',
        label: 'Geo Routing',
        desc: 'Serving jurisdiction-specific profiles',
      },
      {
        href: '/guides/backend/storage/',
        label: 'Storage',
        desc: 'Storage adapters and data persistence',
      },
      { href: '/guides/backend/auth/', label: 'Auth', desc: 'Authenticating admin and API access' },
      {
        href: '/guides/backend/server-side-enforcement/',
        label: 'Server-Side Enforcement',
        desc: 'Blocking non-consented requests server-side',
      },
      { href: '/guides/backend/webhooks/', label: 'Webhooks', desc: 'Reacting to consent events' },
      {
        href: '/guides/backend/policy-engine-mapping/',
        label: 'Policy Engine Mapping',
        desc: 'Mapping consent policies to enforcement rules',
      },
    ],
  },
  {
    title: 'Compliance',
    links: [
      {
        href: '/docs/compliance/jurisdiction-coverage-map/',
        label: 'Jurisdiction Coverage Map',
        desc: 'Every country, its law(s), and its compliance group',
      },
      {
        href: '/docs/compliance/gdpr/',
        label: 'GDPR (EU / EEA)',
        desc: 'Opt-in, legitimate interest, erasure',
      },
      {
        href: '/docs/compliance/uk-gdpr/',
        label: 'UK GDPR',
        desc: 'Post-Brexit equivalent, ICO-enforced',
      },
      {
        href: '/docs/compliance/ccpa/',
        label: 'CCPA / US States',
        desc: 'Opt-out, GPC, CPRA, VCDPA, CPA',
      },
      {
        href: '/docs/compliance/cpra/',
        label: 'CPRA (California 2023)',
        desc: 'Stricter opt-out, sensitive data',
      },
      {
        href: '/docs/compliance/lgpd/',
        label: 'LGPD (Brazil)',
        desc: '10 lawful bases, ANPD-enforced',
      },
      {
        href: '/docs/compliance/pipeda/',
        label: 'PIPEDA / Law 25 (Canada)',
        desc: 'Federal PIPEDA + Quebec Law 25',
      },
      {
        href: '/docs/compliance/dpdpa/',
        label: 'DPDPA (India)',
        desc: 'Opt-in, fiduciary disclosure',
      },
      {
        href: '/docs/compliance/pdpa-th/',
        label: 'PDPA (Thailand)',
        desc: 'Consent and legitimate interest bases',
      },
      {
        href: '/docs/compliance/appi/',
        label: 'APPI (Japan)',
        desc: 'Opt-in for sensitive data and transfers',
      },
      {
        href: '/docs/compliance/pipl/',
        label: 'PIPL (China)',
        desc: 'Explicit opt-in, cross-border transfer rules',
      },
      {
        href: '/docs/compliance/popia/',
        label: 'POPIA (South Africa)',
        desc: '8 lawful processing conditions',
      },
      {
        href: '/docs/compliance/kvkk/',
        label: 'KVKK (Turkey)',
        desc: 'GDPR-inspired opt-in, KVK Board',
      },
      {
        href: '/docs/compliance/coppa/',
        label: 'COPPA (USA children)',
        desc: 'Age gate widget, parental consent',
      },
      {
        href: '/docs/compliance/tcf/',
        label: 'TCF v2.2',
        desc: 'IAB TC string, vendor list, stacks',
      },
      {
        href: '/docs/compliance/notice-only/',
        label: 'Notice Only',
        desc: 'Informational banner without opt-in',
      },
    ],
  },
]

export default function SitemapPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-3 tracking-tight">
          Sitemap
        </h1>
        <p className="text-slate-500 dark:text-gray-400 text-[15px]">
          All pages on consenti.dev. The machine-readable version is available at{' '}
          <a href="/sitemap.xml" className="text-brand-500 hover:underline font-mono text-sm">
            /sitemap.xml
          </a>
          .
        </p>
      </div>

      <div className="space-y-12">
        {GROUPS.map(group => (
          <section key={group.title}>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-4 pb-2 border-b border-slate-100 dark:border-gray-800">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col gap-0.5 p-3 rounded-lg border border-slate-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-900 bg-white dark:bg-gray-900 transition-colors no-underline"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {link.label}
                  </span>
                  {link.desc && (
                    <span className="text-xs text-slate-400 dark:text-gray-600 leading-snug">
                      {link.desc}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-gray-800">
        <p className="text-xs text-slate-400 dark:text-gray-600 font-mono">
          XML sitemap:{' '}
          <a href="/sitemap.xml" className="hover:text-brand-500 transition-colors">
            https://consenti.dev/sitemap.xml
          </a>
        </p>
      </div>
    </main>
  )
}
