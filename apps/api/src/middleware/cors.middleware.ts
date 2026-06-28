function matchesAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  let hostname: string
  try {
    hostname = new URL(origin).hostname
  } catch {
    return false
  }
  return allowedOrigins.some(pattern => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1) // '.example.com'
      return hostname === pattern.slice(2) || hostname.endsWith(suffix)
    }
    return hostname === pattern
  })
}

export function buildCorsHeaders(origin: string | null, allowedOrigins?: string[]): Record<string, string> {
  let allowOrigin = origin ?? '*'
  if (allowedOrigins && allowedOrigins.length > 0 && origin) {
    allowOrigin = matchesAllowedOrigin(origin, allowedOrigins) ? origin : 'null'
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin),
    })
  }
  return null
}

export function withCors(response: Response, request: Request): Response {
  const origin = request.headers.get('origin')
  const cors = buildCorsHeaders(origin)
  const newHeaders = new Headers(response.headers)
  for (const [k, v] of Object.entries(cors)) newHeaders.set(k, v)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

export function checkOriginAllowed(request: Request, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) return true
  const origin = request.headers.get('origin')
  if (!origin) return true // non-browser / server-side calls always allowed
  return matchesAllowedOrigin(origin, allowedOrigins)
}

export function addSecurityHeaders(res: Response): Response {
  const h = new Headers(res.headers)
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('X-Frame-Options', 'DENY')
  h.set('Referrer-Policy', 'no-referrer')
  h.set('Permissions-Policy', 'interest-cohort=()')
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h })
}
