import { apiFetch } from './client'
import type { Role, Permission } from '@consenti/types'

export const rolesApi = {
  list: () => apiFetch<Role[]>('/roles'),
  permissions: (roleId: string) => apiFetch<Permission[]>(`/roles/${roleId}/permissions`),
  allPermissions: () => apiFetch<Permission[]>('/permissions'),
  create: (data: { name: string; description?: string | undefined }) =>
    apiFetch<Role>('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string | undefined; description?: string | undefined }) =>
    apiFetch<Role>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/roles/${id}`, { method: 'DELETE' }),
  assignPermission: (roleId: string, permissionId: string) =>
    apiFetch<void>(`/roles/${roleId}/permissions`, { method: 'POST', body: JSON.stringify({ permissionId }) }),
  revokePermission: (roleId: string, permissionId: string) =>
    apiFetch<void>(`/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' }),
}
