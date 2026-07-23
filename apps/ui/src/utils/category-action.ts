/**
 * CategoryAction — runs a callback based on a category's rollup consent state.
 *
 * A category is considered "granted" only when *every* parameter it contains is
 * `'granted'` — matching the preference modal's tri-state rollup rule. `onDeny`
 * fires for both a fully-denied category and a partially-granted ("mixed") one,
 * since neither represents full consent for the category.
 *
 * Same lifecycle as `ConsentAction`: evaluates immediately on construction,
 * re-evaluates on `consenti:consentSubmitted`, `destroy()` to unbind.
 *
 * @example
 * ```ts
 * import { ConsentiSetup, CategoryAction } from '@consenti/ui'
 *
 * const widget = new ConsentiSetup({ core: { profileId: 0 } })
 * await widget.ready
 *
 * new CategoryAction({
 *   id: 'marketing',
 *   widget,
 *   onGrant: () => adSdk.enableAll(),
 *   onDeny: () => adSdk.disableAll(),
 * })
 * ```
 */

import type { ConsentiSetup } from '../core/consenti-setup'
import type { ConsentValue } from '../types'
import { isClient } from './ssr'

/** Passed to `onGrant`/`onDeny` — the category's member parameter IDs plus the full current consent map. */
export interface CategoryActionParams {
  categoryId: string
  cookieIds: string[]
  consent: ConsentValue | null
}

/** Options for constructing a {@link CategoryAction} instance. */
export interface CategoryActionOptions {
  /** The category ID to watch (e.g. `'marketing'`). */
  id: string
  /** The `ConsentiSetup` widget instance to read consent from. */
  widget: ConsentiSetup
  /**
   * When `true` (default), the callbacks re-fire automatically on every future consent
   * change. Set to `false` to evaluate consent only once at construction time — no
   * event listener is attached.
   */
  bind?: boolean
  /** Called when every parameter in the category transitions to `'granted'`. */
  onGrant?: (params: CategoryActionParams) => void
  /** Called when the category transitions away from fully-granted (any parameter denied/objected). */
  onDeny?: (params: CategoryActionParams) => void
}

/**
 * Watches a category's rollup grant status and fires `onGrant`/`onDeny` callbacks
 * on transitions. Call {@link CategoryAction.destroy} when no longer needed to
 * remove the event listener.
 */
export class CategoryAction {
  private granted: boolean | null = null
  private readonly handler: () => void

  constructor(private readonly options: CategoryActionOptions) {
    // Assign handler unconditionally to satisfy TypeScript strict property initialisation.
    this.handler = () => this.evaluate()

    if (!isClient()) return

    if (options.bind !== false) {
      window.addEventListener('consenti:consentSubmitted', this.handler)
    }

    // Evaluate immediately so any existing consent is reflected at construction time.
    this.evaluate()
  }

  private evaluate(): void {
    const category = this.options.widget.getProfile()?.preferenceModal.categories[this.options.id]
    const cookieIds = category?.cookies ?? []
    const consent = this.options.widget.getConsent()
    const granted = cookieIds.length > 0 && cookieIds.every(id => consent?.[id] === 'granted')

    if (granted === this.granted) return
    this.granted = granted

    const params: CategoryActionParams = { categoryId: this.options.id, cookieIds, consent }

    if (granted) this.options.onGrant?.(params)
    else this.options.onDeny?.(params)
  }

  /** Removes the event listener (if bound). */
  destroy(): void {
    if (!isClient()) return
    if (this.options.bind !== false) {
      window.removeEventListener('consenti:consentSubmitted', this.handler)
    }
  }
}
