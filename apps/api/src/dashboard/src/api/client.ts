const BASE = '/consenti/admin'

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
    localStorage.removeItem('consenti_token')
    window.location.hash = '#/login'
    throw new ApiError(401, 'Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function apiDownload(path: string): void {
  const token = getToken()
  const url = `${BASE}${path}`
  const a = document.createElement('a')
  a.href = token ? `${url}${url.includes('?') ? '&' : '?'}_t=${encodeURIComponent(token)}` : url
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
