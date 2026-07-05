import type { ProfileService } from '../../services/profile.service'
import type { GeoResolverService } from '../../services/geo-resolver.service'
import { json } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=60'
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': CACHE_CONTROL }

function serveJsonFile(filePath: string): Response {
  const content = readFileSync(filePath, 'utf8')
  return new Response(content, { headers: JSON_HEADERS })
}

function redirectToDefault(basePath: string, tenantId: string, complianceGroup: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `${basePath}/profiles/${tenantId}/${complianceGroup}/default` },
  })
}

export function buildProfileRoutes(
  profiles: ProfileService,
  geoResolver?: GeoResolverService,
  profilesDir?: string,
  basePath = '',
) {
  return {
    // Static file route — primary hot-serve path, zero DB when file exists
    'GET /profiles/:tenantId/:complianceGroupOrProfileId/:locale': async (
      _req: Request,
      params: Record<string, string>,
    ): Promise<Response> =>
      withErrorHandler(async () => {
        const { tenantId, complianceGroupOrProfileId, locale } = params as Record<string, string>
        if (!tenantId || !complianceGroupOrProfileId || !locale) return errorResponse(400, 'Missing path parameters')

        if (profilesDir) {
          const filePath = join(profilesDir, tenantId, complianceGroupOrProfileId, `${locale}.json`)
          if (existsSync(filePath)) return serveJsonFile(filePath)
          // Locale not found → 303 to default
          const defaultPath = join(profilesDir, tenantId, complianceGroupOrProfileId, 'default.json')
          if (existsSync(defaultPath)) return redirectToDefault(basePath, tenantId, complianceGroupOrProfileId)
        }

        // Fall back to DB-resolved profile (for preview of inactive/versioned profiles)
        const result = await profiles.getResolved(complianceGroupOrProfileId, locale)
        if (!result) return errorResponse(404, 'Profile not found')
        return json(200, result)
      }),

    // Versioned profile file route (for dashboard preview)
    'GET /profiles/:tenantId/:profileId/:version/:locale': async (
      _req: Request,
      params: Record<string, string>,
    ): Promise<Response> =>
      withErrorHandler(async () => {
        const { tenantId, profileId, version, locale } = params as Record<string, string>
        if (!tenantId || !profileId || !version || !locale) return errorResponse(400, 'Missing path parameters')
        const ver = parseInt(version, 10)
        if (isNaN(ver) || ver < 1) return errorResponse(400, 'Invalid version')

        if (profilesDir) {
          const filePath = join(profilesDir, tenantId, profileId, version, `${locale}.json`)
          if (existsSync(filePath)) return serveJsonFile(filePath)
          const defaultPath = join(profilesDir, tenantId, profileId, version, 'default.json')
          if (existsSync(defaultPath)) return serveJsonFile(defaultPath)
        }

        const content = profiles.getVersionFile(profileId, ver, locale)
        if (!content) return errorResponse(404, 'Version not found')
        return new Response(content, { headers: JSON_HEADERS })
      }),

    // Geo-resolve endpoint — for compliance.type='auto' widgets
    'GET /resolve-profile': async (request: Request, _params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!geoResolver) return errorResponse(501, 'Geo compliance routing not configured')
        const url = new URL(request.url)

        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip') ??
          ''
        const timezone = url.searchParams.get('tz') ?? ''
        const language =
          url.searchParams.get('lang') ??
          request.headers.get('accept-language') ??
          ''
        const requestedLocale = url.searchParams.get('locale') ?? ''

        const geo = await geoResolver.resolve({ ip, language, timezone })

        if (!geo.complianceGroup) {
          return errorResponse(404, 'Could not resolve compliance group for this location')
        }

        const profile = await profiles.findActiveByComplianceGroup(geo.complianceGroup)
        if (!profile) {
          return errorResponse(404, `No active profile found for compliance group: ${geo.complianceGroup}`)
        }

        // Determine best locale
        const pj = profile.profileJson as { localeContents?: Record<string, unknown>; defaultLocale?: string }
        const availableLocales = pj.localeContents ? Object.keys(pj.localeContents) : []
        let resolvedLocale = profile.defaultLocale
        if (requestedLocale && availableLocales.includes(requestedLocale)) {
          resolvedLocale = requestedLocale
        } else if (geo.locale && availableLocales.includes(geo.locale)) {
          resolvedLocale = geo.locale
        }

        const complianceGroup = geo.complianceGroup
        const tenantId = profile.tenantId

        let warning: string | undefined
        let filePath = profilesDir
          ? join(profilesDir, tenantId, complianceGroup, `${resolvedLocale}.json`)
          : ''

        if (profilesDir && !existsSync(filePath)) {
          const defaultPath = join(profilesDir, tenantId, complianceGroup, 'default.json')
          if (existsSync(defaultPath)) {
            resolvedLocale = profile.defaultLocale
            warning = 'locale_not_found'
            filePath = defaultPath
          }
        }

        const path = `${basePath}/profiles/${tenantId}/${complianceGroup}/${resolvedLocale}`

        return json(200, {
          path,
          resolvedLocale,
          resolvedComplianceGroup: complianceGroup,
          profileId: profile.id,
          version: profile.version,
          ...(warning ? { warning } : {}),
        })
      }),

    // Legacy: single-param profile route (by ID)
    'GET /profiles/:id': async (_request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const id = params['id']
        if (!id) return errorResponse(400, 'Missing profile id')
        const result = await profiles.getResolved(id)
        if (!result) return errorResponse(404, 'Profile not found')
        return json(200, result)
      }),

    'GET /profiles/:id/:locale': async (_request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { id, locale } = params as Record<string, string>
        if (!id) return errorResponse(400, 'Missing profile id')
        const result = await profiles.getResolved(id, locale)
        if (!result) return errorResponse(404, 'Profile not found')
        return json(200, result)
      }),

    // Geo-resolved auto route (legacy path)
    'GET /profiles/auto/:locale': async (request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!geoResolver) return errorResponse(501, 'Geo compliance routing not configured')
        const locale = params['locale'] ?? 'en'
        const url = new URL(request.url)
        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip') ?? ''
        const timezone = url.searchParams.get('tz') ?? ''
        const language = request.headers.get('accept-language') ?? url.searchParams.get('lang') ?? ''
        const geo = await geoResolver.resolve({ ip, language, timezone })
        if (!geo.complianceGroup) return errorResponse(404, 'Could not resolve compliance group for this location')
        const profile = await profiles.findActiveByComplianceGroup(geo.complianceGroup)
        if (!profile) return errorResponse(404, `No active profile found for compliance group: ${geo.complianceGroup}`)
        const result = await profiles.getResolved(profile.id, locale)
        if (!result) return errorResponse(404, 'Profile not found')
        return json(200, { ...result, resolvedComplianceGroup: geo.complianceGroup })
      }),
  }
}
