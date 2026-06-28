import { useState } from 'preact/hooks'
import type { ComponentChildren, FunctionComponent } from 'preact'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { DarkModeToggle } from './DarkModeToggle'
import { useAuth } from '../context/auth'

interface IconProps { size?: number; className?: string }
const LogOutIcon = LogOut as unknown as FunctionComponent<IconProps>
const ChevronRightIcon = ChevronRight as unknown as FunctionComponent<IconProps>
const ChevronLeftIcon = ChevronLeft as unknown as FunctionComponent<IconProps>

interface Props {
  children: ComponentChildren
  title?: string
  current: string
}

export function Layout({ children, title, current }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = () => setCollapsed(c => !c)
  const { logout } = useAuth()

  return (
    <div class="flex min-h-screen dark:bg-gray-900">
      <div class="relative shrink-0">
        <Sidebar current={current} collapsed={collapsed} onToggle={toggle} />
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          class="absolute top-5 -right-3.5 z-20 w-7 h-7 flex items-center justify-center bg-gray-800 border border-gray-600 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 shadow-md transition-colors"
        >
          {collapsed ? <ChevronRightIcon size={13} /> : <ChevronLeftIcon size={13} />}
        </button>
      </div>
      <main class="flex-1 overflow-auto min-w-0">
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between min-h-[56px]">
          {title
            ? <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
            : <span />}
          <div class="flex items-center gap-3">
            <DarkModeToggle />
            <button
              onClick={logout}
              title="Sign out"
              class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <LogOutIcon size={14} />
              Sign out
            </button>
          </div>
        </div>
        <div class="p-6">{children}</div>
      </main>
    </div>
  )
}
