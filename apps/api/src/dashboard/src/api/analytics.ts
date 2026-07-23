import { apiFetch } from './client'
import type { OptInStats, OptInFilters } from '@consenti/types'

export const analyticsApi = {
  optIn: (filters: OptInFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.profileId) params.set('profileId', filters.profileId)
    if (filters.complianceGroup) params.set('complianceGroup', filters.complianceGroup)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.locale) params.set('locale', filters.locale)
    const qs = params.toString()
    return apiFetch<OptInStats>(`/analytics/opt-in${qs ? `?${qs}` : ''}`)
  },
}
