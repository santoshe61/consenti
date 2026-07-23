import type { NoticeService } from '../../services/notice.service'
import { parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'

/**
 * Proof-of-notice (recording that the banner was rendered to a visitor, independent of any
 * decision) is not wired up anywhere — the widget never mints a visitor identifier before a
 * consent decision exists, so it has nothing to send here. Route kept dormant, not deleted,
 * as a starting point if this is ever revisited; see /docs/upcoming-features.
 */
const NOTICE_SHOWN_ENABLED: boolean = false

export function buildNoticeRoutes(notices: NoticeService) {
  return {
    'POST /notice-shown': async (request: Request, _params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!NOTICE_SHOWN_ENABLED) return errorResponse(404, 'Not found')

        const body = await parseJsonBody(request)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Request body must be a JSON object')
        const b = body as Record<string, unknown>

        const visitorId = typeof b['visitorId'] === 'string' ? b['visitorId'] : ''
        const profileId = typeof b['profileId'] === 'string' ? b['profileId'] : ''
        const locale = typeof b['locale'] === 'string' ? b['locale'] : ''
        if (!visitorId) return errorResponse(400, 'visitorId is required')
        if (!profileId) return errorResponse(400, 'profileId is required')
        if (!locale) return errorResponse(400, 'locale is required')

        const record = await notices.recordShown({ visitorId, profileId, locale })
        return new Response(JSON.stringify({ success: true, id: record.id }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
  }
}
