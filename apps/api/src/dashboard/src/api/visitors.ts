import { apiFetch } from './client'
import type { Visitor, NoticeShownRecord, PagedResult } from '@consenti/types'

export const visitorsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.q) qs.set('q', params.q)
    return apiFetch<PagedResult<Visitor>>(`/visitors?${qs}`)
  },
  noticeShown: (visitorId: string) => apiFetch<NoticeShownRecord[]>(`/visitors/${visitorId}/notice-shown`),
}
