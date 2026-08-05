import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { RelatedDocs } from '@/components/RelatedDocs'
import { ExampleNav } from '@/components/ExampleNav'

export const metadata: Metadata = {
  title: 'Example — Vue 3 + Pinia Integration',
  description:
    'The useConsent() composable wired into a Pinia store so any component can read consent state reactively.',
  alternates: { canonical: '/guides/examples/vue3-pinia' },
  openGraph: {
    title: 'Example — Vue 3 + Pinia Integration',
    description:
      'The useConsent() composable wired into a Pinia store so any component can read consent state reactively.',
    url: 'https://consenti.dev/guides/examples/vue3-pinia',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Example — Vue 3 + Pinia Integration',
    description:
      'The useConsent() composable wired into a Pinia store so any component can read consent state reactively.',
    images: ['/og-image.jpg'],
  },
}

export default function Vue3PiniaExample() {
  return (
    <div className="prose max-w-none">
      <h1>Vue 3 + Pinia — Composable-Driven Integration</h1>
      <p className="lead">
        A frontend-only Vue 3 app where several unrelated components need to know whether
        analytics is granted. Rather than calling <code>useConsent()</code> in every one of them,
        it&apos;s wrapped once in a Pinia store — Pinia&apos;s setup-store syntax can call
        composables directly, so this is a thin wrapper, not a reimplementation.
      </p>

      <h2>What this demonstrates</h2>
      <ul>
        <li>Registering the widget once with <code>setConsentiWidget()</code></li>
        <li>A Pinia setup store built directly on top of <code>useConsent()</code></li>
        <li>A derived, memoized getter (<code>analyticsEnabled</code>) any component can read</li>
      </ul>

      <h2>1. Create and register the widget</h2>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ConsentiSetup } from '@consenti/ui'
import { setConsentiWidget } from '@consenti/ui/vue'
import App from './App.vue'

const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })
setConsentiWidget(widget)

createApp(App).use(createPinia()).mount('#app')`}
      />
      <Callout type="info">
        Using Nuxt 3? Do this inside a <code>.client.ts</code> plugin instead of{' '}
        <code>main.ts</code> — see <code>@consenti/ui/vue</code> in the{' '}
        <a href="/docs/ui/frameworks/">Frameworks reference</a>.
      </Callout>

      <h2>2. Wrap useConsent() in a Pinia store</h2>
      <CodeBlock
        lang="ts"
        filename="stores/consent.ts"
        code={`import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useConsent } from '@consenti/ui/vue'

export const useConsentStore = defineStore('consent', () => {
  const { hasConsent, consent, isCookieGranted, showModal, grantAll, denyAll } = useConsent()

  const analyticsEnabled = computed(() => isCookieGranted('analytics'))
  const marketingEnabled = computed(() => isCookieGranted('marketing'))

  return { hasConsent, consent, analyticsEnabled, marketingEnabled, showModal, grantAll, denyAll }
})`}
      />
      <p>
        <code>hasConsent</code>, <code>consent</code>, <code>bannerVisible</code>, and{' '}
        <code>modalVisible</code> from <code>useConsent()</code> are Vue <code>Ref</code>s — Pinia
        auto-unwraps them at the store boundary, so components read them without{' '}
        <code>.value</code>.
      </p>

      <h2>3. Use it anywhere</h2>
      <CodeBlock
        lang="vue"
        filename="components/AnalyticsGate.vue"
        code={`<script setup lang="ts">
import { useConsentStore } from '@/stores/consent'
const consent = useConsentStore()
</script>

<template>
  <button v-if="!consent.analyticsEnabled" @click="consent.showModal()">
    Enable Analytics
  </button>
  <span v-else class="text-sm text-slate-400">Analytics enabled</span>
</template>`}
      />

      <RelatedDocs
        items={[
          { href: '/docs/ui/frameworks/', label: 'Frameworks', desc: 'React, Vue, Angular, and Vanilla JS integration patterns' },
          { href: '/docs/ui/methods/', label: 'API Methods', desc: 'Every widget method the composable wraps' },
          { href: '/docs/ui/events/', label: 'Events', desc: 'The raw consenti: events the composable subscribes to' },
        ]}
      />

      <ExampleNav currentSlug="vue3-pinia" />
    </div>
  )
}
