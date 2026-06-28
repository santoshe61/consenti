/**
 * Minimal `fetch` wrapper used for all Consenti API calls.
 *
 * Adds `Content-Type: application/json` and, when `authToken` is provided,
 * an `Authorization: Bearer <token>` header. Throws a descriptive `Error` on
 * non-2xx responses so callers can catch and fall back gracefully.
 *
 * This module is tree-shaken out of bundles that do not use API mode.
 */

/**
 * Sends an HTTP request and returns the parsed JSON response body.
 *
 * @param url       - The request URL.
 * @param options   - Standard `RequestInit` options (method, body, headers, etc.).
 * @param authToken - Optional Bearer token. Added as `Authorization: Bearer <token>` when present.
 * @returns         Parsed JSON body typed as `T`.
 * @throws          `Error` with HTTP status and URL on non-2xx responses.
 */
export async function httpRequest<T>(
  url: string,
  options: RequestInit = {},
  authToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    throw new Error(`[Consenti] HTTP ${res.status} ${res.statusText} — ${url}`)
  }
  return res.json() as Promise<T>
}
