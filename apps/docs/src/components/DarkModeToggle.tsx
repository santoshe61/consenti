'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export function DarkModeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex items-center w-8 h-6 rounded-full px-0.5 transition-all duration-300 ${isDark ? 'bg-gray-900 ring-2 ring-cyan-400' : 'bg-white/20 hover:bg-white/30'
        }`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${isDark ? 'translate-x-2 bg-gray-800' : 'translate-x-0 bg-white shadow'
          }`}
      >
        {isDark
          ? <Moon size={11} className="text-cyan-400" />
          : <Sun size={11} className="text-amber-500" />}
      </span>
    </button>
  )
}
