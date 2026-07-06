import { useEffect, useState } from 'preact/hooks'
import { ChevronLeft } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Select } from '../components/Select'
import { profilesApi } from '../api/profiles'
import type { ProfileVersionEntry } from '@consenti/types'

interface Props {
  id: string
  current: string
}

export function ProfileVersionHistory({ id, current }: Props) {
  const [versions, setVersions] = useState<ProfileVersionEntry[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [selectedLocale, setSelectedLocale] = useState('default')
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    Promise.all([profilesApi.get(id), profilesApi.listVersions(id)])
      .then(([profile, vers]) => {
        setProfileName(profile.name)
        setVersions(vers)
        if (vers.length > 0) {
          const latest = vers[vers.length - 1]
          if (latest) setSelectedVersion(latest.version)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (selectedVersion === null) return
    setContentLoading(true)
    profilesApi.getVersion(id, selectedVersion, selectedLocale)
      .then(data => setContent(JSON.stringify(data, null, 2)))
      .catch(() => setContent(null))
      .finally(() => setContentLoading(false))
  }, [id, selectedVersion, selectedLocale])

  const selectedVersionData = versions.find(v => v.version === selectedVersion)
  const localeOptions = selectedVersionData
    ? ['default', ...selectedVersionData.locales.filter(l => l !== 'default')].map(l => ({ value: l, label: l }))
    : [{ value: 'default', label: 'default' }]

  return (
    <Layout title={`Version History — ${profileName || id}`} current={current}>
      <div class="mb-4">
        <a
          href={`#/banners/profiles/${id}`}
          class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Back to profile
        </a>
      </div>

      {loading ? (
        <div class="text-sm text-gray-400">Loading…</div>
      ) : versions.length === 0 ? (
        <div class="text-sm text-gray-400">No version files found. Versions are written when a profile is saved with file storage enabled.</div>
      ) : (
        <div class="flex gap-0 h-[calc(100vh-10rem)] border border-gray-200 rounded-lg overflow-hidden">
          {/* Version list — 10% */}
          <aside class="w-32 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
              Versions
            </div>
            <ul>
              {[...versions].reverse().map(v => (
                <li key={v.version}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVersion(v.version)
                      setSelectedLocale('default')
                    }}
                    class={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      selectedVersion === v.version
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div class="font-mono font-semibold">v{v.version}</div>
                    <div class={`text-[10px] mt-0.5 ${selectedVersion === v.version ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Content panel — 90% */}
          <div class="flex-1 flex flex-col overflow-hidden">
            {selectedVersion !== null && (
              <div class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-white">
                <span class="text-sm font-medium text-gray-700">v{selectedVersion}</span>
                <div class="w-48">
                  <Select
                    options={localeOptions}
                    value={selectedLocale}
                    onChange={locale => setSelectedLocale(locale)}
                    placeholder="Select locale…"
                  />
                </div>
              </div>
            )}
            <div class="flex-1 overflow-auto bg-gray-950 p-4">
              {contentLoading ? (
                <span class="text-gray-400 text-sm">Loading…</span>
              ) : content === null ? (
                <span class="text-gray-500 text-sm">File not found for this version/locale.</span>
              ) : (
                <pre class="text-xs text-green-300 whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
