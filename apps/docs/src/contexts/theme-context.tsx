'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('docs-theme') as Theme | null
      const preferred =
        stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      setTheme(preferred)
      document.documentElement.classList.toggle('dark', preferred === 'dark')
    } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('docs-theme', theme)
    } catch {}
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
