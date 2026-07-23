'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Coffee, Layout, List, Map, Server, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

interface NavItem {
  href: string
  label: string
  badge?: string
  /** When set, this item renders nested inside a collapsible sub-group at this position in the list. */
  group?: { id: string; label: string }
}

interface NavSection {
  title: string
  icon?: React.ReactNode
  items: NavItem[]
}

interface ComplianceGroup {
  id: string
  label: string
  typeLabel: string
  items: NavItem[]
}

const COMPLIANCE_GROUPS: ComplianceGroup[] = [
  {
    id: 'opt-in',
    label: 'Opt-in (GDPR model)',
    typeLabel: 'opt-in',
    items: [
      { href: '/docs/compliance/gdpr/', label: 'GDPR (EU / EEA)' },
      { href: '/docs/compliance/uk-gdpr/', label: 'UK GDPR' },
      { href: '/docs/compliance/pipeda/', label: 'PIPEDA / Law 25 (Canada)' },
      { href: '/docs/compliance/popia/', label: 'POPIA (South Africa)' },
      { href: '/docs/compliance/pdpa-th/', label: 'PDPA (Thailand)' },
      { href: '/docs/compliance/appi/', label: 'APPI (Japan)' },
      { href: '/docs/compliance/kvkk/', label: 'KVKK (Turkey)' },
    ],
  },
  {
    id: 'opt-out',
    label: 'Opt-out',
    typeLabel: 'opt-out',
    items: [
      { href: '/docs/compliance/ccpa/', label: 'CCPA / US States' },
    ],
  },
  {
    id: 'opt-out-strict',
    label: 'Opt-out Strict',
    typeLabel: 'opt-out-strict',
    items: [
      { href: '/docs/compliance/cpra/', label: 'CPRA (California 2023)' },
    ],
  },
  {
    id: 'opt-in-dpdpa',
    label: 'Opt-in DPDPA (India)',
    typeLabel: 'opt-in-dpdpa',
    items: [
      { href: '/docs/compliance/dpdpa/', label: 'DPDPA (India 2023)' },
    ],
  },
  {
    id: 'opt-in-china',
    label: 'Opt-in China (PIPL)',
    typeLabel: 'opt-in-china',
    items: [
      { href: '/docs/compliance/pipl/', label: 'PIPL (China 2021)' },
    ],
  },
  {
    id: 'opt-in-brazil',
    label: 'Opt-in Brazil (LGPD)',
    typeLabel: 'opt-in-brazil',
    items: [
      { href: '/docs/compliance/lgpd/', label: 'LGPD (Brazil)' },
    ],
  },
  {
    id: 'general-privacy-consent',
    label: 'General Privacy Consent',
    typeLabel: 'general-privacy-consent',
    items: [
      { href: '/docs/compliance/coppa/', label: 'COPPA' },
      { href: '/docs/compliance/tcf/', label: 'TCF v2.2' },
    ],
  },
  {
    id: 'notice-only',
    label: 'Notice Only',
    typeLabel: 'notice-only',
    items: [
      { href: '/docs/compliance/notice-only/', label: 'Notice Only' },
    ],
  },
]

function groupForPath(pathname: string): string | null {
  for (const group of COMPLIANCE_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname === item.href.slice(0, -1)) {
        return group.id
      }
    }
  }
  return null
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
      { href: '/docs/ui/profiles/', label: 'Profile' },
      { href: '/docs/ui/configuration/', label: 'Configuration' },
      { href: '/docs/ui/events/', label: 'Events' },
      { href: '/docs/ui/methods/', label: 'API Methods' },
      { href: '/docs/ui/themes/', label: 'Themes & CSS' },
      { href: '/docs/ui/frameworks/', label: 'Frameworks' },
    ],
  },
  {
    title: 'Advanced Setup',
    items: [
      { href: '/docs/ui/advanced-profiles/', label: 'Advanced Profile' },
      { href: '/docs/ui/advanced-configuration/', label: 'Advanced Configuration' },
    ],
  },
  {
    title: 'UI Plugins',
    items: [
      { href: '/docs/ui/plugins/', label: 'Overview' },
    ],
  },
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
      { href: '/docs/api/advanced-configuration/', label: 'Advanced Configuration' },
      { href: '/docs/api/routes/', label: 'API Routes' },
      { href: '/docs/api/routes/public/', label: 'Public Routes' },
      { href: '/docs/api/routes/admin/', label: 'Admin Routes' },
      { href: '/docs/api/dashboard/', label: 'Admin Dashboard' },
    ],
  },
  {
    title: 'Backend Plugins',
    items: [
      { href: '/docs/api/plugins/', label: 'Overview' },
      { href: '/docs/api/plugins/bigquery/', label: 'BigQuery' },
      { href: '/docs/api/plugins/segment/', label: 'Segment' },
      { href: '/docs/api/plugins/snowflake/', label: 'Snowflake' },
    ],
  },
]

function navGroupForPath(nav: NavSection[], pathname: string): string | null {
  for (const section of nav) {
    for (const item of section.items) {
      if (item.group && (pathname === item.href || pathname === item.href.slice(0, -1))) {
        return item.group.id
      }
    }
  }
  return null
}

function isBackendPath(pathname: string) {
  return (
    pathname.startsWith('/docs/api')
  )
}

export function Sidebar({ onClose, isOpen }: { onClose?: () => void; isOpen?: boolean }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend'>(
    isBackendPath(pathname) ? 'backend' : 'frontend'
  )

  const activeGroupId = groupForPath(pathname)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    activeGroupId ? new Set([activeGroupId]) : new Set()
  )

  const activeNavGroupId = navGroupForPath(FRONTEND_NAV, pathname) ?? navGroupForPath(BACKEND_NAV, pathname)
  const [expandedNavGroups, setExpandedNavGroups] = useState<Set<string>>(
    activeNavGroupId ? new Set([activeNavGroupId]) : new Set()
  )

  useEffect(() => {
    setActiveTab(isBackendPath(pathname) ? 'backend' : 'frontend')
    const gid = groupForPath(pathname)
    if (gid) {
      setExpandedGroups((prev) => {
        if (prev.has(gid)) return prev
        return new Set([...prev, gid])
      })
    }
    const ngid = navGroupForPath(FRONTEND_NAV, pathname) ?? navGroupForPath(BACKEND_NAV, pathname)
    if (ngid) {
      setExpandedNavGroups((prev) => {
        if (prev.has(ngid)) return prev
        return new Set([...prev, ngid])
      })
    }
  }, [pathname])

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleNavGroup(id: string) {
    setExpandedNavGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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
            UI
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
            {section.items.map((item, idx) => {
              const active = pathname === item.href || pathname === item.href.slice(0, -1)
              const prevGroupId = section.items[idx - 1]?.group?.id
              const isGroupStart = item.group && item.group.id !== prevGroupId
              const link = item.group && !expandedNavGroups.has(item.group.id) ? null : (
                <Link
                  key={item.href}
                  href={item.href}
                  {...(onClose ? { onClick: onClose } : {})}
                  className={`nav-link mx-2 ${item.group ? 'ml-5' : ''} ${active ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
              if (!isGroupStart) return link
              const groupId = item.group!.id
              const isExpanded = expandedNavGroups.has(groupId)
              return (
                <div key={groupId} className="mx-2">
                  <button
                    onClick={() => toggleNavGroup(groupId)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] font-medium rounded-md mx-0 transition-colors text-left text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800"
                  >
                    <span className="flex-1">{item.group!.label}</span>
                    <span className="shrink-0 text-slate-400 dark:text-gray-500">
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                  </button>
                  {link}
                </div>
              )
            })}
          </div>
        ))}

        {/* Compliances — expandable groups */}
        <div>
          <div className="nav-section">Compliances</div>
          <Link
            href="/docs/compliance/jurisdiction-coverage-map/"
            {...(onClose ? { onClick: onClose } : {})}
            className={`nav-link mx-2 flex items-center gap-1.5 ${pathname === '/docs/compliance/jurisdiction-coverage-map' || pathname === '/docs/compliance/jurisdiction-coverage-map/' ? 'nav-link-active' : ''}`}
          >
            <Map size={13} className="text-brand-500 shrink-0" />
            Jurisdiction Coverage Map
          </Link>
          {COMPLIANCE_GROUPS.map((group) => {
            const isExpanded = expandedGroups.has(group.id)
            const hasActiveChild = group.items.some(
              (item) => pathname === item.href || pathname === item.href.slice(0, -1)
            )
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] font-medium rounded-md mx-0 transition-colors text-left ${hasActiveChild
                    ? 'text-brand-700 dark:text-brand-400'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <span className="flex-1">{group.label}</span>
                  <span className="shrink-0 text-slate-400 dark:text-gray-500">
                    {isExpanded
                      ? <ChevronDown size={13} />
                      : <ChevronRight size={13} />
                    }
                  </span>
                </button>
                {isExpanded && (
                  <div className="pl-3">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname === item.href.slice(0, -1)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          {...(onClose ? { onClick: onClose } : {})}
                          className={`nav-link mx-2 ${active ? 'nav-link-active' : ''}`}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 mx-3 pt-4 border-t border-slate-100">
          <Link
            href="/docs/upcoming-features/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 transition-colors no-underline"
          >
            <Sparkles size={15} /> Upcoming Features
          </Link>
          <Link
            href="/docs/changelog/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 mt-1 transition-colors no-underline"
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
          <a
            href="https://github.com/santoshe61/consenti"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <FaGithub size={15} /> GitHub
          </a>
        </div>
      </div>
    </aside>
  )
}
