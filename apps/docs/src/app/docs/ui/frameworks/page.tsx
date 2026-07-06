import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Framework Guides' }

export default function UIFrameworksPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Framework Guides</h1>

      <h2>React</h2>
      <Terminal code="npm install @consenti/ui" />
      <CodeBlock lang="tsx" filename="ConsentSetup.tsx" code={`'use client'  // Next.js App Router

import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({
      core: { regulation: 'gdpr', locale: 'en' },
    })
    return () => widget.destroy()
  }, [])

  return null
}`} />

      <h3>useConsent hook</h3>
      <CodeBlock lang="tsx" code={`import { useConsent } from '@consenti/ui/react'

export function AnalyticsButton() {
  const { hasConsent, consent, showModal } = useConsent()

  if (!hasConsent) {
    return <button onClick={showModal}>Enable Analytics</button>
  }

  const analyticsGranted = consent?.analytics === 'granted'
  return <span>{analyticsGranted ? 'Analytics on' : 'Analytics off'}</span>
}`} />

      <h2>Next.js App Router</h2>
      <Callout type="info">
        The widget accesses <code>document</code>, <code>window</code>, and <code>navigator</code>.
        Always initialise it in a <code>'use client'</code> component.
      </Callout>
      <CodeBlock lang="tsx" filename="app/layout.tsx" code={`import { ConsentSetup } from '@/components/ConsentSetup'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConsentSetup />   {/* 'use client' component */}
        {children}
      </body>
    </html>
  )
}`} />

      <CodeBlock lang="tsx" filename="components/ConsentSetup.tsx" code={`'use client'

import { useEffect, useRef } from 'react'
import type { ConsentiSetup as WidgetType } from '@consenti/ui'

export function ConsentSetup() {
  const widgetRef = useRef<WidgetType | null>(null)

  useEffect(() => {
    let widget: WidgetType
    import('@consenti/ui').then(({ ConsentiSetup }) => {
      widget = new ConsentiSetup({
        core: { regulation: 'gdpr', locale: 'en', autoHonorGPC: true },
        api: { enabled: true, baseUrl: process.env.NEXT_PUBLIC_API_URL },
      })
      widgetRef.current = widget
    })
    return () => widgetRef.current?.destroy()
  }, [])

  return null
}`} />

      <h2>Vue 3 / Nuxt</h2>
      <CodeBlock lang="ts" filename="composables/useConsenti.ts" code={`// For Nuxt: wrap in process.client check
import { onMounted, onUnmounted } from 'vue'
import { useConsent } from '@consenti/ui/vue'

export { useConsent }

// Usage in component:
// const { hasConsent, consent, showModal } = useConsent()`} />

      <CodeBlock lang="vue" filename="app.vue" code={`<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

let widget: Awaited<typeof import('@consenti/ui')>['ConsentiSetup'] | null = null

onMounted(async () => {
  const { ConsentiSetup } = await import('@consenti/ui')
  widget = new ConsentiSetup({ core: { regulation: 'gdpr' } })
})

onBeforeUnmount(() => widget?.destroy())
</script>

<template>
  <NuxtPage />
</template>`} />

      <h2>Angular</h2>
      <CodeBlock lang="ts" filename="consent.service.ts" code={`import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({ providedIn: 'root' })
export class ConsentService implements OnDestroy {
  private platformId = inject(PLATFORM_ID)
  private widget: unknown = null

  async init(config = {}) {
    if (!isPlatformBrowser(this.platformId)) return
    const { ConsentiSetup } = await import('@consenti/ui')
    this.widget = new ConsentiSetup({ core: { regulation: 'gdpr' }, ...config })
  }

  ngOnDestroy() {
    (this.widget as { destroy?: () => void })?.destroy?.()
  }
}`} />

      <CodeBlock lang="ts" filename="app.component.ts" code={`import { Component, OnInit } from '@angular/core'
import { ConsentService } from './consent.service'

@Component({
  selector: 'app-root',
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  constructor(private consent: ConsentService) {}

  ngOnInit() {
    this.consent.init()
  }
}`} />

      <h2>Angular — useConsent service</h2>
      <CodeBlock lang="ts" code={`import { ConsentiService } from '@consenti/ui/angular'

@Component({ ... })
export class MyComponent {
  consent = inject(ConsentiService)

  // consent.hasConsent()
  // consent.showModal()
  // consent.getConsent()
}`} />

      <h2>Vanilla JS</h2>
      <CodeBlock lang="js" filename="main.js" code={`import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({
  core: { regulation: 'gdpr', locale: 'en' },
})

// Open preference modal from a footer link
document.querySelector('#cookie-settings')?.addEventListener('click', () => {
  widget.showModal()
})`} />
    </div>
  )
}
