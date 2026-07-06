'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa'
import { SiNpm } from 'react-icons/si'

const DOCS_LINKS = [
  { href: '/docs/getting-started/', label: 'Introduction' },
  { href: '/docs/getting-started/quick-start/', label: 'Quick Start' },
  { href: '/docs/changelog/', label: 'Changelog' },
  { href: '/demo-playground/frontend', label: 'UI Playground' },
  { href: '/demo-playground/backend', label: 'Admin Demo' },
  { href: '/support/', label: 'Support Consenti' },
  { href: '/sitemap/', label: 'Sitemap' },
]

const UI_LINKS = [
  { href: '/docs/ui/', label: 'Overview' },
  { href: '/docs/ui/installation/', label: 'Installation' },
  { href: '/docs/ui/profiles/', label: 'Consent Profiles' },
  { href: '/docs/ui/configuration/', label: 'Configuration' },
  { href: '/docs/ui/events/', label: 'Events' },
  { href: '/docs/ui/methods/', label: 'API Methods' },
  { href: '/docs/ui/themes/', label: 'Themes & CSS' },
  { href: '/docs/ui/frameworks/', label: 'Framework Guides' },
  { href: '/docs/ui/plugins/', label: 'UI Plugins' },
]

const API_LINKS = [
  { href: '/docs/api/', label: 'Overview' },
  { href: '/docs/api/installation/', label: 'Installation' },
  { href: '/docs/api/configuration/', label: 'Configuration' },
  { href: '/docs/api/routes/public/', label: 'Public Routes' },
  { href: '/docs/api/routes/admin/', label: 'Admin Routes' },
  { href: '/docs/api/dashboard/', label: 'Admin Dashboard' },
  { href: '/docs/api/plugins/', label: 'API Plugins' },
]

const COMPLIANCE_LINKS = [
  { href: '/docs/compliance/gdpr/', label: 'GDPR (EU / EEA)' },
  { href: '/docs/compliance/uk-gdpr/', label: 'UK GDPR' },
  { href: '/docs/compliance/ccpa/', label: 'CCPA / US States' },
  { href: '/docs/compliance/pipl/', label: 'PIPL (China)' },
  { href: '/docs/compliance/lgpd/', label: 'LGPD (Brazil)' },
  { href: '/docs/compliance/pdpa-th/', label: 'PDPA (Thailand)' },
  { href: '/docs/compliance/appi/', label: 'APPI (Japan)' },
  { href: '/docs/compliance/dpdpa/', label: 'DPDPA (India)' },
  { href: '/docs/compliance/notice-only/', label: 'Notice Only' },
]

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-slate-400 hover:text-white no-underline transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-9xl mx-auto px-6 py-14">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 lg:mr-18">
            <Link href="/" className="inline-block mb-4 no-underline">
              <Image src="/logo-dark.svg" alt="Consenti — Open-Source CMP" width={160} height={44} className="rounded-lg" unoptimized />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Self-hosted cookie consent &amp; consent management platform. Zero runtime dependencies,
              TypeScript strict, Apache 2.0. Covers GDPR, CCPA, PIPL, LGPD, and 12+ global regulations.
            </p>
            <p className="text-xs text-slate-600 mb-5">
              Works with React · Vue · Next.js · Nuxt · Angular · Svelte · plain JS
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/santoshe61/consenti"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Consenti on GitHub"
                className="text-slate-500 hover:text-white transition-colors"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://www.npmjs.com/org/consenti"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Consenti on npm"
                className="text-slate-500 hover:text-white transition-colors"
              >
                <SiNpm size={22} />
              </a>
            </div>
          </div>

          <FooterColumn title="Resources" links={DOCS_LINKS} />
          <FooterColumn title="UI Widget" links={UI_LINKS} />
          <FooterColumn title="Backend API" links={API_LINKS} />
          <FooterColumn title="Compliance" links={COMPLIANCE_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-wrap gap-3 justify-between items-center text-xs text-slate-600">
          <span>
            © {new Date().getFullYear()}{' '}
            <a href="https://santosh.top" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 no-underline transition-colors">
              Santosh Ojha
            </a>
            {' '}· Apache 2.0 License
          </span>
          <span className="text-slate-700">
            TypeScript Strict · Zero Runtime Deps · Self-hosted · Node 20+
          </span>
          <span className="text-slate-700">
            GDPR · CCPA · PIPL · LGPD · Open-Source CMP
          </span>
        </div>
      </div>
    </footer>
  )
}
