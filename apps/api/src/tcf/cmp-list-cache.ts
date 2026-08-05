// Companion to gvl-cache.ts — same host, same caching pattern, different document. The CMP List
// is IAB Europe's registry of every registered CMP id, including deregistration dates. Used to
// validate a `cmpId`/`cmpVersion` at confirmation time (see registration-confirmation.ts and
// tcf.routes.ts) — never to encode anything, so it doesn't need the full GVL's vendor/purpose data.
const CMP_LIST_URL = 'https://vendor-list.consensu.org/v3/cmp-list.json'
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000

export interface CmpListEntry {
  id: number
  name: string
  /** Present once IAB has deregistered this CMP id — an ISO date string. Absent for active CMPs. */
  deletedDate?: string
}

export interface CmpListData {
  cmpListVersion: number
  lastUpdated: string
  cmps: Record<string, CmpListEntry>
}

let cachedList: CmpListData | null = null
let lastFetched = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

function isRawCmpList(d: unknown): d is Record<string, unknown> & { cmps: unknown } {
  return typeof d === 'object' && d !== null && 'cmps' in d &&
    typeof (d as { cmps: unknown }).cmps === 'object'
}

/** `force: true` bypasses the 7-day cache — used by the dashboard's "Refresh Status" button when
 * a `cmpId` isn't found in the cached list yet (registration can take time to propagate). */
export async function getCmpList(force = false): Promise<CmpListData | null> {
  if (!force && cachedList && Date.now() - lastFetched < REFRESH_MS) return cachedList
  try {
    const res = await fetch(CMP_LIST_URL, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return cachedList
    const data = await res.json()
    if (!isRawCmpList(data)) return cachedList
    const raw = data as Record<string, unknown> & { cmpListVersion: number; lastUpdated: string; cmps: Record<string, CmpListEntry> }
    cachedList = { cmpListVersion: raw.cmpListVersion, lastUpdated: raw.lastUpdated, cmps: raw.cmps }
    lastFetched = Date.now()
    return cachedList
  } catch {
    return cachedList
  }
}

export function startCmpListRefresh(): void {
  if (refreshTimer) return
  void getCmpList()
  refreshTimer = setInterval(() => { void getCmpList() }, REFRESH_MS)
}

export function stopCmpListRefresh(): void {
  if (!refreshTimer) return
  clearInterval(refreshTimer)
  refreshTimer = null
}
