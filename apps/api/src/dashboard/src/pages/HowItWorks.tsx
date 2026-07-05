import { Layout } from '../components/Layout'
import { useT } from '../context/locale'

const WORKFLOW_STEPS = [
  'howItWorks.workflow.step1',
  'howItWorks.workflow.step2',
  'howItWorks.workflow.step3',
  'howItWorks.workflow.step4',
  'howItWorks.workflow.step5',
] as const

const CONSENT_FLOW_STEPS = [
  'howItWorks.consentFlow.step1',
  'howItWorks.consentFlow.step2',
  'howItWorks.consentFlow.step3',
  'howItWorks.consentFlow.step4',
  'howItWorks.consentFlow.step5',
  'howItWorks.consentFlow.step6',
] as const

const PROFILE_RESOLUTION_STEPS = [
  'howItWorks.profileResolution.step1',
  'howItWorks.profileResolution.step2',
  'howItWorks.profileResolution.step3',
  'howItWorks.profileResolution.step4',
  'howItWorks.profileResolution.step5',
] as const

const COMPLIANCE_GROUPS = [
  { key: 'optIn', color: 'bg-blue-100 text-blue-800' },
  { key: 'optInDPDPA', color: 'bg-violet-100 text-violet-800' },
  { key: 'optInChina', color: 'bg-red-100 text-red-800' },
  { key: 'optOutCalifornia', color: 'bg-orange-100 text-orange-800' },
  { key: 'optOutUSState', color: 'bg-amber-100 text-amber-800' },
  { key: 'generalPrivacyConsent', color: 'bg-green-100 text-green-800' },
  { key: 'hybridBrazil', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'noticeOnly', color: 'bg-gray-100 text-gray-600' },
] as const

const LEGAL_BASIS_KEYS = ['mandatory', 'consent', 'legitimateInterest'] as const
const CONSENT_STATUS_KEYS = ['granted', 'denied', 'objected'] as const
const GEO_PROVIDER_KEYS = ['default', 'language', 'geoip', 'hostedGeoipLite', 'maxmind', 'custom'] as const

const FEATURES = [
  'dashboard',
  'cookieTemplates',
  'uiTemplates',
  'profiles',
  'consents',
  'visitors',
  'users',
  'roles',
  'vendors',
  'audit',
  'api',
  'settings',
] as const

export function HowItWorks({ current }: { current: string }) {
  const t = useT()

  return (
    <Layout title={t('howItWorks.title')} current={current}>
      <div class="space-y-4">

        {/* Intro */}
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <p class="text-sm text-gray-600 leading-relaxed">{t('howItWorks.intro')}</p>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          {/* Setup workflow */}
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-4">{t('howItWorks.workflow.heading')}</h2>
            <ol class="space-y-4">
              {WORKFLOW_STEPS.map((base, i) => (
                <li key={base} class="flex gap-4">
                  <span class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-gray-800">{t(`${base}.title` as Parameters<typeof t>[0])}</p>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(`${base}.desc` as Parameters<typeof t>[0])}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* End-to-end consent flow */}
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-4">{t('howItWorks.consentFlow.heading')}</h2>
            <ol class="space-y-4">
              {CONSENT_FLOW_STEPS.map((base, i) => (
                <li key={base} class="flex gap-4">
                  <span class="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-gray-800">{t(`${base}.title` as Parameters<typeof t>[0])}</p>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(`${base}.desc` as Parameters<typeof t>[0])}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>


        <div class="grid md:grid-cols-2 gap-4">
          {/* Profile resolution */}
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-1">{t('howItWorks.profileResolution.heading')}</h2>
            <p class="text-xs text-gray-500 mb-4 leading-relaxed">{t('howItWorks.profileResolution.intro')}</p>
            <ol class="space-y-4">
              {PROFILE_RESOLUTION_STEPS.map((base, i) => (
                <li key={base} class="flex gap-4">
                  <span class="flex-shrink-0 w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-gray-800">{t(`${base}.title` as Parameters<typeof t>[0])}</p>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(`${base}.desc` as Parameters<typeof t>[0])}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Key values reference */}
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-4">{t('howItWorks.enums.heading')}</h2>

            <div class="space-y-5">
              <div>
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('howItWorks.enums.legalBasis.heading')}</p>
                <ul class="space-y-1.5">
                  {LEGAL_BASIS_KEYS.map(k => (
                    <li key={k} class="text-xs text-gray-500 leading-relaxed pl-3 border-l-2 border-gray-200">
                      {t(`howItWorks.enums.legalBasis.${k}` as Parameters<typeof t>[0])}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('howItWorks.enums.consentStatus.heading')}</p>
                <ul class="space-y-1.5">
                  {CONSENT_STATUS_KEYS.map(k => (
                    <li key={k} class="text-xs text-gray-500 leading-relaxed pl-3 border-l-2 border-gray-200">
                      {t(`howItWorks.enums.consentStatus.${k}` as Parameters<typeof t>[0])}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('howItWorks.enums.geoProvider.heading')}</p>
                <ul class="space-y-1.5">
                  {GEO_PROVIDER_KEYS.map(k => (
                    <li key={k} class="text-xs text-gray-500 leading-relaxed pl-3 border-l-2 border-gray-200">
                      {t(`howItWorks.enums.geoProvider.${k}` as Parameters<typeof t>[0])}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Compliance groups */}
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">{t('howItWorks.complianceGroups.heading')}</h2>
          <p class="text-xs text-gray-500 mb-4 leading-relaxed">{t('howItWorks.complianceGroups.intro')}</p>
          <div class="space-y-4 grid md:grid-cols-2 gap-4">
            {COMPLIANCE_GROUPS.map(({ key, color }) => (
              <div key={key} class="border border-gray-100 rounded-md p-4">
                <div class="flex items-start gap-3">
                  <div class="min-w-0">
                    <span class={`flex-shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded ${color}`}>
                      {key}
                    </span>
                    <p class="text-sm font-semibold text-gray-800">{t(`howItWorks.complianceGroups.${key}.title` as Parameters<typeof t>[0])}</p>
                    <p class="text-xs text-gray-500 mt-1 leading-relaxed">{t(`howItWorks.complianceGroups.${key}.desc` as Parameters<typeof t>[0])}</p>
                    <p class="text-xs text-gray-400 mt-2">
                      <span class="font-medium text-gray-500">Laws: </span>
                      {t(`howItWorks.complianceGroups.${key}.laws` as Parameters<typeof t>[0])}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      <span class="font-medium text-gray-500">Countries: </span>
                      {t(`howItWorks.complianceGroups.${key}.countries` as Parameters<typeof t>[0])}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard features */}
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">{t('howItWorks.features.heading')}</h2>
          <div class="divide-y divide-gray-100 grid md:grid-cols-2 gap-8">
            {FEATURES.map(feature => (
              <div key={feature} class="py-3 first:pt-0 last:pb-0">
                <p class="text-sm font-semibold text-gray-800">{t(`howItWorks.features.${feature}.title` as Parameters<typeof t>[0])}</p>
                <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(`howItWorks.features.${feature}.desc` as Parameters<typeof t>[0])}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Docs link */}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h2 class="text-sm font-semibold text-blue-800 mb-1">{t('howItWorks.docs.heading')}</h2>
          <p class="text-xs text-blue-700 mb-3 leading-relaxed">{t('howItWorks.docs.text')}</p>
          <a
            href="https://consenti.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {t('howItWorks.docs.link')}
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>

      </div>
    </Layout>
  )
}
