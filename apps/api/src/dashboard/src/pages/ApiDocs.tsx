import { useState } from 'preact/hooks'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'

const DOCS_URL = '/consenti/admin/docs'

export function ApiDocs({ current }: { current: string }) {
  const [key, setKey] = useState(0)

  return (
    <Layout title="Endpoint Docs" current={current}>
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-gray-500">
          Interactive OpenAPI documentation for the Consenti Admin API.
        </p>
        <div class="flex items-center gap-3">
          <button
            onClick={() => setKey(k => k + 1)}
            class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
            title="Reload"
          >
            <RefreshCw size={13} /> Reload
          </button>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            Open in new tab <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 overflow-hidden bg-white" style="height: calc(100vh - 200px)">
        <iframe
          key={key}
          src={DOCS_URL}
          class="w-full h-full border-0"
          title="API Documentation"
        />
      </div>
    </Layout>
  )
}
