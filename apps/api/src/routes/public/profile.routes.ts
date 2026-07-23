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

    // Historical snapshot file route — :profileId resolves to its lineage, :entryId picks
    // the specific edit within that lineage (see ProfileService.listVersions/getVersionFile).
    'GET /profiles/:tenantId/:profileId/:entryId/:locale': async (
      _req: Request,
      params: Record<string, string>,
    ): Promise<Response> =>
      withErrorHandler(async () => {
        const { profileId, entryId, locale } = params as Record<string, string>
        if (!profileId || !entryId || !locale) return errorResponse(400, 'Missing path parameters')

        const content = await profiles.getVersionFile(profileId, entryId, locale)
        if (!content) return errorResponse(404, 'Version not found')
        return new Response(content, { headers: JSON_HEADERS })
      }),

    // Geo-resolve endpoint — for compliance.type='auto' widgets
    // Accepts: ?data=<base64-encoded GeoHints JSON> (preferred) OR legacy ?tz=&lang=&locale= params
    // Response: { path: string|null, complianceGroup: string, locale: string, found: boolean }
    'GET /resolve-profile': async (request: Request, _params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!geoResolver) return errorResponse(501, 'Geo compliance routing not configured')
        const url = new URL(request.url)

        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip') ??
          ''

        // Decode hints from the `data` param (widget sends base64-encoded JSON), falling
        // back to individual legacy query params for backwards compatibility.
        let timezone = url.searchParams.get('tz') ?? ''
        let language = url.searchParams.get('lang') ?? request.headers.get('accept-language') ?? ''
        let requestedLocale = url.searchParams.get('locale') ?? ''

        const dataParam = url.searchParams.get('data')
        if (dataParam) {
          try {
            const decoded = JSON.parse(Buffer.from(dataParam, 'base64').toString('utf8')) as {
              timezone?: string; language?: string; languages?: string[]; locale?: string
            }
            if (decoded.timezone) timezone = decoded.timezone
            if (decoded.language) language = decoded.language
            if (decoded.locale) requestedLocale = decoded.locale
          } catch {
            // ignore malformed data param — fall back to legacy params
          }
        }

        const geo = await geoResolver.resolve({ ip, language, timezone })

        if (!geo.complianceGroup) {
          return json(200, { path: null, complianceGroup: 'opt-in', locale: requestedLocale || 'en', found: false })
        }

        const profile = await profiles.findActiveByComplianceGroup(geo.complianceGroup)
        if (!profile) {
          return json(200, { path: null, complianceGroup: geo.complianceGroup, locale: requestedLocale || 'en', found: false })
        }

        // Determine best locale for this profile
        const availableLocales = profile.profileJson.locales ?? []
        let resolvedLocale = profile.defaultLocale
        if (requestedLocale && availableLocales.includes(requestedLocale)) {
          resolvedLocale = requestedLocale
        } else if (availableLocales.length > 0) {
          // Try language prefix match (e.g. 'de-AT' → 'de')
          const langPrefix = (requestedLocale || language).split('-')[0] ?? ''
          const prefixMatch = availableLocales.find(l => l === langPrefix || l.startsWith(`${langPrefix}-`))
          if (prefixMatch) resolvedLocale = prefixMatch
        }

        const complianceGroup = geo.complianceGroup
        const tenantId = profile.tenantId

        // Check if the resolved static file exists on disk
        let found = false
        let filePath = profilesDir
          ? join(profilesDir, tenantId, complianceGroup, `${resolvedLocale}.json`)
          : ''

        if (profilesDir && existsSync(filePath)) {
          found = true
        } else if (profilesDir) {
          // Locale file missing → try the profile's default locale
          const defaultPath = join(profilesDir, tenantId, complianceGroup, `${profile.defaultLocale}.json`)
          if (existsSync(defaultPath)) {
            resolvedLocale = profile.defaultLocale
            filePath = defaultPath
            found = true
          }
        }

        const servePath = found
          ? `${basePath}/profiles/${tenantId}/${complianceGroup}/${resolvedLocale}`
          : null

        return json(200, { path: servePath, complianceGroup, locale: resolvedLocale, found })
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
