import { getConsenti, getConsentiError } from '@/lib/consenti'

export const dynamic = 'force-dynamic'

async function handle(request: Request): Promise<Response> {
  const consenti = await getConsenti()

  if (!consenti) {
    const reason = getConsentiError() ?? 'Unknown error'
    const isNodeVersion = reason.includes('node:sqlite') || reason.includes('UNKNOWN_BUILTIN_MODULE')
    return new Response(
      JSON.stringify({
        error: isNodeVersion
          ? 'Backend unavailable: requires Node.js ≥ 22.5.0 (node:sqlite built-in).'
          : `Backend unavailable: ${reason}`,
        ...(isNodeVersion ? { docs: 'https://nodejs.org/en/blog/release/v22.5.0' } : {}),
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return consenti.honoApp.fetch(request)
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
