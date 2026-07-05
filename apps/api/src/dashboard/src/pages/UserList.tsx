import { useEffect, useState } from 'preact/hooks'
import { Eye, EyeOff } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { PermissionGate } from '../components/PermissionGate'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT } from '../context/locale'
import { usersApi } from '../api/users'
import { rolesApi } from '../api/roles'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/auth'
import type { DashboardAdminUser, Role } from '@consenti/types'

interface Tenant { id: string; name: string; slug: string }

export function UserList({ current }: { current: string }) {
  const { user: me } = useAuth()
  const t = useT()
  const [users, setUsers] = useState<DashboardAdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', roleId: '', allowedTenants: [] as string[] })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<DashboardAdminUser | null>(null)
  const [editAllowedTenants, setEditAllowedTenants] = useState<string[]>([])
  const [editError, setEditError] = useState('')
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    Promise.all([usersApi.list(), rolesApi.list(), apiFetch<Tenant[]>('/tenants').catch(() => [] as Tenant[])])
      .then(([u, r, ts]) => { setUsers(u); setRoles(r); setTenants(ts) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleAllowedTenant = (tenantId: string) => {
    setForm(f => ({
      ...f,
      allowedTenants: f.allowedTenants.includes(tenantId)
        ? f.allowedTenants.filter(id => id !== tenantId)
        : [...f.allowedTenants, tenantId],
    }))
  }

  const handleCreate = async (e: Event) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError(t('users.createForm.passwordMismatch'))
      return
    }
    setError('')
    try {
      await usersApi.create({
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: form.roleId || undefined,
        ...(form.allowedTenants.length > 0 ? { allowedTenants: form.allowedTenants } : {}),
      })
      setCreating(false)
      setForm({ name: '', email: '', password: '', confirmPassword: '', roleId: '', allowedTenants: [] })
      setShowPassword(false)
      setShowConfirmPassword(false)
      load()
    } catch {
      setError(t('users.createForm.error'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: t('users.dialog.delete.title', { name }),
      message: t('users.dialog.delete.message'),
    })
    if (!ok) return
    await usersApi.delete(id).catch(() => {})
    load()
  }

  const handleToggleActive = async (user: DashboardAdminUser) => {
    await usersApi.update(user.id, { isActive: !user.isActive }).catch(() => {})
    load()
  }

  const openEdit = (u: DashboardAdminUser) => {
    setEditingUser(u)
    setEditAllowedTenants(u.allowedTenants ?? [])
    setEditError('')
  }

  const handleEditSave = async () => {
    if (!editingUser) return
    try {
      await usersApi.update(editingUser.id, { allowedTenants: editAllowedTenants })
      setEditingUser(null)
      load()
    } catch {
      setEditError(t('users.edit.error.save'))
    }
  }

  const toggleEditTenant = (tenantId: string) => {
    setEditAllowedTenants(prev =>
      prev.includes(tenantId) ? prev.filter(id => id !== tenantId) : [...prev, tenantId]
    )
  }

  return (
    <Layout title={t('users.title')} current={current}>
      {dialog}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{t('users.count', { n: users.length })}</p>
        <PermissionGate perm="user:create">
          <button
            onClick={() => setCreating(!creating)}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {creating ? t('common.cancel') : t('users.newUser')}
          </button>
        </PermissionGate>
      </div>

      {editingUser && (
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" onClick={() => setEditingUser(null)} aria-hidden="true" />
          <div class="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900">{t('users.edit.title', { name: editingUser.name })}</h3>
            {tenants.length > 0 && (
              <div>
                <p class="text-xs font-medium text-gray-700 mb-1.5">
                  {t('users.allowedSites')}
                  <span class="ml-1.5 font-normal text-gray-400">{t('users.allowedSitesHint')}</span>
                </p>
                <div class="flex flex-wrap gap-2">
                  {tenants.map(tn => (
                    <label key={tn.id} class={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs cursor-pointer select-none transition-colors ${editAllowedTenants.includes(tn.id) ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input
                        type="checkbox"
                        class="accent-blue-600"
                        checked={editAllowedTenants.includes(tn.id)}
                        onChange={() => toggleEditTenant(tn.id)}
                      />
                      {tn.name || tn.slug}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {editError && <p class="text-xs text-red-600">{editError}</p>}
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditingUser(null)} class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="button" onClick={handleEditSave} class="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} class="bg-white border border-gray-200 rounded-lg p-5 mb-4 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700">{t('users.createForm.title')}</h3>
          <div class="grid grid-cols-2 gap-3">
            <input
              class="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder={t('users.createForm.namePlaceholder')}
              aria-label={t('common.name')}
              required
              value={form.name}
              onInput={e => setForm(f => ({ ...f, name: (e.target as HTMLInputElement).value }))}
            />
            <input
              class="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder={t('users.createForm.emailPlaceholder')}
              aria-label={t('common.email')}
              type="email"
              required
              value={form.email}
              onInput={e => setForm(f => ({ ...f, email: (e.target as HTMLInputElement).value }))}
            />
            <div class="relative">
              <input
                class="w-full border border-gray-300 rounded px-3 py-2 pr-9 text-sm"
                placeholder={t('users.createForm.passwordPlaceholder')}
                aria-label={t('users.createForm.passwordPlaceholder')}
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onInput={e => setForm(f => ({ ...f, password: (e.target as HTMLInputElement).value }))}
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                title={showPassword ? t('common.hidePassword') : t('common.showPassword')}
              >
                {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>
            <div class="relative">
              <input
                class={`w-full border rounded px-3 py-2 pr-9 text-sm ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder={t('users.createForm.confirmPasswordPlaceholder')}
                aria-label={t('users.createForm.confirmPasswordPlaceholder')}
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onInput={e => setForm(f => ({ ...f, confirmPassword: (e.target as HTMLInputElement).value }))}
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(s => !s)}
                aria-label={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}
                title={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}
              >
                {showConfirmPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm col-span-2"
              value={form.roleId}
              aria-label={t('common.roles')}
              onChange={e => setForm(f => ({ ...f, roleId: (e.target as HTMLSelectElement).value }))}
            >
              <option value="">{t('users.createForm.selectRole')}</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {tenants.length > 0 && (
            <div>
              <p class="text-xs font-medium text-gray-700 mb-1.5">
                {t('users.allowedSites')}
                <span class="ml-1.5 font-normal text-gray-400">{t('users.allowedSitesHint')}</span>
              </p>
              <div class="flex flex-wrap gap-2">
                {tenants.map(t => (
                  <label key={t.id} class={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs cursor-pointer select-none transition-colors ${form.allowedTenants.includes(t.id) ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input
                      type="checkbox"
                      class="accent-blue-600"
                      checked={form.allowedTenants.includes(t.id)}
                      onChange={() => toggleAllowedTenant(t.id)}
                    />
                    {t.name || t.slug}
                  </label>
                ))}
              </div>
            </div>
          )}
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p role="alert" class="text-xs text-red-600">{t('users.createForm.passwordMismatch')}</p>
          )}
          {error && <p role="alert" class="text-sm text-red-600">{error}</p>}
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">{t('common.create')}</button>
        </form>
      )}

      <Table
        loading={loading}
        keyFn={r => (r as unknown as DashboardAdminUser).id}
        rows={users as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'name', label: t('common.name') },
          { key: 'email', label: t('common.email') },
          {
            key: 'isActive', label: t('users.col.status'),
            render: r => {
              const u = r as unknown as DashboardAdminUser
              return (
                <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.isActive ? t('users.status.active') : t('users.status.inactive')}
                </span>
              )
            },
          },
          { key: 'createdAt', label: t('common.created'), render: r => new Date((r as unknown as DashboardAdminUser).createdAt).toLocaleDateString() },
          {
            key: 'actions', label: '',
            render: r => {
              const u = r as unknown as DashboardAdminUser
              if (u.id === me?.sub) return <span class="text-xs text-gray-400">{t('common.you')}</span>
              return (
                <div class="flex gap-2">
                  <PermissionGate perm="user:update">
                    <button onClick={() => openEdit(u)} class="text-xs text-gray-600 hover:underline">
                      {t('common.edit')}
                    </button>
                    <button onClick={() => handleToggleActive(u)} class="text-xs text-blue-600 hover:underline">
                      {u.isActive ? t('users.action.deactivate') : t('users.action.activate')}
                    </button>
                  </PermissionGate>
                  <PermissionGate perm="user:delete">
                    <button onClick={() => handleDelete(u.id, u.name)} class="text-xs text-red-500 hover:underline">
                      {t('common.delete')}
                    </button>
                  </PermissionGate>
                </div>
              )
            },
          },
        ]}
      />
    </Layout>
  )
}
