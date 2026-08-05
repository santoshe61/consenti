import type { Metadata } from 'next'
import Link from 'next/link'
import { Layout, Server, BookOpen, Flame, CircleQuestionMark, Radar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guides — Consenti',
  description:
    'Step-by-step narrative walkthroughs for Consenti — learn how things work, not just what they are.',
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Guides — Consenti',
    description:
      'Step-by-step narrative walkthroughs for Consenti — learn how things work, not just what they are.',
    url: 'https://consenti.dev/guides',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guides — Consenti',
    description:
      'Step-by-step narrative walkthroughs for Consenti — learn how things work, not just what they are.',
    images: ['/og-image.jpg'],
  },
}

const LEARN_GUIDES = [
  {
    href: '/guides/what-is-consenti/',
    title: 'Consenti, What-Why-How?',
    desc: 'What it is, why it detects jurisdiction in the browser, and how it plans to stay compliant.',
  },
  {
    href: '/guides/frontend-only-mode/',
    title: 'Frontend-Only Mode',
    desc: '31 widget methods, 8 events, native framework hooks, six analytics integrations — no backend required.',
  },
]

const FRONTEND_GUIDES = [
  {
    href: '/guides/frontend/minimal-setup/',
    title: 'Minimal Setup',
    desc: 'Get a consent banner on screen in under 5 minutes — no backend required.',
  },
  {
    href: '/guides/frontend/consent-flow/',
    title: 'How Consent Flow Works',
    desc: 'Follow a consent decision from first visit all the way to cookie and event.',
  },
  {
    href: '/guides/frontend/auto-detection/',
    title: 'How Auto-Detection Works',
    desc: 'Understand the three scenarios Consenti uses to resolve the right compliance group.',
  },
  {
    href: '/guides/frontend/frameworks/',
    title: 'Framework Integrations',
    desc: 'Complete working snippets for React, Next.js, Vue 3, Angular, and Vanilla JS.',
  },
  {
    href: '/guides/frontend/gtm/',
    title: 'GTM & Google Consent Mode v2',
    desc: 'Wire Consenti to GTM and push consent signals to your dataLayer automatically.',
  },
  {
    href: '/guides/frontend/adobe/',
    title: 'Adobe Analytics & Experience Platform',
    desc: 'Read Adobe-shaped consent and wire it to Launch, AppMeasurement, or the Web SDK.',
  },
  {
    href: '/guides/frontend/meta/',
    title: 'Meta Pixel & Conversions API',
    desc: 'Sync the fbq consent flag and gate what you forward to the server-side CAPI.',
  },
  {
    href: '/guides/frontend/clarity/',
    title: 'Microsoft Clarity',
    desc: 'Gate session recordings and heatmaps behind analytics consent.',
  },
  {
    href: '/guides/frontend/segment/',
    title: 'Twilio Segment',
    desc: 'Gate identify, page, and track calls independently instead of an all-or-nothing switch.',
  },
  {
    href: '/guides/frontend/hotjar/',
    title: 'Hotjar & Others',
    desc: 'Tools with no dedicated vendor format — pick the right getConsent() call and gate the script.',
  },
  {
    href: '/guides/frontend/themes/',
    title: 'Custom Themes & Dark Mode',
    desc: 'Override CSS tokens, swap themes at runtime, and toggle dark mode.',
  },
]

const BACKEND_GUIDES = [
  {
    href: '/guides/backend/minimal-setup/',
    title: 'Minimal Setup',
    desc: 'Mount the Consenti API on any Node.js framework in minutes.',
  },
  {
    href: '/guides/backend/consent-flow/',
    title: 'How Consent Flow Works',
    desc: 'Trace a consent record from HTTP POST through storage to GDPR erasure.',
  },
  {
    href: '/guides/backend/geo-routing/',
    title: 'Geo-Routing & Auto-Detection',
    desc: "How Consenti maps a visitor's IP and timezone to the right compliance group.",
  },
  {
    href: '/guides/backend/storage/',
    title: 'Choosing a Storage Driver',
    desc: 'Compare JSON, SQLite, PostgreSQL, MySQL, and MongoDB — and when to use each.',
  },
  {
    href: '/guides/backend/auth/',
    title: 'Auth Modes',
    desc: 'Local passwords for dev, JWT for API consumers, OIDC/SAML for enterprise SSO.',
  },
  {
    href: '/guides/backend/server-side-enforcement/',
    title: 'Server-Side Enforcement',
    desc: 'Gate a tag, pixel, or backend event pipeline on real consent — including an edge-worker example.',
  },
  {
    href: '/guides/backend/webhooks/',
    title: 'Webhook Integration',
    desc: 'POST consent decisions to your own webhook URL using the existing eventBus — no new package.',
  },
  {
    href: '/guides/backend/policy-engine-mapping/',
    title: 'Policy & Rules Engine Mapping',
    desc: 'How compliance groups, geo-resolution, and multi-tenancy map onto "policy by regulation/region/site" language.',
  },
]

const HOT_TOPICS = [
  {
    href: '/guides/hot-topics/google-consent-mode-v2-explained/',
    title: 'Google Consent Mode v2 Explained',
    desc: 'What the seven consent signals mean, and basic vs. advanced mode.',
  },
  {
    href: '/guides/hot-topics/gdpr-vs-dpdpa/',
    title: 'GDPR vs DPDPA',
    desc: 'Where the EU and India opt-in laws agree — and where they don’t.',
  },
  {
    href: '/guides/hot-topics/dpdpa-cookie-compliance-guide/',
    title: 'DPDPA Cookie Compliance Guide',
    desc: 'A practical checklist for an India-compliant opt-in banner.',
  },
  {
    href: '/guides/hot-topics/cpra-implementation-guide/',
    title: 'CPRA Implementation Guide',
    desc: 'Do Not Sell/Share, GPC auto-honour, and sensitive data opt-in.',
  },
  {
    href: '/guides/hot-topics/right-to-erasure/',
    title: 'Right to Erasure ("Right to Be Forgotten")',
    desc: 'The erasure endpoint, the preference modal\'s "Forget me" button, and what events fire.',
  },
  {
    href: '/guides/hot-topics/google-consent-mode-for-gtm/',
    title: 'Google Consent Mode for GTM',
    desc: 'Configuring consent checks and triggers inside the GTM console.',
  },
  {
    href: '/guides/hot-topics/self-hosting-a-cmp/',
    title: 'Self-hosting a CMP',
    desc: 'The four pieces a self-hosted consent stack actually needs.',
  },
  {
    href: '/guides/hot-topics/open-source-alternatives-to-onetrust/',
    title: 'Open-source alternatives to OneTrust',
    desc: 'Scoped to the cookie consent module, not the full GRC suite.',
  },
  {
    href: '/guides/hot-topics/open-source-alternatives-to-cookiebot/',
    title: 'Open-source alternatives to Cookiebot',
    desc: 'Self-hosted options compared feature-for-feature.',
  },
]

const ECOSYSTEM_GUIDES = [
  {
    href: '/guides/ecosystem/scanner/',
    title: '@consenti/scanner',
    desc: 'Offline CLI that crawls your site under three consent states and reports undeclared third-party trackers.',
  },
]

function GuideCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block p-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-sm transition-all no-underline group"
    >
      <div className="font-semibold text-slate-900 dark:text-gray-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {title}
      </div>
      <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{desc}</div>
    </Link>
  )
}

export default function GuidesPage() {
  return (
    <div className="prose max-w-none">
      <div className="not-prose mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
            <BookOpen size={22} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-50 m-0">Guides</h1>
        </div>
        <p className="text-slate-600 dark:text-gray-400 text-base leading-relaxed max-w-2xl">
          The docs tell you <em>what</em>. The guides tell you <em>why</em> and <em>how</em>. Each
          guide is a narrative walkthrough — context first, then steps, then common mistakes. Pick a
          topic below to get started.
        </p>
      </div>

      {/* Learn */}
      <div className="not-prose mb-10">
        <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100">
          <CircleQuestionMark size={16} className="text-brand-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200 m-0">Learn</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEARN_GUIDES.map(g => (
            <GuideCard key={g.href} {...g} />
          ))}
        </div>
      </div>

      {/* Frontend */}
      <div className="not-prose mb-10">
        <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100">
          <Layout size={16} className="text-brand-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200 m-0">
            Frontend — @consenti/ui
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FRONTEND_GUIDES.map(g => (
            <GuideCard key={g.href} {...g} />
          ))}
        </div>
      </div>

      {/* Backend */}
      <div className="not-prose mb-10">
        <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100">
          <Server size={16} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200 m-0">
            Backend — @consenti/api
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BACKEND_GUIDES.map(g => (
            <GuideCard key={g.href} {...g} />
          ))}
        </div>
      </div>

      {/* Hot Topics */}
      <div className="not-prose mb-10">
        <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100">
          <Flame size={16} className="text-orange-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200 m-0">Hot Topics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOT_TOPICS.map(g => (
            <GuideCard key={g.href} {...g} />
          ))}
        </div>
      </div>

      {/* Ecosystem */}
      <div className="not-prose mb-10">
        <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100">
          <Radar size={16} className="text-purple-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200 m-0">Ecosystem</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ECOSYSTEM_GUIDES.map(g => (
            <GuideCard key={g.href} {...g} />
          ))}
        </div>
      </div>

      <div className="not-prose mt-12 p-5 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
        <p className="text-sm text-slate-600 dark:text-gray-400 m-0">
          Looking for API reference tables, configuration options, and type definitions? Head over
          to the{' '}
          <Link
            href="/docs/getting-started/"
            className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            Documentation
          </Link>{' '}
          section.
        </p>
      </div>
    </div>
  )
}
