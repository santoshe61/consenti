'use client'

import { Sidebar } from '@/components/Sidebar'
import { useDocsMenu } from '@/contexts/docs-menu-context'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useDocsMenu()

  return (
    <div className="flex flex-1 min-h-[calc(100vh-52px)]">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          z-40 lg:z-auto h-auto
          w-64 bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-800 transition-transform duration-200 shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onClose={close} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-6 py-10 lg:px-10 max-w-4xl">
        {children}
      </main>

      {/* Right TOC placeholder */}
      <div className="hidden xl:block w-52 shrink-0" />
    </div>
  )
}
