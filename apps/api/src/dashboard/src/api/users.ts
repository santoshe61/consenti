import { apiFetch } from './client'
import type { DashboardAdminUser } from '@consenti/types'

export const usersApi = {
  list: () => apiFetch<DashboardAdminUser[]>('/users'),
  get: (id: string) => apiFetch<DashboardAdminUser>(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; roleId?: string | undefined; allowedTenants?: string[] }) =>
    apiFetch<DashboardAdminUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; email?: string; isActive?: boolean; password?: string; allowedTenants?: string[] }) =>
    apiFetch<DashboardAdminUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' }),
  assignRole: (userId: string, roleId: string) =>
    apiFetch<void>(`/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleId }) }),
  revokeRole: (userId: string, roleId: string) =>
    apiFetch<void>(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
}
