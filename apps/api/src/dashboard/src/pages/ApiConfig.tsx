import { useEffect, useState } from 'preact/hooks'
import { Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { apiFetch } from '../api/client'

interface ApiKey { id: string; name: string; isActive: boolean; createdAt: string }
interface NewKey { id: string; name: string; key: string; createdAt: string }

interface Settings { allowedOrigins?: string[] }

export function ApiConfig({ current }: { current: string }) {
  // ── Allowed origins ──────────────────────────────────────────────────────────
  const [origins, setOrigins] = useState<string[]>([])
  const [newOrigin, setNewOrigin] = useState('')
  const [originSaving, setOriginSaving] = useState(false)
  const [originError, setOriginError] = useState('')

  // ── API tokens ───────────────────────────────────────────────────────────────
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<NewKey | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(true)

  const { requestConfirm, dialog } = useConfirmDialog()

  // ── Load ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch<Settings>('/settings')
      .then(s => setOrigins(s.allowedOrigins ?? []))
      .catch(() => {})

    apiFetch<ApiKey[]>('/apikeys')
      .then(setKeys)
      .catch(() => {})
      .finally(() => setLoadingKeys(false))
  }, [])

  // ── Origins handlers ─────────────────────────────────────────────────────────
  const saveOrigins = async (updated: string[]) => {
    setOriginSaving(true)
    setOriginError('')
    try {
      await apiFetch('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ allowedOrigins: updated }),
      })
      setOrigins(updated)
    } catch {
      setOriginError('Failed to save. Please try again.')
    } finally {
      setOriginSaving(false)
    }
  }

  const addOrigin = async () => {
    const value = newOrigin.trim().replace(/\/$/, '')
    if (!value) return
    if (origins.includes(value)) { setOriginError('Already in the list.'); return }
    setNewOrigin('')
    await saveOrigins([...origins, value])
  }

  const removeOrigin = async (origin: string) => {
    await saveOrigins(origins.filter(o => o !== origin))
  }

  // ── Token handlers ───────────────────────────────────────────────────────────
  const loadKeys = () => {
    apiFetch<ApiKey[]>('/apikeys').then(setKeys).catch(() => {})
  }

  const createKey = async () => {
    if (!keyName.trim()) { setKeyError('Name is required'); return }
    setKeyError('')
    try {
      const created = await apiFetch<NewKey>('/apikeys', {
        method: 'POST',
        body: JSON.stringify({ name: keyName.trim() }),
      })
      setNewKey(created)
      setShowNewKey(false)
      setKeyCopied(false)
      setKeyName('')
      setKeys(prev => [...prev, { id: created.id, name: created.name, isActive: true, createdAt: created.createdAt }])
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : 'Failed to create token')
    }
  }

  const revokeKey = async (id: string) => {
    const ok = await requestConfirm({
      title: 'Revoke this API token?',
      message: 'Any application using this token will immediately lose access.',
      danger: true,
    })
    if (!ok) return
    try {
      await apiFetch(`/apikeys/${id}`, { method: 'DELETE' })
      setKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false } : k))
      loadKeys()
    } catch {
      // ignore
    }
  }

  const copyKey = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey.key).then(() => {
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    })
  }

  return (
    <Layout title="API Configuration" current={current}>
      {dialog}

      <div class="max-w-2xl space-y-6">

        {/* ── Allowed Origins ──────────────────────────────────────────────── */}
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Allowed Origins</h2>
          <p class="text-xs text-gray-500 mb-4">
            Only requests from these origins will receive consent data. Use <code class="bg-gray-100 px-1 rounded">*</code> to allow all (not recommended for production).
          </p>

          <div class="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="https://example.com"
              value={newOrigin}
              onInput={e => { setNewOrigin((e.target as HTMLInputElement).value); setOriginError('') }}
              onKeyDown={e => e.key === 'Enter' && addOrigin()}
              class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <button
              onClick={addOrigin}
              disabled={originSaving || !newOrigin.trim()}
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {originError && <p class="text-xs text-red-600 mb-2">{originError}</p>}

          {origins.length === 0 ? (
            <p class="text-xs text-gray-400 py-3 text-center">No origins configured — all origins are currently allowed.</p>
          ) : (
            <ul class="border border-gray-200 rounded divide-y divide-gray-100 text-sm">
              {origins.map(origin => (
                <li key={origin} class="flex items-center justify-between px-3 py-2 group">
                  <span class="font-mono text-gray-700 text-xs">{origin}</span>
                  <button
                    onClick={() => removeOrigin(origin)}
                    disabled={originSaving}
                    class="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── API Tokens ───────────────────────────────────────────────────── */}
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Admin API Tokens</h2>
          <p class="text-xs text-gray-500 mb-4">
            Bearer tokens for server-side and CI/CD access to the Consenti <strong>admin</strong> API.
            Pass as <code class="font-mono bg-gray-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code>.
            Never expose in client-side code — these grant full admin access.
          </p>

          {newKey && (
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p class="text-xs font-medium text-green-800 mb-2">Token created — copy it now, it won't be shown again.</p>
              <div class="flex items-center gap-2">
                <code class={`flex-1 text-xs font-mono text-green-700 break-all ${showNewKey ? '' : 'blur-sm select-none'}`}>
                  {newKey.key}
                </code>
                <button
                  type="button"
                  onClick={() => setShowNewKey(s => !s)}
                  class="shrink-0 text-gray-500 hover:text-gray-700"
                  title={showNewKey ? 'Hide' : 'Show'}
                >
                  {showNewKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={copyKey}
                  class="shrink-0 text-gray-500 hover:text-green-700"
                  title="Copy to clipboard"
                >
                  {keyCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          <div class="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Token name (e.g. CI deploy)"
              value={keyName}
              onInput={e => setKeyName((e.target as HTMLInputElement).value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <button
              onClick={createKey}
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
          {keyError && <p class="text-xs text-red-600 mb-2">{keyError}</p>}

          {!loadingKeys && keys.length === 0 && (
            <p class="text-xs text-gray-400 py-3 text-center">No tokens yet.</p>
          )}

          {keys.length > 0 && (
            <table class="w-full text-xs border border-gray-200 rounded overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-3 py-2 text-gray-600 font-medium">Name</th>
                  <th class="text-left px-3 py-2 text-gray-600 font-medium">Status</th>
                  <th class="text-left px-3 py-2 text-gray-600 font-medium">Created</th>
                  <th class="px-3 py-2" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {keys.map(k => (
                  <tr key={k.id}>
                    <td class="px-3 py-2 font-mono">{k.name}</td>
                    <td class="px-3 py-2">
                      <span class={`font-medium ${k.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {k.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td class="px-3 py-2 text-right">
                      {k.isActive && (
                        <button
                          onClick={() => revokeKey(k.id)}
                          class="text-red-500 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  )
}
