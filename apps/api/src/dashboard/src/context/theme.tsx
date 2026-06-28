import { createContext } from 'preact'
import { useContext, useState, useEffect } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ComponentChildren }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('dashboard-theme') as Theme) ?? 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('dashboard-theme', theme)
    } catch {}
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
