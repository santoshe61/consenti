import { useState } from 'preact/hooks'
import {
  LayoutDashboard, ClipboardList, Cookie, Palette, ShieldCheck,
  Users, Key, Shield, Globe, SatelliteDish, ScrollText, Settings,
  LogOut, Plug, SlidersHorizontal, BookOpen,
  ChevronDown, TicketSlash
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/auth'

interface NavItem {
  label: string
  hash: string
  Icon: LucideIcon
  perm?: string
}

interface NavGroup {
  type: 'group'
  label: string
  baseHash: string
  Icon: LucideIcon
  perm?: string
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

const NAV: NavEntry[] = [
  { label: 'Dashboard', hash: '#/', Icon: LayoutDashboard },
  {
    type: 'group',
    label: 'Consent Banners',
    baseHash: '#/banners',
    Icon: TicketSlash,
    children: [
      { label: 'Cookie Templates', hash: '#/banners/cookie-templates', Icon: Cookie },
      { label: 'UI Templates', hash: '#/banners/ui-templates', Icon: Palette },
      { label: 'Profiles', hash: '#/banners/profiles', Icon: ClipboardList },
    ],
  },
  { label: 'Consents', hash: '#/consents', Icon: ShieldCheck },
  { label: 'Visitors', hash: '#/visitors', Icon: Users },
  { label: 'Users', hash: '#/users', Icon: Key, perm: 'user:view' },
  { label: 'Roles', hash: '#/roles', Icon: Shield, perm: 'role:view' },
  { label: 'Sites', hash: '#/tenants', Icon: Globe, perm: 'settings:update' },
  { label: 'TCF Vendors', hash: '#/vendors', Icon: SatelliteDish, perm: 'consent:view' },
  { label: 'Audit Log', hash: '#/audit', Icon: ScrollText, perm: 'audit:view' },
  {
    type: 'group',
    label: 'API',
    baseHash: '#/api',
    Icon: Plug,
    children: [
      { label: 'Config', hash: '#/api/config', Icon: SlidersHorizontal },
      { label: 'Endpoint Docs', hash: '#/api/docs', Icon: BookOpen },
    ],
  },
  { label: 'Settings', hash: '#/settings', Icon: Settings },
]

interface Props {
  current: string
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ current, collapsed, onToggle }: Props) {
  const { user, logout } = useAuth()
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // auto-expand group if current page is inside it
    const initial = new Set<string>()
    for (const entry of NAV) {
      if ('type' in entry && entry.type === 'group') {
        if (current.startsWith(entry.baseHash)) initial.add(entry.baseHash)
      }
    }
    return initial
  })

  const toggleGroup = (baseHash: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(baseHash)) next.delete(baseHash)
      else next.add(baseHash)
      return next
    })
  }

  const isItemActive = (hash: string) =>
    current === hash || (hash !== '#/' && current.startsWith(hash))

  const isGroupActive = (entry: NavGroup) =>
    current.startsWith(entry.baseHash)

  const canSee = (perm?: string) => !perm || user?.permissions.includes(perm)

  return (
    <aside
      class={`${collapsed ? 'w-14' : 'w-56'} min-h-screen bg-gray-900 text-gray-100 flex flex-col transition-[width] duration-200 ease-in-out overflow-hidden shrink-0 border-r border-gray-700`}
    >
      <div class="px-3 py-5 border-b border-gray-700 flex items-center gap-2">
        {collapsed ? (
          <div class="w-full flex justify-center">
            <img src="/icon.svg" alt="Consenti" class="h-7 w-7" />
          </div>
        ) : (
          <div class="min-w-0">
            <img src="/logo-dark.svg" alt="Consenti" class="h-7 w-auto" />
            <p class="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
          </div>
        )}
      </div>

      <nav class="flex-1 py-4 overflow-y-auto">
        {NAV.filter(entry => canSee(entry.perm)).map(entry => {
          if ('type' in entry && entry.type === 'group') {
            const open = !collapsed && openGroups.has(entry.baseHash)
            const groupActive = isGroupActive(entry)
            const visibleChildren = entry.children.filter(c => canSee(c.perm))
            if (visibleChildren.length === 0) return null

            return (
              <div key={entry.baseHash}>
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      window.location.hash = visibleChildren[0]!.hash
                    } else {
                      toggleGroup(entry.baseHash)
                    }
                  }}
                  title={collapsed ? entry.label : undefined}
                  class={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center' : 'justify-between'
                    } ${groupActive
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <div class={`flex items-center gap-3 ${collapsed ? '' : 'min-w-0'}`}>
                    <entry.Icon size={16} className="shrink-0" />
                    {!collapsed && <span class="truncate">{entry.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Children */}
                {open && (
                  <div class="bg-gray-950/30">
                    {visibleChildren.map(child => {
                      const active = isItemActive(child.hash)
                      return (
                        <a
                          key={child.hash}
                          href={child.hash}
                          class={`flex items-center gap-3 pl-8 pr-3 py-2 text-sm transition-colors ${active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                          <child.Icon size={14} className="shrink-0" />
                          {child.label}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Flat item
          const item = entry as NavItem
          const active = isItemActive(item.hash)
          return (
            <a
              key={item.hash}
              href={item.hash}
              title={collapsed ? item.label : undefined}
              class={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center' : ''
                } ${active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <item.Icon size={16} className="shrink-0" />
              {!collapsed && item.label}
            </a>
          )
        })}
      </nav>

      <div class={`px-3 py-4 border-t border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && (
          <>
            <p class="text-xs text-gray-400 truncate">{user?.email}</p>
          </>
        )}
        {collapsed && (
          <button
            onClick={logout}
            title="Sign out"
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}
