import { useState } from 'preact/hooks'
import {
  LayoutDashboard, ClipboardList, Cookie, Palette, ShieldCheck,
  Users, Key, Shield, Globe, SatelliteDish, ScrollText, Settings,
  LogOut, Plug, BarChart3,
  ChevronDown, TicketSlash, HelpCircle
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useBranding } from '../context/branding'
import { useT } from '../context/locale'
import type { TranslationKey } from '../utils/t'

interface NavItem {
  key: TranslationKey
  hash: string
  Icon: LucideIcon
  perm?: string
  superadminOnly?: boolean
}

interface NavGroup {
  type: 'group'
  key: TranslationKey
  baseHash: string
  Icon: LucideIcon
  perm?: string
  superadminOnly?: boolean
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

const NAV: NavEntry[] = [
  { key: 'nav.dashboard', hash: '#/', Icon: LayoutDashboard },
  { key: 'nav.reports', hash: '#/reports', Icon: BarChart3, perm: 'stats:view' },
  {
    type: 'group',
    key: 'nav.consentBanners',
    baseHash: '#/banners',
    Icon: TicketSlash,
    children: [
      { key: 'nav.consentTemplates', hash: '#/banners/consent-templates', Icon: Cookie },
      { key: 'nav.uiTemplates', hash: '#/banners/ui-templates', Icon: Palette },
      { key: 'nav.profiles', hash: '#/banners/profiles', Icon: ClipboardList },
    ],
  },
  { key: 'nav.consents', hash: '#/consents', Icon: ShieldCheck },
  { key: 'nav.visitors', hash: '#/visitors', Icon: Users },
  { key: 'nav.users', hash: '#/users', Icon: Key, perm: 'user:view' },
  { key: 'nav.roles', hash: '#/roles', Icon: Shield, perm: 'role:view' },
  { key: 'nav.sites', hash: '#/tenants', Icon: Globe, perm: 'settings:update', superadminOnly: true },
  { key: 'nav.vendors', hash: '#/vendors', Icon: SatelliteDish, perm: 'consent:view' },
  { key: 'nav.audit', hash: '#/audit', Icon: ScrollText, perm: 'audit:view' },
  { key: 'nav.api', hash: '#/api/config', Icon: Plug, perm: 'settings:update' },
  { key: 'nav.settings', hash: '#/settings', Icon: Settings },
  { key: 'nav.howItWorks', hash: '#/how-it-works', Icon: HelpCircle },
]

interface Props {
  current: string
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ current, collapsed, onToggle: _onToggle }: Props) {
  const { user, logout } = useAuth()
  const { appName, appLogoPath, hidePoweredBy } = useBranding()
  const t = useT()

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
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

  const isSuperadmin = user?.roles.includes('super_admin') ?? false
  const canSee = (perm?: string, superadminOnly?: boolean) =>
    (!superadminOnly || isSuperadmin) && (!perm || user?.permissions.includes(perm))

  return (
    <aside
      class={`${collapsed ? 'w-14' : 'w-56'} min-h-screen bg-gray-900 text-gray-100 flex flex-col transition-[width] duration-200 ease-in-out overflow-hidden shrink-0 border-r border-gray-700`}
      aria-label={t('nav.adminDashboard')}
    >
      <div class="px-3 py-5 border-b border-gray-700 flex items-center gap-2">
        {collapsed ? (
          <div class="w-full flex justify-center">
            {appLogoPath
              ? <img src={appLogoPath} alt={appName} class="h-7 w-7 object-contain rounded" />
              : <img src="/icon.svg" alt={appName} class="h-7 w-7" />}
          </div>
        ) : (
          <div class="min-w-0">
            {appLogoPath
              ? <img src={appLogoPath} alt={appName} class="h-7 w-auto object-contain" />
              : <img src="/logo-dark.svg" alt={appName} class="h-7 w-auto" />}
            <p class="text-xs text-gray-400 mt-0.5">{t('nav.adminDashboard')}</p>
          </div>
        )}
      </div>

      <nav class="flex-1 py-4 overflow-y-auto" aria-label={t('nav.adminDashboard')}>
        {NAV.filter(entry => canSee(entry.perm, entry.superadminOnly)).map(entry => {
          if ('type' in entry && entry.type === 'group') {
            const open = !collapsed && openGroups.has(entry.baseHash)
            const groupActive = isGroupActive(entry)
            const visibleChildren = entry.children.filter(c => canSee(c.perm))
            if (visibleChildren.length === 0) return null
            const label = t(entry.key)

            return (
              <div key={entry.baseHash}>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      window.location.hash = visibleChildren[0]!.hash
                    } else {
                      toggleGroup(entry.baseHash)
                    }
                  }}
                  aria-expanded={collapsed ? undefined : open}
                  aria-label={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                  class={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center' : 'justify-between'
                    } ${groupActive
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <div class={`flex items-center gap-3 ${collapsed ? '' : 'min-w-0'}`}>
                    <entry.Icon size={16} className="shrink-0" aria-hidden="true" />
                    {!collapsed && <span class="truncate">{label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {open && (
                  <div class="bg-gray-950/30">
                    {visibleChildren.map(child => {
                      const active = isItemActive(child.hash)
                      const childLabel = t(child.key)
                      return (
                        <a
                          key={child.hash}
                          href={child.hash}
                          aria-current={active ? 'page' : undefined}
                          class={`flex items-center gap-3 pl-8 pr-3 py-2 text-sm transition-colors ${active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                          <child.Icon size={14} className="shrink-0" aria-hidden="true" />
                          {childLabel}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const item = entry as NavItem
          const active = isItemActive(item.hash)
          const itemLabel = t(item.key)
          return (
            <a
              key={item.hash}
              href={item.hash}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? itemLabel : undefined}
              title={collapsed ? itemLabel : undefined}
              class={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center' : ''
                } ${active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <item.Icon size={16} className="shrink-0" aria-hidden="true" />
              {!collapsed && itemLabel}
            </a>
          )
        })}
      </nav>

      <div class={`px-3 py-4 border-t border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && (
          <>
            <p class="text-xs text-gray-400 truncate">
              {user?.email}
              <br />
              <i class="text-gray-500">{user?.roles}</i>
            </p>
            {!hidePoweredBy && (
              <p class="text-[10px] text-gray-600 mt-2">
                {t('layout.poweredBy')}{' '}
                <a href="https://consenti.dev/?utm_source=dashboard&utm_medium=powered-by&utm_campaign=consenti-api" target="_blank" rel="noopener noreferrer" class="hover:text-gray-400 transition-colors">
                  Consenti
                </a>
              </p>
            )}
          </>
        )}
        {collapsed && (
          <button
            onClick={logout}
            aria-label={t('layout.signOut')}
            title={t('layout.signOut')}
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  )
}
