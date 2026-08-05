import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { RelatedDocs } from '@/components/RelatedDocs'
import { ExampleNav } from '@/components/ExampleNav'

export const metadata: Metadata = {
  title: 'Example — E-commerce Storefront (GDPR + GTM)',
  description:
    'Frontend-only opt-in banner wired to Google Tag Manager and Google Consent Mode v2 for an EU storefront.',
  alternates: { canonical: '/guides/examples/ecommerce-gtm' },
  openGraph: {
    title: 'Example — E-commerce Storefront (GDPR + GTM)',
    description:
      'Frontend-only opt-in banner wired to Google Tag Manager and Google Consent Mode v2 for an EU storefront.',
    url: 'https://consenti.dev/guides/examples/ecommerce-gtm',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Example — E-commerce Storefront (GDPR + GTM)',
    description:
      'Frontend-only opt-in banner wired to Google Tag Manager and Google Consent Mode v2 for an EU storefront.',
    images: ['/og-image.jpg'],
  },
}

export default function EcommerceGtmExample() {
  return (
    <div className="prose max-w-none">
      <h1>E-commerce Storefront — GDPR Banner + GTM</h1>
      <p className="lead">
        A single-page storefront selling into the EU. No backend — consent lives entirely in a
        signed browser cookie. The banner blocks Google Ads and Analytics tags until the shopper
        opts in, using GTM&apos;s own Consent Mode v2 rather than hand-rolled script gating.
      </p>

      <h2>What this demonstrates</h2>
      <ul>
        <li>Zero-backend, opt-in (GDPR-model) setup</li>
        <li>Google Tag Manager + Consent Mode v2, so GTM triggers stay in charge of tag firing</li>
        <li>
          <code>urlPassthrough</code> + <code>adsDataRedaction</code> for cookieless ad modelling
          when a shopper declines
        </li>
        <li>Branded banner copy and buttons via <code>profileOverride</code></li>
      </ul>

      <h2>Setup</h2>
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
      profileOverride: {
        mainBanner: {
          heading: 'Your privacy, your choice',
          htmlText:
            'We use cookies to run this store and, with your permission, to measure and personalise ads.',
          buttons: {
            'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
            'reject-optional': { text: 'Reject Optional', style: 'primary', action: 'custom', cookies: '!' },
            'customize': { text: 'Manage Cookies', style: 'text', action: 'manage' },
          },
        },
      },
      utils: {
        gtm: {
          containerId: 'GTM-XXXXXX',
          urlPassthrough: true,   // preserve click IDs (gclid/fbclid) for cookieless modelling
          adsDataRedaction: true, // redact ad click IDs when ad_storage is denied
        },
      },
    })
    return () => widget.destroy()
  }, [])
  return null
}`}
      />

      <p>
        No manual <code>gtag(&apos;consent&apos;, ...)</code> calls needed — Consenti calls the real
        Consent Mode v2 API for you on init (default denied) and again on every submission, via the
        standard stub-queue pattern so it works whether your GTM snippet loads first or last.
      </p>

      <Callout type="tip">
        Add a <strong>Manage Cookies</strong> link in your footer that calls{' '}
        <code>widget.showModal()</code> so returning shoppers can change their mind without clearing
        cookies. See <code>BannerTrigger</code> in the{' '}
        <a href="/docs/ui/events/">Events reference</a> for a ready-made footer trigger.
      </Callout>

      <h2>Gate the product-recommendation pixel</h2>
      <p>
        Anything beyond GTM itself — a marketplace pixel, a chat widget — gate the same way, keyed
        to the category it belongs to:
      </p>
      <CodeBlock
        lang="ts"
        code={`import { CategoryScript } from '@consenti/ui'

new CategoryScript({
  categoryId: 'marketing',
  widget,
  src: 'https://cdn.marketplace.example.com/pixel.js',
})`}
      />

      <RelatedDocs
        items={[
          {
            href: '/guides/frontend/gtm/',
            label: 'GTM & Google Consent Mode v2',
            desc: 'Every utils.gtm option, plus the verbose dataLayer mirror',
          },
          {
            href: '/docs/compliance/gdpr/',
            label: 'GDPR (EU / EEA)',
            desc: 'What the opt-in compliance group requires and how Consenti meets it',
          },
          {
            href: '/docs/ui/profiles/',
            label: 'Profile',
            desc: 'profileOverride and the three ways to get a profile',
          },
        ]}
      />

      <ExampleNav currentSlug="ecommerce-gtm" />
    </div>
  )
}
