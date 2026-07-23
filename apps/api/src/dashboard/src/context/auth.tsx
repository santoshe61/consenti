import { createContext } from 'preact'
import { useContext, useState, useEffect, useRef } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import type { CurrentUser } from '@consenti/types'
import { apiFetch, SESSION_EXPIRED_EVENT } from '../api/client'

const TOKEN_KEY = 'consenti_token'

/** Sliding inactivity timeout — the token itself is issued with a matching TTL
 * (`SESSION_TTL_SECONDS` in `apps/api/src/auth/local.auth.ts`), so a refresh call here just
 * extends it another `INACTIVITY_TIMEOUT_MS` from now. */
const INACTIVITY_TIMEOUT_MS = 30 * 60_000
const CHECK_INTERVAL_MS = 60_000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

function tokenToUser(token: string | null): CurrentUser | null {
  if (!token) return null
  try {
    const body = token.split('.')[1]
    if (!body) return null
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
    const exp = payload['exp'] as number | undefined
    if (exp && exp < Math.floor(Date.now() / 1000)) return null
    return {
      sub: payload['sub'] as string,
      email: payload['email'] as string,
      roles: (payload['roles'] as string[]) ?? [],
      permissions: (payload['permissions'] as string[]) ?? [],
    }
  } catch {
    return null
  }
}

interface AuthCtx {
  user: CurrentUser | null
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null,
  login: () => {}, logout: () => {},
})

export function AuthProvider({ children }: { children: ComponentChildren }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<CurrentUser | null>(() => tokenToUser(localStorage.getItem(TOKEN_KEY)))
  const lastActivityRef = useRef(Date.now())

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(tokenToUser(newToken))
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    window.location.hash = '#/login'
  }

  // A 401 anywhere in the app (see api/client.ts) means the session's already gone server-side —
  // route through the same logout() as everything else so state, storage, and the hash change
  // all happen together instead of racing each other.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [])

  // Passive activity tracking — a plain ref write on every event, no re-render, cheap enough to
  // run unthrottled even for mousemove. Mounted once for the app's lifetime regardless of login
  // state; the interval below is what actually gates on whether there's a session to manage.
  useEffect(() => {
    const markActive = () => { lastActivityRef.current = Date.now() }
    for (const evt of ACTIVITY_EVENTS) window.addEventListener(evt, markActive, { passive: true })
    return () => { for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, markActive) }
  }, [])

  // Sliding inactivity timeout: every CHECK_INTERVAL_MS, either silently refresh the token (there
  // was recent activity) or force logout (30+ min idle) — proactive, rather than waiting for the
  // token to actually lapse and the next request to 401 before anything visibly happens.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!localStorage.getItem(TOKEN_KEY)) return
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        logout()
        return
      }
      apiFetch<{ token: string }>('/auth/refresh', { method: 'POST' })
        .then(newToken => login(newToken.token))
        .catch(() => {}) // a failed refresh just means the next real request 401s and logs out normally
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
