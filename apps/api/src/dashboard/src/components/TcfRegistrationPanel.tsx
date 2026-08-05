import { useEffect, useState } from 'preact/hooks'
import { useT } from '../context/locale'
import { apiFetch, apiErrorMessage } from '../api/client'

interface TcfRegistrationStatus {
  enabled: boolean
  cmpId?: number
  cmpVersion?: number
  publisherCC?: string
  confirmed: boolean
  confirmedAt?: string
  confirmedBy?: string
  cmpListVersion?: number
  cmpListEntry?: { found: boolean; deregistered: boolean; deletedDate?: string }
}

/**
 * Non-dismissible confirmation gate for `compliance.tcf` — shown whenever the live static
 * config's `cmpId`/`cmpVersion` doesn't match the last-confirmed hash in `TenantSettings`
 * (never confirmed, or changed since). Visibility is computed live from the fetched status on
 * every mount, not a dismissible flag — see registration-confirmation.ts. While unconfirmed, the
 * API fails closed on writes (no `tcfString`) and the widget won't install `window.__tcfapi`.
 */
export function TcfRegistrationPanel() {
  const t = useT()
  const [status, setStatus] = useState<TcfRegistrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const load = (refresh = false) => {
    setLoading(true)
    setLoadError('')
    apiFetch<TcfRegistrationStatus>(`/tcf/registration-status${refresh ? '?refresh=true' : ''}`)
      .then(setStatus)
      .catch(e => setLoadError(apiErrorMessage(e, t('tcfRegistration.loadError'))))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return null
  if (loadError) return <p role="alert" class="text-sm text-red-600 mb-5">{loadError}</p>
  if (!status?.enabled || status.confirmed) return null

  const confirm = async () => {
    setBusy(true)
    setConfirmError('')
    try {
      await apiFetch('/tcf/confirm-registration', { method: 'POST', body: JSON.stringify({ acknowledge: true }) })
      setAcknowledged(false)
      load()
    } catch (e) {
      setConfirmError(apiErrorMessage(e, t('tcfRegistration.confirmError')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="alert" class="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900 space-y-3">
      <p class="font-semibold">{t('tcfRegistration.title')}</p>
      <p>{t('tcfRegistration.body', { cmpId: status.cmpId ?? 0, cmpVersion: status.cmpVersion ?? 0 })}</p>

      {status.cmpListEntry?.deregistered && (
        <p class="font-medium">{t('tcfRegistration.deregistered', { date: status.cmpListEntry.deletedDate ?? '' })}</p>
      )}
      {status.cmpListEntry && !status.cmpListEntry.found && !status.cmpListEntry.deregistered && (
        <p>{t('tcfRegistration.notFound')}</p>
      )}
      {confirmError && <p class="font-medium">{confirmError}</p>}

      <label class="flex items-start gap-2 text-red-900">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => setAcknowledged((e.target as HTMLInputElement).checked)}
          class="mt-0.5 w-4 h-4 rounded border-red-300"
        />
        <span>{t('tcfRegistration.checkbox', { cmpId: status.cmpId ?? 0, cmpVersion: status.cmpVersion ?? 0 })}</span>
      </label>

      <div class="flex items-center gap-3">
        <button
          type="button"
          disabled={!acknowledged || busy}
          onClick={() => void confirm()}
          class="bg-red-600 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? t('common.saving') : t('tcfRegistration.confirmButton')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => { setConfirmError(''); load(true) }}
          class="text-xs text-red-700 hover:text-red-900 underline disabled:opacity-40"
        >
          {t('tcfRegistration.refreshStatus')}
        </button>
      </div>
    </div>
  )
}
