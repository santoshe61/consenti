import { useEffect, useState } from 'preact/hooks'
import { Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { useBranding } from '../context/branding'
import { useT } from '../context/locale'
import { setupApi } from '../api/setup'
import type { SetupComplianceGroup, SetupConfigResponse } from '../api/setup'

type Step = 1 | 2 | 3 | 4

const STEP_KEYS = ['welcome', 'config', 'profiles', 'confirmation'] as const

function StepDots({ step }: { step: Step }) {
  return (
    <div class="flex items-center justify-center gap-2 mb-8">
      {STEP_KEYS.map((key, i) => {
        const n = (i + 1) as Step
        const done = step > n
        const active = step === n
        return (
          <div
            key={key}
            class={`h-2 rounded-full transition-all ${done ? 'w-2 bg-green-500' : active ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200'}`}
          />
        )
      })}
    </div>
  )
}

/** Minimal recursive read-only renderer for the sanitized, merged server config — grouped by
 * top-level key rather than a raw JSON dump, per the setup wizard plan's step 2. */
function ConfigValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span class="text-gray-400">—</span>
  if (Array.isArray(value)) {
    return value.length
      ? <span class="text-gray-700">{value.map(String).join(', ')}</span>
      : <span class="text-gray-400">—</span>
  }
  if (typeof value === 'object') {
    return (
      <div class="pl-3 border-l-2 border-gray-100 space-y-1 mt-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} class="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span class="text-gray-500 font-medium">{k}</span>
            <ConfigValue value={v} />
          </div>
        ))}
      </div>
    )
  }
  return <span class="text-gray-700">{String(value)}</span>
}

function ConfigSection({ title, value }: { title: string; value: unknown }) {
  return (
    <div class="border border-gray-200 rounded-lg p-4">
      <p class="text-sm font-semibold text-gray-800 mb-2">{title}</p>
      <ConfigValue value={value} />
    </div>
  )
}

function GpcBadge({ mode }: { mode: string }) {
  const color = mode === 'strict' ? 'bg-red-100 text-red-700' : mode === 'honor' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
  return <span class={`text-[11px] px-1.5 py-0.5 rounded ${color}`}>GPC: {mode}</span>
}

function GroupAccordionRow({
  group, checked, onToggle,
}: {
  group: SetupComplianceGroup
  checked: boolean
  onToggle: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <div class="flex items-center gap-3 p-3 bg-white">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={group.label}
        />
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          class="flex-1 flex items-center justify-between text-left"
        >
          <span class="text-sm font-medium text-gray-800">{group.label}</span>
          {open ? <ChevronDown size={16} class="text-gray-400" /> : <ChevronRight size={16} class="text-gray-400" />}
        </button>
      </div>
      {open && (
        <div class="px-3 pb-3 pt-0 bg-gray-50 border-t border-gray-100">
          <p class="text-xs text-gray-600 leading-relaxed mb-2">{group.description}</p>
          <div class="flex flex-wrap gap-1.5">
            <GpcBadge mode={group.defaultGpc} />
            {group.allowsTcf && <span class="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">TCF</span>}
            {group.requiresCpraCategory && <span class="text-[11px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">CPRA categories</span>}
            {group.requiresDpdpaDisclosure && <span class="text-[11px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">DPDPA disclosure</span>}
            {group.allowsLegitimateInterest && <span class="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Legitimate interest</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const t = useT()
  const { appName, appLogoPath } = useBranding()
  const [step, setStep] = useState<Step>(1)

  const [configData, setConfigData] = useState<SetupConfigResponse | null>(null)
  const [groups, setGroups] = useState<SetupComplianceGroup[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [seededCount, setSeededCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setupApi.config().then(setConfigData).catch(() => {})
    setupApi.complianceGroups().then(list => {
      setGroups(list)
      setSelected(new Set(list.map(g => g.id)))
    }).catch(() => {})
  }, [])

  const finish = async (nextHash: string) => {
    setBusy(true)
    try {
      await setupApi.complete()
    } catch {
      // Non-fatal — the wizard still exits; a failed flag write just means it may show again.
    } finally {
      // Update the router's setupCompleted state before changing the hash — otherwise it still
      // thinks setup is incomplete for this render pass and redirects straight back to #/setup,
      // remounting this component fresh at step 1 instead of actually exiting.
      onComplete()
      window.location.hash = nextHash
    }
  }

  const skip = () => { void finish('#/') }

  const toggleGroup = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => prev.size === groups.length ? new Set() : new Set(groups.map(g => g.id)))
  }

  const seedAndContinue = async () => {
    setBusy(true)
    setError('')
    try {
      const ids = [...selected]
      if (ids.length > 0) {
        const { seeded } = await setupApi.seedProfiles(ids)
        setSeededCount(seeded.length)
      } else {
        setSeededCount(0)
      }
      setStep(4)
    } catch {
      setError(t('setupWizard.profiles.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-2xl">
        {appLogoPath && <img src={appLogoPath} alt={appName} class="h-10 w-auto mx-auto mb-6 object-contain" />}
        <StepDots step={step} />

        {step === 1 && (
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900 mb-2">{t('setupWizard.welcome.title', { appName })}</h1>
            <p class="text-sm text-gray-500 leading-relaxed mb-6 max-w-md mx-auto">{t('setupWizard.welcome.body')}</p>
            <div class="flex items-center justify-center gap-4 mb-8 text-sm">
              <a
                href="https://consenti.dev/docs?utm_source=dashboard&utm_medium=setup-wizard&utm_campaign=consenti-api"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                {t('setupWizard.welcome.docsLink')} <ExternalLink size={12} aria-hidden="true" />
              </a>
              <a href="#/how-it-works" class="text-blue-600 hover:text-blue-800 hover:underline">
                {t('setupWizard.welcome.howItWorksLink')}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              class="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors mb-3"
            >
              {t('setupWizard.welcome.getStarted')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={skip}
              class="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              {t('setupWizard.welcome.skip')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-1">{t('setupWizard.config.title')}</h2>
            <p class="text-sm text-gray-500 mb-5">{t('setupWizard.config.subtitle')}</p>
            {configData
              ? (
                <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {Object.entries(configData.config).map(([key, value]) => (
                    <ConfigSection key={key} title={key} value={value} />
                  ))}
                </div>
              )
              : <p class="text-sm text-gray-400">{t('common.loading')}</p>}
            <div class="flex items-center justify-between mt-6">
              <button type="button" onClick={() => setStep(1)} class="text-sm text-gray-500 hover:text-gray-700">
                {t('setupWizard.back')}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                class="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('setupWizard.continue')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-1">{t('setupWizard.profiles.title')}</h2>
            <p class="text-sm text-gray-500 mb-4">{t('setupWizard.profiles.subtitle')}</p>
            <label class="flex items-center gap-2 mb-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.size === groups.length && groups.length > 0}
                onChange={toggleAll}
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t('setupWizard.profiles.selectAll')}
            </label>
            <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
              {groups.map(g => (
                <GroupAccordionRow key={g.id} group={g} checked={selected.has(g.id)} onToggle={() => toggleGroup(g.id)} />
              ))}
            </div>
            {error && <p role="alert" class="text-sm text-red-600 mt-3">{error}</p>}
            <div class="flex items-center justify-between mt-6">
              <button type="button" onClick={() => setStep(2)} class="text-sm text-gray-500 hover:text-gray-700">
                {t('setupWizard.back')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void seedAndContinue()}
                class="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {busy
                  ? t('common.saving')
                  : selected.size > 0 ? t('setupWizard.profiles.installAndContinue') : t('setupWizard.profiles.skipAndContinue')}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <Check size={24} aria-hidden="true" />
            </div>
            <h1 class="text-xl font-bold text-gray-900 mb-2">{t('setupWizard.confirmation.title')}</h1>
            <p class="text-sm text-gray-500 mb-6">
              {seededCount > 0
                ? t('setupWizard.confirmation.seededSummary', { count: seededCount })
                : t('setupWizard.confirmation.noneSeeded')}
            </p>

            {configData && (configData.usingJsonStorage || configData.usingDefaultCredentials) && (
              <div class="text-left bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p class="text-xs font-semibold text-amber-800 mb-2">{t('setupWizard.confirmation.readinessTitle')}</p>
                <ul class="space-y-1 text-xs text-amber-700 list-disc list-inside">
                  {configData.usingJsonStorage && <li>{t('setupWizard.confirmation.readinessJsonStorage')}</li>}
                  {configData.usingDefaultCredentials && <li>{t('setupWizard.confirmation.readinessDefaultCredentials')}</li>}
                </ul>
              </div>
            )}

            <div class="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void finish('#/how-it-works')}
                class="border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t('setupWizard.confirmation.howItWorks')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void finish('#/')}
                class="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {t('setupWizard.confirmation.goToDashboard')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
