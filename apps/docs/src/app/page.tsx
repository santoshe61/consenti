import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  BarChart2,
  Check,
  Database,
  Eye,
  Globe,
  Lock,
  Minus,
  Palette,
  Plug,
  Server,
  Shield,
  TrendingDown,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
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
} from 'react-icons/si'
import { QuickStartTabs } from '@/components/QuickStartTabs'

export const metadata: Metadata = {
  title: 'Consenti — Open Source Cookie Consent & CMP',
}

const features = [
  {
    icon: Zap,
    title: 'Zero Runtime Dependencies',
    desc: 'UI uses only browser built-ins (crypto.subtle, BroadcastChannel, document.cookie). API uses only Node built-ins (node:sqlite, node:crypto). Nothing to bundle but your own code.',
    tag: '@consenti/ui',
  },
  {
    icon: Globe,
    title: 'GDPR, CCPA & TCF Ready',
    desc: 'Opt-in (GDPR) and opt-out (CCPA) modes. GPC signal detection. IAB TCF v2.2 support. COPPA age gates. Legitimate interest handling per GDPR Art. 6(1)(f).',
    tag: 'Compliance',
  },
  {
    icon: Wrench,
    title: 'Framework Agnostic',
    desc: 'Works with Vanilla JS, React, Vue, Angular, Next.js, Nuxt. ESM + UMD + subpath exports included. Hooks for React, composables for Vue, services for Angular.',
    tag: 'Any Stack',
  },
  {
    icon: Database,
    title: 'Backend Powered',
    desc: 'Optional backend module records consent to SQLite (built-in), MongoDB, MySQL, or PostgreSQL. Immutable audit log. GDPR right-to-erasure endpoint. Rate limiting included.',
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
    title: 'WCAG AAA Accessible',
    desc: 'Focus trap, ARIA roles, keyboard navigation, screen reader announcements. Meets WCAG 2.2 AAA — because consent must be accessible to everyone.',
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
    desc: 'Cookiebot starts at €9/month. OneTrust costs thousands. Consenti is Apache 2.0 — free to run on your own infra, forever.',
  },
  {
    icon: Server,
    title: 'Your data, your servers',
    desc: 'Hosted CMPs phone home with every consent event. Consenti records consent in your own database — SQLite by default, Mongo/Postgres when you need scale. Zero third-party data transfer.',
  },
  {
    icon: Database,
    title: 'More complete than other open-source CMPs',
    desc: 'Klaro and orestbida/cookie-consent are UI-only widgets. Consenti ships a full stack: banner widget + backend + admin dashboard + audit log — all zero dependencies.',
  },
  {
    icon: Shield,
    title: 'Privacy by design, not by checkbox',
    desc: 'IPs stored as SHA-256 hashes. Passwords via scrypt. JWT via native HMAC. Signed consent cookies. Consent receipts on demand. Built in, not bolted on.',
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
    { label: 'Open source', consenti: true, cookiebot: false, onetrust: false, cassie: false, klaro: true, orestbida: true, consentstack: true },
    { label: 'Self-hosted', consenti: true, cookiebot: false, onetrust: 'paid', cassie: 'paid', klaro: true, orestbida: true, consentstack: true },
    { label: 'Zero runtime deps', consenti: true, cookiebot: false, onetrust: false, cassie: false, klaro: false, orestbida: true, consentstack: false },
    { label: 'Built-in backend + audit log', consenti: true, cookiebot: false, onetrust: 'paid', cassie: true, klaro: false, orestbida: false, consentstack: false },
    { label: 'Admin dashboard', consenti: true, cookiebot: true, onetrust: true, cassie: true, klaro: false, orestbida: false, consentstack: false },
    { label: 'GDPR + CCPA + TCF v2.2', consenti: true, cookiebot: true, onetrust: true, cassie: true, klaro: 'partial', orestbida: 'partial', consentstack: 'partial' },
    { label: 'GPC auto-honour', consenti: true, cookiebot: false, onetrust: 'paid', cassie: false, klaro: false, orestbida: false, consentstack: false },
    { label: 'TypeScript strict', consenti: true, cookiebot: false, onetrust: false, cassie: false, klaro: false, orestbida: 'partial', consentstack: false },
    { label: 'Framework hooks (React / Vue / Ng)', consenti: true, cookiebot: false, onetrust: false, cassie: false, klaro: false, orestbida: false, consentstack: false },
    { label: 'WCAG AAA accessible', consenti: true, cookiebot: false, onetrust: false, cassie: false, klaro: false, orestbida: false, consentstack: false },
    { label: 'No cross-origin script', consenti: true, cookiebot: false, onetrust: false, cassie: false, klaro: true, orestbida: true, consentstack: true },
    { label: 'Data sovereignty', consenti: true, cookiebot: false, onetrust: 'paid', cassie: 'paid', klaro: true, orestbida: true, consentstack: true },
    { label: 'Free to use', consenti: true, cookiebot: 'limited', onetrust: false, cassie: false, klaro: true, orestbida: true, consentstack: true },
  ]

const compliance = [
  // EU / UK
  {
    law: 'GDPR',
    region: 'EU / EEA',
    flag: '🇪🇺',
    status: 'Full',
    note: 'Opt-in consent, legitimate interest, erasure, portability, DPO support',
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
    law: 'COPPA',
    region: 'USA (children)',
    flag: '🇺🇸',
    status: 'Partial',
    note: 'Age gate widget included; parental verification requires your backend',
    href: '/docs/compliance/coppa/',
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
    law: 'PIPEDA / Law 25',
    region: 'Canada',
    flag: '🇨🇦',
    status: 'Full',
    note: 'Federal PIPEDA + Quebec Law 25 (stricter, GDPR-aligned); explicit opt-in',
    href: '/docs/compliance/pipeda/',
  },
  // Asia / Pacific
  {
    law: 'DPDPA',
    region: 'India',
    flag: '🇮🇳',
    status: 'Full',
    note: 'Opt-in, fiduciary disclosure, grievance officer in notice, no GPC',
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
  // Africa / Middle East
  {
    law: 'POPIA',
    region: 'South Africa',
    flag: '🇿🇦',
    status: 'Full',
    note: 'Opt-in, 8 lawful processing conditions, Information Regulator-enforced',
    href: '/docs/compliance/popia/',
  },
  {
    law: 'KVKK',
    region: 'Turkey',
    flag: '🇹🇷',
    status: 'Partial',
    note: 'GDPR-inspired opt-in; explicit consent for sensitive data; KVK Board enforces',
    href: '/docs/compliance/kvkk/',
  },
  // Global signals
  {
    law: 'TCF v2.2',
    region: 'IAB / Global',
    flag: '🌐',
    status: 'Full',
    note: 'TC string encoding, vendor list, stacks, publisher restrictions',
    href: '/docs/compliance/tcf/',
  },
  {
    law: 'GPC',
    region: 'Global signal',
    flag: '🌐',
    status: 'Full',
    note: 'Auto-detects navigator.globalPrivacyControl with three honour modes',
    href: undefined,
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

interface LandingPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default function LandingPage({ searchParams }: LandingPageProps) {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero */}
      <section
        className="text-white text-center py-24 px-6"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #1a3460 40%, #1565c0 75%, #43a047 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-white/20">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Apache 2.0 · Zero runtime dependencies · TypeScript strict
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight leading-[1.1]">
            Open-Source Cookie Consent<br />
            <span className="text-green-300">Zero Dependencies</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Drop in one import. GDPR, CCPA, TCF, and GPC compliant.
            Works with any stack. Admin dashboard included. Backend optional.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/docs/getting-started/" className="inline-flex items-center gap-2 bg-white dark:!bg-white text-brand-600 font-bold px-7 py-3.5 rounded-xl no-underline hover:bg-blue-50 transition-colors text-base shadow-lg">
              Get Started →
            </Link>
            <Link href="/demo-playground/frontend" className="inline-flex items-center gap-2 bg-transparent border-2 border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl no-underline hover:border-white hover:bg-white/10 transition-colors text-base">
              Live Demo
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <FaGithub size={16} />
              Open Source
            </span>
            <span>Node 20+</span>
            <span>ES2020+</span>
            <span>TypeScript Strict</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 mb-4">Everything you need. Nothing you don't.</h2>
          <p className="text-slate-500 dark:text-gray-400 text-lg max-w-4xl mx-auto">Start with just the UI widget — no backend required. Add the backend module only if you need server-side records or an admin dashboard. Both ship zero runtime dependencies.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-700/20 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={20} className="text-brand-500" />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-gray-100">{f.title}</h3>
                  <span className="shrink-0 text-[10px] font-semibold text-brand-500 bg-brand-50 dark:bg-brand-700/20 px-2 py-0.5 rounded-full whitespace-nowrap">{f.tag}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Why Consenti */}
      <section className="py-20 px-6 section-gradient-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold tracking-widest text-brand-500 uppercase mb-3">Why Consenti</span>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-gray-100 mb-4">
              Built different from every other CMP
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              SaaS CMPs like Cookiebot, OneTrust, and Cassie own your consent data and charge monthly.
              Other open-source alternatives like Klaro, orestbida, and ConsentStack are UI-only — no backend, no audit log.
              Consenti is the only open-source CMP with a full stack included.
            </p>
          </div>

          {/* Reason cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {whyReasons.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-gray-100 mb-2">{r.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{r.desc}</p>
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
                  <th colSpan={3} className="py-2 px-4 text-center text-[11px] font-semibold text-slate-400 tracking-wide uppercase border-r border-slate-100">
                    SaaS / Hosted
                  </th>
                  <th colSpan={3} className="py-2 px-4 text-center text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                    Open Source
                  </th>
                </tr>
                {/* Name row */}
                <tr className="border-b border-slate-100 dark:border-gray-700">
                  <th className="text-left py-4 px-5 font-semibold text-slate-500 dark:text-gray-400">Feature</th>
                  <th className="py-4 px-4 font-extrabold text-brand-600 text-center bg-brand-50 border-x border-brand-100">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>Consenti</span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Open Source</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">Cookiebot</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">OneTrust</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center border-r border-slate-100">Cassie</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">Klaro</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">orestbida</th>
                  <th className="py-4 px-4 font-semibold text-slate-500 text-center">ConsentStack</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={row.label} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50/50 dark:bg-gray-700/30'}>
                    <td className="py-3 px-5 text-slate-700 dark:text-gray-300 font-medium">{row.label}</td>
                    <td className="py-3 px-4 text-center bg-brand-50/40 border-x border-brand-100">
                      <ComparisonCell value={row.consenti} />
                    </td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.cookiebot} /></td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.onetrust} /></td>
                    <td className="py-3 px-4 text-center border-r border-slate-100"><ComparisonCell value={row.cassie} /></td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.klaro} /></td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.orestbida} /></td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.consentstack} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-slate-50 dark:bg-gray-700/40 border-t border-slate-100 dark:border-gray-700 text-xs text-slate-400 dark:text-gray-500">
              Based on public documentation as of June 2026. "Paid" = available on paid tiers only. "Limited" = free tier with domain/pageview caps. "Partial" = basic support, not full spec coverage.
            </div>
          </div>
        </div>
      </section>

      {/* Quick start */}
      <QuickStartTabs searchParams={searchParams} />

      {/* Compliance table */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-gray-100 mb-3">Compliance Coverage</h2>
          <p className="text-slate-500 dark:text-gray-400 text-lg max-w-4xl mx-auto">Built to meet the most stringent global privacy regulations out of the box.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {compliance.map((row) => (
            <div key={row.law} className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-slate-200 dark:hover:border-gray-600 hover:shadow-sm transition-all group">
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
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">{row.note}</p>
              </div>
              {/* Status badge */}
              <div className="shrink-0">
                {row.status === 'Full' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Full
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Partial
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-gray-500 text-center mt-4">
          Partial = infrastructure provided; your legal team configures jurisdiction-specific specifics.
        </p>
      </section>

      {/* Integrations */}
      <section style={{ background: 'linear-gradient(160deg, #0f1f3d 0%, #1a3460 60%, #122547 100%)' }} className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Works with your stack</h2>
            <p className="text-white/60 text-lg">No migration required. Consenti adapts to whatever you're already running.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {integrations.map((i) => (
              <div
                key={i.name}
                className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-white border border-white/10 hover:border-transparent rounded-2xl p-6 cursor-default transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: i.bg }}
                >
                  <i.Icon size={32} style={{ color: i.iconColor }} />
                </div>
                <span className="text-sm font-semibold text-white/80 group-hover:text-slate-800 transition-colors text-center leading-tight">
                  {i.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-12 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #1a3460 0%, #1565c0 60%, #43a047 100%)' }}
        >
          <h2 className="text-3xl font-extrabold mb-4">Ready to add Consenti?</h2>
          <p className="text-white/80 text-lg mb-8">One import. Full GDPR compliance. No external dependencies.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/docs/getting-started/" className="inline-flex items-center gap-2 bg-white dark:!bg-white text-brand-600 font-bold px-7 py-3.5 rounded-xl no-underline hover:bg-blue-50 transition-colors text-base">
              Read the Docs →
            </Link>
            <Link href="/demo-playground/frontend" className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl no-underline hover:border-white hover:bg-white/10 transition-colors text-base">
              Try Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
