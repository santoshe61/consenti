import { createContext } from 'preact'
import { useContext, useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import type { CurrentUser } from '@consenti/types'

const TOKEN_KEY = 'consenti_token'

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

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
