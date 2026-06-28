import type {
  StorageAdapter, AuthConfig, ConsentFilters, AuditFilters,
  ConsentDbRecord, AuditLog,
} from '@consenti/types'
import { withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import { getQueryParam } from '../../utils/http'

function escapeCsv(val: string | number | boolean | null | undefined): string {
  const s = val == null ? '' : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function consentToCsvRow(r: ConsentDbRecord): string {
  return [
    r.id, r.visitorId, r.profileId, r.profileVersion, r.locale,
    JSON.stringify(r.consentJson), r.gpcDetected ? '1' : '0',
    r.source, r.createdAt, r.updatedAt,
  ].map(escapeCsv).join(',') + '\n'
}

function auditToCsvRow(r: AuditLog): string {
  return [
    r.id, r.userId ?? '', r.action, r.resourceType, r.resourceId ?? '', r.createdAt,
  ].map(escapeCsv).join(',') + '\n'
}

export function buildAdminExportRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { denied: authError(user, 'export:run') }
  }

  return {
    'GET /export/consents': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const url = new URL(req.url)
        const format = getQueryParam(url, 'format') ?? 'csv'
        const profileId = getQueryParam(url, 'profileId')
        const from = getQueryParam(url, 'from')
        const to = getQueryParam(url, 'to')
        const filters: ConsentFilters = {
          tenantId: 'default',
          ...(profileId !== undefined ? { profileId } : {}),
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        }

        if (format === 'json') {
          const records: ConsentDbRecord[] = []
          for await (const r of storage.streamConsents(filters)) records.push(r)
          return new Response(JSON.stringify(records), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="consents.json"',
            },
          })
        }

        const enc = new TextEncoder()
        const header = 'id,visitor_id,profile_id,profile_version,locale,consent_json,gpc_detected,source,created_at,updated_at\n'
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(enc.encode(header))
            for await (const r of storage.streamConsents(filters)) {
              controller.enqueue(enc.encode(consentToCsvRow(r)))
            }
            controller.close()
          },
        })
        return new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="consents.csv"',
          },
        })
      }),

    'GET /export/consents/xlsx': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied

        interface XlsxModule {
          utils: {
            book_new(): object
            json_to_sheet(rows: object[]): object
            book_append_sheet(wb: object, ws: object, name: string): void
          }
          write(wb: object, opts: { type: string; bookType: string }): Uint8Array
        }
        let XlsxMod: XlsxModule | null = null
        try {
          // @ts-expect-error -- xlsx is an optional peer dependency; install it to use XLSX export
          XlsxMod = (await import('xlsx')) as XlsxModule
        } catch {
          return new Response(JSON.stringify({ error: 'xlsx peer dependency not installed. Run: npm install xlsx' }), {
            status: 501,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (!XlsxMod) return new Response(null, { status: 501 })

        const url = new URL(req.url)
        const profileId = url.searchParams.get('profileId') ?? undefined
        const from = url.searchParams.get('from') ?? undefined
        const to = url.searchParams.get('to') ?? undefined
        const filters: ConsentFilters = {
          tenantId: 'default',
          ...(profileId !== undefined ? { profileId } : {}),
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        }

        const rows: Record<string, unknown>[] = []
        for await (const r of storage.streamConsents(filters)) {
          rows.push({
            id: r.id,
            visitor_id: r.visitorId,
            profile_id: r.profileId,
            profile_version: r.profileVersion,
            locale: r.locale,
            consent_json: JSON.stringify(r.consentJson),
            gpc_detected: r.gpcDetected ? 1 : 0,
            age_verified: r.ageVerified ? 1 : 0,
            tcf_string: r.tcfString ?? '',
            source: r.source,
            created_at: r.createdAt,
            updated_at: r.updatedAt,
          })
        }

        const wb = XlsxMod.utils.book_new()
        const ws = XlsxMod.utils.json_to_sheet(rows)
        XlsxMod.utils.book_append_sheet(wb, ws, 'Consents')
        const buf = XlsxMod.write(wb, { type: 'buffer', bookType: 'xlsx' })
        return new Response(buf as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="consents.xlsx"',
          },
        })
      }),

    'GET /export/audit': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const url = new URL(req.url)
        const format = getQueryParam(url, 'format') ?? 'csv'
        const from = getQueryParam(url, 'from')
        const to = getQueryParam(url, 'to')
        const filters: AuditFilters = {
          tenantId: 'default',
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        }

        if (format === 'json') {
          const logs: AuditLog[] = []
          for await (const r of storage.streamAuditLogs(filters)) logs.push(r)
          return new Response(JSON.stringify(logs), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="audit.json"',
            },
          })
        }

        const enc = new TextEncoder()
        const header = 'id,user_id,action,resource_type,resource_id,created_at\n'
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(enc.encode(header))
            for await (const r of storage.streamAuditLogs(filters)) {
              controller.enqueue(enc.encode(auditToCsvRow(r)))
            }
            controller.close()
          },
        })
        return new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="audit.csv"',
          },
        })
      }),
  }
}
