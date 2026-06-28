import type { IncomingMessage, ServerResponse } from 'node:http'

export class PayloadTooLargeError extends Error {
  constructor() { super('Payload Too Large') }
}

export function getIp(req: IncomingMessage, trustedProxies?: string[]): string {
  const remoteIp = req.socket?.remoteAddress ?? ''
  if (!trustedProxies?.length) return remoteIp
  if (!trustedProxies.includes(remoteIp)) return remoteIp
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string') return fwd.split(',')[0]?.trim() ?? remoteIp
  if (Array.isArray(fwd)) return fwd[0]?.trim() ?? remoteIp
  return remoteIp
}

export function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function parseJsonBody<T = unknown>(request: Request): Promise<T | null> {
  const ct = request.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) return null
  try {
    return await request.json() as T
  } catch {
    return null
  }
}

export function getQueryParam(url: URL, key: string): string | undefined {
  const val = url.searchParams.get(key)
  return val ?? undefined
}

export function getQueryInt(url: URL, key: string, fallback: number): number {
  const val = url.searchParams.get(key)
  if (!val) return fallback
  const n = parseInt(val, 10)
  return isNaN(n) ? fallback : n
}

export async function nodeRequestToFetch(
  req: IncomingMessage,
  maxBodyBytes = 1_048_576,
  trustedProxies?: string[],
): Promise<Request> {
  const rawProto = req.headers['x-forwarded-proto']
  const proto = rawProto === 'https' ? 'https' : 'http'
  const host = req.headers['host'] ?? 'localhost'
  const url = new URL(req.url ?? '/', `${proto}://${host}`)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v)
    } else {
      headers.set(key, value)
    }
  }
  headers.set('x-real-ip', getIp(req, trustedProxies))

  let body: BodyInit | null = null
  const method = (req.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = []
    let totalBytes = 0
    for await (const chunk of req) {
      totalBytes += (chunk as Buffer).length
      if (totalBytes > maxBodyBytes) throw new PayloadTooLargeError()
      chunks.push(chunk as Buffer)
    }
    if (chunks.length > 0) body = Buffer.concat(chunks)
  }

  return new Request(url.toString(), { method, headers, body })
}

export async function fetchResponseToNode(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status
  const setCookies: string[] =
    typeof (response.headers as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (response.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')!] : [])
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return
    res.setHeader(key, value)
  })
  for (const cookie of setCookies) {
    res.appendHeader('set-cookie', cookie)
  }
  if (response.body) {
    const reader = response.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
    } finally {
      reader.releaseLock()
    }
    res.end()
  } else {
    res.end()
  }
}
