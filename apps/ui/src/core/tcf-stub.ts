/**
 * Client-side `window.__tcfapi` stub — the standard IAB TCF v2.2 entry point third-party
 * ad-tech scripts call to read consent (`ping`, `getTCData`, `addEventListener`,
 * `removeEventListener`).
 *
 * Simplified, like the server-side TC string this reads (`@consenti/utils`'s `encodeTcString`):
 * `tcString` is a base64url-encoded JSON payload, not the full IAB binary bitfield encoding.
 * Vendor list data (`gvlVersion`, `publisherCC`) isn't fetched client-side, so those fields are
 * placeholders. For full IAB TCF v2.2 compliance, use the `iabtcf-core` npm package instead.
 *
 * Only one CMP may own `window.__tcfapi` per page — if it's already set (a real CMP, or another
 * `ConsentiSetup` instance in a multi-profile page), this stub does not overwrite it.
 */

import type { ConsentValue, ResolvedProfile, TcfWidgetConfig } from '../types'
import { encodeTcString } from '@consenti/utils'
import { isClient, safeWindow } from '../utils/ssr'

type TcfCommand = 'ping' | 'getTCData' | 'addEventListener' | 'removeEventListener'
type TcfCallback = (data: unknown, success: boolean) => void
type QueuedCall = [TcfCommand, number, TcfCallback, unknown?]

const TCF_POLICY_VERSION = 4
const API_VERSION = '2.2'

export interface TcfState {
  profile: ResolvedProfile | null
  consent: ConsentValue | null
  tcfConfig: TcfWidgetConfig | undefined
}

function buildPurposeAndVendorConsents(profile: ResolvedProfile | null, consent: ConsentValue | null) {
  const purposeConsents = new Set<number>()
  const vendorConsents = new Set<number>()
  if (profile && consent) {
    for (const [cookieId, cookie] of Object.entries(profile.cookies)) {
      if (consent[cookieId] !== 'granted' || !cookie.tcfVendorId) continue
      vendorConsents.add(cookie.tcfVendorId)
      for (const p of cookie.tcfPurposes ?? []) purposeConsents.add(p)
    }
  }
  return {
    purposeConsents: Array.from(purposeConsents).sort((a, b) => a - b),
    vendorConsents: Array.from(vendorConsents).sort((a, b) => a - b),
  }
}

function toBoolMap(ids: number[], max: number): Record<number, boolean> {
  const map: Record<number, boolean> = {}
  for (let i = 1; i <= max; i++) map[i] = ids.includes(i)
  return map
}

/**
 * Installs `window.__tcfapi`. No-ops in SSR, when `tcfConfig.enabled` is false, or when
 * `window.__tcfapi` already exists (another CMP/instance owns the page's TCF surface).
 *
 * @param getState - Called on every command so the stub always reflects current consent —
 *   no stale snapshot captured at install time.
 */
export function installTcfStub(getState: () => TcfState): void {
  if (!isClient()) return
  const win = safeWindow() as (Window & { __tcfapi?: unknown }) | null
  if (!win || !getState().tcfConfig?.enabled) return
  if (win.__tcfapi) return

  const listeners = new Map<number, TcfCallback>()
  let listenerCounter = 0

  function buildTcData(listenerId?: number) {
    const { profile, consent, tcfConfig: cfg } = getState()
    const tcfConfig = cfg ?? { enabled: false, cmpId: 0, cmpVersion: 0 }
    const { purposeConsents, vendorConsents } = buildPurposeAndVendorConsents(profile, consent)
    const gdprApplies = true
    const tcString = encodeTcString({
      cmpId: tcfConfig.cmpId,
      cmpVersion: tcfConfig.cmpVersion,
      consentScreen: 1,
      consentLanguage: 'en',
      vendorListVersion: 0,
      purposeConsents,
      vendorConsents,
    })
    return {
      tcString,
      tcfPolicyVersion: TCF_POLICY_VERSION,
      cmpId: tcfConfig.cmpId,
      cmpVersion: tcfConfig.cmpVersion,
      gdprApplies,
      eventStatus: consent ? 'tcloaded' : 'cmpuishown',
      cmpStatus: 'loaded',
      isServiceSpecific: true,
      useNonStandardStacks: false,
      publisherCC: 'AA',
      purposeOneTreatment: false,
      ...(listenerId !== undefined ? { listenerId } : {}),
      purpose: {
        consents: toBoolMap(purposeConsents, 10),
        legitimateInterests: toBoolMap([], 10),
      },
      vendor: {
        consents: toBoolMap(vendorConsents, Math.max(0, ...vendorConsents)),
        legitimateInterests: toBoolMap([], 0),
      },
    }
  }

  function notifyListeners(): void {
    for (const [listenerId, callback] of listeners) {
      callback(buildTcData(listenerId), true)
    }
  }

  function handleCommand(command: TcfCommand, _version: number, callback: TcfCallback, parameter?: unknown): void {
    switch (command) {
      case 'ping': {
        const { consent, tcfConfig } = getState()
        callback({
          gdprApplies: true,
          cmpLoaded: true,
          cmpStatus: 'loaded',
          displayStatus: consent ? 'hidden' : 'visible',
          apiVersion: API_VERSION,
          cmpVersion: tcfConfig?.cmpVersion ?? 0,
          cmpId: tcfConfig?.cmpId ?? 0,
          gvlVersion: 0,
          tcfPolicyVersion: TCF_POLICY_VERSION,
        }, true)
        return
      }
      case 'getTCData':
        callback(buildTcData(), true)
        return
      case 'addEventListener': {
        const listenerId = ++listenerCounter
        listeners.set(listenerId, callback)
        callback(buildTcData(listenerId), true)
        return
      }
      case 'removeEventListener': {
        const listenerId = typeof parameter === 'number' ? parameter : undefined
        const removed = listenerId !== undefined && listeners.delete(listenerId)
        callback(removed, removed)
        return
      }
    }
  }

  // Standard IAB stub-queue convention: scripts that load before the real stub push their
  // call onto `__tcfapi.a` instead of calling it directly. Drain it once we install for real.
  const queued = ((win.__tcfapi as { a?: QueuedCall[] } | undefined)?.a ?? []) as QueuedCall[]

  const api = ((command: TcfCommand, version: number, callback: TcfCallback, parameter?: unknown) => {
    handleCommand(command, version, callback, parameter)
  }) as { (command: TcfCommand, version: number, callback: TcfCallback, parameter?: unknown): void; a: QueuedCall[] }
  api.a = []
  win.__tcfapi = api

  window.addEventListener('consenti:consentSubmitted', notifyListeners)

  for (const [command, version, callback, parameter] of queued) {
    handleCommand(command, version, callback, parameter)
  }
}
