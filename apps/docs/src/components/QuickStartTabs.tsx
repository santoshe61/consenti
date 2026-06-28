import Link from 'next/link'

type Tab = 'frontend' | 'both'

const TABS: { id: Tab; label: string }[] = [
  { id: 'frontend', label: 'Frontend Only' },
  { id: 'both', label: 'Both Frontend & Backend' },
]

interface Step {
  num: number
  title: string
  filename?: string
  code: string
  color: string
}

const FRONTEND_STEPS: Step[] = [
  {
    num: 1,
    title: 'Install',
    code: 'npm install @consenti/ui',
    color: 'text-green-400',
  },
  {
    num: 2,
    title: 'Configure',
    filename: 'main.ts',
    code: `import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

new ConsentiSetup({
  core: {
    regulation: 'gdpr',
    locale: 'en',
    autoHonorGPC: true,
  },
})`,
    color: 'text-blue-300',
  },
  {
    num: 3,
    title: 'Listen for consent',
    filename: 'main.ts',
    code: `document.addEventListener('consenti:consentSubmitted', (e) => {
  const { consentJson } = (e as CustomEvent).detail
  if (consentJson.analytics === 'granted') {
    // load your analytics
  }
})`,
    color: 'text-blue-300',
  },
]

const BOTH_STEPS: Step[] = [
  {
    num: 1,
    title: 'Install both packages',
    code: `npm install @consenti/ui        # browser widget
npm install @consenti/api   # backend module`,
    color: 'text-green-400',
  },
  {
    num: 2,
    title: 'Start the backend',
    filename: 'server.ts',
    code: `import { createConsenti } from '@consenti/api'
import http from 'node:http'

const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@yourdomain.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,   // admin SPA at /consenti/
})
http.createServer(consenti.handler).listen(3001)`,
    color: 'text-purple-300',
  },
  {
    num: 3,
    title: 'Connect the frontend',
    filename: 'main.ts',
    code: `import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

new ConsentiSetup({
  core: { regulation: 'gdpr', locale: 'en' },
  api: {
    enabled: true,
    baseUrl: 'http://localhost:3001',
  },
})`,
    color: 'text-blue-300',
  },
]

const MORE_LINKS: Record<Tab, { href: string; label: string }> = {
  frontend: { href: '/docs/ui/', label: 'Full UI docs →' },
  both: { href: '/docs/getting-started/', label: 'Full Getting Started guide →' },
}

interface QuickStartTabsProps {
  searchParams: Promise<{ tab?: string }>
}

export async function QuickStartTabs({ searchParams }: QuickStartTabsProps) {
  const { tab } = await searchParams
  const active = (tab === 'both' ? 'both' : 'frontend') as Tab

  const steps = active === 'frontend' ? FRONTEND_STEPS : BOTH_STEPS
  const more = MORE_LINKS[active]

  return (
    <section className="bg-slate-950 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Start</h2>

        {/* Horizontal Link Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-800 rounded-xl p-1 gap-1">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`?tab=${t.id}`}
                scroll={false}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${active === t.id
                  ? 'bg-brand-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div key={step.num} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              {/* Step header */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {step.num}
                </span>
                <span className="text-xs font-semibold text-slate-300">{step.title}</span>
                {step.filename && (
                  <span className="ml-auto text-[10px] text-slate-500 font-mono">{step.filename}</span>
                )}
              </div>
              {/* Code */}
              <pre className={`p-4 text-xs font-mono leading-relaxed overflow-x-auto ${step.color}`}>
                {step.code}
              </pre>
            </div>
          ))}
        </div>

        {/* More link */}
        <div className="text-center mt-8">
          <Link
            href={more.href}
            className="inline-flex items-center gap-2 bg-brand-500 text-white font-bold px-6 py-3 rounded-xl no-underline hover:bg-brand-600 transition-colors"
          >
            {more.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
