'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Menu, X, ChevronDown, Sliders, Server, Coffee } from 'lucide-react'
import { SiNpm } from 'react-icons/si'
import { FaGithub } from 'react-icons/fa'
import { AskAIButton } from './AskAIButton'
import { DarkModeToggle } from './DarkModeToggle'
import { DocSearch } from './DocSearch'

type MenuItem = { label: string; href: string; indent?: boolean } | { label: string; header: true }

const DOCS_MENU_ITEMS: MenuItem[] = [
  { label: 'Getting Started', href: '/docs/getting-started/' },
  { label: 'Compliance Groups', href: '/docs/compliance/compliance-groups/' },
  { label: 'Jurisdiction Coverage Map', href: '/docs/compliance/jurisdiction-coverage-map/' },
  { label: 'UI Widget', header: true },
  { label: 'Overview', href: '/docs/ui/', indent: true },
  { label: 'Profile', href: '/docs/ui/profiles/', indent: true },
  { label: 'Configuration', href: '/docs/ui/configuration/', indent: true },
  { label: 'Events', href: '/docs/ui/events/', indent: true },
  { label: 'Themes & CSS', href: '/docs/ui/themes/', indent: true },
  { label: 'Frameworks', href: '/docs/ui/frameworks/', indent: true },
  { label: 'Plugins', href: '/docs/ui/plugins/', indent: true },
  { label: 'API / Backend Reference', header: true },
  { label: 'Overview', href: '/docs/api/', indent: true },
  { label: 'Configuration', href: '/docs/api/configuration/', indent: true },
  { label: 'API Routes', href: '/docs/api/routes/', indent: true },
  { label: 'Events', href: '/docs/api/events/', indent: true },
  { label: 'Admin Dashboard', href: '/docs/api/dashboard/', indent: true },
  { label: 'Plugins', href: '/docs/api/plugins/', indent: true },
  { label: 'Changelog', href: '/docs/changelog/' },
]

const GUIDES_MENU_ITEMS: MenuItem[] = [
  { label: 'Consenti, What-Why-How ?', href: '/guides/what-is-consenti/' },
  { label: 'Frontend-Only Mode', href: '/guides/frontend-only-mode/' },
  { label: 'Usage Guides', href: '/guides/' },
  { label: 'Tutorials', href: '/guides/tutorials/' },
  { label: 'Examples', href: '/guides/examples/' },
  { label: 'Ecosystem', header: true },
  { label: '@consenti/scanner', href: '/guides/ecosystem/scanner/', indent: true },
]

function NavDropdown({
  label,
  items,
  active,
  pathname,
}: {
  label: string
  items: MenuItem[]
  active: boolean
  pathname: string | null
}) {
  return (
    <div className="hidden lg:block relative group">
      <button
        className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors bg-transparent border-0 cursor-pointer ${active ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
      >
        {label}
        <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 max-h-[80vh] overflow-y-auto">
        {items.map((item) =>
          'header' in item ? (
            <div
              key={item.label}
              className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 first:pt-1.5"
            >
              {item.label}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-1.5 text-sm no-underline transition-colors ${item.indent ? 'ml-4' : ''} ${pathname === item.href || pathname === item.href.slice(0, -1) ? 'text-brand-600 dark:text-cyan-400 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const headerRowRef = useRef<HTMLDivElement>(null)
  const [headerRowHeight, setHeaderRowHeight] = useState(0)

  const isHomeActive = pathname === '/'
  const isDemoActive = pathname?.startsWith('/demo-playground')
  const isDocsActive = pathname?.startsWith('/docs')
  const isGuidesActive = pathname?.startsWith('/guides')
  const isSupportActive = pathname === '/support'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Measure the header row so the mobile menu panel can fill exactly the
  // remaining viewport height and scroll independently of the page behind it.
  useEffect(() => {
    const updateHeight = () => {
      if (headerRowRef.current) setHeaderRowHeight(headerRowRef.current.getBoundingClientRect().height)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Lock page scroll while the mobile menu is open so a scroll/swipe always
  // scrolls the menu panel, never the page behind it.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [mobileMenuOpen])

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-[#04111f]/96 border-b border-white/[0.06] text-white w-full">
      {/* Main nav row */}
      <div ref={headerRowRef} className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          className="lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 relative">
          <Image src="/logo-dark.svg" alt="Consenti" width={160} height={46} className="rounded-lg sm:w-36 md:w-40" unoptimized />
          <div className="hidden sm:block absolute bottom-[-4px] right-[24px]">
            <div className="text-[10px] text-white/60 mt-0.5">Open Source CMP</div>
          </div>
        </Link>

        <div className="flex-1 hidden md:flex justify-center">
          <div className="w-full max-w-xs">
            <DocSearch />
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/"
            className={`hidden lg:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md no-underline transition-colors ${isHomeActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Home size={15} />
            Home
          </Link>

          <NavDropdown label="Guides" items={GUIDES_MENU_ITEMS} active={isGuidesActive ?? false} pathname={pathname} />

          <NavDropdown label="Docs" items={DOCS_MENU_ITEMS} active={isDocsActive ?? false} pathname={pathname} />


          {/* Demo & Playground dropdown */}
          <div className="hidden lg:block relative group">
            <button
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors bg-transparent border-0 cursor-pointer ${isDemoActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              Playground
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <Link
                href="/demo-playground/frontend"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${pathname === '/demo-playground/frontend' ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-gray-700 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
              >
                <Sliders size={16} className="shrink-0 text-brand-500 dark:text-cyan-400" />
                <div>
                  <div className="font-medium">Frontend Demo</div>
                  <div className="text-xs text-slate-400 dark:text-gray-500">Interactive widget playground</div>
                </div>
              </Link>
              <Link
                href="/demo-playground/backend"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${pathname === '/demo-playground/backend' ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-gray-700 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
              >
                <Server size={16} className="shrink-0 text-brand-500 dark:text-cyan-400" />
                <div>
                  <div className="font-medium">Backend Demo</div>
                  <div className="text-xs text-slate-400 dark:text-gray-500">Admin dashboard & API docs</div>
                </div>
              </Link>
            </div>
          </div>

          <Link
            href="/support"
            className={`hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md no-underline transition-colors ${isSupportActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Coffee size={15} className='hidden lg:block' />
            <Coffee size={24} className='block lg:hidden' />
            <span className='hidden lg:flex'>Support</span>
          </Link>

          <AskAIButton />

          <DarkModeToggle />

          <a
            href="https://github.com/santoshe61/consenti"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="GitHub"
          >
            <FaGithub size={20} />
          </a>

          <a
            href="https://www.npmjs.com/org/consenti"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="npm"
          >
            <SiNpm size={20} />
          </a>
        </nav>
      </div>

      {/* Mobile menu panel — fixed and bounded to the remaining viewport height so it
          scrolls independently of the page behind it, instead of the page scrolling first. */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 z-40 overflow-y-auto overscroll-contain border-t border-white/[0.06] bg-[#020c1a]"
          style={{ top: headerRowHeight, height: `calc(100vh - ${headerRowHeight}px)` }}
        >
          <nav className="px-2 py-2 flex flex-col gap-0.5">
            <Link
              href="/"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md no-underline transition-colors ${isHomeActive ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <Home size={15} /> Home
            </Link>
            <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wide">Guides</div>
            {GUIDES_MENU_ITEMS.map((item) =>
              'header' in item ? (
                <div key={item.label} className="px-3 pt-2 pb-0.5 pl-5 text-[10px] font-semibold text-white/30 uppercase tracking-wide">
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md no-underline transition-colors ${item.indent ? 'pl-8' : 'pl-5'} ${pathname === item.href || pathname === item.href.slice(0, -1) ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  {item.label}
                </Link>
              )
            )}

            <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wide">Documentation</div>
            {DOCS_MENU_ITEMS.map((item) =>
              'header' in item ? (
                <div key={item.label} className="px-3 pt-2 pb-0.5 pl-5 text-[10px] font-semibold text-white/30 uppercase tracking-wide">
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-2 text-sm px-3 py-2 pl-5 rounded-md no-underline transition-colors ${pathname === item.href || pathname === item.href.slice(0, -1) ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  {item.label}
                </Link>
              )
            )}

            <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wide">Demo & Playground</div>
            <Link
              href="/demo-playground/frontend"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 pl-5 rounded-md no-underline transition-colors ${pathname === '/demo-playground/frontend' ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <Sliders size={14} /> Frontend Demo
            </Link>
            <Link
              href="/demo-playground/backend"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 pl-5 rounded-md no-underline transition-colors ${pathname === '/demo-playground/backend' ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <Server size={14} /> Backend Demo
            </Link>

            <Link
              href="/support"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md no-underline transition-colors ${pathname === '/support' ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <Coffee size={15} /> Support
            </Link>

          </nav>
        </div>
      )}
    </header>
  )
}
