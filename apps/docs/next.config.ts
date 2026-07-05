import type { NextConfig } from 'next'
import { join } from 'node:path'

const OPTIONAL_EXTERNALS = ['samlify', 'xlsx', 'mongodb', 'mysql2', 'pg', '@node-rs/argon2']

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? ''
const algoliaConnectSrc = algoliaAppId
  ? `https://${algoliaAppId}-dsn.algolia.net https://${algoliaAppId}.algolia.net https://${algoliaAppId}.algolianet.com`
  : ''

const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''
const recaptchaScriptSrc = recaptchaKey ? ' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/' : ''
const recaptchaFrameSrc = recaptchaKey ? 'https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/' : ''

let DOCS_CSP: string | string[] = [
  "default-src 'self'",
  "style-src 'self' 'style-src-elem' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  `connect-src 'self'${algoliaConnectSrc ? ` ${algoliaConnectSrc}` : ''}`,
  `frame-ancestors 'none'`,
  "base-uri 'self'",
  "form-action 'self'",
]

if (recaptchaFrameSrc) DOCS_CSP.push(`frame-src 'self' ${recaptchaFrameSrc}`)

if (process.env.NODE_ENV === "development") DOCS_CSP.push(`script-src 'self' 'unsafe-inline' 'unsafe-eval'${recaptchaScriptSrc}`)
else DOCS_CSP.push(`script-src 'self' 'unsafe-inline'${recaptchaScriptSrc}`)

DOCS_CSP = DOCS_CSP.join('; ')

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: DOCS_CSP },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }]
  },
  async redirects() {
    return [
      { source: '/demo', destination: '/demo-playground/frontend', permanent: false },
      { source: '/demo/', destination: '/demo-playground/frontend', permanent: false },
      { source: '/demo-playground', destination: '/demo-playground/frontend', permanent: false },
      { source: '/demo-playground/', destination: '/demo-playground/frontend', permanent: false },
    ]
  },
  outputFileTracingIncludes: {
    '/consenti/[[...path]]': [join(__dirname, '..', 'api', 'dist', 'dashboard', '**', '*')],
  },
  serverExternalPackages: ['@consenti/api', ...OPTIONAL_EXTERNALS],
  webpack(config, { isServer }) {
    if (isServer) {
      const existingExternals = Array.isArray(config.externals) ? config.externals : []
      config.externals = [
        ...existingExternals,
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (!request) return callback()
          if (request === '@consenti/api' || request.includes('/apps/api/dist/')) {
            return callback(null, `commonjs ${request}`)
          }
          if (OPTIONAL_EXTERNALS.includes(request)) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        },
      ]
    }
    return config
  },
}

export default nextConfig
