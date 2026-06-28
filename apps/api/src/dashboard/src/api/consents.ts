import { apiFetch } from './client'
import type { ConsentDbRecord, ConsentHistoryEntry } from '@consenti/types'

export const consentsApi = {
  list: (params?: { profileId?: string | undefined; page?: number | undefined; from?: string | undefined; to?: string | undefined }) => {
    const q = new URLSearchParams()
    if (params?.profileId) q.set('profileId', params.profileId)
    if (params?.page) q.set('page', String(params.page))
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    return apiFetch<ConsentDbRecord[]>(`/consents?${q}`)
  },
  get: (visitorId: string) => apiFetch<ConsentDbRecord>(`/consents/${visitorId}`),
  history: (visitorId: string) => apiFetch<ConsentHistoryEntry[]>(`/consents/${visitorId}/history`),
}
