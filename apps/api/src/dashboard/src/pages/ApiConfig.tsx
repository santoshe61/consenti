import { useEffect, useState } from 'preact/hooks'
import { Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT } from '../context/locale'
import { apiFetch } from '../api/client'

interface ApiKey { id: string; name: string; isActive: boolean; createdAt: string }
interface NewKey { id: string; name: string; key: string; createdAt: string }
interface Settings { allowedOrigins?: string[] }

export function ApiConfig({ current }: { current: string }) {
  const t = useT()

  const [origins, setOrigins] = useState<string[]>([])
  const [newOrigin, setNewOrigin] = useState('')
  const [originSaving, setOriginSaving] = useState(false)
  const [originError, setOriginError] = useState('')

  const [keys, setKeys] = useState<ApiKey[]>([])
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<NewKey | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(true)

  const { requestConfirm, dialog } = useConfirmDialog()

  useEffect(() => {
    apiFetch<Settings>('/settings')
      .then(s => setOrigins(s.allowedOrigins ?? []))
      .catch(() => {})

    apiFetch<ApiKey[]>('/apikeys')
      .then(setKeys)
      .catch(() => {})
      .finally(() => setLoadingKeys(false))
  }, [])

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
      setOriginError(t('apiConfig.origins.errorSave'))
    } finally {
      setOriginSaving(false)
    }
  }

  const addOrigin = async () => {
    const value = newOrigin.trim().replace(/\/$/, '')
    if (!value) return
    if (origins.includes(value)) { setOriginError(t('apiConfig.origins.errorDuplicate')); return }
    setNewOrigin('')
    await saveOrigins([...origins, value])
  }

  const removeOrigin = async (origin: string) => {
    await saveOrigins(origins.filter(o => o !== origin))
  }

  const loadKeys = () => {
    apiFetch<ApiKey[]>('/apikeys').then(setKeys).catch(() => {})
  }

  const createKey = async () => {
    if (!keyName.trim()) { setKeyError(t('apiConfig.tokens.errorName')); return }
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
      setKeyError(e instanceof Error ? e.message : t('apiConfig.tokens.errorCreate'))
    }
  }

  const revokeKey = async (id: string) => {
    const ok = await requestConfirm({
      title: t('apiConfig.tokens.dialog.title'),
      message: t('apiConfig.tokens.dialog.message'),
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
    <Layout title={t('apiConfig.title')} current={current}>
      {dialog}

      <div class="max-w-2xl space-y-6">

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">{t('apiConfig.origins.heading')}</h2>
          <p class="text-xs text-gray-500 mb-4">
            {t('apiConfig.origins.hint')}
          </p>

          <div class="flex gap-2 mb-3">
            <input
              type="text"
              placeholder={t('apiConfig.origins.placeholder')}
              aria-label={t('apiConfig.origins.placeholder')}
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
              {t('common.add')}
            </button>
          </div>

          {originError && <p role="alert" class="text-xs text-red-600 mb-2">{originError}</p>}

          {origins.length === 0 ? (
            <p class="text-xs text-gray-400 py-3 text-center">{t('apiConfig.origins.empty')}</p>
          ) : (
            <ul class="border border-gray-200 rounded divide-y divide-gray-100 text-sm">
              {origins.map(origin => (
                <li key={origin} class="flex items-center justify-between px-3 py-2 group">
                  <span class="font-mono text-gray-700 text-xs">{origin}</span>
                  <button
                    onClick={() => removeOrigin(origin)}
                    disabled={originSaving}
                    aria-label={`${t('apiConfig.origins.remove')} ${origin}`}
                    title={t('apiConfig.origins.remove')}
                    class="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">{t('apiConfig.tokens.heading')}</h2>
          <p class="text-xs text-gray-500 mb-4">{t('apiConfig.tokens.hint')}</p>

          {newKey && (
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p class="text-xs font-medium text-green-800 mb-2">{t('apiConfig.tokens.created')}</p>
              <div class="flex items-center gap-2">
                <code class={`flex-1 text-xs font-mono text-green-700 break-all ${showNewKey ? '' : 'blur-sm select-none'}`}>
                  {newKey.key}
                </code>
                <button
                  type="button"
                  onClick={() => setShowNewKey(s => !s)}
                  aria-label={showNewKey ? t('common.hide') : t('common.show')}
                  title={showNewKey ? t('common.hide') : t('common.show')}
                  class="shrink-0 text-gray-500 hover:text-gray-700"
                >
                  {showNewKey ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={copyKey}
                  aria-label={t('common.copyToClipboard')}
                  title={t('common.copyToClipboard')}
                  class="shrink-0 text-gray-500 hover:text-green-700"
                >
                  {keyCopied ? <Check size={14} className="text-green-600" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                </button>
              </div>
            </div>
          )}

          <div class="flex gap-2 mb-4">
            <input
              type="text"
              placeholder={t('apiConfig.tokens.placeholder')}
              aria-label={t('apiConfig.tokens.placeholder')}
              value={keyName}
              onInput={e => setKeyName((e.target as HTMLInputElement).value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <button
              onClick={createKey}
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              {t('common.create')}
            </button>
          </div>
          {keyError && <p role="alert" class="text-xs text-red-600 mb-2">{keyError}</p>}

          {!loadingKeys && keys.length === 0 && (
            <p class="text-xs text-gray-400 py-3 text-center">{t('apiConfig.tokens.empty')}</p>
          )}

          {keys.length > 0 && (
            <table class="w-full text-xs border border-gray-200 rounded overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="text-left px-3 py-2 text-gray-600 font-medium">{t('apiConfig.tokens.col.name')}</th>
                  <th scope="col" class="text-left px-3 py-2 text-gray-600 font-medium">{t('apiConfig.tokens.col.status')}</th>
                  <th scope="col" class="text-left px-3 py-2 text-gray-600 font-medium">{t('apiConfig.tokens.col.created')}</th>
                  <th scope="col" class="px-3 py-2" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {keys.map(k => (
                  <tr key={k.id}>
                    <td class="px-3 py-2 font-mono">{k.name}</td>
                    <td class="px-3 py-2">
                      <span class={`font-medium ${k.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {k.isActive ? t('apiConfig.tokens.status.active') : t('apiConfig.tokens.status.revoked')}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td class="px-3 py-2 text-right">
                      {k.isActive && (
                        <button
                          onClick={() => revokeKey(k.id)}
                          class="text-red-500 hover:underline"
                        >
                          {t('common.revoke')}
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
