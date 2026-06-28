export function errorResponse(status: number, message: string, details?: unknown): Response {
  const body: Record<string, unknown> = { error: message }
  if (details != null && process.env['NODE_ENV'] !== 'production') {
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
