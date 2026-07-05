import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { PublicProfileResponse } from '@consenti/types'
import { safeJsonWrite } from '../utils/safe-json-write'

function isPublicProfileResponse(v: unknown): v is PublicProfileResponse {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>)['id'] === 'string' &&
    typeof (v as Record<string, unknown>)['version'] === 'number'
  )
}

export class LocaleJsonCacheService {
  constructor(private readonly dir: string) {}

  read(profileId: string, locale: string): PublicProfileResponse | null {
    const path = this.path(profileId, locale)
    if (!existsSync(path)) return null
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
      return isPublicProfileResponse(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  write(profileId: string, locale: string, response: PublicProfileResponse): void {
    safeJsonWrite(this.path(profileId, locale), response, isPublicProfileResponse)
  }

  rebuild(profileId: string, responses: Map<string, PublicProfileResponse>): void {
    for (const [locale, response] of responses) {
      try {
        this.write(profileId, locale, response)
      } catch (err) {
        console.warn(`[Consenti] locale cache rebuild failed for ${profileId}/${locale}:`, err)
      }
    }
  }

  invalidate(profileId: string): void {
    try {
      const prefix = `${profileId}_`
      for (const file of readdirSync(this.dir)) {
        if (file.startsWith(prefix) && file.endsWith('.json')) {
          try { unlinkSync(join(this.dir, file)) } catch { /* ok */ }
        }
      }
    } catch { /* ok if dir doesn't exist */ }
  }

  private path(profileId: string, locale: string): string {
    return join(this.dir, `${profileId}_${locale}.json`)
  }
}
