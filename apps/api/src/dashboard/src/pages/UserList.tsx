import { useEffect, useState } from 'preact/hooks'
import { Eye, EyeOff } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { PermissionGate } from '../components/PermissionGate'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { usersApi } from '../api/users'
import { rolesApi } from '../api/roles'
import { useAuth } from '../context/auth'
import type { DashboardDashboardAdminUser, Role } from '@consenti/types'

export function UserList({ current }: { current: string }) {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<DashboardAdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', roleId: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    Promise.all([usersApi.list(), rolesApi.list()])
      .then(([u, r]) => { setUsers(u); setRoles(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleCreate = async (e: Event) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    try {
      await usersApi.create({ name: form.name, email: form.email, password: form.password, roleId: form.roleId || undefined })
      setCreating(false)
      setForm({ name: '', email: '', password: '', confirmPassword: '', roleId: '' })
      setShowPassword(false)
      setShowConfirmPassword(false)
      load()
    } catch {
      setError('Failed to create user')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: `Delete user "${name}"?`,
      message: 'This user account will be permanently removed.',
    })
    if (!ok) return
    await usersApi.delete(id).catch(() => {})
    load()
  }

  const handleToggleActive = async (user: DashboardAdminUser) => {
    await usersApi.update(user.id, { isActive: !user.isActive }).catch(() => {})
    load()
  }

  return (
    <Layout title="Users" current={current}>
      {dialog}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{users.length} users</p>
        <PermissionGate perm="user:create">
          <button
            onClick={() => setCreating(!creating)}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {creating ? 'Cancel' : '+ New User'}
          </button>
        </PermissionGate>
      </div>

      {creating && (
        <form onSubmit={handleCreate} class="bg-white border border-gray-200 rounded-lg p-5 mb-4 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700">Create User</h3>
          <div class="grid grid-cols-2 gap-3">
            <input
              class="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Name"
              required
              value={form.name}
              onInput={e => setForm(f => ({ ...f, name: (e.target as HTMLInputElement).value }))}
            />
            <input
              class="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
              required
              value={form.email}
              onInput={e => setForm(f => ({ ...f, email: (e.target as HTMLInputElement).value }))}
            />
            <div class="relative">
              <input
                class="w-full border border-gray-300 rounded px-3 py-2 pr-9 text-sm"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onInput={e => setForm(f => ({ ...f, password: (e.target as HTMLInputElement).value }))}
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(s => !s)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div class="relative">
              <input
                class={`w-full border rounded px-3 py-2 pr-9 text-sm ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onInput={e => setForm(f => ({ ...f, confirmPassword: (e.target as HTMLInputElement).value }))}
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(s => !s)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm col-span-2"
              value={form.roleId}
              onChange={e => setForm(f => ({ ...f, roleId: (e.target as HTMLSelectElement).value }))}
            >
              <option value="">Select role…</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p class="text-xs text-red-600">Passwords do not match</p>
          )}
          {error && <p class="text-sm text-red-600">{error}</p>}
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">Create</button>
        </form>
      )}

      <Table
        loading={loading}
        keyFn={r => (r as unknown as DashboardAdminUser).id}
        rows={users as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'isActive', label: 'Status',
            render: r => {
              const u = r as unknown as DashboardAdminUser
              return (
                <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              )
            },
          },
          { key: 'createdAt', label: 'Created', render: r => new Date((r as unknown as DashboardAdminUser).createdAt).toLocaleDateString() },
          {
            key: 'actions', label: '',
            render: r => {
              const u = r as unknown as DashboardAdminUser
              if (u.id === me?.sub) return <span class="text-xs text-gray-400">You</span>
              return (
                <div class="flex gap-2">
                  <PermissionGate perm="user:update">
                    <button onClick={() => handleToggleActive(u)} class="text-xs text-blue-600 hover:underline">
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </PermissionGate>
                  <PermissionGate perm="user:delete">
                    <button onClick={() => handleDelete(u.id, u.name)} class="text-xs text-red-500 hover:underline">Delete</button>
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
