import { parentPort } from 'node:worker_threads'
import { runWorkerAction } from './profile-json-worker-core.js'
export type { WorkerMessage } from './profile-json-worker-core.js'
import type { WorkerMessage } from './profile-json-worker-core.js'

type WorkerResult =
  | { ok: true; action: WorkerMessage['action'] }
  | { ok: false; action: WorkerMessage['action']; error: string }

if (parentPort) {
  parentPort.on('message', async (msg: WorkerMessage) => {
    const port = parentPort!
    try {
      await runWorkerAction(msg)
      port.postMessage({ ok: true, action: msg.action } satisfies WorkerResult)
    } catch (err) {
      port.postMessage({
        ok: false,
        action: msg.action,
        error: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResult)
    }
  })
}
