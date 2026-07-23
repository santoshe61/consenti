import { useState } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { Eye, EyeOff } from 'lucide-react'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/auth'
import { useBranding } from '../context/branding'
import { useT } from '../context/locale'

interface IconProps { size?: number; className?: string }
const EyeIcon = Eye as unknown as FunctionComponent<IconProps>
const EyeOffIcon = EyeOff as unknown as FunctionComponent<IconProps>

export function Login() {
  const { login } = useAuth()
  const { appName, appLogoPath, hidePoweredBy } = useBranding()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async (e: string, p: string) => {
    setError('')
    setLoading(true)
    try {
      const { token } = await apiFetch<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: e, password: p }),
      })
      login(token)
      window.location.hash = '#/'
    } catch {
      setError(t('login.error.invalid'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    void doLogin(email, password)
  }

  const handleDemoLogin = () => {
    setEmail('user@consenti.dev')
    setPassword('Consenti@123')
    void doLogin('user@consenti.dev', 'Consenti@123')
  }

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={{ background: "linear-gradient(135deg, rgb(2, 6, 23) 0%, rgb(26, 52, 96) 40%, rgb(21, 101, 192) 75%, rgb(67, 160, 71) 100%)" }}>
      {appLogoPath
        ? <img src={appLogoPath} alt={appName} class="h-14 w-auto mx-auto mb-3 object-contain" />
        : null}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div class="mb-6 text-center">
          <h1 class="text-xl font-bold text-gray-900">{t('login.title', { appName })}</h1>
          <p class="text-sm text-gray-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">
              {t('login.email')}
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onInput={e => setEmail((e.target as HTMLInputElement).value)}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('login.emailPlaceholder')}
              autocomplete="email"
            />
          </div>

          <div>
            <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">
              {t('login.password')}
            </label>
            <div class="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onInput={e => setPassword((e.target as HTMLInputElement).value)}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autocomplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword
                  ? <EyeOffIcon size={16} />
                  : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div class="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={handleDemoLogin}
              class="w-full border border-dashed border-gray-300 text-gray-500 rounded-lg px-4 py-2 text-xs font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {t('login.devSignIn')}
            </button>
          </div>
        )}

        {hidePoweredBy || (
          <p class="mt-5 text-center text-[11px] text-gray-400">
            {t('layout.poweredBy')}{' '}
            <a href="https://consenti.dev/?utm_source=dashboard&utm_medium=powered-by&utm_campaign=consenti-api" target="_blank" rel="noopener noreferrer" class="hover:text-blue-500 transition-colors">
              Consenti
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
