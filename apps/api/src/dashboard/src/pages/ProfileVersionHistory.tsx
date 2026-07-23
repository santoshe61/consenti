import { useEffect, useState } from 'preact/hooks'
import { ChevronLeft, GitCompare, X } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { Select } from '../components/Select'
import { profilesApi } from '../api/profiles'
import { diffLines } from '../utils/linediff'
import type { ProfileVersionEntry } from '@consenti/types'

interface Props {
  id: string
  current: string
  /** Deep-links here from the audit log for a specific edit — selects this version instead of
   * defaulting to the latest one. */
  initialVersion?: number
  /** Paired with `initialVersion`: turns compare mode on, defaulting the "compare against" side
   * to the version just before the edit the audit log entry is linking to. */
  compareVersion?: number
}

/**
 * Minimal dependency-free JSON syntax highlighter — wraps each token in a colored `<span>`
 * via inline styles (no CSS classes needed, so nothing for Tailwind's build-time scanner to
 * purge from this dynamically-injected HTML). Deliberately not a full tokenizer/parser: one
 * regex pass over the already-valid `JSON.stringify()` output is enough for a read-only
 * viewer and keeps this a few lines instead of a dependency. Safe to run per-line (used by
 * both the plain viewer and the diff viewer below) since each token match is self-contained.
 */
function highlightJson(json: string): string {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    match => {
      let color = '#fcd34d' // number
      if (/^"/.test(match)) color = /:\s*$/.test(match) ? '#7dd3fc' : '#86efac' // key : string
      else if (match === 'true' || match === 'false') color = '#c4b5fd' // boolean
      else if (match === 'null') color = '#9ca3af' // null
      return `<span style="color:${color}">${match}</span>`
    },
  )
}

export function ProfileVersionHistory({ id, current, initialVersion, compareVersion: initialCompareVersion }: Props) {
  const [profileName, setProfileName] = useState('')
  usePageTitle(`Version History — ${profileName || id}`)
  const [versions, setVersions] = useState<ProfileVersionEntry[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [selectedLocale, setSelectedLocale] = useState('default')
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [archived, setArchived] = useState(false)

  const [compareMode, setCompareMode] = useState(initialCompareVersion !== undefined)
  const [compareVersion, setCompareVersion] = useState<number | null>(initialCompareVersion ?? null)
  const [compareContent, setCompareContent] = useState<string | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  useEffect(() => {
    // Fetched independently — an archived profile (deleted DB row, version files still on
    // disk) 404s on get() but must still show its version history, so that failure can't be
    // allowed to short-circuit the versions fetch via a shared Promise.all.
    profilesApi.get(id).then(profile => setProfileName(profile.name)).catch(() => setArchived(true))
    profilesApi.listVersions(id)
      .then(vers => {
        setVersions(vers)
        // Deep-linked to a specific edit (from the audit log) — select that version if its
        // snapshot still exists on disk; otherwise fall back to the latest, same as a normal visit.
        const target = initialVersion !== undefined && vers.some(v => v.version === initialVersion)
          ? initialVersion
          : vers[0]?.version
        if (target !== undefined) setSelectedVersion(target)
        // Deep-linked compare target wasn't found among the actual version files (e.g. pruned) —
        // fall back to the version right before the selected one instead of silently doing nothing.
        if (initialCompareVersion !== undefined && !vers.some(v => v.version === initialCompareVersion)) {
          const idx = vers.findIndex(v => v.version === target)
          setCompareVersion(vers[idx + 1]?.version ?? null)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (selectedVersion === null) return
    setContentLoading(true)
    profilesApi.getVersion(id, String(selectedVersion), selectedLocale)
      .then(data => setContent(JSON.stringify(data, null, 2)))
      .catch(() => setContent(null))
      .finally(() => setContentLoading(false))
  }, [id, selectedVersion, selectedLocale])

  useEffect(() => {
    if (!compareMode || compareVersion === null) { setCompareContent(null); return }
    setCompareLoading(true)
    profilesApi.getVersion(id, String(compareVersion), selectedLocale)
      .then(data => setCompareContent(JSON.stringify(data, null, 2)))
      .catch(() => setCompareContent(null))
      .finally(() => setCompareLoading(false))
  }, [id, compareVersion, selectedLocale, compareMode])

  const selectedVersionData = versions.find(v => v.version === selectedVersion)
  const localeOptions = selectedVersionData
    ? ['default', ...selectedVersionData.locales.filter(l => l !== 'default')].map(l => ({ value: l, label: l }))
    : [{ value: 'default', label: 'default' }]

  const otherVersionOptions = versions
    .filter(v => v.version !== selectedVersion)
    .map(v => ({ value: String(v.version), label: `v${v.version} — ${new Date(v.createdAt).toLocaleDateString()}` }))

  const toggleCompare = () => {
    setCompareMode(on => {
      const next = !on
      if (next && compareVersion === null) {
        // Default to the version immediately before the one being viewed.
        const idx = versions.findIndex(v => v.version === selectedVersion)
        setCompareVersion(versions[idx + 1]?.version ?? null)
      }
      return next
    })
  }

  const diff = content !== null && compareContent !== null
    ? diffLines(compareContent.split('\n'), content.split('\n'))
    : null

  return (
    <>
      <div class="mb-4">
        <a
          href={archived ? '#/banners/profiles/archived' : `#/banners/profiles/${id}`}
          class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {archived ? 'Back to archived profiles' : 'Back to profile'}
        </a>
      </div>

      {loading ? (
        <div class="text-sm text-gray-400">Loading…</div>
      ) : versions.length === 0 ? (
        <div class="text-sm text-gray-400">No version files found. Versions are written when a profile is saved with file storage enabled.</div>
      ) : (
        <div class="flex gap-0 h-[calc(100vh-10rem)] border border-gray-200 rounded-lg overflow-hidden">
          {/* Version list — newest first — 10% */}
          <aside class="w-32 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
              Versions
            </div>
            <ul>
              {versions.map(v => (
                <li key={v.version}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVersion(v.version)
                      setSelectedLocale('default')
                      if (compareVersion === v.version) setCompareVersion(null)
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
              <div class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-white flex-wrap">
                <span class="text-sm font-mono font-medium text-gray-700">v{selectedVersion}</span>
                <div class="w-48">
                  <Select
                    options={localeOptions}
                    value={selectedLocale}
                    onChange={locale => setSelectedLocale(locale)}
                    placeholder="Select locale…"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleCompare}
                  disabled={versions.length < 2}
                  class={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    compareMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  title={versions.length < 2 ? 'Need at least two versions to compare' : 'Compare with another version'}
                >
                  <GitCompare size={13} aria-hidden="true" /> Compare
                </button>
                {compareMode && (
                  <>
                    <span class="text-xs text-gray-400">vs</span>
                    <div class="w-48">
                      <Select
                        options={otherVersionOptions}
                        value={compareVersion !== null ? String(compareVersion) : ''}
                        onChange={v => setCompareVersion(Number(v))}
                        placeholder="Compare against…"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCompareMode(false); setCompareVersion(null) }}
                      class="text-gray-400 hover:text-gray-700"
                      aria-label="Close compare"
                      title="Close compare"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            )}
            <div class="flex-1 overflow-auto bg-gray-950 p-4">
              {contentLoading || (compareMode && compareLoading) ? (
                <span class="text-gray-400 text-sm">Loading…</span>
              ) : content === null ? (
                <span class="text-gray-500 text-sm">File not found for this version/locale.</span>
              ) : compareMode ? (
                compareVersion === null ? (
                  <span class="text-gray-500 text-sm">Pick a version to compare against.</span>
                ) : compareContent === null ? (
                  <span class="text-gray-500 text-sm">File not found for v{compareVersion} at this locale.</span>
                ) : diff && diff.every(d => d.type === 'same') ? (
                  <span class="text-gray-500 text-sm">No differences between v{compareVersion} and v{selectedVersion} for this locale.</span>
                ) : (
                  <div class="text-xs font-mono leading-relaxed">
                    {diff!.map((d, idx) => (
                      <div
                        key={idx}
                        class={`px-2 whitespace-pre-wrap ${
                          d.type === 'add' ? 'bg-green-900/30' : d.type === 'del' ? 'bg-red-900/30' : ''
                        }`}
                      >
                        <span
                          class={`select-none mr-2 ${
                            d.type === 'add' ? 'text-green-500' : d.type === 'del' ? 'text-red-500' : 'text-gray-600'
                          }`}
                        >
                          {d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' '}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: highlightJson(d.line) }} />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <pre
                  class="text-xs text-gray-200 whitespace-pre-wrap font-mono leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightJson(content) }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
