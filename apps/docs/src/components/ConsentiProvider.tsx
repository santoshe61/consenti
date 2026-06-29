'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/theme-context'
import { ConsentiSetup, ConsentiPlugin, type ConsentiWidgetAPI as WidgetAPI, type ConsentValue } from "@consenti/ui"
import { setConsentiWidget } from "@consenti/ui/react"
// import '@consenti/ui/style'

interface WidgetHandle {
  destroy(): void
  bannerVisibility(): 'main' | 'gpc' | false
  modalVisibility(): 'preference' | false
}

declare global {
  interface Window {
    consentiWidget?: WidgetAPI;
  }
}

async function createWidget(dark: boolean): Promise<WidgetHandle> {

  class DemoAnalyticsPlugin extends ConsentiPlugin {
    initialize(widget: WidgetAPI): void {
      console.log(
        '[DemoPlugin] Widget ready — profile v' + (widget.getProfile()?.version ?? '?'),
        '| has consent:', widget.hasConsent(),
      )
    }
    destroy(): void { console.log('[DemoPlugin] Destroyed.') }
    onConsentSubmit(consent: ConsentValue): void {
      console.log('[DemoPlugin] Consent saved:', consent)
    }
    onBannerShow(): void { console.log('[DemoPlugin] Banner shown.') }
    onBannerHide(): void { console.log('[DemoPlugin] Banner hidden.') }
    onModalShow(): void { console.log('[DemoPlugin] Modal opened.') }
    onModalHide(): void { console.log('[DemoPlugin] Modal closed.') }
  }

  const widget = new ConsentiSetup({
    darkMode: dark,
    core: {
      regulation: 'gdpr',
      locale: 'en',
      storage: 'cookie',
      allowReceipt: true,
      // disableCssTemplate: true,
    },
    api: {
      enabled: true,
      baseUrl: '',
    },
    plugins: [new DemoAnalyticsPlugin()],
  })

  setConsentiWidget(widget as unknown as Parameters<typeof setConsentiWidget>[0])
  window.consentiWidget = widget
  return widget as unknown as WidgetHandle
}

export function ConsentiProvider() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const widgetRef = useRef<WidgetHandle | null>(null)
  const isDark = theme === 'dark'

  // Initialize widget on pathname change
  useEffect(() => {
    if (pathname === '/demo-playground/frontend') return

    let cancelled = false

    createWidget(isDark).then(w => {
      if (cancelled) { w.destroy(); return }
      widgetRef.current = w
    })

    return () => {
      cancelled = true
      widgetRef.current?.destroy()
      widgetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Re-init on theme change only if banner or modal is currently visible
  useEffect(() => {
    if (pathname === '/demo-playground/frontend') return
    const widget = widgetRef.current
    if (!widget) return
    if (!widget.bannerVisibility() && !widget.modalVisibility()) return

    widget.destroy()
    widgetRef.current = null

    createWidget(isDark).then(w => {
      widgetRef.current = w
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark])

  return null
}
