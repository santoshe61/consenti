import { Moon, Sun } from 'lucide-react'
import type { FunctionComponent } from 'preact'
import { useTheme } from '../context/theme'

interface IconProps { size?: number; className?: string }

const MoonIcon = Moon as unknown as FunctionComponent<IconProps>
const SunIcon = Sun as unknown as FunctionComponent<IconProps>

interface Props {
  collapsed?: boolean
}

export function DarkModeToggle({ collapsed }: Props) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
      >
        {isDark
          ? <MoonIcon size={16} className="text-cyan-400" />
          : <SunIcon size={16} className="text-gray-400" />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      class={`relative flex items-center w-12 h-6 rounded-full px-0.5 transition-all duration-300 ${
        isDark ? 'bg-gray-900 ring-2 ring-cyan-400' : 'bg-gray-600'
      }`}
    >
      <span
        class={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
          isDark ? 'translate-x-6 bg-gray-800' : 'translate-x-0 bg-white shadow'
        }`}
      >
        {isDark
          ? <MoonIcon size={11} className="text-cyan-400" />
          : <SunIcon size={11} className="text-amber-500" />}
      </span>
    </button>
  )
}
