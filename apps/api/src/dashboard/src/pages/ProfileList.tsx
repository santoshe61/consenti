import { useEffect, useState } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { Check, Copy, SquarePen, Trash, BookCopy, History, Power, PowerOff, Info } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { Table } from '../components/Table'
import { PermissionGate } from '../components/PermissionGate'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { Tooltip } from '../components/Tooltip'
import { useT } from '../context/locale'
import { profilesApi } from '../api/profiles'
import type { ProfileSummary } from '@consenti/types'
import { COMPLIANCE_GROUPS } from '@consenti/utils'

export function ProfileList({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('profiles.title'))
  const [profiles, setProfiles] = useState<ProfileSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [conflictInfo, setConflictInfo] = useState<{ id: string; name: string } | null>(null)
  const [pendingActivateId, setPendingActivateId] = useState<string | null>(null)
  const { requestConfirm, dialog } = useConfirmDialog()

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500)
    }).catch(() => { })
  }

  const load = () => {
    setLoading(true)
    profilesApi.listSummary()
      .then(setProfiles)
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: t('profiles.dialog.delete.title', { name }),
      message: t('profiles.dialog.delete.message'),
    })
    if (!ok) return
    await profilesApi.delete(id).catch(() => { })
    load()
  }

  const handleCopy = async (p: ProfileSummary) => {
    const ok = await requestConfirm({
      title: t('profiles.dialog.copy.title', { name: p.name }),
      message: t('profiles.dialog.copy.message'),
    })
    if (!ok) return
    setCopying(p.id)
    try {
      await profilesApi.copy(p.id)
      load()
    } catch {
      // ignore
    } finally {
      setCopying(null)
    }
  }

  const doActivate = async (id: string, choice?: 'deactivate') => {
    setToggling(id)
    try {
      const result = await profilesApi.activate(id, choice ? { choice } : undefined)
      if (result.requiresChoice) {
        setPendingActivateId(id)
        setConflictInfo(result.conflict)
        return
      }
      load()
    } catch {
      // ignore
    } finally {
      setToggling(prev => prev === id ? null : prev)
    }
  }

  const handleConflictDeactivate = async () => {
    const id = pendingActivateId
    setConflictInfo(null)
    setPendingActivateId(null)
    if (!id) return
    await doActivate(id, 'deactivate')
  }

  const handleToggleActive = async (p: ProfileSummary) => {
    if (p.isActive) {
      const ok = await requestConfirm({
        title: `Deactivate profile "${p.name}"?`,
        message: 'This will remove the profile JSON files for this compliance group.',
      })
      if (!ok) return
      setToggling(p.id)
      try {
        await profilesApi.deactivate(p.id)
        load()
      } catch {
        // ignore
      } finally {
        setToggling(null)
      }
    } else {
      await doActivate(p.id)
    }
  }

  const count = profiles.length
  const countLabel = count === 1
    ? t('profiles.countSingular', { n: count })
    : t('profiles.count', { n: count })

  return (
    <>
      {dialog}
      {conflictInfo && createPortal(
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" onClick={() => { setConflictInfo(null); setPendingActivateId(null) }} aria-hidden="true" />
          <div class="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900">{t('profileEditor.conflict.title')}</h3>
            <p class="text-sm text-gray-600">
              {t('profileEditor.conflict.message', { name: conflictInfo.name })}
            </p>
            <div class="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleConflictDeactivate}
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('profileEditor.conflict.deactivate', { name: conflictInfo.name })}
              </button>
              <button
                type="button"
                onClick={() => { setConflictInfo(null); setPendingActivateId(null) }}
                class="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{countLabel}</p>
        <div class="flex items-center gap-2">
          <a
            href="#/banners/profiles/archived"
            class="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <History size={14} aria-hidden="true" />
            {t('profiles.archived.cta')}
          </a>
          <PermissionGate perm="profile:create">
            <a
              href="#/banners/profiles/new"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('profiles.newProfile')}
            </a>
          </PermissionGate>
        </div>
      </div>

      <Table
        loading={loading}
        keyFn={r => r.id as string}
        rows={profiles as unknown as Record<string, unknown>[]}
        search={{
          placeholder: t('profiles.search.placeholder'),
          keys: r => [r['name'] as string, r['id'] as string, r['consentTemplateName'] as string | undefined, r['uiTemplateName'] as string | undefined],
        }}
        filters={[
          {
            label: t('profiles.filter.status'),
            options: [
              { value: 'active', label: t('profiles.filter.active') },
              { value: 'inactive', label: t('profiles.filter.inactive') },
            ],
            predicate: (r, value) => (value === 'active') === (r['isActive'] as boolean),
          },
        ]}
        columns={[
          {
            key: 'name', label: t('profiles.col.name'),
            render: r => {
              const p = r as unknown as ProfileSummary
              return (
                <div>
                  <div class="font-medium text-sm text-gray-900">{p.name}</div>
                  <div class="flex items-center gap-1 mt-0.5">
                    <span class="text-xs text-gray-400 font-mono">{p.id}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleCopyId(p.id) }}
                      class="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={t('profiles.action.copyId')}
                      title={t('profiles.action.copyId')}
                    >
                      {copiedId === p.id
                        ? <Check size={11} className="text-green-500" aria-hidden="true" />
                        : <Copy size={11} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )
            },
          },
          { key: 'defaultLocale', label: t('profiles.col.defaultLocale') },
          {
            key: 'complianceGroup', label: 'Compliance Group',
            render: r => {
              const p = r as unknown as ProfileSummary
              const slug = p.complianceGroup ?? p.customComplianceGroup
              if (!p.complianceGroup) {
                return p.customComplianceGroup
                  ? (
                    <div>
                      <div class="font-medium text-sm text-gray-900">{p.customComplianceGroup}</div>
                      <div class="flex items-center gap-1">
                        <span class="text-sm text-gray-700 font-mono">{slug}</span>
                        <button
                          onClick={e => { e.stopPropagation(); handleCopyId(slug!) }}
                          class="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={t('profiles.action.copySlug')}
                          title={t('profiles.action.copySlug')}
                        >
                          {copiedId === slug
                            ? <Check size={11} className="text-green-500" aria-hidden="true" />
                            : <Copy size={11} aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                  )
                  : <span class="text-xs text-gray-400">—</span>
              }
              const group = COMPLIANCE_GROUPS[p.complianceGroup as keyof typeof COMPLIANCE_GROUPS]
              const label = group?.label ?? p.complianceGroup
              const compliances = group?.compliances ?? []
              return (
                <div>
                  <div class="font-medium text-sm text-gray-900">{label}</div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-gray-700">{slug}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleCopyId(slug!) }}
                      class="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={t('profiles.action.copySlug')}
                      title={t('profiles.action.copySlug')}
                    >
                      {copiedId === slug
                        ? <Check size={11} className="text-green-500" aria-hidden="true" />
                        : <Copy size={11} aria-hidden="true" />}
                    </button>
                    {compliances.length > 0 && (
                      <Tooltip
                        content={
                          <div class="space-y-0.5">
                            {(compliances as string[]).map(c => (
                              <div key={c} class="text-xs">{c}</div>
                            ))}
                          </div>
                        }
                      >
                        <Info size={13} className="text-gray-400 cursor-help" aria-hidden="true" />
                      </Tooltip>
                    )}
                  </div>
                </div>
              )
            },
          },
          {
            key: 'isActive', label: 'Status',
            render: r => {
              const p = r as unknown as ProfileSummary
              return (
                <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              )
            },
          },
          {
            key: 'templates', label: t('profiles.col.templates'),
            render: r => {
              const p = r as unknown as ProfileSummary
              return (
                <div class="text-xs text-gray-500 space-y-0.5">
                  {p.consentTemplateName && <div>Consent: <span class="text-gray-700">{p.consentTemplateName}</span></div>}
                  {p.uiTemplateName && <div>UI: <span class="text-gray-700">{p.uiTemplateName}</span></div>}
                  {!p.consentTemplateName && !p.uiTemplateName && <span class="text-gray-300">—</span>}
                </div>
              )
            },
          },
          {
            key: 'createdAt', label: t('profiles.col.created'),
            render: r => {
              const p = r as unknown as ProfileSummary
              return (
                <div class="text-xs text-gray-500">
                  <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                  {p.updatedAt && p.updatedAt !== p.createdAt && (
                    <div class="text-gray-400">upd {new Date(p.updatedAt).toLocaleDateString()}</div>
                  )}
                </div>
              )
            },
          },
          {
            key: 'actions', label: '',
            render: r => {
              const p = r as unknown as ProfileSummary
              return (
                <div class="flex gap-2 items-center">
                  <a href={`#/banners/profiles/${p.id}`} class="text-blue-600 hover:text-blue-800 text-xs" title={t('common.edit')} aria-label={t('common.edit')}>
                    <SquarePen size={14} aria-hidden="true" />
                  </a>
                  <a href={`#/banners/profiles/${p.id}/history`} class="text-gray-500 hover:text-gray-700 text-xs" title="Version history" aria-label="Version history">
                    <History size={14} aria-hidden="true" />
                  </a>
                  <PermissionGate perm="profile:update">
                    <button
                      onClick={() => handleToggleActive(p)}
                      disabled={toggling === p.id}
                      class={`text-xs disabled:opacity-50 ${p.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}`}
                      title={p.isActive ? 'Deactivate' : 'Activate'}
                      aria-label={p.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {p.isActive ? <PowerOff size={14} aria-hidden="true" /> : <Power size={14} aria-hidden="true" />}
                    </button>
                  </PermissionGate>
                  <PermissionGate perm="profile:create">
                    <button
                      onClick={() => handleCopy(p)}
                      disabled={copying === p.id}
                      class="text-gray-500 hover:text-blue-600 text-xs disabled:opacity-50"
                      title={t('common.duplicate')}
                      aria-label={t('common.duplicate')}
                    >
                      {copying === p.id ? '…' : <BookCopy size={14} aria-hidden="true" />}
                    </button>
                  </PermissionGate>
                  <PermissionGate perm="profile:delete">
                    <button onClick={() => handleDelete(p.id, p.name)} class="text-red-500 hover:text-red-700 text-xs" title={t('common.delete')} aria-label={t('common.delete')}>
                      <Trash size={14} aria-hidden="true" />
                    </button>
                  </PermissionGate>
                </div>
              )
            },
          },
        ]}
        emptyText={t('profiles.empty')}
      />
    </>
  )
}
