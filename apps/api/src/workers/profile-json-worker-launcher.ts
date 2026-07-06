import { Worker } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { runWorkerAction } from './profile-json-worker-core.js'
import type { WorkerMessage } from './profile-json-worker-core.js'

type WorkerResult =
  | { ok: true; action: WorkerMessage['action'] }
  | { ok: false; action: WorkerMessage['action']; error: string }

const _dir = dirname(fileURLToPath(import.meta.url))
const JS_WORKER = join(_dir, 'profile-json.worker.js')
// In dev (tsx), only the .ts file exists; skip the worker thread entirely and call the core logic directly.
const IS_DEV = !existsSync(JS_WORKER)

/**
 * Writes/activates/deactivates profile JSON files.
 * In dev mode runs inline (no worker thread). In production uses a worker thread.
 * Throws if the operation fails so callers can surface the error to the API client.
 */
export async function runProfileJsonWrite(msg: WorkerMessage): Promise<void> {
  if (IS_DEV) {
    await runWorkerAction(msg)
    return
  }

  return new Promise<void>((resolve, reject) => {
    const worker = new Worker(JS_WORKER)
    worker.postMessage(msg)
    worker.once('message', (result: WorkerResult) => {
      void worker.terminate()
      if (result.ok) {
        resolve()
      } else {
        reject(new Error(`[profile-worker] ${result.action} failed: ${result.error}`))
      }
    })
    worker.once('error', err => {
      void worker.terminate()
      reject(err)
    })
  })
}
