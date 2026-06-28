import type { NextConfig } from 'next'
import { join } from 'node:path'

const OPTIONAL_EXTERNALS = ['samlify', 'xlsx', 'mongodb', 'mysql2', 'pg', '@node-rs/argon2']

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
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
