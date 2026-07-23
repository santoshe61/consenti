/**
 * ConsentAction — server-side counterpart to `@consenti/ui`'s `ConsentAction`.
 *
 * Watches a single consent parameter across *every* visitor's submission (not just one
 * browser's own state) and fires `onGrant`/`onDeny` when that parameter's status actually
 * changes — via the same `eventBus` `createConsenti()` already emits `consent.created`/
 * `consent.updated` on. Useful for server-side integrations (CRM sync, suppression lists,
 * downstream webhooks) that need to react to consent decisions without polling the database.
 *
 * There is no server equivalent of the widget's `ConsentScript` — injecting a `<script>` tag
 * only makes sense in a browser DOM the server doesn't have. `services.consent.create()`/
 * `.update()` are already the server-side "submit"/"update consent" methods this hook reacts to.
 *
 * @example
 * ```ts
 * import { createConsenti, ConsentAction } from '@consenti/api'
 *
 * const { eventBus } = createConsenti({ ... })
 *
 * new ConsentAction({
 *   id: 'analytics_storage',
 *   eventBus,
 *   onGrant: ({ visitorId }) => crm.optIn(visitorId),
 *   onDeny: ({ visitorId }) => crm.optOut(visitorId),
 * })
 * ```
 */

import type { EventEmitter } from 'node:events'
import type { ConsentDbRecord, ConsentStatus } from '@consenti/types'

/** Passed to `onGrant`/`onDeny` — the transitioning parameter's status plus the full consent record. */
export interface ConsentActionParams {
  visitorId: string
  cookieId: string
  status: ConsentStatus
  record: ConsentDbRecord
}

/** Options for constructing a {@link ConsentAction} instance. */
export interface ConsentActionOptions {
  /** The consent parameter ID to watch (e.g. `'analytics_storage'`). */
  id: string
  /** The `eventBus` returned by `createConsenti()`. */
  eventBus: EventEmitter
  /** Called when the parameter's status transitions to `'granted'`, for any visitor. */
  onGrant?: (params: ConsentActionParams) => void
  /** Called when the parameter's status transitions away from `'granted'` (`'denied'` or `'objected'`). */
  onDeny?: (params: ConsentActionParams) => void
}

/**
 * Watches a single consent parameter across every incoming `consent.created`/`consent.updated`
 * event and fires `onGrant`/`onDeny` on transitions. Call {@link ConsentAction.destroy} to
 * remove the event listeners when the hook is no longer needed.
 */
export class ConsentAction {
  private readonly onCreated = (record: ConsentDbRecord): void => this.fire(record, undefined)
  private readonly onUpdated = ({ previous, current }: { previous: ConsentDbRecord; current: ConsentDbRecord }): void =>
    this.fire(current, previous)

  constructor(private readonly options: ConsentActionOptions) {
    options.eventBus.on('consent.created', this.onCreated)
    options.eventBus.on('consent.updated', this.onUpdated)
  }

  private fire(record: ConsentDbRecord, previous: ConsentDbRecord | undefined): void {
    const status: ConsentStatus = record.consentJson[this.options.id] ?? 'denied'
    const prevStatus: ConsentStatus = previous?.consentJson[this.options.id] ?? 'denied'
    if (status === prevStatus) return

    const params: ConsentActionParams = { visitorId: record.visitorId, cookieId: this.options.id, status, record }
    if (status === 'granted') this.options.onGrant?.(params)
    else this.options.onDeny?.(params)
  }

  /** Removes the event listeners. Call when the hook is no longer needed. */
  destroy(): void {
    this.options.eventBus.off('consent.created', this.onCreated)
    this.options.eventBus.off('consent.updated', this.onUpdated)
  }
}
