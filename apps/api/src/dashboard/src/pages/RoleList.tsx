import { useEffect, useState } from 'preact/hooks'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { rolesApi } from '../api/roles'
import type { Role, Permission } from '@consenti/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupPermissions(perms: Permission[]): Array<{ group: string; items: Permission[] }> {
  const map: Record<string, Permission[]> = {}
  for (const p of perms) {
    const group = p.name.includes(':') ? p.name.split(':')[0]! : 'other'
    ;(map[group] ??= []).push(p)
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, items]) => ({ group, items }))
}

// ── Inline role form ───────────────────────────────────────────────────────────

function RoleForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: { name: string; description: string }
  onSave: (name: string, description: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const nameEmpty = !name.trim()

  const submit = (e: Event) => {
    e.preventDefault()
    if (nameEmpty) return
    onSave(name.trim(), desc.trim())
  }

  return (
    <form onSubmit={submit} class="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-0.5">
          Role name <span class="text-red-500">*</span>
        </label>
        <input
          class={`w-full border rounded px-2 py-1.5 text-sm ${nameEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
          value={name}
          onInput={e => setName((e.target as HTMLInputElement).value)}
          placeholder="e.g. Editor"
          autoFocus
        />
        {nameEmpty && <p class="text-xs text-red-500 mt-0.5">Required</p>}
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-0.5">Description</label>
        <input
          class="w-full border border-gray-300 bg-white rounded px-2 py-1.5 text-sm"
          value={desc}
          onInput={e => setDesc((e.target as HTMLInputElement).value)}
          placeholder="Optional description"
        />
      </div>
      <div class="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || nameEmpty}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Check size={12} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RoleList({ current }: { current: string }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [allPerms, setAllPerms] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePerms, setRolePerms] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    Promise.all([rolesApi.list(), rolesApi.allPermissions()])
      .then(([r, p]) => { setRoles(r); setAllPerms(p) })
      .catch(() => setError('Failed to load roles.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const selectRole = (role: Role) => {
    if (editingId === role.id) return
    setSelectedRole(role)
    rolesApi.permissions(role.id).then(setRolePerms).catch(() => {})
  }

  const togglePerm = async (perm: Permission) => {
    if (!selectedRole) return
    const has = rolePerms.some(p => p.id === perm.id)
    try {
      if (has) {
        await rolesApi.revokePermission(selectedRole.id, perm.id)
        setRolePerms(p => p.filter(x => x.id !== perm.id))
      } else {
        await rolesApi.assignPermission(selectedRole.id, perm.id)
        setRolePerms(p => [...p, perm])
      }
    } catch {
      setError('Failed to update permission.')
    }
  }

  const handleCreate = async (name: string, description: string) => {
    setSaving(true)
    setError('')
    try {
      const role = await rolesApi.create({ name, description: description || undefined })
      setCreating(false)
      load()
      setSelectedRole(role)
      rolesApi.permissions(role.id).then(setRolePerms).catch(() => {})
    } catch {
      setError('Failed to create role.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string, name: string, description: string) => {
    setSaving(true)
    setError('')
    try {
      await rolesApi.update(id, { name, description: description || undefined })
      setEditingId(null)
      load()
      if (selectedRole?.id === id) {
        setSelectedRole(prev => prev ? { ...prev, name, description } : prev)
      }
    } catch {
      setError('Failed to update role.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    const ok = await requestConfirm({
      title: `Delete role "${role.name}"?`,
      message: 'Users assigned this role will lose its permissions immediately.',
    })
    if (!ok) return
    try {
      await rolesApi.delete(role.id)
      if (selectedRole?.id === role.id) { setSelectedRole(null); setRolePerms([]) }
      load()
    } catch {
      setError('Failed to delete role.')
    }
  }

  const grouped = groupPermissions(allPerms)

  return (
    <Layout title="Roles & Permissions" current={current}>
      {dialog}

      {error && (
        <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>
      )}

      {loading ? (
        <p class="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">

          {/* ── Left: role list ─────────────────────────────────────────── */}
          <div>
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-sm font-semibold text-gray-700">Roles</h2>
              <button
                onClick={() => { setCreating(true); setEditingId(null) }}
                class="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Plus size={12} /> New Role
              </button>
            </div>

            <div class="space-y-2">
              {creating && (
                <RoleForm
                  onSave={handleCreate}
                  onCancel={() => setCreating(false)}
                  saving={saving}
                />
              )}

              {roles.map(role => {
                const isSelected = selectedRole?.id === role.id
                const isEditing = editingId === role.id

                if (isEditing) {
                  return (
                    <RoleForm
                      key={role.id}
                      initial={{ name: role.name, description: role.description ?? '' }}
                      onSave={(name, desc) => handleUpdate(role.id, name, desc)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  )
                }

                return (
                  <div
                    key={role.id}
                    class={`group flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => selectRole(role)}
                  >
                    <div class="flex-1 min-w-0">
                      <p class={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{role.name}</p>
                      {role.description && (
                        <p class="text-xs text-gray-400 mt-0.5 truncate">{role.description}</p>
                      )}
                    </div>
                    <div class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setEditingId(role.id); setCreating(false) }}
                        class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Edit role"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleDelete(role) }}
                        class="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Delete role"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {roles.length === 0 && !creating && (
                <p class="text-sm text-gray-400 text-center py-6">No roles yet. Create one to get started.</p>
              )}
            </div>
          </div>

          {/* ── Right: permissions ──────────────────────────────────────── */}
          <div>
            <h2 class="text-sm font-semibold text-gray-700 mb-2">
              {selectedRole ? `Permissions — ${selectedRole.name}` : 'Select a role to manage permissions'}
            </h2>

            {selectedRole ? (
              <div class="space-y-4">
                {grouped.map(({ group, items }) => (
                  <div key={group} class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{group}</span>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="text-xs text-blue-600 hover:underline"
                          onClick={() => {
                            const allGranted = items.every(p => rolePerms.some(rp => rp.id === p.id))
                            const toToggle = allGranted
                              ? items.filter(p => rolePerms.some(rp => rp.id === p.id))
                              : items.filter(p => !rolePerms.some(rp => rp.id === p.id))
                            toToggle.forEach(p => togglePerm(p))
                          }}
                        >
                          {items.every(p => rolePerms.some(rp => rp.id === p.id)) ? 'Revoke all' : 'Grant all'}
                        </button>
                      </div>
                    </div>
                    <div class="divide-y divide-gray-50">
                      {items.map(perm => {
                        const has = rolePerms.some(p => p.id === perm.id)
                        return (
                          <label
                            key={perm.id}
                            class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={has}
                              onChange={() => togglePerm(perm)}
                              class="w-4 h-4 accent-blue-600 rounded shrink-0"
                            />
                            <div class="min-w-0">
                              <p class="text-sm font-medium text-gray-700 font-mono">{perm.name}</p>
                              {perm.description && (
                                <p class="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                              )}
                            </div>
                            {has && (
                              <span class="ml-auto shrink-0 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                granted
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {allPerms.length === 0 && (
                  <p class="text-sm text-gray-400">No permissions defined in the system.</p>
                )}
              </div>
            ) : (
              <div class="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p class="text-sm text-gray-400">Click a role on the left to view and manage its permissions.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
