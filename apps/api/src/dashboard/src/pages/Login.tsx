import { useState } from 'preact/hooks'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/auth'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError('Invalid email or password')
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
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold text-gray-900">Consenti Admin</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onInput={e => setEmail((e.target as HTMLInputElement).value)}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onInput={e => setPassword((e.target as HTMLInputElement).value)}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
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
              ⚡ Dev: sign in as user@consenti.dev
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
