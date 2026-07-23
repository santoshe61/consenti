import { useEffect, useState } from 'preact/hooks'
import { usePageTitle } from '../context/pageTitle'
import { useAuth } from '../context/auth'
import { useT } from '../context/locale'
import { apiDownload } from '../api/client'

export function Settings({ current }: { current: string }) {
  const { user } = useAuth()
  const t = useT()
  usePageTitle(t('settings.title'))
  const [_ready] = useState(true)

  useEffect(() => {}, [])

  return (
    <>
      <div class="max-w-2xl space-y-4">

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">{t('settings.account.heading')}</h2>
          <div class="space-y-2 text-sm text-gray-600">
            <p><span class="font-medium">{t('settings.account.email')}</span> {user?.email}</p>
            <p><span class="font-medium">{t('settings.account.roles')}</span> {user?.roles.join(', ')}</p>
            <p><span class="font-medium">{t('settings.account.id')}</span> <span class="font-mono">{user?.sub}</span></p>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <a
              href="#/settings/change-password"
              class="text-sm text-blue-600 hover:underline"
            >
              {t('settings.account.changePassword')}
            </a>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">{t('settings.export.heading')}</h2>
          <p class="text-xs text-gray-500 mb-3">{t('settings.export.hint')}</p>
          <div class="flex flex-wrap gap-3">
            <button onClick={() => apiDownload('/export/consents?format=csv')} class="text-sm text-blue-600 hover:underline">
              {t('settings.export.consentCsv')}
            </button>
            <button onClick={() => apiDownload('/export/consents/xlsx')} class="text-sm text-blue-600 hover:underline">
              {t('settings.export.consentXlsx')}
            </button>
            <button onClick={() => apiDownload('/export/consents?format=json')} class="text-sm text-blue-600 hover:underline">
              {t('settings.export.consentJson')}
            </button>
            <button onClick={() => apiDownload('/export/audit?format=csv')} class="text-sm text-blue-600 hover:underline">
              {t('settings.export.auditCsv')}
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">{t('settings.about.heading')}</h2>
          <p class="text-xs text-gray-500">
            {t('settings.about.text')}
            <br />{t('settings.about.license')}
          </p>
        </div>

      </div>
    </>
  )
}
