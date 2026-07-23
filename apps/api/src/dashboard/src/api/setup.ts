import { apiFetch } from './client'
import type { ComplianceGroupId, TenantSettings } from '@consenti/types'

export interface SetupComplianceGroup {
  id: ComplianceGroupId
  label: string
  description: string
  compliances: readonly string[]
  defaultGpc: 'ignore' | 'honor' | 'strict'
  gpcAutoHonor: boolean
  allowsLegitimateInterest: boolean
  allowsTcf: boolean
  requiresCpraCategory: boolean
  requiresDpdpaDisclosure: boolean
}

export interface SetupConfigResponse {
  config: Record<string, unknown>
  usingJsonStorage: boolean
  usingDefaultCredentials: boolean
}

export const setupApi = {
  status: () => apiFetch<{ completed: boolean }>('/setup/status'),
  config: () => apiFetch<SetupConfigResponse>('/setup/config'),
  complianceGroups: () => apiFetch<SetupComplianceGroup[]>('/setup/compliance-groups'),
  seedProfiles: (groups: string[]) =>
    apiFetch<{ seeded: string[] }>('/setup/seed-profiles', { method: 'POST', body: JSON.stringify({ groups }) }),
  complete: () => apiFetch<TenantSettings>('/setup/complete', { method: 'POST' }),
}
