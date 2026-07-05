'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Menu, X, Package, ChevronDown, Sliders, Server, Coffee, Heart } from 'lucide-react'
import { SiNpm } from 'react-icons/si'
import { FaGithub } from 'react-icons/fa'
import { AskAIButton } from './AskAIButton'
import { DarkModeToggle } from './DarkModeToggle'
import { DocSearch } from './DocSearch'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHomeActive = pathname === '/'
  const isDemoActive = pathname?.startsWith('/demo-playground')
  const isDocsActive = pathname?.startsWith('/docs')
  const isSupportActive = pathname === '/support' || pathname === '/author'

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

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-brand-600 text-white shadow-md w-full">
      {/* Main nav row */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          className="lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 relative">
          <Image src="/logo-dark.svg" alt="Consenti" width={160} height={44} className="rounded-lg" unoptimized />
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
            className={`hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md no-underline transition-colors ${isHomeActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Home size={15} />
            Home
          </Link>

          <Link
            href="/docs/getting-started/"
            className={`hidden sm:block text-sm px-3 py-1.5 rounded-md no-underline transition-colors ${isDocsActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            Docs
          </Link>

          {/* Demo & Playground dropdown */}
          <div className="hidden sm:block relative group">
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

          {/* Support dropdown (desktop) */}
          <div className="hidden sm:block relative group">
            <button
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors bg-transparent border-0 cursor-pointer ${isSupportActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              Support
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <Link
                href="/support"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${pathname === '/support' ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-gray-700 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
              >
                <Coffee size={15} />
                Support Consenti
              </Link>
              <Link
                href="/author"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${pathname === '/author' ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-gray-700 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
              >
                <Heart size={15} />
                Support Author
              </Link>
            </div>
          </div>

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
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="npm"
          >
            <SiNpm size={20} />
          </a>
        </nav>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-brand-700">
          <nav className="px-2 py-2 flex flex-col gap-0.5">
            <Link
              href="/"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md no-underline transition-colors ${isHomeActive ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <Home size={15} /> Home
            </Link>
            <Link
              href="/docs/getting-started/"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md no-underline transition-colors ${isDocsActive ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              Docs
            </Link>

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

            <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wide">Support</div>
            <Link
              href="/support"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 pl-5 rounded-md no-underline transition-colors ${pathname === '/support' ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              Support Consenti
            </Link>
            <Link
              href="/author"
              onClick={closeMobile}
              className={`flex items-center gap-2 text-sm px-3 py-2 pl-5 rounded-md no-underline transition-colors ${pathname === '/author' ? 'text-white bg-white/15' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              Support Author
            </Link>

          </nav>
        </div>
      )}
    </header>
  )
}
