import { apiFetch } from './client'
import type { AuditLog, AuditLogSummary, PagedResult } from '@consenti/types'

export const auditApi = {
  list: (params?: { action?: string; page?: number; limit?: number; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.action) qs.set('action', params.action)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.q) qs.set('q', params.q)
    return apiFetch<PagedResult<AuditLogSummary>>(`/audit?${qs}`)
  },
  get: (id: string) => apiFetch<AuditLog>(`/audit/${id}`),
}
