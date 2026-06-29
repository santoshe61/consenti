import { useEffect, useState } from 'preact/hooks'
import { useAuth } from './context/auth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ProfileList } from './pages/ProfileList'
import { ProfileEditor } from './pages/ProfileEditor'
import { CookieTemplateList } from './pages/CookieTemplateList'
import { CookieTemplateEditor } from './pages/CookieTemplateEditor'
import { UITemplateList } from './pages/UITemplateList'
import { UITemplateEditor } from './pages/UITemplateEditor'
import { ConsentList } from './pages/ConsentList'
import { VisitorList } from './pages/VisitorList'
import { UserList } from './pages/UserList'
import { RoleList } from './pages/RoleList'
import { TenantList } from './pages/TenantList'
import { VendorList } from './pages/VendorList'
import { AuditLogPage } from './pages/AuditLog'
import { Settings } from './pages/Settings'
import { ChangePassword } from './pages/ChangePassword'
import { ApiConfig } from './pages/ApiConfig'
import { ApiDocs } from './pages/ApiDocs'

function getHash(): string {
  return window.location.hash || '#/'
}

export function Router() {
  const { user } = useAuth()
  const [hash, setHash] = useState(getHash)

  useEffect(() => {
    const update = () => setHash(getHash())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  if (!user) {
    if (hash !== '#/login') window.location.hash = '#/login'
    return <Login />
  }

  if (hash === '#/login') {
    window.location.hash = '#/'
    return null
  }

  if (hash === '#/' || hash === '#') return <Dashboard current={hash} />
  if (hash === '#/banners/profiles') return <ProfileList current={hash} />
  if (hash === '#/banners/profiles/new') return <ProfileEditor current={hash} />
  if (hash.startsWith('#/banners/profiles/')) return <ProfileEditor id={hash.slice('#/banners/profiles/'.length)} current={hash} />
  if (hash === '#/banners/cookie-templates') return <CookieTemplateList current={hash} />
  if (hash === '#/banners/cookie-templates/new') return <CookieTemplateEditor current={hash} />
  if (hash.startsWith('#/banners/cookie-templates/')) return <CookieTemplateEditor id={hash.slice('#/banners/cookie-templates/'.length)} current={hash} />
  if (hash === '#/banners/ui-templates') return <UITemplateList current={hash} />
  if (hash === '#/banners/ui-templates/new') return <UITemplateEditor current={hash} />
  if (hash.startsWith('#/banners/ui-templates/')) return <UITemplateEditor id={hash.slice('#/banners/ui-templates/'.length)} current={hash} />
  if (hash === '#/consents') return <ConsentList current={hash} />
  if (hash === '#/visitors') return <VisitorList current={hash} />
  if (hash === '#/users') return <UserList current={hash} />
  if (hash === '#/roles') return <RoleList current={hash} />
  if (hash === '#/tenants') return <TenantList current={hash} />
  if (hash === '#/vendors' || hash.startsWith('#/vendors?')) return <VendorList current={hash} />
  if (hash === '#/audit') return <AuditLogPage current={hash} />
  if (hash === '#/api/config') return <ApiConfig current={hash} />
  if (hash === '#/api/docs') return <ApiDocs current={hash} />
  if (hash === '#/settings') return <Settings current={hash} />
  if (hash === '#/settings/change-password') return <ChangePassword current={hash} />

  return <Dashboard current="#/" />
}
