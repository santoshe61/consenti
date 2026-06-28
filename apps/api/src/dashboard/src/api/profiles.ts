import { apiFetch } from './client'
import type { DashboardProfile } from '@consenti/types'

export const profilesApi = {
  list: () => apiFetch<DashboardProfile[]>('/profiles'),
  get: (id: string) => apiFetch<DashboardProfile>(`/profiles/${id}`),
  create: (data: unknown) => apiFetch<DashboardProfile>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiFetch<DashboardProfile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/profiles/${id}`, { method: 'DELETE' }),
  previewUrl: (draft: unknown) => `/consenti/api/profiles/preview?draft=${encodeURIComponent(JSON.stringify(draft))}`,
}
