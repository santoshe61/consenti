import type { Metadata } from 'next'
import { CodeTabs } from '@/components/CodeTabs'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Framework Integrations — Frontend Guide — Consenti',
  description:
    'Complete working snippets for integrating Consenti with React, Next.js, Vue 3, Angular, and Vanilla JS.',
  alternates: { canonical: '/guides/frontend/frameworks' },
  openGraph: {
    title: 'Framework Integrations — Frontend Guide — Consenti',
    description:
      'Complete working snippets for integrating Consenti with React, Next.js, Vue 3, Angular, and Vanilla JS.',
    url: 'https://consenti.dev/guides/frontend/frameworks',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Framework Integrations — Frontend Guide — Consenti',
    description:
      'Complete working snippets for integrating Consenti with React, Next.js, Vue 3, Angular, and Vanilla JS.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendFrameworksGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Framework Integrations</h1>
      <p className="lead">
        Consenti is framework-agnostic at its core — it&apos;s a plain TypeScript class that touches
        the DOM. What changes per framework is <em>when</em> you initialise it (after mount, not
        during server render) and how you clean up on unmount. This guide gives you a complete,
        copy-paste snippet for each major framework.
      </p>

      <Callout type="info">
        All snippets assume <code>npm install @consenti/ui</code> is already done. No CSS import is
        needed — <code>ConsentiSetup</code> injects its own <code>&lt;style&gt;</code> tag at
        runtime unless you set <code>core.disableCssTemplate: true</code>.
      </Callout>

      <h2>React</h2>
      <p>
        Use <code>useEffect</code> to initialise after mount and return{' '}
        <code>widget.destroy()</code>
        as the cleanup function. This handles hot reloads and strict mode double-invocation
        correctly.
      </p>

      <CodeBlock
        lang="tsx"
        filename="components/ConsentSetup.tsx"
        code={`'use client' // remove this line outside Next.js

import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({
      compliance: { type: 'opt-in' },
      core: { locale: 'auto' },
    })
    return () => widget.destroy()
  }, [])

  return null
}`}
      />

      <h3>The useConsent hook</h3>
      <p>
        For reading consent state in components, use the bundled React hook from the{' '}
        <code>@consenti/ui/react</code> subpath. It&apos;s SSR-safe — returns <code>false</code>{' '}
        during server render.
      </p>

      <CodeBlock
        lang="tsx"
        filename="components/AnalyticsGate.tsx"
        code={`import { useConsent } from '@consenti/ui/react'

export function AnalyticsGate() {
  const { hasConsent, consent, showModal } = useConsent()

  if (!hasConsent) {
    return (
      <button onClick={showModal}>
        Enable Analytics
      </button>
    )
  }

  if (consent?.analytics === 'granted') {
    return <span>Analytics are on</span>
  }

  return <span>Analytics are off</span>
}`}
      />

      <h2>Next.js App Router</h2>
      <p>
        In Next.js App Router, the widget must run in a Client Component because it accesses the
        DOM. Create a wrapper component with <code>&apos;use client&apos;</code> and add it to your
        root layout.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'components/ConsentSetup.tsx',
            lang: 'tsx',
            code: `'use client'

import { useEffect, useRef } from 'react'
import type { ConsentiSetup as WidgetType } from '@consenti/ui'

export function ConsentSetup() {
  const widgetRef = useRef<WidgetType | null>(null)

  useEffect(() => {
    let widget: WidgetType
    import('@consenti/ui').then(({ ConsentiSetup }) => {
      widget = new ConsentiSetup({
        api: {
          enabled: true,
          baseUrl: process.env.NEXT_PUBLIC_API_URL,
        },
        core: { autoHonorGPC: true },
      })
      widgetRef.current = widget
    })
    return () => widgetRef.current?.destroy()
  }, [])

  return null
}`,
          },
          {
            label: 'app/layout.tsx',
            lang: 'tsx',
            code: `import { ConsentSetup } from '@/components/ConsentSetup'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ConsentSetup />
        {children}
      </body>
    </html>
  )
}`,
          },
        ]}
      />

      <Callout type="tip">
        The dynamic <code>import('@consenti/ui')</code> ensures the browser-only widget code is
        never evaluated during SSR, even if Next.js renders the Client Component on the server
        (which it does for the initial HTML). The <code>useEffect</code> callback only runs
        client-side.
      </Callout>

      <h2>Vue 3 / Nuxt</h2>
      <p>
        Use <code>onMounted</code> and <code>onBeforeUnmount</code>. Dynamic import inside{' '}
        <code>onMounted</code> ensures the widget is never evaluated during Nuxt SSR.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'ConsentSetup.vue',
            lang: 'vue',
            code: `<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

let widget: { destroy?: () => void } | null = null

onMounted(async () => {
  const { ConsentiSetup } = await import('@consenti/ui')
  widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })
})

onBeforeUnmount(() => widget?.destroy?.())
</script>

<template><slot /></template>`,
          },
          {
            label: 'useConsent composable',
            lang: 'typescript',
            code: `import { useConsent } from '@consenti/ui/vue'

// In any component:
const { hasConsent, consent, showModal } = useConsent()`,
          },
        ]}
      />

      <h2>Angular</h2>
      <p>
        Use the built-in Angular service from <code>@consenti/ui/angular</code>, or create your own
        service using <code>isPlatformBrowser</code> to guard the SSR boundary.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'Built-in service',
            lang: 'typescript',
            code: `import { ConsentiService } from '@consenti/ui/angular'
import { Component, inject } from '@angular/core'

@Component({ /* ... */ })
export class MyComponent {
  consent = inject(ConsentiService)

  openPreferences() {
    this.consent.showModal()
  }
}`,
          },
          {
            label: 'Custom service',
            lang: 'typescript',
            code: `import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({ providedIn: 'root' })
export class ConsentService implements OnDestroy {
  private platformId = inject(PLATFORM_ID)
  private widget: { destroy?: () => void } | null = null

  async init() {
    if (!isPlatformBrowser(this.platformId)) return
    const { ConsentiSetup } = await import('@consenti/ui')
    this.widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })
  }

  ngOnDestroy() {
    this.widget?.destroy?.()
  }
}`,
          },
        ]}
      />

      <h2>Vanilla JS</h2>
      <p>
        No framework? No problem. Import the package directly if you have a bundler, or use the
        CDN/UMD build for zero-tooling setups.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'With bundler (ESM)',
            lang: 'javascript',
            code: `import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })

document.querySelector('#cookie-settings')
  ?.addEventListener('click', () => widget.showModal())`,
          },
          {
            label: 'CDN / UMD (no bundler)',
            lang: 'html',
            code: `<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
<script>
  const { ConsentiSetup } = ConsentiUI
  const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })

  document.querySelector('#cookie-settings')
    ?.addEventListener('click', () => widget.showModal())
</script>`,
          },
        ]}
      />

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/frameworks/',
            label: 'Framework Guides',
            desc: 'Reference-level detail for React, Vue, Angular, Next.js, Nuxt',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'destroy, showModal, and every other widget instance method',
          },
          {
            href: '/docs/ui/configuration/',
            label: 'Configuration',
            desc: 'core.locale, autoHonorGPC, and other options used above',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Why do I get a hydration error in Next.js?',
            answer: (
              <p className="m-0">
                This happens when the widget renders something server-side that doesn&apos;t match
                the client. The fix is to use dynamic import inside <code>useEffect</code> (as shown
                above) so the widget never touches the DOM during SSR. Alternatively, use{' '}
                <code>next/dynamic</code> with <code>{'{ ssr: false }'}</code> to load the consent
                component only on the client.
              </p>
            ),
          },
          {
            question: 'Do I need the @consenti/ui/react subpath export?',
            answer: (
              <p className="m-0">
                Only if you want to use the <code>useConsent()</code> hook in your components. You
                can use the widget directly from <code>@consenti/ui</code> — the React subpath just
                provides a hook that reads the widget&apos;s state reactively and re-renders on
                changes.
              </p>
            ),
          },
          {
            question: 'Can I use useConsent in a React Server Component?',
            answer: (
              <p className="m-0">
                No — <code>useConsent</code> is a client-side hook. Server Components cannot use
                hooks. Mark the component that uses <code>useConsent</code> with{' '}
                <code>&apos;use client&apos;</code>. During SSR, the hook returns{' '}
                <code>{'{ hasConsent: false, consent: null }'}</code> as a safe default.
              </p>
            ),
          },
          {
            question: 'Does destroy() need to be called on every page navigation?',
            answer: (
              <p className="m-0">
                In SPAs, only call <code>widget.destroy()</code> when the component unmounts for the
                last time (e.g. app-level teardown). If you instantiate the widget once in your root
                layout, it lives for the full session and you never need to call{' '}
                <code>destroy()</code>
                between route changes.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
