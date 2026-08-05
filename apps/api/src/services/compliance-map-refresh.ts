import { resolveComplianceMapOverride, type ComplianceMapData } from '@consenti/utils'
import type { GeoResolverService } from './geo-resolver.service'

const DEFAULT_REFRESH_MS = 24 * 60 * 60 * 1000

/** Derives the next refresh delay from the response's `Cache-Control: max-age` (preferred) or
 * `Expires` header — falls back to 24h when neither is present or parseable. */
function refreshDelayMs(response?: Response): number {
  const maxAge = response?.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]
  if (maxAge) {
    const ms = parseInt(maxAge, 10) * 1000
    if (!isNaN(ms) && ms > 0) return ms
  }
  const expires = response?.headers.get('expires')
  if (expires) {
    const ms = Date.parse(expires) - Date.now()
    if (!isNaN(ms) && ms > 0) return ms
  }
  return DEFAULT_REFRESH_MS
}

/**
 * Resolves `compliance.complianceMap` in the background and hot-swaps `geoResolver`'s map via
 * `setMap()` once resolved — never blocks `createConsenti()`'s synchronous return (the caller
 * already constructed `geoResolver` with the embedded map as an immediately-available default).
 *
 * For a URL value, schedules a recurring background refetch afterward, with the interval
 * derived from each response's `Cache-Control`/`Expires` header (24h fallback). `'default'` and
 * inline-object values resolve once and never re-fetch (nothing to refresh without a restart).
 *
 * Returns a handle to cancel any pending refresh timer on server shutdown.
 */
export function startComplianceMapRefresh(
  complianceMap: 'default' | string | ComplianceMapData | undefined,
  geoResolver: GeoResolverService,
): { stop: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined

  const cycle = async (): Promise<void> => {
    const { map, response } = await resolveComplianceMapOverride(
      complianceMap,
      (msg) => console.error('[Consenti]', msg),
    )
    geoResolver.setMap(map)

    if (typeof complianceMap === 'string') {
      timer = setTimeout(() => { void cycle() }, refreshDelayMs(response))
      timer.unref()
    }
  }

  void cycle()

  return {
    stop: () => { if (timer) clearTimeout(timer) },
  }
}
