import { writeFileSync, readFileSync, renameSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PublicProfileResponse, S3ApiConfig } from '@consenti/types'
import { s3Put, s3Delete } from '../storage/s3/s3-client.js'

export interface WorkerMessage {
  action: 'write' | 'activate' | 'deactivate'
  profile: PublicProfileResponse & { translations?: Record<string, unknown> }
  storagePath: string
  tenantId: string
  profileId: string
  version: number
  complianceGroup: string
  s3Config?: S3ApiConfig
}

function profilesRoot(storagePath: string, tenantId: string): string {
  return join(storagePath, 'profiles', tenantId)
}

function versionDir(storagePath: string, tenantId: string, profileId: string, version: number): string {
  return join(profilesRoot(storagePath, tenantId), profileId, String(version))
}

function complianceDir(storagePath: string, tenantId: string, complianceGroup: string): string {
  return join(profilesRoot(storagePath, tenantId), complianceGroup)
}

function s3Key(tenantId: string, segment: string, locale: string): string {
  return `profiles/${tenantId}/${segment}/${locale}.json`
}

function writeJsonFile(filePath: string, content: string): void {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, content, 'utf8')
  JSON.parse(content)
  renameSync(tmp, filePath)
}

export async function writeVersionDir(msg: WorkerMessage): Promise<void> {
  const { storagePath, tenantId, profileId, version, profile, s3Config } = msg
  const dir = versionDir(storagePath, tenantId, profileId, version)
  mkdirSync(dir, { recursive: true })

  const locales = profile.locales ?? []
  const defaultLocale = profile.defaultLocale
  const translations = (profile as { translations?: Record<string, unknown> }).translations ?? {}

  for (const locale of locales) {
    const content = locale === profile.currentLocale
      ? JSON.stringify(profile, null, 2)
      : JSON.stringify({ ...profile, currentLocale: locale, ...(translations[locale] ?? {}) }, null, 2)
    const filePath = join(dir, `${locale}.json`)
    writeJsonFile(filePath, content)

    if (locale === defaultLocale) {
      writeJsonFile(join(dir, 'default.json'), content)
    }

    if (s3Config?.enabled) {
      await s3Put(s3Key(tenantId, `${profileId}/${version}`, locale), content, s3Config)
      if (locale === defaultLocale) {
        await s3Put(s3Key(tenantId, `${profileId}/${version}`, 'default'), content, s3Config)
      }
    }
  }

  if (!existsSync(join(dir, 'default.json'))) {
    const fallbackLocale = locales.includes(defaultLocale) ? defaultLocale : (locales[0] ?? '')
    if (fallbackLocale) {
      const fallbackPath = join(dir, `${fallbackLocale}.json`)
      if (existsSync(fallbackPath)) {
        copyFileSync(fallbackPath, join(dir, 'default.json'))
      }
    }
  }
}

export async function activateComplianceGroup(msg: WorkerMessage): Promise<void> {
  const { storagePath, tenantId, profileId, version, complianceGroup, s3Config } = msg
  const srcDir = versionDir(storagePath, tenantId, profileId, version)
  const destDir = complianceDir(storagePath, tenantId, complianceGroup)

  mkdirSync(destDir, { recursive: true })

  const files = readdirSync(srcDir).filter(f => f.endsWith('.json'))
  for (const file of files) {
    copyFileSync(join(srcDir, file), join(destDir, file))

    if (s3Config?.enabled) {
      const content = readFileSync(join(destDir, file), 'utf8')
      await s3Put(s3Key(tenantId, complianceGroup, file.replace('.json', '')), content, s3Config)
    }
  }
}

export async function deactivateComplianceGroup(msg: WorkerMessage): Promise<void> {
  const { storagePath, tenantId, complianceGroup, s3Config, profile } = msg
  const dir = complianceDir(storagePath, tenantId, complianceGroup)

  if (existsSync(dir)) {
    if (s3Config?.enabled) {
      const locales = profile.locales ?? []
      for (const locale of locales) {
        await s3Delete(s3Key(tenantId, complianceGroup, locale), s3Config)
      }
      await s3Delete(s3Key(tenantId, complianceGroup, 'default'), s3Config)
    }
    rmSync(dir, { recursive: true, force: true })
  }
}

export async function runWorkerAction(msg: WorkerMessage): Promise<void> {
  if (msg.action === 'write') {
    await writeVersionDir(msg)
  } else if (msg.action === 'activate') {
    await writeVersionDir(msg)
    await activateComplianceGroup(msg)
  } else if (msg.action === 'deactivate') {
    await deactivateComplianceGroup(msg)
  }
}
