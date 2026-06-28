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
  vendors: Record<string, GvlVendor>
  purposes: Record<string, GvlPurpose>
}

let cachedGvl: GvlData | null = null
let lastFetched = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

function isGvlData(d: unknown): d is GvlData {
  return typeof d === 'object' && d !== null &&
    'vendors' in d && 'purposes' in d &&
    typeof (d as GvlData).vendors === 'object' &&
    typeof (d as GvlData).purposes === 'object'
}

export async function getGvl(): Promise<GvlData | null> {
  if (cachedGvl && Date.now() - lastFetched < REFRESH_MS) return cachedGvl
  try {
    const res = await fetch(GVL_URL, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return cachedGvl
    const data = await res.json()
    if (!isGvlData(data)) return cachedGvl
    cachedGvl = data
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
