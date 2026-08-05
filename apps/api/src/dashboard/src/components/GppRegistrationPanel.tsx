import { useEffect, useState } from 'preact/hooks'
import { useT } from '../context/locale'
import { apiFetch, apiErrorMessage } from '../api/client'

interface GppRegistrationStatus {
  enabled: boolean
  cmpId?: number
  cmpVersion?: number
  confirmed: boolean
  confirmedAt?: string
  confirmedBy?: string
}

/**
 * Confirmation gate for `compliance.gpp` — same hash-drift mechanism as `TcfRegistrationPanel`,
 * but self-attestation only: IAB doesn't publish a CMP-List equivalent for GPP, so there's no
 * external registry to validate `cmpId` against (no deregistration check, no "Refresh Status").
 */
export function GppRegistrationPanel() {
  const t = useT()
  const [status, setStatus] = useState<GppRegistrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const load = () => {
    setLoading(true)
    setLoadError('')
    apiFetch<GppRegistrationStatus>('/gpp/registration-status')
      .then(setStatus)
      .catch(e => setLoadError(apiErrorMessage(e, t('gppRegistration.loadError'))))
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
      await apiFetch('/gpp/confirm-registration', { method: 'POST', body: JSON.stringify({ acknowledge: true }) })
      setAcknowledged(false)
      load()
    } catch (e) {
      setConfirmError(apiErrorMessage(e, t('gppRegistration.confirmError')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="alert" class="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900 space-y-3">
      <p class="font-semibold">{t('gppRegistration.title')}</p>
      <p>{t('gppRegistration.body', { cmpId: status.cmpId ?? 0, cmpVersion: status.cmpVersion ?? 0 })}</p>

      {confirmError && <p class="font-medium">{confirmError}</p>}

      <label class="flex items-start gap-2 text-red-900">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => setAcknowledged((e.target as HTMLInputElement).checked)}
          class="mt-0.5 w-4 h-4 rounded border-red-300"
        />
        <span>{t('gppRegistration.checkbox', { cmpId: status.cmpId ?? 0, cmpVersion: status.cmpVersion ?? 0 })}</span>
      </label>

      <button
        type="button"
        disabled={!acknowledged || busy}
        onClick={() => void confirm()}
        class="bg-red-600 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? t('common.saving') : t('gppRegistration.confirmButton')}
      </button>
    </div>
  )
}
