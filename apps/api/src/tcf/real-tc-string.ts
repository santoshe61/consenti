/**
 * Spec-correct IAB TCF v2.3 binary TC-string encoding.
 *
 * `tcModel.policyVersion` isn't set explicitly here — `@iabtechlabtcf/core`'s `TCModel` derives
 * it live from `gvl.tcfPolicyVersion` once a `GVL` instance is attached (this file always attaches
 * one), so the encoded policy version always reflects whatever the cached vendor-list.json
 * currently declares — 5 for TCF v2.3 — without needing a version bump here when IAB revises the
 * policy again.
 *
 * Requires the optional `@iabtechlabtcf/core` peer dependency (the actively-maintained IAB
 * Tech Lab package — not `iabtcf-core`, which no longer exists on npm). Dynamically imported
 * so `@consenti/api` stays dependency-free for the majority of installs that never enable TCF,
 * matching the existing optional-peer-dependency pattern used for the Mongo/Postgres/MySQL
 * storage adapters.
 *
 * Legitimate-interest note: Consenti's cookie schema has no per-cookie legitimate-interest
 * purpose field and no user-facing "object to legitimate interest" control yet. Until that
 * exists, `vendorLegitimateInterests`/`purposeLegitimateInterests` are derived from the GVL's
 * own vendor metadata (what each already-consented vendor declares) rather than left empty —
 * an improvement over a placeholder, but not a substitute for a real objection flow.
 */

import type { GvlData } from './gvl-cache'

export interface RealTcStringInput {
  cmpId: number
  cmpVersion: number
  consentScreen: number
  consentLanguage: string
  publisherCC: string
  isServiceSpecific: boolean
  purposeConsents: number[]
  vendorConsents: number[]
  gvl: GvlData
}

type IabtcfCoreModule = typeof import('@iabtechlabtcf/core')

let importAttempted = false
let iabtcfCoreModule: IabtcfCoreModule | null = null
let warnedMissingDependency = false

async function loadIabtcfCore(): Promise<IabtcfCoreModule | null> {
  if (importAttempted) return iabtcfCoreModule
  importAttempted = true
  try {
    iabtcfCoreModule = await import('@iabtechlabtcf/core')
  } catch {
    iabtcfCoreModule = null
  }
  return iabtcfCoreModule
}

export async function isRealTcfEncodingAvailable(): Promise<boolean> {
  return (await loadIabtcfCore()) !== null
}

function deriveLegitimateInterests(vendorConsents: number[], gvl: GvlData): {
  vendorLegitimateInterests: number[]
  purposeLegitimateInterests: number[]
} {
  const vendorLI = new Set<number>()
  const purposeLI = new Set<number>()
  for (const vendorId of vendorConsents) {
    const vendor = gvl.vendors[String(vendorId)]
    if (!vendor?.legIntPurposes?.length) continue
    vendorLI.add(vendorId)
    for (const p of vendor.legIntPurposes) purposeLI.add(p)
  }
  return {
    vendorLegitimateInterests: [...vendorLI].sort((a, b) => a - b),
    purposeLegitimateInterests: [...purposeLI].sort((a, b) => a - b),
  }
}

/**
 * Encodes a spec-correct binary TC string. Returns `null` (never throws) when the optional
 * dependency isn't installed — callers fall back to the simplified encoder and should log
 * that decision themselves; TCF is opt-in, so a missing dependency isn't a hard failure.
 */
export async function encodeRealTcString(input: RealTcStringInput): Promise<string | null> {
  const mod = await loadIabtcfCore()
  if (!mod) {
    if (!warnedMissingDependency) {
      warnedMissingDependency = true
      // eslint-disable-next-line no-console
      console.warn(
        '[consenti] TCF is enabled but the optional "@iabtechlabtcf/core" dependency is not ' +
        'installed. Falling back to a simplified, non-spec-compliant TC string. Run ' +
        '`npm install @iabtechlabtcf/core` to produce real IAB-spec binary TC strings.',
      )
    }
    return null
  }

  const { TCModel, TCString, GVL } = mod
  const gvl = new GVL(input.gvl.raw as unknown as ConstructorParameters<typeof GVL>[0])
  const tcModel = new TCModel(gvl)

  tcModel.cmpId = input.cmpId
  tcModel.cmpVersion = input.cmpVersion
  tcModel.consentScreen = input.consentScreen
  tcModel.consentLanguage = input.consentLanguage
  tcModel.publisherCountryCode = input.publisherCC
  tcModel.isServiceSpecific = input.isServiceSpecific

  tcModel.purposeConsents.set(input.purposeConsents)
  tcModel.vendorConsents.set(input.vendorConsents)

  const { vendorLegitimateInterests, purposeLegitimateInterests } =
    deriveLegitimateInterests(input.vendorConsents, input.gvl)
  tcModel.purposeLegitimateInterests.set(purposeLegitimateInterests)
  tcModel.vendorLegitimateInterests.set(vendorLegitimateInterests)
  tcModel.vendorsDisclosed.set(input.vendorConsents)

  return TCString.encode(tcModel)
}
