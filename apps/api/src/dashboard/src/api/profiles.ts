import { apiFetch } from './client'
import type { DashboardProfile, ProfileSummary, ProfileVersionEntry, ArchivedProfileSummary, ComplianceValidationResult } from '@consenti/types'

export type ProfileSaveResult =
  | { profile: DashboardProfile; warnings?: unknown[]; requiresChoice?: undefined }
  | { conflict: { id: string; name: string }; requiresChoice: true }

export type ActivateResult =
  | (DashboardProfile & { requiresChoice?: undefined })
  | { conflict: { id: string; name: string }; requiresChoice: true }

export const profilesApi = {
  list: () => apiFetch<DashboardProfile[]>('/profiles'),
  listSummary: () => apiFetch<ProfileSummary[]>('/profiles?summary=1'),
  get: (id: string) => apiFetch<DashboardProfile>(`/profiles/${id}`),
  create: (data: unknown) => apiFetch<ProfileSaveResult>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiFetch<ProfileSaveResult>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  validateCompliance: (data: { complianceGroup: string; cookies: Record<string, unknown>; categories: Record<string, unknown> }) =>
    apiFetch<ComplianceValidationResult>('/profiles/validate', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/profiles/${id}`, { method: 'DELETE' }),
  copy: (id: string, name?: string) =>
    apiFetch<DashboardProfile>(`/profiles/${id}/copy`, { method: 'POST', ...(name ? { body: JSON.stringify({ name }) } : {}) }),
  activate: (id: string, body?: { choice: 'deactivate' }) => apiFetch<ActivateResult>(`/profiles/${id}/activate`, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) }),
  deactivate: (id: string) => apiFetch<DashboardProfile>(`/profiles/${id}/deactivate`, { method: 'POST' }),
  listVersions: (id: string) => apiFetch<ProfileVersionEntry[]>(`/profiles/${id}/versions`),
  listArchived: () => apiFetch<ArchivedProfileSummary[]>('/profiles/archived'),
  getVersion: (id: string, entryId: string, locale = 'default') =>
    apiFetch<unknown>(`/profiles/${id}/versions/${entryId}?locale=${encodeURIComponent(locale)}`),
  previewUrl: (draft: unknown) => `/consenti/api/profiles/preview?draft=${encodeURIComponent(JSON.stringify(draft))}`,
}
