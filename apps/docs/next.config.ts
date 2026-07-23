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
  "style-src 'self' 'unsafe-inline'",
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

// CSP for /consenti/* routes — the API package serves Swagger UI from unpkg.com
const CONSENTI_CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://unpkg.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com",
].join('; ')

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
    return [
      { source: '/(.*)', headers: SECURITY_HEADERS },
      // Override CSP for the API package routes — Swagger UI loads from unpkg.com
      {
        source: '/consenti/(.*)',
        headers: [{ key: 'Content-Security-Policy', value: CONSENTI_CSP }],
      },
    ]
  },
  async redirects() {
    return [
      // Canonicalise: www → non-www (covers both http+www and https+www)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.consenti.dev' }],
        destination: 'https://consenti.dev/:path*',
        permanent: true,
      },
      // Force https: Next can't match on URL scheme directly, but the
      // terminating proxy/CDN (nginx, ALB, Cloudflare, Vercel, etc.) sets
      // x-forwarded-proto, so redirect on that instead.
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://consenti.dev/:path*',
        permanent: true,
      },
      // App shortcuts
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
