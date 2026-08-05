// `details` is always sent when the caller passes it — every call site in the routes layer
// passes deliberate, non-sensitive, user-facing structure (missing-field lists, compliance
// errors, blocking-profile ids), never raw internals. The one place that touches an actual
// exception message (`withErrorHandler` below) does its own production check before it ever
// reaches here, so gating again in this shared helper would only suppress the safe kind.
export function errorResponse(status: number, message: string, details?: unknown): Response {
  const body: Record<string, unknown> = { error: message }
  if (details != null) {
    body['details'] = details
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function withErrorHandler(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return errorResponse(500, 'Internal Server Error',
      process.env['NODE_ENV'] !== 'production' ? message : undefined)
  }
}
