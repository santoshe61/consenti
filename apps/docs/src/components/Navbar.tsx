'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github, Home, Menu, Package, ChevronDown, Sliders, Server } from 'lucide-react'
import { SiNpm } from 'react-icons/si'
import { AskAIButton } from './AskAIButton'
import { DarkModeToggle } from './DarkModeToggle'
import { useDocsMenu } from '@/contexts/docs-menu-context'

export function Navbar() {
  const pathname = usePathname()
  const { toggle } = useDocsMenu()

  const isHomeActive = pathname === '/'
  const isDemoActive = pathname?.startsWith('/demo-playground')
  const isDocsActive = pathname?.startsWith('/docs')
  const isSupportActive = pathname === '/support'

  return (
    <header className="sticky top-0 z-50 bg-brand-600 text-white shadow-md w-full">
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={toggle}
          className="lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 relative">
          <Image src="/logo-dark.svg" alt="Consenti" width={160} height={44} className="rounded-lg" unoptimized />
          <div className="hidden sm:block absolute bottom-[-4px] right-[24px]">
            <div className="text-[10px] text-white/60 mt-0.5">Open Source CMP</div>
          </div>
        </Link>

        <div className="flex-1 hidden md:block">
          <div className="max-w-xs mx-auto relative">
            <input
              type="search"
              placeholder="Search docs…"
              className="w-full bg-white/10 text-white placeholder-white/50 text-sm px-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:bg-white/20 focus:border-white/40"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-mono">⌘K</kbd>
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
              Demo & Playground
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <Link
                href="/demo-playground/frontend"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${pathname === '/demo-playground/frontend' ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-gray-700 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
              >
                <Sliders size={16} className="shrink-0 text-brand-500 dark:text-cyan-400" />
                <div>
                  <div className="font-medium">Frontend</div>
                  <div className="text-xs text-slate-400 dark:text-gray-500">Interactive widget playground</div>
                </div>
              </Link>
              <Link
                href="/demo-playground/backend"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${pathname === '/demo-playground/backend' ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-gray-700 font-semibold' : 'text-slate-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-brand-50 dark:hover:bg-gray-700'}`}
              >
                <Server size={16} className="shrink-0 text-brand-500 dark:text-cyan-400" />
                <div>
                  <div className="font-medium">Backend</div>
                  <div className="text-xs text-slate-400 dark:text-gray-500">Admin dashboard & API docs</div>
                </div>
              </Link>
            </div>
          </div>

          <Link
            href="/support"
            className={`hidden sm:block text-sm px-3 py-1.5 rounded-md no-underline transition-colors ${isSupportActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            Support
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
            <Github size={20} />
          </a>

          <a
            href="https://www.npmjs.com/org/santoshe61"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="npm"
          >
            <SiNpm size={20} />
          </a>
        </nav>
      </div>
    </header>
  )
}
