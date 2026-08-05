export interface ExampleMeta {
  slug: string
  title: string
  desc: string
  tags: string[]
}

export const EXAMPLES: ExampleMeta[] = [
  {
    slug: 'ecommerce-gtm',
    title: 'E-commerce Storefront — GDPR Banner + GTM',
    desc: 'Frontend-only opt-in banner wired to Google Tag Manager and Google Consent Mode v2 for an EU storefront.',
    tags: ['Frontend only', 'GDPR', 'GTM'],
  },
  {
    slug: 'saas-sso-admin',
    title: 'SaaS Dashboard — Backend + SSO Admin',
    desc: 'Backend deployment with Auth0 OIDC admin login, node:sqlite storage, and server-recorded consent.',
    tags: ['Frontend + Backend', 'OIDC / SSO', 'Node.js'],
  },
  {
    slug: 'nextjs-app-router',
    title: 'Next.js App Router — Full-Stack Integration',
    desc: 'Widget mounted as a Client Component in the root layout; backend mounted on a Route Handler.',
    tags: ['Next.js', 'Frontend + Backend'],
  },
  {
    slug: 'multi-region-gdpr-ccpa',
    title: 'Multi-Region Site — GDPR + CCPA Geo-Routing',
    desc: 'One backend serving both an opt-in EU profile and an opt-out US/CCPA profile, resolved per visitor.',
    tags: ['Frontend + Backend', 'GDPR', 'CCPA', 'Geo-Routing'],
  },
  {
    slug: 'vue3-pinia',
    title: 'Vue 3 + Pinia — Composable-Driven Integration',
    desc: 'The useConsent() composable wired into a Pinia store so any component reads consent reactively.',
    tags: ['Frontend only', 'Vue 3', 'Pinia'],
  },
]
