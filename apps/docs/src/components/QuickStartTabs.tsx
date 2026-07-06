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
    title: 'Add to your app',
    filename: 'main.ts',
    code: `import { ConsentiSetup } from '@consenti/ui'

// Auto-detects compliance from browser locale — GDPR, CCPA, etc.
new ConsentiSetup({})`,
    color: 'text-blue-300',
  },
  {
    num: 3,
    title: 'Gate code on consent',
    filename: 'main.ts',
    code: `const widget = new ConsentiSetup({})

widget.onReady(() => {
  if (widget.isCookieGranted('analytics')) initAnalytics()
})`,
    color: 'text-blue-300',
  },
]

const BOTH_STEPS: Step[] = [
  {
    num: 1,
    title: 'Install both packages',
    code: `npm install @consenti/ui   # browser widget
npm install @consenti/api  # backend module`,
    color: 'text-green-400',
  },
  {
    num: 2,
    title: 'Start the backend',
    filename: 'server.ts',
    code: `import { createConsenti } from '@consenti/api'
import http from 'node:http'

const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
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

new ConsentiSetup({
  api: { enabled: true, baseUrl: 'http://localhost:3001' },
  // compliance group auto-resolved per visitor via /resolve-profile
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
    <section className="bg-[#030d1a] border-y border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-xl font-bold text-white mb-6 text-center tracking-tight">Quick Start</h2>

        {/* Horizontal Link Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/[0.05] border border-white/10 rounded-lg p-1 gap-1">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`?tab=${t.id}`}
                scroll={false}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${active === t.id
                  ? 'bg-brand-500 text-white'
                  : 'text-white/40 hover:text-white/70'
                  }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step) => (
            <div key={step.num} className="bg-[#060f1e] rounded-lg border border-white/[0.07] overflow-hidden">
              {/* Step header */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.06]">
                <span className="w-5 h-5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold font-mono flex items-center justify-center shrink-0 border border-brand-500/30">
                  {step.num}
                </span>
                <span className="text-xs font-medium text-white/60">{step.title}</span>
                {step.filename && (
                  <span className="ml-auto text-[10px] text-white/30 font-mono">{step.filename}</span>
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
            className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 text-white/70 font-medium text-sm px-6 py-3 rounded-lg no-underline hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-colors"
          >
            {more.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
