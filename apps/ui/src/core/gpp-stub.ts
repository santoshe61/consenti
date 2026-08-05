/**
 * Client-side `window.__gpp` stub — the standard IAB GPP CMP API entry point, US National
 * ("usnat") section only.
 *
 * Simplified, like the server-side fallback GPP string this reads (`@consenti/utils`'s
 * `encodeGppString`): `gppString` is a base64url-encoded JSON payload, not the real IAB binary
 * bit-string encoding. This is intentional here, not just unfinished — `@iabgpp/cmpapi` (the
 * real encoder, used server-side when installed — see `apps/api/src/gpp/gpp-string.ts`) bundles
 * every GPP section's encoder plus a GVL class, and inlining that into `@consenti/ui`'s bundle
 * would cost every site loading the widget the full library size, not just ones using GPP —
 * the same bundle-size reasoning that already keeps `@iabtechlabtcf/core` server-only for TCF,
 * just for a different underlying cause (there GVL-fetch cost, here plain library size).
 *
 * Only one CMP may own `window.__gpp` per page — if it's already set (a real CMP, or another
 * `ConsentiSetup` instance in a multi-profile page), this stub does not overwrite it.
 */

import type { ConsentValue, ResolvedProfile, GppWidgetConfig } from '../types'
import { encodeGppString } from '@consenti/utils'
import { isClient, safeWindow } from '../utils/ssr'
import { detectGPC } from './gpc'

type GppCommand = 'ping' | 'addEventListener' | 'removeEventListener' | 'getSection' | 'hasSection'
type GppCallback = (data: unknown, success: boolean) => void
type QueuedCall = [GppCommand, GppCallback, unknown?]

const GPP_VERSION = '1.1'
const USNAT_SECTION_ID = 7

export interface GppState {
  profile: ResolvedProfile | null
  consent: ConsentValue | null
  gppConfig: GppWidgetConfig | undefined
}

function deriveOptOuts(profile: ResolvedProfile | null, consent: ConsentValue | null) {
  let saleApplicable = false
  let sharingApplicable = false
  let saleOptOut = true
  let sharingOptOut = true
  if (profile && consent) {
    for (const [id, cookie] of Object.entries(profile.cookies)) {
      if (cookie.cpraCategory === 'sale') {
        saleApplicable = true
        if (consent[id] === 'granted') saleOptOut = false
      }
      if (cookie.cpraCategory === 'sharing') {
        sharingApplicable = true
        if (consent[id] === 'granted') sharingOptOut = false
      }
    }
  }
  return { saleApplicable, sharingApplicable, saleOptOut, sharingOptOut }
}

/**
 * Installs `window.__gpp`. No-ops in SSR, when `gppConfig.enabled` is false, or when
 * `window.__gpp` already exists (another CMP/instance owns the page's GPP surface).
 *
 * @param getState - Called on every command so the stub always reflects current consent — no
 *   stale snapshot captured at install time.
 */
export function installGppStub(getState: () => GppState): void {
  if (!isClient()) return
  const win = safeWindow() as (Window & { __gpp?: unknown }) | null
  if (!win || !getState().gppConfig?.enabled) return
  if (win.__gpp) return

  const listeners = new Map<number, GppCallback>()
  let listenerCounter = 0

  function currentGppString(): string {
    const { profile, consent, gppConfig: cfg } = getState()
    const gppConfig = cfg ?? { enabled: false, cmpId: 0, cmpVersion: 0, mspaCoveredTransaction: false, mspaOptOutOptionMode: 0 as const, mspaServiceProviderMode: 0 as const }
    const { saleApplicable, sharingApplicable, saleOptOut, sharingOptOut } = deriveOptOuts(profile, consent)
    return encodeGppString({
      cmpId: gppConfig.cmpId,
      cmpVersion: gppConfig.cmpVersion,
      mspaCoveredTransaction: gppConfig.mspaCoveredTransaction,
      mspaOptOutOptionMode: gppConfig.mspaOptOutOptionMode,
      mspaServiceProviderMode: gppConfig.mspaServiceProviderMode,
      saleOptOut,
      saleApplicable,
      sharingOptOut,
      sharingApplicable,
      gpcDetected: detectGPC(),
    })
  }

  function buildPingData(): Record<string, unknown> {
    const { consent, gppConfig } = getState()
    return {
      gppVersion: GPP_VERSION,
      cmpStatus: 'loaded',
      cmpDisplayStatus: consent ? 'hidden' : 'visible',
      signalStatus: consent ? 'ready' : 'not ready',
      supportedAPIs: [`${USNAT_SECTION_ID}:usnat`],
      cmpId: gppConfig?.cmpId ?? 0,
      sectionList: [USNAT_SECTION_ID],
      applicableSections: [USNAT_SECTION_ID],
      gppString: currentGppString(),
      parsedSections: {},
    }
  }

  function notifyListeners(): void {
    for (const [listenerId, callback] of listeners) {
      callback({ ...buildPingData(), listenerId, pingData: buildPingData() }, true)
    }
  }

  function handleCommand(command: GppCommand, callback: GppCallback, parameter?: unknown): void {
    switch (command) {
      case 'ping':
        callback(buildPingData(), true)
        return
      case 'addEventListener': {
        const listenerId = ++listenerCounter
        listeners.set(listenerId, callback)
        callback({ ...buildPingData(), listenerId, pingData: buildPingData() }, true)
        return
      }
      case 'removeEventListener': {
        const listenerId = typeof parameter === 'number' ? parameter : undefined
        const removed = listenerId !== undefined && listeners.delete(listenerId)
        callback(removed, removed)
        return
      }
      case 'getSection':
        callback(parameter === 'usnat' ? currentGppString() : null, parameter === 'usnat')
        return
      case 'hasSection':
        callback(parameter === 'usnat', true)
        return
    }
  }

  // Standard IAB stub-queue convention: scripts that load before the real stub push their
  // call onto `__gpp.queue` instead of calling it directly. Drain it once we install for real.
  const queued = ((win.__gpp as { queue?: QueuedCall[] } | undefined)?.queue ?? []) as QueuedCall[]

  const api = ((command: GppCommand, callback: GppCallback, parameter?: unknown) => {
    handleCommand(command, callback, parameter)
  }) as { (command: GppCommand, callback: GppCallback, parameter?: unknown): void; queue: QueuedCall[]; gppVersion: string }
  api.queue = []
  api.gppVersion = GPP_VERSION
  win.__gpp = api

  window.addEventListener('consenti:consentSubmitted', notifyListeners)

  for (const [command, callback, parameter] of queued) {
    handleCommand(command, callback, parameter)
  }
}
