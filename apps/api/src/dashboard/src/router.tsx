import { useEffect, useState } from 'preact/hooks'
import { lazy, Suspense } from 'preact/compat'
import { useAuth } from './context/auth'
import { PageTitleProvider } from './context/pageTitle'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { setupApi } from './api/setup'

// Lazily loaded: everything past the initial login/dashboard landing screens.
// Each becomes its own chunk, fetched on first navigation instead of bloating
// the main bundle that every visitor has to download up front. The same
// import() specifiers are re-used in routeImports below to prefetch them all
// during idle time right after login, so in practice the chunk is already in
// the module cache — and the lazy() component itself already resolved once —
// by the time a user navigates there, and Suspense rarely has to show its
// fallback at all.
const routeImports = {
  Reports: () => import('./pages/Reports'),
  ProfileList: () => import('./pages/ProfileList'),
  ProfileEditor: () => import('./pages/ProfileEditor'),
  ProfileVersionHistory: () => import('./pages/ProfileVersionHistory'),
  ArchivedProfileList: () => import('./pages/ArchivedProfileList'),
  ConsentTemplateList: () => import('./pages/ConsentTemplateList'),
  ConsentTemplateEditor: () => import('./pages/ConsentTemplateEditor'),
  UITemplateList: () => import('./pages/UITemplateList'),
  UITemplateEditor: () => import('./pages/UITemplateEditor'),
  ConsentList: () => import('./pages/ConsentList'),
  VisitorList: () => import('./pages/VisitorList'),
  UserList: () => import('./pages/UserList'),
  RoleList: () => import('./pages/RoleList'),
  TenantList: () => import('./pages/TenantList'),
  VendorList: () => import('./pages/VendorList'),
  AuditLog: () => import('./pages/AuditLog'),
  Settings: () => import('./pages/Settings'),
  ChangePassword: () => import('./pages/ChangePassword'),
  ApiConfig: () => import('./pages/ApiConfig'),
  HowItWorks: () => import('./pages/HowItWorks'),
  SetupWizard: () => import('./pages/SetupWizard'),
}

const Reports = lazy(() => routeImports.Reports().then((m) => ({ default: m.Reports })))
const ProfileList = lazy(() => routeImports.ProfileList().then((m) => ({ default: m.ProfileList })))
const ProfileEditor = lazy(() => routeImports.ProfileEditor().then((m) => ({ default: m.ProfileEditor })))
const ProfileVersionHistory = lazy(() => routeImports.ProfileVersionHistory().then((m) => ({ default: m.ProfileVersionHistory })))
const ArchivedProfileList = lazy(() => routeImports.ArchivedProfileList().then((m) => ({ default: m.ArchivedProfileList })))
const ConsentTemplateList = lazy(() => routeImports.ConsentTemplateList().then((m) => ({ default: m.ConsentTemplateList })))
const ConsentTemplateEditor = lazy(() => routeImports.ConsentTemplateEditor().then((m) => ({ default: m.ConsentTemplateEditor })))
const UITemplateList = lazy(() => routeImports.UITemplateList().then((m) => ({ default: m.UITemplateList })))
const UITemplateEditor = lazy(() => routeImports.UITemplateEditor().then((m) => ({ default: m.UITemplateEditor })))
const ConsentList = lazy(() => routeImports.ConsentList().then((m) => ({ default: m.ConsentList })))
const VisitorList = lazy(() => routeImports.VisitorList().then((m) => ({ default: m.VisitorList })))
const UserList = lazy(() => routeImports.UserList().then((m) => ({ default: m.UserList })))
const RoleList = lazy(() => routeImports.RoleList().then((m) => ({ default: m.RoleList })))
const TenantList = lazy(() => routeImports.TenantList().then((m) => ({ default: m.TenantList })))
const VendorList = lazy(() => routeImports.VendorList().then((m) => ({ default: m.VendorList })))
const AuditLogPage = lazy(() => routeImports.AuditLog().then((m) => ({ default: m.AuditLogPage })))
const Settings = lazy(() => routeImports.Settings().then((m) => ({ default: m.Settings })))
const ChangePassword = lazy(() => routeImports.ChangePassword().then((m) => ({ default: m.ChangePassword })))
const ApiConfig = lazy(() => routeImports.ApiConfig().then((m) => ({ default: m.ApiConfig })))
const HowItWorks = lazy(() => routeImports.HowItWorks().then((m) => ({ default: m.HowItWorks })))
const SetupWizard = lazy(() => routeImports.SetupWizard().then((m) => ({ default: m.SetupWizard })))

// Kicks off every page chunk fetch at once; browser/bundler module cache means
// the later `lazy()` import() calls above resolve instantly once this lands.
function prefetchAllRoutes() {
  for (const load of Object.values(routeImports)) void load().catch(() => {})
}

function scheduleIdle(cb: () => void) {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb)
  else window.setTimeout(cb, 1)
}

const routeFallback = <div class="p-6 text-sm text-gray-400">Loading…</div>

function getHash(): string {
  return window.location.hash || '#/'
}

export function Router() {
  const { user } = useAuth()
  const [hash, setHash] = useState(getHash)
  // null = not checked yet; true = complete or unknown (fail open — never gate a user out of
  // the dashboard over this); false = confirmed incomplete, one-time #/setup redirect below.
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null)
  const [pageTitle, setPageTitle] = useState('')

  useEffect(() => {
    const update = () => setHash(getHash())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  useEffect(() => {
    if (!user) { setSetupCompleted(null); return }
    setupApi.status().then(({ completed }) => setSetupCompleted(completed)).catch(() => setSetupCompleted(true))
  }, [user])

  // Warm every lazy page chunk in the background once logged in, so the
  // Suspense fallback below is rarely seen at all — belt-and-braces on top of
  // the persistent <Layout> below, which keeps the chrome mounted regardless.
  useEffect(() => {
    if (!user) return
    scheduleIdle(prefetchAllRoutes)
  }, [user])

  if (!user) {
    if (hash !== '#/login') window.location.hash = '#/login'
    return <Login />
  }

  if (hash === '#/setup') {
    // Once setup is completed it's gone for good — no re-entry via direct navigation either.
    if (setupCompleted === true) {
      window.location.hash = '#/'
      return null
    }
    return (
      <Suspense fallback={routeFallback}>
        <SetupWizard onComplete={() => setSetupCompleted(true)} />
      </Suspense>
    )
  }

  if (setupCompleted === false) {
    if (hash !== '#/setup') window.location.hash = '#/setup'
    return null
  }

  if (hash === '#/login') {
    window.location.hash = '#/'
    return null
  }

  // The sidebar/header chrome lives here — once, for every authenticated
  // route — instead of inside each page, so it never unmounts (and never
  // flickers) while a lazy page chunk loads behind the Suspense boundary.
  return (
    <PageTitleProvider setTitle={setPageTitle}>
      <Layout title={pageTitle} current={hash}>
        <Suspense fallback={routeFallback}>{renderRoute(hash)}</Suspense>
      </Layout>
    </PageTitleProvider>
  )
}

function renderRoute(hash: string) {
  if (hash === '#/' || hash === '#') return <Dashboard current={hash} />
  if (hash === '#/reports') return <Reports current={hash} />
  if (hash === '#/banners/profiles') return <ProfileList current={hash} />
  if (hash === '#/banners/profiles/new') return <ProfileEditor current={hash} />
  if (hash === '#/banners/profiles/archived') return <ArchivedProfileList current={hash} />
  {
    const historyMatch = hash.match(/^#\/banners\/profiles\/([^/]+)\/history(?:\?(.*))?$/)
    if (historyMatch) {
      const params = new URLSearchParams(historyMatch[2] ?? '')
      const parseIntParam = (key: string): number | undefined => {
        const raw = params.get(key)
        return raw !== null && Number.isInteger(Number(raw)) ? Number(raw) : undefined
      }
      const initialVersion = parseIntParam('version')
      const compareVersion = parseIntParam('compare')
      return (
        <ProfileVersionHistory
          id={historyMatch[1]!}
          current={hash}
          {...(initialVersion !== undefined ? { initialVersion } : {})}
          {...(compareVersion !== undefined ? { compareVersion } : {})}
        />
      )
    }
  }
  if (hash.startsWith('#/banners/profiles/')) return <ProfileEditor id={hash.slice('#/banners/profiles/'.length)} current={hash} />
  if (hash === '#/banners/consent-templates') return <ConsentTemplateList current={hash} />
  if (hash === '#/banners/consent-templates/new') return <ConsentTemplateEditor current={hash} />
  if (hash.startsWith('#/banners/consent-templates/')) return <ConsentTemplateEditor id={hash.slice('#/banners/consent-templates/'.length)} current={hash} />
  if (hash === '#/banners/ui-templates') return <UITemplateList current={hash} />
  if (hash === '#/banners/ui-templates/new') return <UITemplateEditor current={hash} />
  if (hash.startsWith('#/banners/ui-templates/')) return <UITemplateEditor id={hash.slice('#/banners/ui-templates/'.length)} current={hash} />
  if (hash === '#/consents' || hash.startsWith('#/consents?')) return <ConsentList current={hash} />
  if (hash === '#/visitors' || hash.startsWith('#/visitors?')) return <VisitorList current={hash} />
  if (hash === '#/users') return <UserList current={hash} />
  if (hash === '#/roles') return <RoleList current={hash} />
  if (hash === '#/tenants') return <TenantList current={hash} />
  if (hash === '#/vendors' || hash.startsWith('#/vendors?')) return <VendorList current={hash} />
  if (hash === '#/audit' || hash.startsWith('#/audit?')) return <AuditLogPage current={hash} />
  if (hash === '#/api/config') return <ApiConfig current={hash} />
  if (hash === '#/settings') return <Settings current={hash} />
  if (hash === '#/settings/change-password') return <ChangePassword current={hash} />
  if (hash === '#/how-it-works') return <HowItWorks current={hash} />

  return <Dashboard current="#/" />
}
