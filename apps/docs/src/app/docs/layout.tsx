'use client'

import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useDocsMenu } from '@/contexts/docs-menu-context'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, close, toggle } = useDocsMenu()

  return (
    <div className="flex flex-1 min-h-[calc(100vh-52px)]">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar — 0 width on mobile (aside is fixed), 256px on desktop */}
      <div className="w-0 lg:w-64 shrink-0">
        <Sidebar onClose={close} isOpen={isOpen} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-6 py-10 lg:px-10 max-w-4xl">
        {/* Mobile sidebar toggle — only visible below lg */}
        <button
          onClick={toggle}
          className="lg:hidden mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <Menu size={16} />
          Content Menu
        </button>
        {children}
      </main>

      {/* Right TOC placeholder */}
      <div className="hidden xl:block w-52 shrink-0" />
    </div>
  )
}
