const BASE = `${window.__CONSENTI_CONFIG__?.basePath ?? '/consenti'}/admin`

/** Fired on any 401 response — `AuthProvider` listens for this and calls its own `logout()`,
 * so React state, localStorage, and the route all update together through one path instead of
 * this module reaching around the context to clear storage/hash directly (which left `AuthContext`
 * believing the user was still logged in, fighting the router's own redirect). */
export const SESSION_EXPIRED_EVENT = 'consenti:session-expired'

function getToken(): string | null {
  return localStorage.getItem('consenti_token')
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })

  if (res.status === 401) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    throw new ApiError(401, 'Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function filenameFromContentDisposition(header: string | null): string | null {
  const match = header?.match(/filename="?([^";]+)"?/)
  return match?.[1] ?? null
}

/**
 * Downloads an authenticated export in the same window/tab — no separate navigation, so the JWT
 * goes in the `Authorization` header like every other request, never in the URL (a URL-embedded
 * token leaks into browser history, server access logs, and the Referer header of any link on
 * the downloaded page). Fetches the file as a blob, then triggers the browser's native save
 * dialog via a short-lived object URL.
 */
export async function apiDownload(path: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (res.status === 401) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    throw new ApiError(401, 'Unauthorized')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }

  const blob = await res.blob()
  const filename = filenameFromContentDisposition(res.headers.get('content-disposition')) ?? 'export'
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}
