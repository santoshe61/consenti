import { useEffect, useState } from 'preact/hooks'
import { ChevronLeft } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { Table } from '../components/Table'
import { useT } from '../context/locale'
import { profilesApi } from '../api/profiles'
import type { ArchivedProfileSummary } from '@consenti/types'

export function ArchivedProfileList({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('profiles.archived.title'))
  const [profiles, setProfiles] = useState<ArchivedProfileSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    profilesApi.listArchived().then(setProfiles).catch(() => setProfiles([])).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div class="mb-4">
        <a
          href="#/banners/profiles"
          class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {t('profiles.archived.back')}
        </a>
      </div>

      <p class="text-xs text-gray-500 mb-4">{t('profiles.archived.hint')}</p>

      <Table
        loading={loading}
        keyFn={r => r['id'] as string}
        rows={profiles as unknown as Record<string, unknown>[]}
        emptyText={t('profiles.archived.empty')}
        search={{ placeholder: t('profiles.archived.searchPlaceholder'), keys: r => [r['id'] as string] }}
        columns={[
          {
            key: 'id', label: t('profiles.archived.col.id'),
            render: r => <span class="font-mono text-sm text-gray-700">{(r as unknown as ArchivedProfileSummary).id}</span>,
          },
          {
            key: 'versionCount', label: t('profiles.archived.col.versions'),
            render: r => <span class="text-sm text-gray-700">{(r as unknown as ArchivedProfileSummary).versionCount}</span>,
          },
          {
            key: 'lastModified', label: t('profiles.archived.col.lastModified'),
            render: r => <span class="text-sm text-gray-500">{new Date((r as unknown as ArchivedProfileSummary).lastModified).toLocaleString()}</span>,
          },
          {
            key: 'actions', label: '',
            render: r => (
              <a
                href={`#/banners/profiles/${(r as unknown as ArchivedProfileSummary).id}/history`}
                class="text-blue-600 hover:underline text-sm"
              >
                {t('profiles.archived.viewHistory')}
              </a>
            ),
          },
        ]}
      />
    </>
  )
}
