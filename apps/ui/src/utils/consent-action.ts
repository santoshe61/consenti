/**
 * ConsentAction — runs a callback based on a specific consent parameter's grant status.
 *
 * Same lifecycle as `ConsentScript` (evaluates immediately on construction so
 * existing consent is honoured, re-evaluates on `consenti:consentSubmitted`,
 * `destroy()` to unbind) but fires `onGrant`/`onDeny` callbacks instead of
 * injecting a `<script>` element — for integrations that expose their own
 * `sdk.optIn()`/`sdk.optOut()` API (Segment, Mixpanel, Amplitude, Sentry, etc.)
 * rather than needing a script tag toggled. Use `ConsentScript` for that case instead.
 *
 * @example
 * ```ts
 * import { ConsentiSetup, ConsentAction } from '@consenti/ui'
 *
 * const widget = new ConsentiSetup({ core: { profileId: 0 } })
 * await widget.ready
 *
 * new ConsentAction({
 *   id: 'analytics_storage',
 *   widget,
 *   onGrant: () => analyticsSdk.optIn(),
 *   onDeny: () => analyticsSdk.optOut(),
 * })
 * ```
 */

import type { ConsentiSetup } from '../core/consenti-setup'
import type { ConsentValue, ConsentStatus, Cookie } from '../types'
import { isClient } from './ssr'

/** Passed to `onGrant`/`onDeny` — the resolved parameter's metadata plus the full current consent map. */
export interface ConsentActionParams {
  cookieId: string
  status: ConsentStatus
  cookie: Cookie | undefined
  consent: ConsentValue | null
}

/** Options for constructing a {@link ConsentAction} instance. */
export interface ConsentActionOptions {
  /** The consent parameter ID to watch (e.g. `'analytics_storage'`). */
  id: string
  /** The `ConsentiSetup` widget instance to read consent from. */
  widget: ConsentiSetup
  /**
   * When `true` (default), the callbacks re-fire automatically on every future consent
   * change. Set to `false` to evaluate consent only once at construction time — no
   * event listener is attached.
   */
  bind?: boolean
  /** Called when the parameter's status transitions to `'granted'`. */
  onGrant?: (params: ConsentActionParams) => void
  /** Called when the parameter's status transitions away from `'granted'` (`'denied'` or `'objected'`). */
  onDeny?: (params: ConsentActionParams) => void
}

/**
 * Watches a single consent parameter's grant status and fires `onGrant`/`onDeny`
 * callbacks on transitions. Call {@link ConsentAction.destroy} when no longer
 * needed to remove the event listener.
 */
export class ConsentAction {
  private granted: boolean | null = null
  private readonly handler: () => void

  constructor(private readonly options: ConsentActionOptions) {
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
    const consent = this.options.widget.getConsent()
    const status: ConsentStatus = consent?.[this.options.id] ?? 'denied'
    const granted = status === 'granted'

    if (granted === this.granted) return
    this.granted = granted

    const cookie = this.options.widget.getProfile()?.cookies[this.options.id]
    const params: ConsentActionParams = { cookieId: this.options.id, status, cookie, consent }

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
