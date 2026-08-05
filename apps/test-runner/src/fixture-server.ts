import { createServer, type Server } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const FIXTURE_DIR = join(PACKAGE_ROOT, 'fixture')
const UI_DIST_DIR = join(PACKAGE_ROOT, '..', '..', 'apps', 'ui', 'dist')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

export interface FixtureServer {
  url: string
  close: () => Promise<void>
}

/**
 * Resolves a request path to an absolute file path under `root`, rejecting
 * anything that would escape it (defence against `..` path traversal —
 * this server binds to loopback only, but stay honest about the boundary).
 */
function resolveUnderRoot(root: string, requestPath: string): string {
  const decoded = decodeURIComponent(requestPath)
  const resolved = join(root, decoded)
  if (!resolved.startsWith(root)) throw new Error('Path escapes root')
  return resolved
}

async function serveFile(res: import('node:http').ServerResponse, filePath: string): Promise<void> {
  const info = await stat(filePath)
  if (!info.isFile()) throw new Error('Not a file')
  const body = await readFile(filePath)
  const contentType = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': body.length })
  res.end(body)
}

/**
 * Serves the test-runner fixture page + the real built `@consenti/ui` bundle
 * (under `/consenti-ui/*`) so the fixture exercises the same artifact that
 * ships, not raw `src`. Requires `apps/ui` to have been built first
 * (`npm run build --workspace=apps/ui`).
 */
export async function startFixtureServer(): Promise<FixtureServer> {
  const server: Server = createServer((req, res) => {
    void (async () => {
      try {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        const pathname = url.pathname === '/' ? '/index.html' : url.pathname

        if (pathname.startsWith('/consenti-ui/')) {
          await serveFile(res, resolveUnderRoot(UI_DIST_DIR, pathname.slice('/consenti-ui'.length)))
          return
        }

        await serveFile(res, resolveUnderRoot(FIXTURE_DIR, pathname))
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
      }
    })()
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('Failed to determine fixture server port')
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()))
    }),
  }
}
