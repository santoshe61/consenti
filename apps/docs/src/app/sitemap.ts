import type { MetadataRoute } from 'next'

const BASE = 'https://consenti.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const page = (
    url: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'monthly',
  ): MetadataRoute.Sitemap[number] => ({
    url: `${BASE}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  })

  return [
    page('/', 1.0, 'weekly'),
    page('/docs/getting-started/quick-start', 0.95, 'weekly'),
    page('/docs/getting-started', 0.9, 'monthly'),

    // UI widget
    page('/docs/ui', 0.9, 'monthly'),
    page('/docs/ui/installation', 0.85, 'monthly'),
    page('/docs/ui/configuration', 0.85, 'monthly'),
    page('/docs/ui/advanced-configuration', 0.8, 'monthly'),
    page('/docs/ui/profiles', 0.8, 'monthly'),
    page('/docs/ui/advanced-profiles', 0.75, 'monthly'),
    page('/docs/ui/frameworks', 0.85, 'monthly'),
    page('/docs/ui/events', 0.75, 'monthly'),
    page('/docs/ui/methods', 0.75, 'monthly'),
    page('/docs/ui/themes', 0.75, 'monthly'),
    page('/docs/ui/plugins', 0.7, 'monthly'),

    // Backend API
    page('/docs/api', 0.9, 'monthly'),
    page('/docs/api/installation', 0.85, 'monthly'),
    page('/docs/api/configuration', 0.85, 'monthly'),
    page('/docs/api/advanced-configuration', 0.8, 'monthly'),
    page('/docs/api/dashboard', 0.8, 'monthly'),
    page('/docs/api/routes', 0.75, 'monthly'),
    page('/docs/api/routes/admin', 0.7, 'monthly'),
    page('/docs/api/routes/public', 0.7, 'monthly'),
    page('/docs/api/events', 0.7, 'monthly'),
    page('/docs/api/methods', 0.7, 'monthly'),
    page('/docs/api/plugins', 0.7, 'monthly'),
    page('/docs/api/plugins/bigquery', 0.65, 'monthly'),
    page('/docs/api/plugins/segment', 0.65, 'monthly'),
    page('/docs/api/plugins/snowflake', 0.65, 'monthly'),

    // Compliance — high priority for search traffic
    page('/docs/compliance/jurisdiction-coverage-map', 0.85, 'monthly'),
    page('/docs/compliance/gdpr', 0.9, 'monthly'),
    page('/docs/compliance/ccpa', 0.9, 'monthly'),
    page('/docs/compliance/pdpa-th', 0.88, 'monthly'),
    page('/docs/compliance/appi', 0.85, 'monthly'),
    page('/docs/compliance/uk-gdpr', 0.85, 'monthly'),
    page('/docs/compliance/lgpd', 0.82, 'monthly'),
    page('/docs/compliance/pipl', 0.82, 'monthly'),
    page('/docs/compliance/dpdpa', 0.82, 'monthly'),
    page('/docs/compliance/popia', 0.8, 'monthly'),
    page('/docs/compliance/pipeda', 0.8, 'monthly'),
    page('/docs/compliance/kvkk', 0.8, 'monthly'),
    page('/docs/compliance/cpra', 0.78, 'monthly'),
    page('/docs/compliance/tcf', 0.78, 'monthly'),
    page('/docs/compliance/coppa', 0.75, 'monthly'),
    page('/docs/compliance/notice-only', 0.7, 'monthly'),

    // Guides
    page('/guides', 0.85, 'monthly'),
    page('/guides/frontend/minimal-setup', 0.8, 'monthly'),
    page('/guides/frontend/consent-flow', 0.8, 'monthly'),
    page('/guides/frontend/auto-detection', 0.75, 'monthly'),
    page('/guides/frontend/frameworks', 0.8, 'monthly'),
    page('/guides/frontend/gtm', 0.8, 'monthly'),
    page('/guides/frontend/themes', 0.7, 'monthly'),
    page('/guides/backend/minimal-setup', 0.8, 'monthly'),
    page('/guides/backend/consent-flow', 0.8, 'monthly'),
    page('/guides/backend/geo-routing', 0.75, 'monthly'),
    page('/guides/backend/storage', 0.75, 'monthly'),
    page('/guides/backend/auth', 0.75, 'monthly'),
    page('/guides/backend/server-side-enforcement', 0.75, 'monthly'),
    page('/guides/backend/webhooks', 0.75, 'monthly'),
    page('/guides/backend/policy-engine-mapping', 0.7, 'monthly'),

    // Other
    page('/docs/changelog', 0.6, 'weekly'),
    page('/demo-playground/frontend', 0.7, 'monthly'),
    page('/support', 0.5, 'monthly'),
    page('/sitemap', 0.3, 'monthly'),
    page('/privacy', 0.3, 'yearly'),
    page('/terms', 0.3, 'yearly'),
    page('/license', 0.3, 'yearly'),
  ]
}
