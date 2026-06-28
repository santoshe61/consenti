import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { useAuth } from '../context/auth'
import { apiDownload } from '../api/client'

export function Settings({ current }: { current: string }) {
  const { user } = useAuth()
  const [_ready] = useState(true)

  useEffect(() => {}, [])

  return (
    <Layout title="Settings" current={current}>
      <div class="max-w-2xl space-y-4">

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Account</h2>
          <div class="space-y-2 text-sm text-gray-600">
            <p><span class="font-medium">Email:</span> {user?.email}</p>
            <p><span class="font-medium">Roles:</span> {user?.roles.join(', ')}</p>
            <p><span class="font-medium">ID:</span> <span class="font-mono">{user?.sub}</span></p>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Export Data</h2>
          <p class="text-xs text-gray-500 mb-3">Download all consent records or audit logs.</p>
          <div class="flex flex-wrap gap-3">
            <button
              onClick={() => apiDownload('/export/consents?format=csv')}
              class="text-sm text-blue-600 hover:underline"
            >
              Consent CSV
            </button>
            <button
              onClick={() => apiDownload('/export/consents/xlsx')}
              class="text-sm text-blue-600 hover:underline"
            >
              Consent XLSX
            </button>
            <button
              onClick={() => apiDownload('/export/consents?format=json')}
              class="text-sm text-blue-600 hover:underline"
            >
              Consent JSON
            </button>
            <button
              onClick={() => apiDownload('/export/audit?format=csv')}
              class="text-sm text-blue-600 hover:underline"
            >
              Audit CSV
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">About</h2>
          <p class="text-xs text-gray-500">
            Consenti v0.1.0 — Open-source GDPR-compliant Consent Management Platform.
            <br />Apache 2.0 License.
          </p>
        </div>

      </div>
    </Layout>
  )
}
