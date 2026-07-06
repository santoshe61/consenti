import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import '@docsearch/css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600'],
})
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
      softwareRequirements: 'Node.js 20+; Browser: Chrome 80+, Firefox 74+, Safari 13.1+',
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
            text: 'Install the UI widget with: npm install @consenti/ui. Then import and initialise: import { ConsentiSetup } from \'@consenti/ui\'; new ConsentiSetup({ compliance: { type: \'opt-in\' } }). No CSS import needed — styles are injected automatically. For the backend: npm install @consenti/api. Both packages have zero external runtime dependencies.',
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
            text: 'Yes. Consenti is released under the Apache 2.0 license. It is free to use, modify, and distribute. It is a self-hosted alternative to commercial CMPs like OneTrust and Cookiebot.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti support PDPA (Thailand)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Consenti fully supports the Thai Personal Data Protection Act (PDPA). Configure it with compliance: { type: \'pdpa-th\' } or use type: \'auto\' to detect Thai visitors automatically and apply PDPA opt-in consent requirements. The consent banner, preference modal, and audit logs all meet PDPA requirements.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti support APPI (Japan)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Consenti supports Japan\'s Act on the Protection of Personal Information (APPI). Use compliance: { type: \'appi\' } or type: \'auto\' for geo-based detection. Consenti handles APPI opt-in consent with proper audit trails.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is an open source CMP?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An open-source Consent Management Platform (CMP) is a tool that manages cookie consent and privacy compliance, where the source code is publicly available for inspection, modification, and self-hosting. Consenti is an open-source CMP licensed under Apache 2.0, offering the same features as commercial CMPs (GDPR, CCPA, TCF v2.2, admin dashboard, consent records) without licensing fees or vendor lock-in.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Consenti work without importing CSS?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The @consenti/ui widget automatically injects its styles into the page when ConsentiSetup initialises — no separate CSS import is required. You only need to import the CSS explicitly if you want to preload it to avoid flash of unstyled content, or if you set core.disableCssTemplate: true to provide your own styles.',
          },
        },
      ],
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://consenti.dev'),
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
    'open source CMP',
    'CCPA',
    'TCF',
    'GPC',
    'PDPA Thailand',
    'PDPA compliance',
    'APPI compliance Japan',
    'LGPD Brazil',
    'PIPL China',
    'DPDPA India',
    'POPIA South Africa',
    'KVKK Turkey',
    'open source',
    'TypeScript',
    'zero dependencies',
    'consent banner',
    'privacy',
    'cookie banner',
    'React cookie consent',
    'Next.js GDPR',
    'self-hosted consent management',
    'OneTrust alternative',
    'Cookiebot alternative',
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
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
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
        <link rel="alternate" type="text/plain" title="Consenti Documentation for AI / LLMs" href="https://consenti.dev/llms-full.txt" />
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
