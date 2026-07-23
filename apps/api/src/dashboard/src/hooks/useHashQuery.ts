import { useCallback, useState } from 'preact/hooks'

function parseHashQuery(): URLSearchParams {
  return new URLSearchParams(window.location.hash.split('?')[1] ?? '')
}

/**
 * Keeps a page's filter/pagination state synced to its route hash (`#/consents?page=2&q=foo`),
 * so a refresh restores the same view instead of resetting it. `base` is the route's hash path
 * with no query string (e.g. `'#/consents'`) — the router must match `hash.startsWith(base)` for
 * this to round-trip (an exact `hash === base` match would never see the query string attached).
 */
export function useHashQuery(base: string): {
  params: URLSearchParams
  setParams: (updates: Record<string, string | number | undefined>) => void
} {
  const [params, setParamsState] = useState<URLSearchParams>(parseHashQuery)

  const setParams = useCallback((updates: Record<string, string | number | undefined>) => {
    const next = parseHashQuery()
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    }
    const qs = next.toString()
    const target = qs ? `${base}?${qs}` : base
    if (window.location.hash !== target) window.location.hash = target
    setParamsState(next)
  }, [base])

  return { params, setParams }
}
