import { apiFetch } from './client'
import type { ConsentDbRecord, ConsentSummary, ConsentHistoryEntry, PagedResult } from '@consenti/types'

export const consentsApi = {
  list: (params?: { profileId?: string | undefined; page?: number | undefined; limit?: number | undefined; from?: string | undefined; to?: string | undefined; q?: string | undefined }) => {
    const qs = new URLSearchParams()
    if (params?.profileId) qs.set('profileId', params.profileId)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    if (params?.q) qs.set('q', params.q)
    return apiFetch<PagedResult<ConsentSummary>>(`/consents?${qs}`)
  },
  get: (visitorId: string) => apiFetch<ConsentDbRecord>(`/consents/${visitorId}`),
  history: (visitorId: string) => apiFetch<ConsentHistoryEntry[]>(`/consents/${visitorId}/history`),
}
