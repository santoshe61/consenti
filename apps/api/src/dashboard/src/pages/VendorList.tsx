import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { apiFetch } from '../api/client'

interface Vendor {
  id: number
  name: string
  purposes?: number[]
  legIntPurposes?: number[]
  specialPurposes?: number[]
  features?: number[]
}

interface VendorResponse {
  vendorListVersion: number
  total: number
  page: number
  totalPages: number
  vendors: Vendor[]
}

function getPageFromHash(): number {
  const match = window.location.hash.match(/[?&]page=(\d+)/)
  return match ? Math.max(1, parseInt(match[1]!, 10)) : 1
}

function setPageInHash(page: number): void {
  if (!Number.isFinite(page) || page < 1) return
  const hash = window.location.hash
  const base = (hash.split('?')[0] ?? '/vendors').replace(/^#/, '')
  window.location.hash = page === 1 ? base : `${base}?page=${page}`
}

export function VendorList({ current }: { current: string }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [version, setVersion] = useState(0)
  const [page, setPage] = useState(getPageFromHash)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = (q: string, p: number) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', String(p))
    params.set('limit', String(25))
    apiFetch<VendorResponse>(`/tcf/vendors?${params.toString()}`)
      .then(d => {
        setVendors(d.vendors)
        setTotal(d.total)
        setVersion(d.vendorListVersion)
        setTotalPages(d.totalPages)
        setPage(Number.isFinite(d.page) && d.page >= 1 ? d.page : 1)
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'GVL not available. Enable tcf.enabled in server config.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(search, page) }, [])

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
    setPageInHash(1)
    load(q, 1)
  }

  const goToPage = (p: number) => {
    setPage(p)
    setPageInHash(p)
    load(search, p)
  }

  return (
    <Layout title="TCF Vendor List" current={current}>
      <div class="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-2">
        <p class="font-semibold">What is the TCF Vendor List?</p>
        <p>
          The <strong>IAB Transparency &amp; Consent Framework (TCF)</strong> is an industry standard used by ad-tech
          platforms across Europe. The <strong>Global Vendor List (GVL)</strong> is a public registry — maintained by
          the IAB — of every registered ad-tech vendor (Google, Meta, etc.) and the "purposes" they require consent
          for (e.g. Purpose 1 = store/access info, Purpose 3 = create personalised ads).
        </p>
        <p>
          When TCF is enabled on a profile, Consenti generates a <strong>TC String</strong> alongside the normal
          consent record. Ad platforms read this string from the cookie to know which vendors and purposes the visitor
          accepted. Without a valid TC String, compliant ad platforms will not fire their tags.
        </p>
        <p>
          This list is <strong>read-only reference data</strong> — it is fetched automatically from the IAB and
          refreshed every 7 days. You do not need to sync or edit it manually. Use it to look up a vendor's numeric
          ID and the purpose IDs they need, then attach those IDs to the relevant cookie in your profile config.
        </p>
        <p class="text-xs text-blue-700">
          TCF is only relevant if your site runs IAB-registered ad-tech vendors and you need to pass a TC String to
          their tags. If you only need GDPR / CCPA consent for your own first-party cookies, you can ignore this page.
        </p>
      </div>

      <div class="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search vendors…"
          value={search}
          onInput={e => handleSearch((e.target as HTMLInputElement).value)}
          class="border border-gray-300 rounded px-3 py-1.5 text-sm w-64"
        />
        {version > 0 && (
          <span class="text-xs text-gray-500">GVL v{version} · {total} vendors</span>
        )}
      </div>

      {error && (
        <div class="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading && <p class="text-sm text-gray-500">Loading vendor list…</p>}

      {!loading && !error && vendors.length === 0 && (
        <p class="text-sm text-gray-500">No vendors found.</p>
      )}

      {!loading && vendors.length > 0 && (
        <>
          <div class="max-h-[60vh] overflow-y-auto rounded border border-gray-200">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-3 py-2 text-gray-600">ID</th>
                  <th class="text-left px-3 py-2 text-gray-600">Name</th>
                  <th class="text-left px-3 py-2 text-gray-600">Purposes</th>
                  <th class="text-left px-3 py-2 text-gray-600">LI Purposes</th>
                  <th class="text-left px-3 py-2 text-gray-600">Special Purposes</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-2 font-mono text-gray-500">{v.id}</td>
                    <td class="px-3 py-2 font-medium text-gray-800">{v.name}</td>
                    <td class="px-3 py-2 text-gray-600">{(v.purposes ?? []).join(', ') || '—'}</td>
                    <td class="px-3 py-2 text-gray-600">{(v.legIntPurposes ?? []).join(', ') || '—'}</td>
                    <td class="px-3 py-2 text-gray-600">{(v.specialPurposes ?? []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages} · {total} vendors total
            </span>
            <div class="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    class={`px-2 py-1 border rounded ${p === page ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
