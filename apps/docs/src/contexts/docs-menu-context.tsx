'use client'

import { createContext, useContext, useState } from 'react'

interface DocsMenuContextValue {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const DocsMenuContext = createContext<DocsMenuContextValue>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export function DocsMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <DocsMenuContext.Provider value={{ isOpen, toggle: () => setIsOpen((v) => !v), close: () => setIsOpen(false) }}>
      {children}
    </DocsMenuContext.Provider>
  )
}

export function useDocsMenu() {
  return useContext(DocsMenuContext)
}
