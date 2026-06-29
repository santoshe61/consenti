import type { Metadata } from 'next'
import './globals.css'
import { ConsentiProvider } from '@/components/ConsentiProvider'
import { DocsMenuProvider } from '@/contexts/docs-menu-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SaasRequestBadge } from '@/components/SaasRequestBadge'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://consenti.dev/#software',
      name: 'Consenti',
      alternateName: ['@consenti/ui', '@consenti/api'],
      description:
        'Open-source, GDPR-compliant Cookie Consent & Consent Management Platform (CMP). Zero external runtime dependencies. Supports GDPR, CCPA, TCF v2.2, GPC, and COPPA. Works with React, Vue, Angular, Next.js, Express, and any JavaScript stack.',
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'Privacy & Consent Management',
      operatingSystem: 'Cross-platform (Browser, Node.js)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      programmingLanguage: ['TypeScript', 'JavaScript'],
      url: 'https://consenti.dev',
      sameAs: ['https://github.com/santoshe61/consenti', 'https://www.npmjs.com/org/consenti'],
      featureList: [
        'GDPR opt-in consent management',
        'CCPA opt-out consent management',
        'TCF v2.2 vendor consent',
        'GPC (Global Privacy Control) signal detection',
        'COPPA age gate',
        'Zero external runtime dependencies',
        'Built-in SQLite storage via node:sqlite',
        'Admin dashboard (Preact SPA)',
        'REST API for consent records',
        'RBAC (Role-Based Access Control)',
        'GDPR right-to-erasure endpoint',
        'Signed consent cookies via HMAC',
        'Cross-tab consent sync via BroadcastChannel',
        'Google Consent Mode v2',
        'GTM (Google Tag Manager) integration',
        'WCAG AAA accessibility',
        'React, Vue, Angular, Next.js, Nuxt framework hooks',
        'Plugin system for BigQuery, Segment, Snowflake',
        'i18n / locale support',
        'CSS custom properties theming (no Shadow DOM)',
      ],
      softwareRequirements: 'Node.js 24 LTS or newer; Browser: Chrome 80+, Firefox 74+, Safari 13.1+',
      author: { '@type': 'Person', name: 'Santosh Ojha', url: 'https://santosh.top' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://consenti.dev/#website',
      url: 'https://consenti.dev',
      name: 'Consenti Docs',
      description: 'Documentation for Consenti — open-source cookie consent & CMP.',
      publisher: { '@type': 'Person', name: 'Santosh Ojha', url: 'https://santosh.top' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Consenti?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Consenti is an open-source, GDPR-compliant Cookie Consent and Consent Management Platform (CMP). It ships as two npm packages: @consenti/ui (browser widget) and @consenti/api (Node.js backend). Both have zero external runtime dependencies.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti support GDPR?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Consenti fully supports GDPR with opt-in consent mode, legitimate interest handling (Art. 6(1)(f)), right-to-erasure endpoint, immutable audit logs, and signed consent receipts.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti support CCPA?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Consenti fully supports CCPA and CPRA with opt-out consent mode, GPC signal detection, and configurable do-not-sell/share flows.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I install Consenti?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Install the UI widget with: npm install @consenti/ui. For the backend: npm install @consenti/api. Both packages have zero external runtime dependencies.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti work with React?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Consenti provides a useConsent() React hook via the subpath export @consenti/ui/react. It also works with Next.js, Vue, Angular, Nuxt, and any JavaScript framework.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti require a backend?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. The UI widget (@consenti/ui) works standalone without any backend. The backend module (@consenti/api) is optional and only needed if you want server-side consent records, audit logs, or the admin dashboard.',
          },
        },
        {
          '@type': 'Question',
          name: 'What database does Consenti use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'By default Consenti uses SQLite via the built-in node:sqlite module (Node.js 24+) — no external database package required. It also supports MongoDB, PostgreSQL, and MySQL via the StorageAdapter interface.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Consenti free and open source?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Consenti is released under the Apache 2.0 license. It is free to use, modify, and distribute.',
          },
        },
      ],
    },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Consenti — Open Source Cookie Consent & CMP',
    template: '%s — Consenti Docs',
  },
  description:
    'Open-source GDPR-compliant cookie consent & CMP. Zero runtime dependencies. GDPR, CCPA, TCF v2.2, GPC. Works with React, Vue, Angular, Next.js, Express, and more.',
  keywords: [
    'cookie consent',
    'GDPR',
    'CMP',
    'consent management platform',
    'CCPA',
    'TCF',
    'GPC',
    'open source',
    'TypeScript',
    'zero dependencies',
    'consent banner',
    'privacy',
    'cookie banner',
    'React cookie consent',
    'Next.js GDPR',
  ],
  authors: [{ name: 'Santosh Ojha', url: 'https://santosh.top' }],
  openGraph: {
    type: 'website',
    siteName: 'Consenti Docs',
    title: 'Consenti — Open Source Cookie Consent & CMP',
    description:
      'Zero-dependency GDPR-compliant consent management platform. CCPA, TCF v2.2, GPC. Works with any JavaScript stack.',
    url: 'https://consenti.dev',
  },
  twitter: {
    card: 'summary',
    title: 'Consenti — Open Source Cookie Consent & CMP',
    description: 'Zero-dependency GDPR & CCPA consent management. Works with React, Vue, Next.js, Express, and more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://consenti.dev',
  },
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('docs-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href="https://consenti.dev" />
      </head>
      <body>
        <ThemeProvider>
          <DocsMenuProvider>
            <ConsentiProvider />
            <Navbar />
            {children}
            <Footer />
            <SaasRequestBadge />
          </DocsMenuProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
