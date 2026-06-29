'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Coffee, Github, Heart, Layout, List, Server } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  badge?: string
}

interface NavSection {
  title: string
  icon?: React.ReactNode
  items: NavItem[]
}

const COMPLIANCE_NAV: NavSection = {
  title: 'Compliance',
  items: [
    { href: '/docs/compliance/gdpr/', label: 'GDPR (EU / EEA)' },
    { href: '/docs/compliance/uk-gdpr/', label: 'UK GDPR' },
    { href: '/docs/compliance/ccpa/', label: 'CCPA / US States' },
    { href: '/docs/compliance/cpra/', label: 'CPRA (California 2023)' },
    { href: '/docs/compliance/coppa/', label: 'COPPA' },
    { href: '/docs/compliance/lgpd/', label: 'LGPD (Brazil)' },
    { href: '/docs/compliance/pipeda/', label: 'PIPEDA / Law 25 (Canada)' },
    { href: '/docs/compliance/dpdpa/', label: 'DPDPA (India 2023)' },
    { href: '/docs/compliance/pdpa-th/', label: 'PDPA (Thailand)' },
    { href: '/docs/compliance/appi/', label: 'APPI (Japan)' },
    { href: '/docs/compliance/popia/', label: 'POPIA (South Africa)' },
    { href: '/docs/compliance/kvkk/', label: 'KVKK (Turkey)' },
    { href: '/docs/compliance/tcf/', label: 'TCF v2.2' },
  ],
}

const FRONTEND_NAV: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs/getting-started/', label: 'Introduction' },
      { href: '/docs/getting-started/quick-start/', label: 'Quick Start' },
    ],
  },
  {
    title: 'UI Widget',
    icon: <Layout size={13} className="text-brand-500" />,
    items: [
      { href: '/docs/ui/', label: 'Overview' },
      { href: '/docs/ui/installation/', label: 'Installation' },
      { href: '/docs/ui/profiles/', label: 'Profiles' },
      { href: '/docs/ui/configuration/', label: 'Configuration' },
      { href: '/docs/ui/events/', label: 'Events' },
      { href: '/docs/ui/methods/', label: 'API Methods' },
      { href: '/docs/ui/themes/', label: 'Themes & CSS' },
      { href: '/docs/ui/frameworks/', label: 'Frameworks' },
      { href: '/docs/ui/plugins/', label: 'Plugins' },
    ],
  },
  COMPLIANCE_NAV,
]

const BACKEND_NAV: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs/getting-started/', label: 'Introduction' },
      { href: '/docs/getting-started/quick-start/', label: 'Quick Start' },
    ],
  },
  {
    title: 'Backend API',
    icon: <Server size={13} className="text-emerald-600" />,
    items: [
      { href: '/docs/api/', label: 'Overview' },
      { href: '/docs/api/installation/', label: 'Installation' },
      { href: '/docs/api/configuration/', label: 'Configuration' },
      { href: '/docs/api/routes/', label: 'API Routes' },
      { href: '/docs/api/routes/public/', label: 'Public Routes' },
      { href: '/docs/api/routes/admin/', label: 'Admin Routes' },
      { href: '/docs/api/dashboard/', label: 'Admin Dashboard' },
    ],
  },
  COMPLIANCE_NAV,
  {
    title: 'Plugins',
    items: [
      { href: '/docs/plugins/', label: 'Overview' },
      { href: '/docs/plugins/bigquery/', label: 'BigQuery' },
      { href: '/docs/plugins/segment/', label: 'Segment' },
      { href: '/docs/plugins/snowflake/', label: 'Snowflake' },
    ],
  },
]

function isBackendPath(pathname: string) {
  return (
    pathname.startsWith('/docs/api') ||
    pathname.startsWith('/docs/compliance') ||
    pathname.startsWith('/docs/plugins')
  )
}

export function Sidebar({ onClose, isOpen }: { onClose?: () => void; isOpen?: boolean }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend'>(
    isBackendPath(pathname) ? 'backend' : 'frontend'
  )

  useEffect(() => {
    setActiveTab(isBackendPath(pathname) ? 'backend' : 'frontend')
  }, [pathname])

  const nav = activeTab === 'frontend' ? FRONTEND_NAV : BACKEND_NAV

  return (
    <aside className={`w-64 shrink-0 overflow-y-auto bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-800 fixed lg:sticky top-[70px] h-[calc(100vh-52px)] z-40 transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Frontend / Backend tabs */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex bg-slate-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setActiveTab('frontend')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'frontend'
              ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
              }`}
          >
            <Layout size={11} />
            Frontend
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'backend'
              ? 'bg-white dark:bg-gray-600 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
              }`}
          >
            <Server size={11} />
            Backend
          </button>
        </div>
      </div>

      <div className="py-1">
        {nav.map((section) => (
          <div key={section.title}>
            <div className="nav-section flex items-center gap-1.5">
              {section.icon}
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname === item.href.slice(0, -1)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  {...(onClose ? { onClick: onClose } : {})}
                  className={`nav-link mx-2 ${active ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        <div className="mt-6 mx-3 pt-4 border-t border-slate-100">
          <Link
            href="/docs/changelog/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 transition-colors no-underline"
          >
            <List size={15} /> Changelog
          </Link>
          <Link
            href="/support/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <Coffee size={15} /> Support Consenti
          </Link>
          <Link
            href="/author/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <Heart size={15} /> Support Author
          </Link>
          <a
            href="https://github.com/santoshe61/consenti"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <Github size={15} /> GitHub
          </a>
        </div>
      </div>
    </aside>
  )
}
