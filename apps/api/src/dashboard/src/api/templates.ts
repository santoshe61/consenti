import { apiFetch } from './client'
import type { ServerConsentTemplate, ServerUITemplate, CookieMap, CategoryMap, ProfileSummary } from '@consenti/types'

export const consentTemplatesApi = {
  list: () => apiFetch<ServerConsentTemplate[]>('/consent-templates'),
  get: (id: string) => apiFetch<ServerConsentTemplate>(`/consent-templates/${id}`),
  create: (data: { name: string; cookies: CookieMap; categories: CategoryMap }) =>
    apiFetch<ServerConsentTemplate>('/consent-templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; cookies?: CookieMap; categories?: CategoryMap }) =>
    apiFetch<ServerConsentTemplate>(`/consent-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/consent-templates/${id}`, { method: 'DELETE' }),
  copy: (id: string, name?: string) =>
    apiFetch<ServerConsentTemplate>(`/consent-templates/${id}/copy`, { method: 'POST', body: JSON.stringify({ name }) }),
  profileUsage: (id: string) => apiFetch<ProfileSummary[]>(`/consent-templates/${id}/profile-usage`),
}

export const uiTemplatesApi = {
  list: () => apiFetch<ServerUITemplate[]>('/ui-templates'),
  get: (id: string) => apiFetch<ServerUITemplate>(`/ui-templates/${id}`),
  create: (data: Omit<ServerUITemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
    apiFetch<ServerUITemplate>('/ui-templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<ServerUITemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>) =>
    apiFetch<ServerUITemplate>(`/ui-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/ui-templates/${id}`, { method: 'DELETE' }),
  copy: (id: string, name?: string) =>
    apiFetch<ServerUITemplate>(`/ui-templates/${id}/copy`, { method: 'POST', body: JSON.stringify({ name }) }),
  profileUsage: (id: string) => apiFetch<ProfileSummary[]>(`/ui-templates/${id}/profile-usage`),
}
