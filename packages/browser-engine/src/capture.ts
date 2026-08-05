import type { Page } from 'playwright'
import type { BrowserSession } from './session.js'
import type { CapturedIndexedDb, CapturedScriptTag, CapturedSignals, CapturedStorageEntry } from './types.js'

export async function captureSignals(session: BrowserSession): Promise<CapturedSignals> {
  const [cookies, localStorageEntries, sessionStorageEntries, indexedDb, scriptTags, iframeOrigins, documentCookieNames] =
    await Promise.all([
      session.context.cookies(),
      readStorage(session.page, 'localStorage'),
      readStorage(session.page, 'sessionStorage'),
      readIndexedDb(session.page),
      readScriptTags(session.page),
      readIframeOrigins(session.page),
      readDocumentCookieNames(session.page),
    ])

  return {
    url: session.page.url(),
    cookies: cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      readableViaDocumentCookie: documentCookieNames.has(cookie.name),
    })),
    localStorage: localStorageEntries,
    sessionStorage: sessionStorageEntries,
    indexedDb,
    requests: [...session.requests],
    scriptTags,
    iframeOrigins,
  }
}

async function readDocumentCookieNames(page: Page): Promise<Set<string>> {
  const raw = await page.evaluate(() => document.cookie)
  const names = raw
    .split(';')
    .map(part => part.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name))
  return new Set(names)
}

async function readStorage(page: Page, kind: 'localStorage' | 'sessionStorage'): Promise<CapturedStorageEntry[]> {
  return page.evaluate(storageKind => {
    const storage = window[storageKind]
    return Object.keys(storage).map(key => ({ key, value: storage.getItem(key) ?? '' }))
  }, kind)
}

async function readScriptTags(page: Page): Promise<CapturedScriptTag[]> {
  return page.evaluate(() =>
    Array.from(document.scripts).map(script => ({
      src: script.src || null,
      inline: !script.src,
      content: script.src ? null : script.textContent,
    }))
  )
}

async function readIframeOrigins(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const origins = new Set<string>()
    for (const frame of Array.from(document.querySelectorAll('iframe'))) {
      const src = frame.getAttribute('src')
      if (!src) continue
      try {
        origins.add(new URL(src, window.location.href).origin)
      } catch {
        continue
      }
    }
    return Array.from(origins)
  })
}

async function readIndexedDb(page: Page): Promise<CapturedIndexedDb[]> {
  return page.evaluate(async () => {
    if (!('indexedDB' in window) || typeof indexedDB.databases !== 'function') return []

    const databases = await indexedDB.databases()
    const results: { databaseName: string; version: number | null; objectStores: string[] }[] = []

    for (const dbInfo of databases) {
      if (!dbInfo.name) continue

      const objectStores = await new Promise<string[]>(resolve => {
        const request = indexedDB.open(dbInfo.name as string)
        request.onsuccess = () => {
          const db = request.result
          const stores = Array.from(db.objectStoreNames)
          db.close()
          resolve(stores)
        }
        request.onerror = () => resolve([])
      })

      results.push({ databaseName: dbInfo.name as string, version: dbInfo.version ?? null, objectStores })
    }

    return results
  })
}
