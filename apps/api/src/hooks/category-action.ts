/**
 * CategoryAction — server-side counterpart to `@consenti/ui`'s `CategoryAction`.
 *
 * Same idea as {@link ConsentAction} but watches a whole category's rollup consent state
 * (granted only when *every* cookie in the category is granted) instead of one parameter —
 * matching the preference modal's tri-state rollup rule and the widget's `CategoryAction`.
 *
 * @example
 * ```ts
 * import { createConsenti, CategoryAction } from '@consenti/api'
 *
 * const { eventBus, services } = createConsenti({ ... })
 *
 * new CategoryAction({
 *   categoryId: 'marketing',
 *   eventBus,
 *   profiles: services.profile,
 *   onGrant: ({ visitorId }) => adsPlatform.optIn(visitorId),
 *   onDeny: ({ visitorId }) => adsPlatform.optOut(visitorId),
 * })
 * ```
 */

import type { EventEmitter } from 'node:events'
import type { ConsentDbRecord, ConsentStatus, ConsentValue } from '@consenti/types'
import type { ProfileService } from '../services/profile.service'

/** Passed to `onGrant`/`onDeny` — the category's rollup status plus the full consent record. */
export interface CategoryActionParams {
  visitorId: string
  categoryId: string
  status: ConsentStatus
  record: ConsentDbRecord
}

/** Options for constructing a {@link CategoryAction} instance. */
export interface CategoryActionOptions {
  /** The category ID to watch (e.g. `'marketing'`). */
  categoryId: string
  /** The `eventBus` returned by `createConsenti()`. */
  eventBus: EventEmitter
  /** The `services.profile` returned by `createConsenti()` — resolves which cookies belong to
   * this category for the record's profile (categories are defined on the consent template). */
  profiles: ProfileService
  /** Called when every cookie in the category transitions to `'granted'`. */
  onGrant?: (params: CategoryActionParams) => void
  /** Called when the category transitions away from fully granted. */
  onDeny?: (params: CategoryActionParams) => void
}

function isCategoryGranted(consent: ConsentValue, cookieIds: string[]): boolean {
  return cookieIds.length > 0 && cookieIds.every(id => consent[id] === 'granted')
}

/**
 * Watches a category's rollup consent status across every incoming `consent.created`/
 * `consent.updated` event and fires `onGrant`/`onDeny` on transitions. Call
 * {@link CategoryAction.destroy} to remove the event listeners when no longer needed.
 */
export class CategoryAction {
  private readonly onCreated = (record: ConsentDbRecord): void => { void this.fire(record, undefined) }
  private readonly onUpdated = ({ previous, current }: { previous: ConsentDbRecord; current: ConsentDbRecord }): void => {
    void this.fire(current, previous)
  }

  constructor(private readonly options: CategoryActionOptions) {
    options.eventBus.on('consent.created', this.onCreated)
    options.eventBus.on('consent.updated', this.onUpdated)
  }

  private async fire(record: ConsentDbRecord, previous: ConsentDbRecord | undefined): Promise<void> {
    const resolved = await this.options.profiles.getResolved(record.profileId)
    const cookieIds = resolved?.preferenceModal.categories[this.options.categoryId]?.cookies ?? []
    if (cookieIds.length === 0) return

    const status: ConsentStatus = isCategoryGranted(record.consentJson, cookieIds) ? 'granted' : 'denied'
    const prevStatus: ConsentStatus = previous && isCategoryGranted(previous.consentJson, cookieIds) ? 'granted' : 'denied'
    if (status === prevStatus) return

    const params: CategoryActionParams = { visitorId: record.visitorId, categoryId: this.options.categoryId, status, record }
    if (status === 'granted') this.options.onGrant?.(params)
    else this.options.onDeny?.(params)
  }

  /** Removes the event listeners. Call when the hook is no longer needed. */
  destroy(): void {
    this.options.eventBus.off('consent.created', this.onCreated)
    this.options.eventBus.off('consent.updated', this.onUpdated)
  }
}
