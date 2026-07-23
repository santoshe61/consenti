import { useEffect, useState } from 'preact/hooks'
import { Copy, Check, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT } from '../context/locale'
import { apiFetch } from '../api/client'

/** `basePath` from the runtime config injected into the dashboard's HTML — reflects
 * whatever `CONSENTI_BASE_PATH` / `config.basePath` the operator actually deployed with. */
const basePath = window.__CONSENTI_CONFIG__?.basePath ?? '/consenti'
const ADMIN_URL = `${window.location.origin}${basePath}/admin`
const PUBLIC_URL = `${window.location.origin}${basePath}/api/v1`

interface ApiKey { id: string; name: string; isActive: boolean; createdAt: string; expireBy?: string }
interface NewKey { id: string; name: string; key: string; createdAt: string }
interface Settings { allowedOrigins?: string[]; adminAllowedOrigins?: string[] }

// ── Shared bits ─────────────────────────────────────────────────────────────

function DocLink({ href, text, label }: { href: string; text: string; label: string }) {
  return (
    <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
      <ExternalLink size={16} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p class="text-xs text-blue-900">{text}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline mt-1"
        >
          {label} <ExternalLink size={11} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}

function EndpointCard({ url }: { url: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div class="bg-white rounded-lg border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-1">{t('apiConfig.endpoint.heading')}</h2>
      <p class="text-xs text-gray-500 mb-4">{t('apiConfig.endpoint.hint')}</p>
      <div class="flex items-center justify-between gap-3 border border-gray-200 rounded px-3 py-2">
        <code class="text-xs font-mono text-gray-700 break-all">{url}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={t('common.copyToClipboard')}
          title={t('common.copyToClipboard')}
          class="shrink-0 text-gray-400 hover:text-gray-700"
        >
          {copied ? <Check size={13} className="text-green-600" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

/** Self-contained origin allowlist editor — reads/writes one field on the shared `/settings`
 * resource (a PATCH only ever sends the one field it owns, so the two instances of this
 * component never clobber each other's list). */
function OriginsSection({
  field, initialOrigins, note,
}: {
  field: 'allowedOrigins' | 'adminAllowedOrigins'
  initialOrigins: string[]
  note?: string
}) {
  const t = useT()
  const [origins, setOrigins] = useState(initialOrigins)
  const [newOrigin, setNewOrigin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // The parent's initial /settings fetch resolves after mount — sync once it lands.
  useEffect(() => { setOrigins(initialOrigins) }, [initialOrigins])

  const save = async (updated: string[]) => {
    setSaving(true)
    setError('')
    try {
      await apiFetch('/settings', { method: 'PATCH', body: JSON.stringify({ [field]: updated }) })
      setOrigins(updated)
    } catch {
      setError(t('apiConfig.origins.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const addOrigin = async () => {
    const value = newOrigin.trim().replace(/\/$/, '')
    if (!value) return
    if (origins.includes(value)) { setError(t('apiConfig.origins.errorDuplicate')); return }
    setNewOrigin('')
    await save([...origins, value])
  }

  const removeOrigin = async (origin: string) => {
    await save(origins.filter(o => o !== origin))
  }

  return (
    <div class="bg-white rounded-lg border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-1">{t('apiConfig.origins.heading')}</h2>
      <p class="text-xs text-gray-500 mb-1">{t('apiConfig.origins.hint')}</p>
      {note && <p class="text-xs text-amber-700 mb-4">{note}</p>}
      {!note && <div class="mb-4" />}

      <div class="flex gap-2 mb-3">
        <input
          type="text"
          placeholder={t('apiConfig.origins.placeholder')}
          aria-label={t('apiConfig.origins.placeholder')}
          value={newOrigin}
          onInput={e => { setNewOrigin((e.target as HTMLInputElement).value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && addOrigin()}
          class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
        <button
          onClick={addOrigin}
          disabled={saving || !newOrigin.trim()}
          class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('common.add')}
        </button>
      </div>

      {error && <p role="alert" class="text-xs text-red-600 mb-2">{error}</p>}

      {origins.length === 0 ? (
        <p class="text-xs text-gray-400 py-3 text-center">{t('apiConfig.origins.empty')}</p>
      ) : (
        <ul class="border border-gray-200 rounded divide-y divide-gray-100 text-sm">
          {origins.map(origin => (
            <li key={origin} class="flex items-center justify-between px-3 py-2 group">
              <span class="font-mono text-gray-700 text-xs">{origin}</span>
              <button
                onClick={() => removeOrigin(origin)}
                disabled={saving}
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
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ApiConfig({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('apiConfig.title'))

  const [settings, setSettings] = useState<Settings>({})

  const [keys, setKeys] = useState<ApiKey[]>([])
  const [keyName, setKeyName] = useState('')
  const [keyExpireBy, setKeyExpireBy] = useState('')
  const [newKey, setNewKey] = useState<NewKey | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(true)

  const { requestConfirm, dialog } = useConfirmDialog()

  useEffect(() => {
    apiFetch<Settings>('/settings').then(setSettings).catch(() => { })

    apiFetch<ApiKey[]>('/apikeys')
      .then(setKeys)
      .catch(() => { })
      .finally(() => setLoadingKeys(false))
  }, [])

  const loadKeys = () => {
    apiFetch<ApiKey[]>('/apikeys').then(setKeys).catch(() => { })
  }

  const createKey = async () => {
    if (!keyName.trim()) { setKeyError(t('apiConfig.tokens.errorName')); return }
    setKeyError('')
    try {
      const created = await apiFetch<NewKey>('/apikeys', {
        method: 'POST',
        body: JSON.stringify({ name: keyName.trim(), ...(keyExpireBy ? { expireBy: new Date(keyExpireBy).toISOString() } : {}) }),
      })
      setNewKey(created)
      setShowNewKey(false)
      setKeyCopied(false)
      setKeyName('')
      setKeyExpireBy('')
      setKeys(prev => [...prev, { id: created.id, name: created.name, isActive: true, createdAt: created.createdAt, ...(keyExpireBy ? { expireBy: new Date(keyExpireBy).toISOString() } : {}) }])
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : t('apiConfig.tokens.errorCreate'))
    }
  }

  const isExpired = (k: ApiKey) => k.isActive && !!k.expireBy && new Date(k.expireBy) <= new Date()

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

  const reactivateKey = async (id: string) => {
    try {
      await apiFetch(`/apikeys/${id}/reactivate`, { method: 'POST' })
      loadKeys()
    } catch {
      // ignore
    }
  }

  const deleteKey = async (id: string) => {
    const ok = await requestConfirm({
      title: t('apiConfig.tokens.deleteDialog.title'),
      message: t('apiConfig.tokens.deleteDialog.message'),
      danger: true,
    })
    if (!ok) return
    try {
      await apiFetch(`/apikeys/${id}/permanent`, { method: 'DELETE' })
      setKeys(prev => prev.filter(k => k.id !== id))
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
    <>
      {dialog}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Admin API ──────────────────────────────────────────────── */}
        <div class="space-y-6 min-w-0">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('apiConfig.admin.heading')}</h2>
          <DocLink href="https://consenti.dev/docs/api/routes/admin?utm_source=dashboard&utm_medium=api-config&utm_campaign=consenti-api" text={t('apiConfig.admin.about.text')} label={t('apiConfig.admin.about.link')} />
          <EndpointCard url={ADMIN_URL} />
          <OriginsSection
            field="adminAllowedOrigins"
            initialOrigins={settings.adminAllowedOrigins ?? []}
            note={t('apiConfig.origins.adminNote', { origin: window.location.origin })}
          />

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
              <input
                type="date"
                aria-label={t('apiConfig.tokens.expiresLabel')}
                title={t('apiConfig.tokens.expiresLabel')}
                value={keyExpireBy}
                onInput={e => setKeyExpireBy((e.target as HTMLInputElement).value)}
                class="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600"
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
                    <th scope="col" class="text-left px-3 py-2 text-gray-600 font-medium">{t('apiConfig.tokens.col.expires')}</th>
                    <th scope="col" class="px-3 py-2" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {keys.map(k => {
                    const expired = isExpired(k)
                    const active = k.isActive && !expired
                    return (
                      <tr key={k.id}>
                        <td class="px-3 py-2 font-mono">{k.name}</td>
                        <td class="px-3 py-2">
                          <span class={`font-medium ${active ? 'text-green-600' : expired ? 'text-amber-600' : 'text-gray-400'}`}>
                            {active ? t('apiConfig.tokens.status.active') : expired ? t('apiConfig.tokens.status.expired') : t('apiConfig.tokens.status.revoked')}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td class="px-3 py-2 text-gray-500">{k.expireBy ? new Date(k.expireBy).toLocaleDateString() : t('apiConfig.tokens.expiresNever')}</td>
                        <td class="px-3 py-2 text-right whitespace-nowrap">
                          {active ? (
                            <button
                              onClick={() => revokeKey(k.id)}
                              class="text-red-500 hover:underline"
                            >
                              {t('common.revoke')}
                            </button>
                          ) : (
                            <span class="inline-flex items-center gap-3">
                              <button
                                onClick={() => reactivateKey(k.id)}
                                class="text-green-600 hover:underline"
                              >
                                {t('apiConfig.tokens.reactivate')}
                              </button>
                              <button
                                onClick={() => deleteKey(k.id)}
                                class="text-red-500 hover:underline"
                              >
                                {t('common.delete')}
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Public API ─────────────────────────────────────────────── */}
        <div class="space-y-6 min-w-0">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('apiConfig.public.heading')}</h2>
          <DocLink href="https://consenti.dev/docs/api/routes/public?utm_source=dashboard&utm_medium=api-config&utm_campaign=consenti-api" text={t('apiConfig.public.about.text')} label={t('apiConfig.public.about.link')} />
          <EndpointCard url={PUBLIC_URL} />
          <OriginsSection
            field="allowedOrigins"
            initialOrigins={settings.allowedOrigins ?? []}
            note={t('apiConfig.origins.publicNote')}
          />
        </div>

      </div>
    </>
  )
}
