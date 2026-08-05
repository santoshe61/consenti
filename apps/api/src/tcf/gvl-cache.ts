const GVL_URL = 'https://vendor-list.consensu.org/v3/vendor-list.json'
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000

export interface GvlPurpose {
  id: number
  name: string
  description: string
}

export interface GvlVendor {
  id: number
  name: string
  purposes?: number[]
  legIntPurposes?: number[]
  flexiblePurposes?: number[]
  specialPurposes?: number[]
  features?: number[]
  specialFeatures?: number[]
}

export interface GvlData {
  gvlSpecificationVersion: number
  vendorListVersion: number
  tcfPolicyVersion: number
  vendors: Record<string, GvlVendor>
  purposes: Record<string, GvlPurpose>
  /** Full, unmodified vendor-list.json — passed to `@iabtechlabtcf/core`'s `GVL` constructor
   * as-is by the real TC-string encoder. Keep this around instead of re-fetching. */
  raw: Record<string, unknown>
}

let cachedGvl: GvlData | null = null
let lastFetched = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

function isRawVendorList(d: unknown): d is Record<string, unknown> & { vendors: unknown; purposes: unknown } {
  return typeof d === 'object' && d !== null &&
    'vendors' in d && 'purposes' in d &&
    typeof (d as { vendors: unknown }).vendors === 'object' &&
    typeof (d as { purposes: unknown }).purposes === 'object'
}

export async function getGvl(): Promise<GvlData | null> {
  if (cachedGvl && Date.now() - lastFetched < REFRESH_MS) return cachedGvl
  try {
    const res = await fetch(GVL_URL, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return cachedGvl
    const data = await res.json()
    if (!isRawVendorList(data)) return cachedGvl
    const raw = data as Record<string, unknown> & {
      gvlSpecificationVersion: number
      vendorListVersion: number
      tcfPolicyVersion: number
      vendors: Record<string, GvlVendor>
      purposes: Record<string, GvlPurpose>
    }
    cachedGvl = {
      gvlSpecificationVersion: raw.gvlSpecificationVersion,
      vendorListVersion: raw.vendorListVersion,
      tcfPolicyVersion: raw.tcfPolicyVersion,
      vendors: raw.vendors,
      purposes: raw.purposes,
      raw,
    }
    lastFetched = Date.now()
    return cachedGvl
  } catch {
    return cachedGvl
  }
}

export function startGvlRefresh(): void {
  if (refreshTimer) return
  void getGvl()
  refreshTimer = setInterval(() => { void getGvl() }, REFRESH_MS)
}

export function stopGvlRefresh(): void {
  if (!refreshTimer) return
  clearInterval(refreshTimer)
  refreshTimer = null
}
