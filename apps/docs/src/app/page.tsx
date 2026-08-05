import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  BarChart2,
  Check,
  Code2,
  Component,
  Database,
  Eye,
  Globe,
  Lock,
  Minus,
  Palette,
  Plug,
  Radio,
  Server,
  Shield,
  TrendingDown,
  Wrench,
  X,
  Zap,
  GraduationCap,
} from 'lucide-react'
import {
  SiJavascript,
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiNextdotjs,
  SiNuxt,
  SiExpress,
  SiFastify,
  SiHono,
  SiNodedotjs,
  SiGoogletagmanager,
} from 'react-icons/si'
import { QuickStartTabs } from '@/components/QuickStartTabs'
import { SeeMore } from '@/components/SeeMore'

export const metadata: Metadata = {
  title: 'Consenti — Open Source Cookie Consent & CMP',
  alternates: {
    canonical: '/',
  },
}

const features = [
  {
    icon: Wrench,
    title: 'Framework Agnostic',
    desc: 'Works with Vanilla JS, React, Vue, Angular, Next.js, Nuxt. ESM + UMD + subpath exports included. Hooks for React, composables for Vue, services for Angular.',
    tag: 'Any Stack',
  },
  {
    icon: Database,
    title: 'Backend Powered',
    desc: 'Optional backend module records consent to SQLite (built-in), MongoDB, MySQL, or PostgreSQL. Append-only audit log. GDPR right-to-erasure endpoint. Rate limiting included.',
    tag: '@consenti/api',
  },
  {
    icon: BarChart2,
    title: 'Admin Dashboard',
    desc: 'Built-in Preact SPA served directly from the API package. Manage profiles, view consent records, audit logs, RBAC roles, and configure your CMP — zero extra setup.',
    tag: 'Included',
  },
  {
    icon: Palette,
    title: 'Fully Customisable',
    desc: 'Every label, colour, position, and button is configurable via CSS custom properties or JS config. BEM class names throughout. No Shadow DOM — your styles apply directly.',
    tag: 'Themeable',
  },
  {
    icon: Eye,
    title: 'Accessibility-Focused',
    desc: 'Focus trap, ARIA roles, keyboard navigation, screen reader announcements. Targeting WCAG 2.x AA — because consent must be accessible to everyone.',
    tag: 'A11Y',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'IPs stored as SHA-256 hashes only. Passwords via scrypt (native). JWT via HMAC-SHA256 (native). Signed consent cookies. Consent receipts on demand. No raw PII stored.',
    tag: 'Secure',
  },
  {
    icon: Plug,
    title: 'Plugin System',
    desc: 'Extend the backend with lifecycle hooks. Official plugins for BigQuery, Segment, Snowflake, webhooks, and Slack. Community plugins welcome under any package name.',
    tag: 'Extensible',
  },
  {
    icon: Zap,
    title: 'Zero Runtime Dependencies',
    desc: 'UI uses only browser built-ins (crypto.subtle, BroadcastChannel, document.cookie). API uses only Node built-ins (node:sqlite, node:crypto) by default. Extra storage drivers (Mongo/Postgres/MySQL) and spec-correct IAB TCF encoding are available as optional peer dependencies — not needed unless you opt in.',
    tag: '@consenti/ui',
  },
  {
    icon: Globe,
    title: 'Maintained Compliance Coverage',
    desc: 'GDPR/UK-GDPR, CCPA/CPRA + the US state-law cluster, and LGPD are actively maintained and tracked as law changes. DPDPA, and more are supported and in active development. TCF v2.3 and GPP both offer spec-correct binary encoding when configured with their respective optional peer dependencies, simplified format otherwise. Every country is pre-mapped to the right compliance group — most as Routing-only UX-template defaults, not individually legal-maintained. GPC auto-honour and COPPA age gates included.',
    tag: 'Compliance',
  },
]

const frontendStrengths = [
  {
    icon: Code2,
    title: 'A documented API, not a black box',
    desc: 'Every method is typed and documented — open(), close(), getConsent(type?), and friends — so you\'re never reverse-engineering a minified bundle to find the behavior you need.',
  },
  {
    icon: Component,
    title: 'Framework-native, not a wrapped script tag',
    desc: 'Real React hooks, Vue composables, and Angular services ship as subpath exports — idiomatic in your framework from the first line, not a <script> tag you build a wrapper around.',
  },
  {
    icon: Radio,
    title: 'Your UI reacts, it doesn\'t poll',
    desc: 'A full DOM event lifecycle (consenti:consentSubmitted and friends) fires on every consent change, so custom banners, gates, and analytics stay in sync without checking state on a timer.',
  },
  {
    icon: BarChart2,
    title: 'Analytics mapped for you',
    desc: 'Built-in mappers for Google Consent Mode v2, Meta, Adobe, and Segment translate a consent decision into the right vendor call — no hand-rolled dataLayer plumbing to keep in sync.',
  },
]

const integrations = [
  { name: 'Vanilla JS', Icon: SiJavascript, iconColor: '#f7df1e', bg: '#fffde7' },
  { name: 'React', Icon: SiReact, iconColor: '#0ea5e9', bg: '#f0f9ff' },
  { name: 'Vue', Icon: SiVuedotjs, iconColor: '#42b883', bg: '#f0fdf4' },
  { name: 'Angular', Icon: SiAngular, iconColor: '#dd0031', bg: '#fff1f2' },
  { name: 'Next.js', Icon: SiNextdotjs, iconColor: '#000000', bg: '#f8fafc' },
  { name: 'Nuxt', Icon: SiNuxt, iconColor: '#00c58e', bg: '#f0fdf4' },
  { name: 'Express', Icon: SiExpress, iconColor: '#404040', bg: '#f8fafc' },
  { name: 'Fastify', Icon: SiFastify, iconColor: '#00b4b6', bg: '#f0fdfe' },
  { name: 'Hono', Icon: SiHono, iconColor: '#e36002', bg: '#fff7ed' },
  { name: 'Node HTTP', Icon: SiNodedotjs, iconColor: '#3c873a', bg: '#f0fdf4' },
]

const whyReasons = [
  {
    icon: TrendingDown,
    title: 'No SaaS fees — ever',
    desc: 'Most paid CMPs charge a monthly fee, and enterprise tiers can run into the thousands. Consenti is Apache 2.0 — free to run on your own infra, forever.',
  },
  {
    icon: Server,
    title: 'Your data, your servers',
    desc: 'Hosted CMPs phone home with every consent event. Consenti records consent in your own database — SQLite by default, Mongo/Postgres when you need scale. Zero third-party data transfer.',
  },
  {
    icon: Shield,
    title: 'Privacy by design, not by checkbox',
    desc: 'IPs stored as SHA-256 hashes. Passwords via scrypt. JWT via native HMAC. Signed consent cookies. Consent receipts on demand. Built in, not bolted on.',
  },
  {
    icon: Globe,
    title: '190+ countries mapped to 8 consent UX groups',
    desc: 'An embedded map of every country and territory routes visitors to the right compliance group in code — see which laws are actively maintained vs. in development on the Jurisdiction Coverage Map.',
  },
  {
    icon: Plug,
    title: 'Extend it without forking it',
    desc: 'A plugin system with lifecycle hooks and official BigQuery, Segment, and Snowflake integrations. Add your own webhook or data pipeline in a few lines.',
  },
  {
    icon: Database,
    title: 'The browser-only category\'s ceiling',
    desc: 'Most open-source cookie consent widgets are banner-only, running entirely in the browser. Consenti works the same way standalone — plus an optional content-gating mode for jurisdictions that need it — and adds an optional backend when you want it: audit-grade consent records, dashboard-authored profiles with no redeploy, spec-correct IAB TCF/GPP encoding for programmatic ad monetization (self-registration included, not needed at all for first-party-only sites), and consent that follows a user across devices. Zero dependencies by default, optional peer dependencies only for what you opt into.',
  },
]

const comparisonRows: Array<{
  label: string
  consenti: boolean | string
  cookiebot: boolean | string
  onetrust: boolean | string
  cassie: boolean | string
  klaro: boolean | string
  orestbida: boolean | string
  consentstack: boolean | string
}> = [
    {
      label: 'Open source',
      consenti: true,
      cookiebot: false,
      onetrust: false,
      cassie: false,
      klaro: true,
      orestbida: true,
      consentstack: true,
    },
    {
      label: 'Self-hosted',
      consenti: true,
      cookiebot: false,
      onetrust: 'paid',
      cassie: 'paid',
      klaro: true,
      orestbida: true,
      consentstack: true,
    },
    {
      label: 'Zero runtime deps',
      consenti: true,
      cookiebot: false,
      onetrust: false,
      cassie: false,
      klaro: false,
      orestbida: true,
      consentstack: false,
    },
    {
      label: 'Built-in backend + audit log',
      consenti: true,
      cookiebot: false,
      onetrust: 'paid',
      cassie: true,
      klaro: false,
      orestbida: false,
      consentstack: false,
    },
    {
      label: 'Admin dashboard',
      consenti: true,
      cookiebot: true,
      onetrust: true,
      cassie: true,
      klaro: false,
      orestbida: false,
      consentstack: false,
    },
    {
      label: 'GDPR + CCPA + TCF v2.3',
      consenti: 'TCF partial',
      cookiebot: true,
      onetrust: true,
      cassie: true,
      klaro: 'partial',
      orestbida: 'partial',
      consentstack: 'partial',
    },
    {
      label: 'GPC auto-honour',
      consenti: true,
      cookiebot: true,
      onetrust: 'paid',
      cassie: 'unclear',
      klaro: false,
      orestbida: false,
      consentstack: 'unclear',
    },
    {
      label: 'TypeScript strict',
      consenti: true,
      cookiebot: false,
      onetrust: false,
      cassie: false,
      klaro: false,
      orestbida: 'partial',
      consentstack: false,
    },
    {
      label: 'Framework hooks (React / Vue / Ng)',
      consenti: true,
      cookiebot: false,
      onetrust: false,
      cassie: false,
      klaro: false,
      orestbida: false,
      consentstack: false,
    },
    {
      label: 'WCAG 2.x AA accessible',
      consenti: true,
      cookiebot: 'unclear',
      onetrust: 'unclear',
      cassie: 'unclear',
      klaro: 'partial',
      orestbida: 'unclear',
      consentstack: 'unclear',
    },
    {
      label: 'No cross-origin script',
      consenti: true,
      cookiebot: false,
      onetrust: false,
      cassie: false,
      klaro: 'frontend only',
      orestbida: 'frontend only',
      consentstack: 'frontend only',
    },
    {
      label: 'Data sovereignty',
      consenti: true,
      cookiebot: false,
      onetrust: 'paid',
      cassie: 'paid',
      klaro: 'frontend only',
      orestbida: 'frontend only',
      consentstack: 'frontend only',
    },
    {
      label: 'Free to use',
      consenti: true,
      cookiebot: 'limited',
      onetrust: false,
      cassie: false,
      klaro: 'frontend only',
      orestbida: 'frontend only',
      consentstack: 'frontend only',
    },
  ]

const compliance = [
  // EU / UK
  {
    law: 'GDPR',
    region: 'EU / EEA',
    flag: '🇪🇺',
    status: 'Full',
    note: 'Opt-in consent, legitimate interest, erasure, admin export',
    href: '/docs/compliance/gdpr/',
  },
  {
    law: 'UK GDPR',
    region: 'United Kingdom',
    flag: '🇬🇧',
    status: 'Full',
    note: 'Post-Brexit equivalent of EU GDPR; ICO-enforced; same opt-in model',
    href: '/docs/compliance/uk-gdpr/',
  },
  // Americas
  {
    law: 'CCPA / CPRA',
    region: 'California, USA',
    flag: '🇺🇸',
    status: 'Full',
    note: '"Do Not Sell" link, GPC auto-honour, CPRA corrections, opt-out records',
    href: '/docs/compliance/ccpa/',
  },
  {
    law: 'VCDPA',
    region: 'Virginia, USA',
    flag: '🇺🇸',
    status: 'Full',
    note: 'Opt-out rights, consent records, appeal mechanism, data access',
    href: '/docs/compliance/ccpa/',
  },
  {
    law: 'CPA',
    region: 'Colorado, USA',
    flag: '🇺🇸',
    status: 'Full',
    note: 'Universal opt-out via GPC, consent audit log, revocation support',
    href: '/docs/compliance/ccpa/',
  },
  {
    law: 'CTDPA',
    region: 'Connecticut, USA',
    flag: '🇺🇸',
    status: 'Full',
    note: 'Opt-out UI, signed consent cookies, audit trail, controller config',
    href: '/docs/compliance/ccpa/',
  },
  {
    law: 'LGPD',
    region: 'Brazil',
    flag: '🇧🇷',
    status: 'Full',
    note: 'Opt-in, 10 lawful bases, ANPD-enforced, under-12 parental consent gate',
    href: '/docs/compliance/lgpd/',
  },
  {
    law: 'POPIA',
    region: 'South Africa',
    flag: '🇿🇦',
    status: 'Full',
    note: 'Opt-in, 8 lawful processing conditions, Information Regulator-enforced',
    href: '/docs/compliance/popia/',
  },
  {
    law: 'PIPEDA / Law 25',
    region: 'Canada',
    flag: '🇨🇦',
    status: 'Full',
    note: 'Federal PIPEDA + Quebec Law 25 (stricter, GDPR-aligned); explicit opt-in',
    href: '/docs/compliance/pipeda/',
  },
  {
    law: 'GPC',
    region: 'Global signal',
    flag: '🌐',
    status: 'Full',
    note: 'Auto-detects navigator.globalPrivacyControl with three honour modes',
    href: undefined,
  },
  {
    law: 'TCF v2.3 / GPP',
    region: 'IAB / Global',
    flag: '🌐',
    status: 'Partial',
    note: 'Only relevant if you monetize via programmatic/RTB ads — self-registration with IAB Europe/MSPA fully supported. Real binary encoding available via optional peer dependencies; simplified format otherwise',
    href: '/docs/compliance/tcf-and-gpp-registration/',
  },
  {
    law: 'COPPA',
    region: 'USA (children)',
    flag: '🇺🇸',
    status: 'Partial',
    note: 'Age gate widget included; parental verification requires your backend',
    href: '/docs/compliance/coppa/',
  },
  {
    law: 'DPDPA',
    region: 'India',
    flag: '🇮🇳',
    status: 'Partial',
    note: 'Opt-in, fiduciary disclosure, grievance officer in notice, Inline with India\'s phased 2025–2027 rules/compliance rollout',
    href: '/docs/compliance/dpdpa/',
  },
  {
    law: 'PDPA',
    region: 'Thailand',
    flag: '🇹🇭',
    status: 'Partial',
    note: 'Consent & legitimate interest bases; cross-border transfer rules apply',
    href: '/docs/compliance/pdpa-th/',
  },
  {
    law: 'APPI',
    region: 'Japan',
    flag: '🇯🇵',
    status: 'Partial',
    note: 'Opt-in for sensitive data and foreign transfers; opt-out for general third-party sharing',
    href: '/docs/compliance/appi/',
  },
  {
    law: 'KVKK',
    region: 'Turkey',
    flag: '🇹🇷',
    status: 'Partial',
    note: 'GDPR-inspired opt-in; explicit consent for sensitive data; KVK Board enforces',
    href: '/docs/compliance/kvkk/',
  },
]

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 mx-auto">
        <Check size={13} className="text-green-600" strokeWidth={2.5} />
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 mx-auto">
        <X size={13} className="text-red-400" strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
      <Minus size={10} /> {value}
    </span>
  )
}

export default function LandingPage() {
  return (
    <main className="bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="hero-section text-white text-center py-42 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-brand-500/10 blur-[100px] -translate-y-1/3" />
        </div>
        <div className="max-w-4xl mx-auto relative">
          <div className="font-mono text-[11px] text-white/35 mb-8 tracking-widest uppercase">
            Consenti: The developer-first open-source Consent Management Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-[-0.03em] leading-[1.1]">
            The Cookie Consent Platform
            <br />
            <span className="text-green-300">You Actually Own</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Maintained for GDPR/UK-GDPR, CCPA/CPRA + US state laws, and LGPD — plus DPDPA and more, supported and in active development.
            <br /> Admin dashboard, an append-only audit
            log, and every consent record stays on your own infrastructure. Open source, no
            monthly fee.
          </p>
          {/* Install command */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-lg px-5 py-3 font-mono text-sm text-white/70">
              <span className="text-green-400 select-none">$</span>
              <span>npm install @consenti/ui</span>
              <span className="text-white/20">·</span>
              <span className="text-white/40 text-xs">optional backend:</span>
              <span className="text-white/60">npm install @consenti/api</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/demo-playground/frontend"
              className="inline-flex items-center gap-2 bg-white dark:!bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg no-underline hover:bg-blue-50 transition-colors text-sm"
            >
              Live Demo →
            </Link>
            <Link
              href="/docs/compliance/jurisdiction-coverage-map/"
              className="inline-flex items-center gap-2 bg-transparent border border-white/20 text-white/80 font-medium px-6 py-3 rounded-lg no-underline hover:border-white/40 hover:text-white transition-colors text-sm"
            >
              See Compliance Coverage
            </Link>
            <a
              href="/guides/tutorials"
              className="inline-flex items-center gap-2 bg-transparent border border-white/20 text-white/80 font-medium px-6 py-3 rounded-lg no-underline hover:border-white/40 hover:text-white transition-colors text-sm"
            >
              <GraduationCap size={16} />
              Tutorials
            </a>
          </div>

          <p className="mt-6 text-sm text-white/40">
            Building it yourself? Jump to the developer {' '}
            <Link
              href="/docs"
              className="text-white/70 hover:text-white underline underline-offset-2"
            >
              docs →
            </Link>
            {' '} or {' '}
            <Link
              href="/guides"
              className="text-white/70 hover:text-white underline underline-offset-2"
            >
              guides →
            </Link>
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-white/25 tracking-wide">
            <span>Apache 2.0</span>
            <span>Node 20+</span>
            <span>ES2020+</span>
            <span>TypeScript Strict</span>
            <span>Zero Runtime Deps</span>
          </div>
        </div>
      </section>

      {/* Frontend-Only Mode */}
      <section className="py-36 bg-slate-100/90 dark:bg-[#060e1c] px-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[500px] h-[280px] bg-green-500/8 rounded-full blur-[90px]" />
        </div>
        <div className="max-w-5xl mx-auto relative text-center">
          <div className="font-mono text-[11px] text-brand-500 dark:text-brand-300 mb-4 tracking-widest uppercase">
            Frontend-only mode
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100 mb-4 tracking-tight">
            Just the widget? You still get the full widget.
          </h2>
          <p className="text-[15px] text-slate-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Most open-source cookie consent tools are frontend-only by design — a script, a banner,
            done. Run <code className="text-[13px]">@consenti/ui</code> the same way,
            with zero backend, and you still get the parts most banner-only tools leave you to
            hand-roll.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left">
            {frontendStrengths.map(s => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className="flex gap-4 p-5 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-100 dark:hover:border-brand-900 transition-colors"
                >
                  <div className="shrink-0 w-8 h-8 rounded-md bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center mt-0.5">
                    <Icon size={16} className="text-brand-500 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-1.5 leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <Link
            href="/guides/frontend-only-mode/"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg no-underline hover:bg-blue-50 transition-colors text-sm"
          >
            See the full frontend-only guide →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-3 tracking-tight">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-slate-500 dark:text-gray-400 max-w-3xl mx-auto text-[15px]">
            Start with just the UI widget — no backend required. Add the backend module only if you
            need server-side records or an admin dashboard. Both ship zero runtime dependencies.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group flex gap-4 p-5 rounded-lg border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-100 dark:hover:border-brand-900 transition-colors"
              >
                <div className="shrink-0 w-8 h-8 rounded-md bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center mt-0.5">
                  <Icon size={16} className="text-brand-500 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 leading-tight">
                      {f.title}
                    </h3>
                    <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-gray-600 shrink-0">
                      {f.tag}
                    </span>
                  </div>
                  <SeeMore tag="div" className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed">
                    {f.desc}
                  </SeeMore>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Google Consent Mode v2 */}
      <section className="px-6 py-20 bg-slate-100/90 dark:bg-[#060e1c]">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="shrink-0 w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <SiGoogletagmanager size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-3 tracking-tight">
              Google Consent Mode v2, auto-wired — not just a mapping helper
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-[15px] leading-relaxed mb-4">
              Consenti fires <code className="text-[13px]">gtag(&apos;consent&apos;, &apos;default&apos;, …)</code>{' '}
              before any tag loads and <code className="text-[13px]">gtag(&apos;consent&apos;, &apos;update&apos;, …)</code>{' '}
              on every consent change — correct GCM keys, configurable{' '}
              <code className="text-[13px]">dataLayer</code> name, no manual wiring. Required for
              Google Ads/Analytics tags to keep working under GDPR once Consent Mode v2 is in effect.
            </p>
            <Link
              href="/guides/hot-topics/google-consent-mode-v2-explained/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 no-underline"
            >
              How Consenti implements Consent Mode v2 →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Consenti */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 font-mono text-xs text-brand-400 dark:text-brand-300 mb-4">
              <span
                className="w-5 h-px bg-brand-300 dark:bg-brand-600 inline-block"
                aria-hidden="true"
              />
              Why Consenti
              <span
                className="w-5 h-px bg-brand-300 dark:bg-brand-600 inline-block"
                aria-hidden="true"
              />
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-4 tracking-tight">
              Built different from every other CMP
            </h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto text-[15px]">
              Most hosted SaaS CMPs own your consent data and charge monthly. Most open-source
              alternatives are UI-only — no backend, no audit log. Consenti ships the full stack
              instead.
            </p>
            <Link
              href="/guides/hot-topics/what-is-consenti/"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 no-underline"
            >
              What is Consenti, and why is it built this way? →
            </Link>
          </div>

          {/* Reason cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
            {whyReasons.map(r => {
              const Icon = r.icon
              return (
                <div
                  key={r.title}
                  className="flex gap-4 p-5 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <div className="shrink-0 w-8 h-8 rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                    <Icon size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-1.5 leading-tight">
                      {r.title}
                    </h3>
                    <SeeMore tag="div" className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed">
                      {r.desc}
                    </SeeMore>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
            <table className="w-full text-sm border-collapse bg-white dark:bg-gray-800">
              <thead>
                {/* Category row */}
                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50/70 dark:bg-gray-700/40">
                  <th className="text-left py-2 px-5 font-medium text-slate-400 text-xs" />
                  <th className="py-2 px-4 text-center bg-brand-50 border-x border-brand-100" />
                  <th
                    colSpan={3}
                    className="py-2 px-4 text-center text-[11px] font-semibold text-slate-400 tracking-wide uppercase border-r border-slate-100"
                  >
                    SaaS / Hosted
                  </th>
                  <th
                    colSpan={3}
                    className="py-2 px-4 text-center text-[11px] font-semibold text-slate-400 tracking-wide uppercase"
                  >
                    Open Source
                  </th>
                </tr>
                {/* Name row */}
                <tr className="border-b border-slate-100 dark:border-gray-700">
                  <th className="text-left py-4 px-5 font-semibold text-slate-500 dark:text-gray-400">
                    Feature
                  </th>
                  <th className="py-4 px-4 font-extrabold text-brand-600 text-center bg-brand-50 border-x border-brand-100">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>Consenti</span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Open Source
                      </span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">Cookiebot</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">OneTrust</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center border-r border-slate-100">
                    Cassie
                  </th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">Klaro</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">orestbida</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">
                    ConsentStack
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={
                      idx % 2 === 0
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-slate-50/50 dark:bg-gray-700/30'
                    }
                  >
                    <td className="py-3 px-5 text-slate-700 dark:text-gray-300 font-medium">
                      {row.label}
                    </td>
                    <td className="py-3 px-4 text-center bg-brand-50/40 border-x border-brand-100">
                      <ComparisonCell value={row.consenti} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ComparisonCell value={row.cookiebot} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ComparisonCell value={row.onetrust} />
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-100">
                      <ComparisonCell value={row.cassie} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ComparisonCell value={row.klaro} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ComparisonCell value={row.orestbida} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ComparisonCell value={row.consentstack} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-slate-50 dark:bg-gray-700/40 border-t border-slate-100 dark:border-gray-700 text-xs text-slate-400 dark:text-gray-500">
              Based on public documentation as of Jan 2026. "Paid" = available on paid tiers only.
              "Limited" = free tier with domain/pageview caps. "Partial" = basic support, not full
              spec coverage. Cookiebot, OneTrust, Cassie, Klaro, orestbida/cookie-consent, and
              ConsentStack are trademarks of their respective owners. Consenti is not affiliated
              with, endorsed by, or sponsored by any of them; see{' '}
              <Link href="/terms/" className="underline">
                Terms of Use
              </Link>
              .
            </div>
          </div>
          <div className="mt-5 rounded-xl text-sm border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3">
            The table above compares Consenti's consent-widget & backend app features. It's not the same product category as the privacy suites some competitors sell alongside their CMP.
            <a href="/guides/what-is-consenti#what-consenti-is-not" className='ml-2 text-brand-600 hover:text-brand-700 '> <span className='underline'>Read more</span> →</a>
          </div>
        </div>
      </section>

      {/* Quick start */}
      <QuickStartTabs />

      {/* Compliance table */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-3 tracking-tight">
            Compliance Coverage
          </h2>
          <p className="text-slate-500 dark:text-gray-400 max-w-3xl mx-auto text-[15px]">
            <Link href="/docs/compliance/compliance-groups/" className="underline decoration-dotted hover:text-brand-600">
              Compliance groups
            </Link>{' '}
            routed automatically — see what's actively maintained vs. still evolving below.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {compliance.map(row => (
            <div
              key={row.law}
              className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-lg px-4 py-3 hover:border-slate-200 dark:hover:border-gray-700 transition-colors group"
            >
              {/* Flag */}
              <span className="text-xl leading-none mt-0.5 shrink-0">{row.flag}</span>
              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="font-bold text-sm text-slate-900 group-hover:text-brand-600 no-underline hover:underline transition-colors"
                    >
                      {row.law}
                    </Link>
                  ) : (
                    <span className="font-bold text-sm text-slate-900">{row.law}</span>
                  )}
                  <span className="text-xs text-slate-400">{row.region}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                  {row.note}
                </p>
              </div>
              {/* Status badge */}
              <div className="shrink-0">
                {row.status === 'Full' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Full
                  </span>
                ) : row.status === 'In development' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M6 3v3l2 1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    In development
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M6 4v3M6 8.5v.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Partial
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-gray-500 text-center mt-4">
          Full = actively maintained, tracked as the law changes. Partial = infrastructure
          provided; your legal team (or, for TCF, your own config + an optional dependency)
          finishes the specifics. In development = supported today, rollout still being
          finished — see each regulation's guide for current status.
        </p>
        <div className="text-center mt-8">
          <Link
            href="/docs/compliance/jurisdiction-coverage-map/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 no-underline"
          >
            This is a sample — see the full Jurisdiction Coverage Map (190+ countries/territories mapped) →
          </Link>
        </div>
      </section>

      {/* Integrations */}
      <section className="hero-section py-20 px-6 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-brand-500/8 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Works with your stack
            </h2>
            <p className="text-white/50 text-[15px]">
              No migration required. Consenti adapts to whatever you're already running.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {integrations.map(i => (
              <div
                key={i.name}
                className="group flex flex-col items-center gap-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-lg p-5 cursor-default transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: i.bg }}
                >
                  <i.Icon size={28} style={{ color: i.iconColor }} />
                </div>
                <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors text-center leading-tight">
                  {i.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
