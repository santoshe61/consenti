'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, Server, Coffee, List, GraduationCap, CircleQuestionMark, Sparkles, Flame, MessageSquare, Zap, Radar } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

interface NavItem {
  href: string
  label: string
}

interface NavSection {
  title: string
  icon?: React.ReactNode
  items: NavItem[]
}

const FRONTEND_GUIDES_NAV: NavSection[] = [
  {
    title: 'UI (Widget)',
    icon: <Layout size={13} className="text-brand-500" />,
    items: [
      { href: '/guides/frontend/minimal-setup/', label: 'Minimal Setup' },
      { href: '/guides/frontend/consent-flow/', label: 'How Consent Flow Works' },
      { href: '/guides/frontend/auto-detection/', label: 'How Auto-Detection Works' },
      { href: '/guides/frontend/frameworks/', label: 'Framework Integrations' },
      { href: '/guides/frontend/gtm/', label: 'GTM & Google Consent Mode v2' },
      { href: '/guides/frontend/adobe/', label: 'Adobe Analytics & Experience Platform' },
      { href: '/guides/frontend/meta/', label: 'Meta Pixel & Conversions API' },
      { href: '/guides/frontend/clarity/', label: 'Microsoft Clarity' },
      { href: '/guides/frontend/segment/', label: 'Twilio Segment' },
      { href: '/guides/frontend/hotjar/', label: 'Hotjar & Others' },
      { href: '/guides/frontend/themes/', label: 'Custom Themes & Dark Mode' },
    ],
  },
]

const BACKEND_GUIDES_NAV: NavSection[] = [
  {
    title: 'Backend (API)',
    icon: <Server size={13} className="text-emerald-600" />,
    items: [
      { href: '/guides/backend/minimal-setup/', label: 'Minimal Setup' },
      { href: '/guides/backend/consent-flow/', label: 'How Consent Flow Works' },
      { href: '/guides/backend/geo-routing/', label: 'Geo-Routing & Auto-Detection' },
      { href: '/guides/backend/storage/', label: 'Choosing a Storage Driver' },
      { href: '/guides/backend/auth/', label: 'Auth Modes' },
      { href: '/guides/backend/server-side-enforcement/', label: 'Server-Side Enforcement' },
      { href: '/guides/backend/webhooks/', label: 'Webhook Integration' },
      { href: '/guides/backend/policy-engine-mapping/', label: 'Policy & Rules Engine Mapping' },
    ],
  },
]

const HOT_TOPICS_NAV: NavSection[] = [
  {
    title: 'Hot Topics',
    icon: <Flame size={13} className="text-orange-500" />,
    items: [
      { href: '/guides/hot-topics/google-consent-mode-v2-explained/', label: 'Google Consent Mode v2 Explained' },
      { href: '/guides/hot-topics/gdpr-vs-dpdpa/', label: 'GDPR vs DPDPA' },
      { href: '/guides/hot-topics/dpdpa-cookie-compliance-guide/', label: 'DPDPA Cookie Compliance Guide' },
      { href: '/guides/hot-topics/cpra-implementation-guide/', label: 'CPRA Implementation Guide' },
      { href: '/guides/hot-topics/right-to-erasure/', label: 'Right to Erasure ("Right to Be Forgotten")' },
      { href: '/guides/hot-topics/google-consent-mode-for-gtm/', label: 'Google Consent Mode for GTM' },
      { href: '/guides/hot-topics/self-hosting-a-cmp/', label: 'Self-hosting a CMP' },
      { href: '/guides/hot-topics/open-source-alternatives-to-onetrust/', label: 'Open-source alternatives to OneTrust' },
      { href: '/guides/hot-topics/open-source-alternatives-to-cookiebot/', label: 'Open-source alternatives to Cookiebot' },
    ],
  },
]

const ECOSYSTEM_GUIDES_NAV: NavSection[] = [
  {
    title: 'Ecosystem',
    icon: <Radar size={13} className="text-purple-500" />,
    items: [
      { href: '/guides/ecosystem/scanner/', label: '@consenti/scanner' },
    ],
  },
]

export function GuidesSidebar({ onClose, isOpen }: { onClose?: () => void; isOpen?: boolean }) {
  const pathname = usePathname()
  const nav = [...FRONTEND_GUIDES_NAV, ...BACKEND_GUIDES_NAV, ...HOT_TOPICS_NAV, ...ECOSYSTEM_GUIDES_NAV]

  return (
    <aside className={`w-64 shrink-0 overflow-y-auto bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-800 fixed lg:sticky top-[70px] h-[calc(100vh-52px)] z-40 transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="py-3">
        <div>
          <div className="nav-section">Learn</div>
          <Link
            href="/guides/what-is-consenti/"
            {...(onClose ? { onClick: onClose } : {})}
            className={`nav-link mx-2 flex items-center gap-1.5 ${pathname.startsWith('/guides/what-is-consenti') ? 'nav-link-active' : ''}`}
          >
            <CircleQuestionMark size={13} className="text-brand-500 shrink-0" />
            Consenti, What-Why-How ?
          </Link>
          <Link
            href="/guides/frontend-only-mode/"
            {...(onClose ? { onClick: onClose } : {})}
            className={`nav-link mx-2 flex items-center gap-1.5 ${pathname.startsWith('/guides/frontend-only-mode') ? 'nav-link-active' : ''}`}
          >
            <Zap size={13} className="text-brand-500 shrink-0" />
            Frontend-Only Mode
          </Link>
          <Link
            href="/guides/tutorials/"
            {...(onClose ? { onClick: onClose } : {})}
            className={`nav-link mx-2 flex items-center gap-1.5 ${pathname.startsWith('/guides/tutorials') ? 'nav-link-active' : ''}`}
          >
            <GraduationCap size={13} className="text-brand-500 shrink-0" />
            Tutorials
          </Link>
          <Link
            href="/guides/examples/"
            {...(onClose ? { onClick: onClose } : {})}
            className={`nav-link mx-2 flex items-center gap-1.5 ${pathname.startsWith('/guides/examples') ? 'nav-link-active' : ''}`}
          >
            <Sparkles size={13} className="text-brand-500 shrink-0" />
            Examples
          </Link>
        </div>

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
                </Link>
              )
            })}
          </div>
        ))}

        <div className="mt-6 mx-3 pt-4 border-t border-slate-100 dark:border-gray-800">
          <Link
            href="/docs/changelog/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-100 px-1 py-1 transition-colors no-underline"
          >
            <List size={15} /> Changelog
          </Link>
          <Link
            href="/support/"
            {...(onClose ? { onClick: onClose } : {})}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-100 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <Coffee size={15} /> Support Consenti
          </Link>
          <a
            href="https://github.com/santoshe61/consenti"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-100 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <FaGithub size={15} /> GitHub
          </a>
          <a
            href="https://github.com/santoshe61/consenti/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-100 px-1 py-1 mt-1 transition-colors no-underline"
          >
            <MessageSquare size={15} /> GitHub Discussions
          </a>
        </div>
      </div>
    </aside>
  )
}
