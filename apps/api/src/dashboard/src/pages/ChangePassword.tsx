import { useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { useAuth } from '../context/auth'
import { usersApi } from '../api/users'

export function ChangePassword({ current }: { current: string }) {
  const { user } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (newPassword.length < 12) return 'Password must be at least 12 characters.'
    if (newPassword !== confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const err = validate()
    if (err) { setError(err); return }
    if (!user?.sub) return
    setLoading(true)
    try {
      await usersApi.update(user.sub, { password: newPassword })
      setSuccess(true)
      setNewPassword('')
      setConfirm('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Change Password" current={current}>
      <div class="max-w-md">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Choose a strong password of at least 12 characters.
          </p>

          {success && (
            <div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
              Password updated successfully.
            </div>
          )}

          {error && (
            <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
                minLength={12}
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min. 12 characters"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onInput={(e) => setConfirm((e.target as HTMLInputElement).value)}
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat new password"
              />
            </div>
            <div class="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving…' : 'Update Password'}
              </button>
              <a href="#/settings" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
