import { apiFetch } from './client'
import type { AuditLog } from '@consenti/types'

export const auditApi = {
  list: (params?: { action?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.action) q.set('action', params.action)
    if (params?.page) q.set('page', String(params.page))
    return apiFetch<AuditLog[]>(`/audit?${q}`)
  },
}
