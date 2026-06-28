import type { AdminUser, AuthConfig } from '@consenti/types'

export function buildCustomAuth(validateUser: AuthConfig['validateUser']) {
  return async (req: Request): Promise<AdminUser | null> => {
    if (!validateUser) return null
    return validateUser(req)
  }
}
