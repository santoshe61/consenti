import { apiFetch } from './client'
import type { ServerCookieTemplate, ServerUITemplate } from '@consenti/types'

export const cookieTemplatesApi = {
  list: () => apiFetch<ServerCookieTemplate[]>('/cookie-templates'),
  get: (id: string) => apiFetch<ServerCookieTemplate>(`/cookie-templates/${id}`),
  create: (data: { name: string; cookies: unknown[] }) =>
    apiFetch<ServerCookieTemplate>('/cookie-templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; cookies?: unknown[] }) =>
    apiFetch<ServerCookieTemplate>(`/cookie-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/cookie-templates/${id}`, { method: 'DELETE' }),
  copy: (id: string, name?: string) =>
    apiFetch<ServerCookieTemplate>(`/cookie-templates/${id}/copy`, { method: 'POST', body: JSON.stringify({ name }) }),
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
}
