/**
 * Main entry point for the Consenti widget.
 *
 * Instantiate one `ConsentiSetup` per page (or per profile ID if you run multiple
 * consent contexts on the same page). The constructor is safe to call during SSR —
 * it silently no-ops when `window` is not defined.
 *
 * @example
 * ```ts
 * const widget = new ConsentiSetup({
 *   compliance: { type: 'opt-in' },
 * })
 * await widget.ready
 * console.log(widget.hasConsent())
 * ```
 */

import type {
  ConsentiConfig,
  ConsentValue,
  ConsentAction,
  ConsentEvent,
  ResolvedProfile,
  ConsentiPlugin,
  ConsentiWidgetAPI,
  ConsentiMessage,
  ConsentiEventName,
  ThemeConfig,
  DeepPartial,
} from '../types'
import { CONSENTI_CSS } from '../styles/consenti-css'
import { isClient } from '../utils/ssr'
import { ConsentStorage } from '../utils/storage'
import { ConsentiChannel } from '../utils/broadcast'
import { generateReceipt, downloadReceipt } from '../utils/receipt'
import { ConsentStore } from './consent-store'
import { EventBus } from './event-bus'
import { resolveProfile } from './profile-resolver'
import { detectGPC, applyGPCToConsent } from './gpc'
import { Banner } from '../ui/banner'
import { Modal } from '../ui/modal'
import { Renderer } from '../ui/renderer'
import type { ButtonClickHandler } from '../ui/buttons'
import { deepMerge } from '../utils/locale'
import { logger, initConsole } from '../utils/console'

export class ConsentiSetup implements ConsentiWidgetAPI {
  private initialized = false
  private initializing = false
  private profile: ResolvedProfile | null = null
  private resolvedBase: ResolvedProfile | null = null
  private consentStore: ConsentStore | null = null
  private eventBus: EventBus | null = null
  private banner: Banner | null = null
  private modal: Modal | null = null
  private renderer: Renderer | null = null
  private broadcastChannel = new ConsentiChannel()
  private readyResolve!: () => void
  private readyPromise: Promise<void>
  private plugins: ConsentiPlugin[] = []
  /** Signature from the most recent `writeAndSign` call. Included in consent receipts. */
  private lastSignature: string | undefined
  /** Tracks which banner variant is currently visible, or null when hidden. */
  private _bannerVariant: 'main' | 'gpc' | null = null
  /** Maps original handler functions to their DOM-wrapped listeners for on/off bookkeeping. */
  private _eventHandlers = new Map<
    (data: ConsentEvent) => void,
    Array<{ name: string; wrapped: EventListener }>
  >()

  /**
   * Creates and initialises the consent widget.
   *
   * Construction is synchronous; the async `init()` is launched in the background.
   * Use `await widget.ready` or `widget.onReady(cb)` to run code after init completes.
   *
   * @param config - Widget configuration. See `ConsentiConfig` for all options.
   */
  constructor(private config: ConsentiConfig) {
    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolve = resolve
    })

    if (!isClient()) return

    initConsole(config.core.console ?? ['error'])

    if (config.api?.enabled && config.core.storage === 'localStorage') {
      logger.warn(
        'localStorage storage mode cannot be used with API mode ' +
        '(API sets cookies via Set-Cookie header). Falling back to cookie storage.',
      )
      config.core.storage = 'cookie'
    }

    if (config.autoInit !== false) {
      this.init().catch((err) => logger.warn('Init error:', err))
    }
  }

  private profileId(): number {
    return this.profile?.id ?? 0
  }

  /**
   * Starts widget initialisation. Called automatically unless `autoInit: false` is set.
   * Can be called explicitly after construction when `autoInit: false`, or after `destroy()`
   * to re-initialise the same instance.
   */
  async init(): Promise<void> {
    if (!isClient()) return
    if (this.initializing) return
    this.initializing = true
    // Reset ready promise so callers can await this init cycle
    this.initialized = false
    this.readyPromise = new Promise<void>((resolve) => { this.readyResolve = resolve })

    try {
      const storageMode = this.config.core.storage ?? 'cookie'
      const userId = this.config.core.userId
        ?? ConsentStore.getOrCreateUserId(this.profileId(), storageMode)

      const resolvedProfile = await resolveProfile(this.config)
      this.resolvedBase = resolvedProfile

      // Apply widget-level config overrides on top of the resolved profile
      if (this.config.darkMode !== undefined) resolvedProfile.darkMode = this.config.darkMode

      const profile = this.config.profileOverride
        ? deepMerge<ResolvedProfile>(resolvedProfile, this.config.profileOverride)
        : resolvedProfile
      this.profile = profile

      this.eventBus = new EventBus(this.profileId(), this.config.utils?.gtm)
      this.consentStore = new ConsentStore(
        userId,
        this.profileId(),
        storageMode,
        this.config.core.cookieDomains,
      )
      this.consentStore.setProfileCookies(profile.cookies)
      this.renderer = new Renderer()
      if (!this.config.core.disableCssTemplate && CONSENTI_CSS) {
        this.renderer.injectStyles(CONSENTI_CSS)
      }
      this.banner = new Banner()
      this.modal = new Modal()

      this.applyTheme()
      this.applyDarkMode()
      this.broadcastChannel.connect((msg) => this.handleBroadcastMessage(msg))

      await this.runPlugins()

      // Determine signing key: API-returned key takes precedence, then config fallback
      const signingKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey

      const existing =
        signingKey
          ? await this.consentStore.readAndVerify(signingKey)
          : this.consentStore.read()
      const hasExisting = existing !== null

      this.eventBus.dispatch('consenti:bannerInitialized', {
        profileId: this.profileId(),
        hasExistingConsent: hasExisting,
      })

      // GPC handling — widget config overrides profile JSON when explicitly set
      const profileGpcMode = profile.gpcMode
      const gpcMode: boolean | 'strict' =
        this.config.core.autoHonorGPC !== undefined
          ? this.config.core.autoHonorGPC
          : profileGpcMode === 'strict' ? 'strict'
          : profileGpcMode === 'honor'  ? true
          : false
      if (gpcMode && detectGPC()) {
        const gpcConsent = applyGPCToConsent(profile.cookies, {}, gpcMode)

        if (gpcMode === 'strict') {
          // Silent mode: write consent immediately, dispatch event, skip any banner
          await this.submitConsent(gpcConsent, true)
          this.initialized = true
          this.readyResolve()
          return
        }

        // Non-strict: only apply GPC denial on first visit.
        // If the user has already explicitly given consent, respect that choice and
        // fall through to normal banner logic (which will skip the banner since
        // hasExisting is true). Re-running the GPC write on every page load would
        // overwrite the user's explicit consent after they've reviewed via the GPC banner.
        if (!hasExisting) {
          // Persist GPC denial immediately so cookies are dropped now, then show
          // the GPC banner for the user to review/adjust.
          // BroadcastChannel is same-window-exempt, so the banner in this tab is
          // not hidden by the consentUpdated handler received in other tabs.
          const gpcSigningKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey
          if (gpcSigningKey && this.consentStore) {
            this.lastSignature = await this.consentStore.writeAndSign(gpcConsent, gpcSigningKey)
          } else {
            this.consentStore?.write(gpcConsent)
          }
          this.broadcastChannel.send({
            type: 'consentUpdated',
            consent: gpcConsent,
            profileId: this.profileId(),
          })
          this.eventBus?.dispatch('consenti:consentSubmitted', {
            consent: gpcConsent,
            gpcDetected: true,
            consentId: crypto.randomUUID(),
            consentAction: this.deriveAction(gpcConsent, false),
            pageUrl: window.location.href,
          })
          this.showBanner(true)
          this.initialized = true
          this.readyResolve()
          return
        }
      }

      // Derive opt-out mode from profile complianceGroup (replaces old core.regulation field)
      const compGroup = profile.complianceGroup ?? ''
      const isOptOut = compGroup === 'opt-out'
      const isOptOutStrict = compGroup === 'opt-out-strict'

      // CCPA opt-out: silently write all-granted on first visit; no banner.
      if (isOptOut && !hasExisting) {
        const defaultConsent: ConsentValue = {}
        for (const cookie of profile.cookies) {
          defaultConsent[cookie.id] = 'granted'
        }
        const ccpaSigKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey
        if (ccpaSigKey) {
          await this.consentStore.writeAndSign(defaultConsent, ccpaSigKey)
        } else {
          this.consentStore.write(defaultConsent)
        }
        this.initialized = true
        this.readyResolve()
        return
      }

      // CPRA: opt-out for non-sensitive; opt-in required for sensitive data.
      // GPC triggers Do Not Sell + Do Not Share simultaneously (CPRA s.1798.135).
      if (isOptOutStrict && !hasExisting) {
        const gpcActive = this.config.core.autoHonorGPC && detectGPC()
        const defaultConsent: ConsentValue = {}
        for (const cookie of profile.cookies) {
          if (cookie.mandatory) { defaultConsent[cookie.id] = 'granted'; continue }
          if (cookie.cpraCategory === 'sensitive') {
            defaultConsent[cookie.id] = 'denied'
          } else if (gpcActive && (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing')) {
            defaultConsent[cookie.id] = 'denied'
          } else {
            defaultConsent[cookie.id] = 'granted'
          }
        }
        const sigKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey
        if (sigKey) {
          await this.consentStore.writeAndSign(defaultConsent, sigKey)
        } else {
          this.consentStore.write(defaultConsent)
        }
        this.initialized = true
        this.readyResolve()
        return
      }

      // DPDPA: opt-in (same as GDPR — show banner). GPC is not a recognised opt-out under DPDPA.
      // (GDPR and DPDPA both fall through to showBanner below.)

      if (!hasExisting) {
        this.showBanner()
      }

      this.initialized = true
      this.readyResolve()
    } finally {
      this.initializing = false
    }
  }

  /** Applies the `consenti-root--dark` class based on config or profile flag. */
  private applyDarkMode(): void {
    if (!this.renderer) return
    const isDark = this.config.darkMode ?? this.profile?.darkMode ?? false
    const root = this.renderer.mount(this.config.rootEl)
    if (isDark) {
      root.classList.add('consenti-root--dark')
    } else {
      root.classList.remove('consenti-root--dark')
    }
  }

  /**
   * Injects CSS custom property overrides supplied via `core.theme` into the
   * Consenti root element so they cascade down to all widget elements.
   */
  private applyTheme(): void {
    const theme = this.config.core.theme
    if (!theme || !this.renderer) return

    const map: Record<string, string | undefined> = {
      '--consenti-color-bg': theme.bgColor,
      '--consenti-color-text': theme.textColor,
      '--consenti-color-primary': theme.primaryColor,
      '--consenti-color-primary-text': theme.primaryTextColor,
      '--consenti-color-secondary': theme.secondaryColor,
      '--consenti-color-secondary-text': theme.secondaryTextColor,
      '--consenti-color-border': theme.borderColor,
      '--consenti-font-family': theme.fontFamily,
      '--consenti-font-size-base': theme.fontSizeBase,
      '--consenti-font-size-heading': theme.fontSizeHeading,
      '--consenti-border-radius': theme.borderRadius,
      '--consenti-border-radius-btn': theme.buttonBorderRadius,
      '--consenti-toggle-bg-on': theme.toggleBgOn,
      '--consenti-toggle-bg-off': theme.toggleBgOff,
      '--consenti-color-accent': theme.accentColor,
      '--consenti-color-accent-text': theme.accentTextColor,
    }

    const root = this.renderer.mount(this.config.rootEl)
    for (const [prop, value] of Object.entries(map)) {
      if (value !== undefined) root.style.setProperty(prop, value)
    }

    if (theme.fontSizeMultiplier) {
      // Multiply base and heading font sizes if a multiplier is given
      const mult = parseFloat(theme.fontSizeMultiplier)
      if (!isNaN(mult)) {
        const baseSize = parseFloat(getComputedStyle(root).getPropertyValue('--consenti-font-size-base') || '14')
        const headingSize = parseFloat(getComputedStyle(root).getPropertyValue('--consenti-font-size-heading') || '16')
        root.style.setProperty('--consenti-font-size-base', `${Math.round(baseSize * mult)}px`)
        root.style.setProperty('--consenti-font-size-heading', `${Math.round(headingSize * mult)}px`)
      }
    }
  }

  private async runPlugins(): Promise<void> {
    this.plugins = this.config.plugins ?? []
    for (const plugin of this.plugins) {
      try {
        await plugin.initialize(this)
      } catch (err) {
        logger.warn('Plugin initialize error:', err)
      }
    }
  }

  /**
   * Invokes an optional plugin hook on all registered plugins.
   * Async hooks are awaited; errors are caught and logged so a broken plugin
   * never interferes with the consent flow.
   *
   * @param invoke - Function that calls the desired hook method on a single plugin.
   */
  private async callPluginHook(invoke: (plugin: ConsentiPlugin, widget: ConsentiWidgetAPI) => void | Promise<void>): Promise<void> {
    for (const plugin of this.plugins) {
      try {
        await invoke(plugin, this)
      } catch (err) {
        logger.warn('Plugin hook failed:', err)
      }
    }
  }

  private _buildGrantAllConsent(onlyMandatory = false): ConsentValue {
    const consent: ConsentValue = {}
    for (const cookie of this.profile?.cookies ?? []) {
      consent[cookie.id] = onlyMandatory && !cookie.mandatory ? 'denied' : 'granted'
    }
    return consent
  }

  private _buildDenyAllConsent(includingMandatory = false): ConsentValue {
    const consent: ConsentValue = {}
    for (const cookie of this.profile?.cookies ?? []) {
      consent[cookie.id] = !includingMandatory && cookie.mandatory ? 'granted' : 'denied'
    }
    return consent
  }

  private buildHandlers(context: 'banner' | 'modal'): ButtonClickHandler {
    return {
      onGrantAll: () => {
        void this.submitConsent(this._buildGrantAllConsent())
        if (context === 'banner') { this.banner?.hide(); this._bannerVariant = null }
      },
      onDenyAll: () => {
        void this.submitConsent(this._buildDenyAllConsent())
        if (context === 'banner') { this.banner?.hide(); this._bannerVariant = null }
      },
      onSubmit: () => {
        if (context === 'modal' && this.modal && this.profile) {
          const consent = this.modal.getToggleConsent(this.profile.preferenceModal.categories)
          void this.submitConsent(consent)
          this.hideModal()
        } else {
          const consent: ConsentValue = {}
          for (const cookie of this.profile?.cookies ?? []) {
            if (cookie.mandatory) consent[cookie.id] = 'granted'
          }
          void this.submitConsent(consent)
          if (context === 'banner') { this.banner?.hide(); this._bannerVariant = null }
        }
      },
      onManage: () => {
        this.showModal()
      },
      onClose: () => {
        if (context === 'modal') {
          this.hideModal()
        } else {
          this.banner?.hide()
          this._bannerVariant = null
          this.broadcastChannel.send({ type: 'bannerClosed' })
          this.eventBus?.dispatch('consenti:bannerVisibility', { show: false, action: true })
          void this.callPluginHook((p) => p.onBannerHide?.())
        }
      },
      onGrantSpecific: (cookieIds: string[]) => {
        const consent: ConsentValue = {}
        for (const cookie of this.profile?.cookies ?? []) {
          if (cookie.mandatory || cookieIds.includes(cookie.id)) {
            consent[cookie.id] = 'granted'
          } else {
            consent[cookie.id] = 'denied'
          }
        }
        void this.submitConsent(consent)
        if (context === 'banner') this.hideBanner()
      },
    }
  }

  /**
   * Classifies a consent submission as `accept_all`, `reject_all`, `custom`, or `update`.
   * Used to enrich events and API payloads with intent metadata.
   */
  private deriveAction(fullConsent: ConsentValue, hadExistingConsent: boolean): ConsentAction {
    if (hadExistingConsent) return 'update'
    const nonMandatory = this.profile?.cookies.filter((c) => !c.mandatory) ?? []
    if (nonMandatory.length === 0) return 'custom'
    const allGranted = nonMandatory.every((c) => fullConsent[c.id] === 'granted')
    const allDenied = nonMandatory.every(
      (c) => fullConsent[c.id] === 'denied' || fullConsent[c.id] === 'objected',
    )
    if (allGranted) return 'accept_all'
    if (allDenied) return 'reject_all'
    return 'custom'
  }

  private handleBroadcastMessage(msg: ConsentiMessage): void {
    switch (msg.type) {
      case 'consentUpdated':
        if (msg.profileId !== this.profileId()) return
        this.consentStore?.setInMemory(msg.consent)
        this.banner?.hide()
        if (this.modal?.isOpen()) this.modal.close()
        this.eventBus?.dispatch('consenti:consentSubmitted', {
          consent: msg.consent,
          fromBroadcast: true,
        })
        break
      case 'bannerClosed':
        this.banner?.hide()
        this._bannerVariant = null
        break
      case 'consentDeleted':
        this.consentStore?.clearInMemory()
        break
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Returns `true` if the visitor has saved consent for the active profile.
   * Always returns `false` during SSR.
   */
  hasConsent(): boolean {
    if (!isClient()) return false
    return this.consentStore?.hasConsent() ?? false
  }

  /**
   * Returns the stored consent map, or `null` if no consent has been saved.
   * Always returns `null` during SSR.
   */
  getConsent(): ConsentValue | null {
    if (!isClient()) return null
    return this.consentStore?.getConsent() ?? null
  }

  /**
   * Returns the `Date` when consent was last saved, or `false` if no consent exists.
   * Always returns `false` during SSR.
   */
  getConsentDate(): Date | false {
    if (!isClient()) return false
    return this.consentStore?.getConsentDate() ?? false
  }

  /**
   * Returns the consent map in Google Consent Mode v2 format, ready to pass to
   * `gtag('consent', 'update', ...)`. Returns `null` if no consent has been saved.
   *
   * Maps Consenti cookie IDs to the seven Google Consent Mode v2 parameters.
   * Cookies whose IDs exactly match a GCM v2 key are forwarded directly.
   * Non-GCM cookies are ignored by this method (they appear in `getConsent()` only).
   */
  getGTMConsent(): Record<string, string> | null {
    const consent = this.getConsent()
    if (!consent) return null

    // The seven Google Consent Mode v2 parameters with their safe defaults.
    const gcmKeys = [
      'ad_storage',
      'analytics_storage',
      'ad_user_data',
      'ad_personalization',
      'functionality_storage',
      'personalization_storage',
      'security_storage',
    ] as const

    const result: Record<string, string> = {}

    for (const key of gcmKeys) {
      const raw = consent[key]
      // Map Consenti statuses to GCM values: 'objected' is treated as 'denied' for GCM
      if (raw === 'granted') {
        result[key] = 'granted'
      } else if (raw === 'denied' || raw === 'objected') {
        result[key] = 'denied'
      } else {
        // Key not in consent map — use a safe default
        const safeDefault = (key === 'functionality_storage' || key === 'security_storage')
          ? 'granted'
          : 'denied'
        result[key] = safeDefault
      }
    }

    return result
  }

  /**
   * Records and persists the user's consent choices.
   *
   * Mandatory cookies are always forced to `'granted'` regardless of what is passed.
   * Non-mandatory cookies not present in `consent` default to `'denied'`.
   *
   * @param consent    - Partial or full map of cookie ID → status.
   * @param gpcDerived - Internal flag set to `true` when called from the GPC strict path.
   */
  async submitConsent(consent: Partial<ConsentValue>, gpcDerived = false): Promise<void> {
    if (!isClient() || !this.profile || !this.consentStore) return

    const compGroup = this.profile.complianceGroup ?? ''
    const hadExistingConsent = this.consentStore.hasConsent()
    const consentId = crypto.randomUUID()
    const pageUrl = window.location.href

    const fullConsent: ConsentValue = {}
    for (const cookie of this.profile.cookies) {
      if (cookie.mandatory) {
        fullConsent[cookie.id] = 'granted'
      } else if (compGroup === 'opt-out-strict') {
        const fallback = cookie.cpraCategory === 'sensitive' ? 'denied' : 'granted'
        fullConsent[cookie.id] = consent[cookie.id] ?? fallback
      } else {
        const defaultDenied = compGroup !== 'opt-out' && compGroup !== 'notice-only'
        fullConsent[cookie.id] = consent[cookie.id] ?? (defaultDenied ? 'denied' : 'granted')
      }
    }

    const consentAction = this.deriveAction(fullConsent, hadExistingConsent)

    this.eventBus?.dispatch('consenti:consentBeingSubmitted', { consent: fullConsent, consentId })

    let apiResponse: unknown
    if (this.config.api?.enabled) {
      try {
        const base = this.config.api.baseUrl ?? window.location.origin
        const { httpRequest } = await import('../utils/http')
        apiResponse = await httpRequest(
          `${base}/consenti/api/v1/consent`,
          {
            method: 'POST',
            body: JSON.stringify({
              profileId: this.profileId(),
              profileUuid: this.profile?.profileUuid,
              consent: fullConsent,
              locale: this.config.core.locale ?? 'en',
              gpcDetected: gpcDerived || detectGPC(),
              consentId,
              action: consentAction,
              pageUrl,
            }),
          },
          this.config.api.authToken,
        )
      } catch (err) {
        logger.warn('API consent submission failed:', err)
      }
    }

    // Sign and write atomically so the signature covers the exact persisted value
    const signingKey = this.profile.cookieSigningKey ?? this.config.core.cookieSigningKey
    if (signingKey) {
      this.lastSignature = await this.consentStore.writeAndSign(fullConsent, signingKey)
    } else {
      this.consentStore.write(fullConsent)
    }

    const receiptRequested = this.modal?.isReceiptRequested() ?? false
    if (receiptRequested && this.config.core.allowReceipt) {
      // Cookie name format: consenti_{userId}_{profileId} — extract the UUID segment.
      const nameParts = this.consentStore.cookieName.split('_')
      // nameParts: ['consenti', '{uuid-segment1}', ..., '{profileId}'] but UUID contains hyphens
      // so join everything except first and last parts for the UUID.
      const visitorId = nameParts.slice(1, -1).join('_')
      const receiptParams = {
        visitorId,
        profileId: this.profileId(),
        profileVersion: this.profile.version,
        locale: this.config.core.locale ?? 'en',
        consent: fullConsent,
        ...(this.lastSignature ? { signature: this.lastSignature } : {}),
      }
      const receipt = generateReceipt(receiptParams)
      downloadReceipt(receipt)
    }

    this.broadcastChannel.send({
      type: 'consentUpdated',
      consent: fullConsent,
      profileId: this.profileId(),
    })

    this.eventBus?.dispatch('consenti:consentSubmitted', {
      consent: fullConsent,
      apiResponse,
      gpcDetected: gpcDerived,
      consentId,
      consentAction,
      pageUrl,
    })

    await this.callPluginHook((p) => p.onConsentSubmit?.(fullConsent))

    this.renderer?.announceToScreenReader('Your cookie preferences have been saved.')

    // Hide any visible UI after consent is saved so programmatic submitConsent()
    // calls also dismiss the banner/modal, not just button-triggered submissions.
    this.hideBanner()
    if (this.modal?.isOpen()) this.hideModal()
  }

  /**
   * Returns the currently visible banner variant, or `false` if no banner is shown.
   * Useful for programmatically checking state before calling `showBanner` / `hideBanner`.
   */
  bannerVisibility(): 'main' | 'gpc' | false {
    return this._bannerVariant ?? false
  }

  /**
   * Returns `'preference'` when the preference modal is open, or `false` when closed.
   */
  modalVisibility(): 'preference' | false {
    return this.modal?.isOpen() ? 'preference' : false
  }

  /**
   * Mounts and shows the consent banner.
   *
   * No-ops if the requested variant is already visible. If a different variant is
   * currently shown (e.g. switching from main to GPC), the existing banner is replaced.
   *
   * @param useGpcVariant - When `true` and the profile has a `gpcBanner`, that variant
   *                        is shown instead of `mainBanner`. Used by the GPC flow.
   */
  showBanner(useGpcVariant = false): void {
    if (!isClient() || !this.profile || !this.banner || !this.renderer) return
    const variant: 'main' | 'gpc' = useGpcVariant && this.profile.gpcBanner ? 'gpc' : 'main'

    // Skip if the same variant is already visible.
    if (this._bannerVariant === variant) return

    const bannerConfig = variant === 'gpc' ? this.profile.gpcBanner! : this.profile.mainBanner
    const root = this.renderer.mount(this.config.rootEl)
    const handlers = this.buildHandlers('banner')

    // Remove any previously rendered banner before building a new one so that we do
    // not accumulate duplicate elements and so new button handlers are correctly wired.
    this.banner.remove()

    const locales = this.profile.locales
    const activeLocale = this.config.core.locale ?? 'en'
    const bannerEl = this.banner.build(
      bannerConfig,
      handlers,
      undefined,
      locales,
      activeLocale,
      (locale) => this.switchLocale(locale),
      this.config.hidePoweredBy ?? false,
    )
    root.appendChild(bannerEl)
    const overlay = this.banner.getOverlay()
    if (overlay) root.appendChild(overlay)
    this._bannerVariant = variant
    this.eventBus?.dispatch('consenti:bannerVisibility', { show: true, action: false })
    void this.callPluginHook((p) => p.onBannerShow?.())
  }

  /** Hides the banner and notifies other tabs via BroadcastChannel. No-op if already hidden. */
  hideBanner(): void {
    if (this._bannerVariant === null) return
    this.banner?.hide()
    this._bannerVariant = null
    this.broadcastChannel.send({ type: 'bannerClosed' })
    this.eventBus?.dispatch('consenti:bannerVisibility', { show: false, action: true })
    this.renderer?.announceToScreenReader('Cookie banner dismissed.')
    void this.callPluginHook((p) => p.onBannerHide?.())
  }

  /**
   * Opens the preference modal and hides the banner while the modal is open.
   * No-ops if the modal is already open.
   * If the modal is closed without saving consent, the banner is re-shown automatically
   * (see `hideModal()`). Only one banner or modal is visible at a time.
   *
   * @param triggerEl - The element that triggered the modal open. Focus returns here on close.
   */
  showModal(triggerEl?: HTMLElement): void {
    if (!isClient() || !this.profile || !this.modal) return
    if (this.modal.isOpen()) return

    const handlers = this.buildHandlers('modal')
    const existing = this.consentStore?.getConsent() ?? {}
    const dpdpaCfg = this.profile.complianceGroup === 'opt-in-dpdpa' ? this.profile.dpdpa : undefined
    const locales = this.profile.locales
    const activeLocale = this.config.core.locale ?? 'en'
    this.modal.build(
      this.profile.preferenceModal,
      existing,
      handlers,
      this.config.core.allowReceipt ?? false,
      dpdpaCfg,
      locales,
      activeLocale,
      (locale) => { this.hideModal(); this.switchLocale(locale) },
      !(this.config.hidePoweredBy ?? false),
    )
    // Hide banner while modal is open so only one panel is visible at a time.
    this.banner?.hide()
    this.modal.open(triggerEl)
    // The modal is appended to document.body (outside #consenti-root), so the
    // consenti-root--dark class must be mirrored onto the modal element itself.
    const isDark = this.config.darkMode ?? this.profile?.darkMode ?? false
    document.getElementById('consenti-modal')?.classList.toggle('consenti-root--dark', isDark)
    this.eventBus?.dispatch('consenti:modalVisibility', { show: true, action: true })
    void this.callPluginHook((p) => p.onModalShow?.())
  }

  /**
   * Closes the preference modal and returns focus to the element that opened it.
   * No-ops if the modal is already closed.
   * If the user has not yet given consent, the banner is re-shown automatically.
   */
  hideModal(): void {
    if (!this.modal?.isOpen()) return
    this.modal.close()
    this.eventBus?.dispatch('consenti:modalVisibility', { show: false, action: true })
    void this.callPluginHook((p) => p.onModalHide?.())

    // If no consent on record, bring the banner back so the user still sees the notice.
    if (!this.consentStore?.hasConsent() && this._bannerVariant !== null) {
      this.banner?.show()
    } else if (!this.consentStore?.hasConsent()) {
      this.showBanner()
    }
  }

  /**
   * Registers a callback to run once the widget has finished initialising.
   * If the widget is already initialised, the callback is invoked synchronously.
   *
   * @param callback - Function to call when the widget is ready.
   */
  onReady(callback: () => void): void {
    if (this.initialized) {
      callback()
    } else {
      void this.readyPromise.then(callback)
    }
  }

  /**
   * A `Promise` that resolves once the widget has finished initialising.
   * Equivalent to wrapping `onReady()` in a `Promise`.
   *
   * @example
   * ```ts
   * await widget.ready
   * console.log('Widget ready')
   * ```
   */
  get ready(): Promise<void> {
    return this.readyPromise
  }

  /**
   * Deletes the stored consent record and notifies other tabs.
   * The banner will reappear on the next page load (or immediately if the
   * receiving tab calls `showBanner()` in response to `consentDeleted`).
   */
  async deleteConsent(): Promise<void> {
    if (!isClient() || !this.consentStore) return

    if (this.config.api?.enabled) {
      try {
        const base = this.config.api.baseUrl ?? window.location.origin
        const visitorId = this.consentStore.cookieName
        const { httpRequest } = await import('../utils/http')
        await httpRequest(
          `${base}/consenti/api/v1/consent/${visitorId}`,
          { method: 'DELETE' },
          this.config.api?.authToken,
        )
      } catch (err) {
        logger.warn('API consent deletion failed:', err)
      }
    }

    this.consentStore.delete()
    this.broadcastChannel.send({ type: 'consentDeleted' })
  }

  /**
   * Removes existing consent and immediately re-shows the consent banner so the user
   * can review and update their preferences.
   *
   * Equivalent to calling `deleteConsent()` followed by `showBanner()`, but in a single
   * method so callers do not need to coordinate the async deletion with the banner display.
   *
   * Use this to power "Review my consent" links in footers or privacy dashboards.
   */
  async reConsent(): Promise<void> {
    await this.deleteConsent()
    this.showBanner()
  }

  /**
   * Returns the fully resolved profile for the current session, or `null` during the
   * async init phase (before the profile has been fetched/resolved).
   *
   * Plugins can use this to read cookie definitions, banner config, modal categories,
   * and the profile version without accessing internal state.
   */
  getProfile(): ResolvedProfile | null {
    return this.profile
  }

  /**
   * Returns the `#consenti-root` container element that wraps all widget DOM,
   * or `null` before the widget has mounted or after `destroy()`.
   *
   * Plugins can use this to append custom elements, apply extra CSS variables,
   * or observe mutations within the widget container.
   */
  getRootElement(): HTMLElement | null {
    if (!isClient()) return null
    if (this.config.rootEl) {
      if (typeof this.config.rootEl === 'string') {
        return document.querySelector<HTMLElement>(this.config.rootEl)
      }
      return this.config.rootEl
    }
    return document.getElementById('consenti-root')
  }

  /**
   * Returns the `#consenti-banner` element when it is present in the DOM, or `null`.
   * The element may be hidden (`display: none`) — check `bannerVisibility()` for visibility state.
   *
   * Useful for adding extra content, custom event listeners, or mutation observers on the banner.
   */
  getBannerElement(): HTMLElement | null {
    if (!isClient()) return null
    return document.getElementById('consenti-banner')
  }

  /**
   * Returns the `#consenti-modal` element when the modal has been built, or `null`.
   * The element is built on first `showModal()` call and reused on subsequent opens.
   *
   * Useful for injecting extra content into the modal or listening to modal-specific events.
   */
  getModalElement(): HTMLElement | null {
    if (!isClient()) return null
    return document.getElementById('consenti-modal')
  }

  /**
   * Switches the active locale, re-resolves the profile, and re-renders the widget.
   * Called by the locale switcher UI when the user selects a different language.
   *
   * @param locale - BCP 47 locale code to switch to (e.g. `'fr'`, `'de-AT'`).
   */
  switchLocale(locale: string): void {
    if (!isClient()) return
    this.config.core.locale = locale
    // Teardown current UI and re-init with new locale
    this.banner?.remove()
    if (this.modal?.isOpen()) this.modal.close()
    this._bannerVariant = null
    this.profile = null
    this.initialized = false
    this.readyPromise = new Promise<void>((resolve) => { this.readyResolve = resolve })
    this.init().catch((err) => logger.warn('Locale switch error:', err))
  }

  /**
   * Returns `true` if the named cookie's consent is `'granted'`.
   * When `requestValue` is `true`, returns the raw `ConsentStatus` string instead of a boolean,
   * or `false` if the cookie is not in the consent map.
   */
  isCookieGranted(cookieId: string, requestValue = false): boolean | 'granted' | 'denied' | 'objected' {
    if (!isClient()) return false
    const status = this.getConsent()?.[cookieId]
    if (requestValue) return status ?? false
    return status === 'granted'
  }

  /**
   * Checks consent for all cookies belonging to the given category.
   *
   * With `requestValue = false` (default): returns `true` only when every cookie in the
   * category is `'granted'`, `false` otherwise.
   *
   * With `requestValue = true`: returns an array of one-key records — one per cookie in the
   * category — e.g. `[{ analytics: 'granted' }, { pixel: 'denied' }]`.
   *
   * Returns `false` / `[]` if the category is not found or the widget is not yet initialized.
   */
  isCategoryGranted(categoryId: string, requestValue = false): boolean | { [cookieId: string]: 'granted' | 'denied' | 'objected' }[] {
    if (!isClient() || !this.profile) return requestValue ? [] : false
    const category = this.profile.preferenceModal.categories.find((c) => c.id === categoryId)
    if (!category) return requestValue ? [] : false

    const consent = this.getConsent()

    if (requestValue) {
      return category.cookies.map((cookieId) => ({
        [cookieId]: (consent?.[cookieId] ?? 'denied') as 'granted' | 'denied' | 'objected',
      }))
    }

    return category.cookies.every((cookieId) => consent?.[cookieId] === 'granted')
  }

  /**
   * Programmatically accepts cookies and hides the banner.
   *
   * @param onlyMandatory - When `true`, only mandatory cookies are granted and all others
   *                        are set to `'denied'`. Defaults to `false` (grant everything).
   */
  async grantAll(onlyMandatory = false): Promise<void> {
    if (!isClient() || !this.profile) return
    await this.submitConsent(this._buildGrantAllConsent(onlyMandatory))
  }

  /**
   * Programmatically denies cookies and hides the banner.
   *
   * @param includingMandatory - When `true`, mandatory cookies are also denied. Defaults to
   *                             `false` (mandatory cookies remain `'granted'`). Passing `true`
   *                             logs a warning — ensure this is intentional.
   */
  async denyAll(includingMandatory = false): Promise<void> {
    if (!isClient() || !this.profile) return
    if (includingMandatory) {
      logger.warn('denyAll called with includingMandatory=true — mandatory cookies will be denied. Ensure this is intentional.')
    }
    await this.submitConsent(this._buildDenyAllConsent(includingMandatory))
  }

  /**
   * Subscribes to a Consenti widget event. The `consenti:` prefix is optional —
   * both `'consentSubmitted'` and `'consenti:consentSubmitted'` are accepted.
   *
   * The same handler reference must be passed to `off()` to unsubscribe.
   *
   * @example
   * ```ts
   * const handler = (data) => console.log(data)
   * widget.on('consentSubmitted', handler)
   * // later:
   * widget.off('consentSubmitted', handler)
   * ```
   */
  on(event: ConsentiEventName, handler: (data: ConsentEvent) => void): void {
    if (!isClient()) return
    const name = event.startsWith('consenti:') ? event : `consenti:${event}`
    const wrapped: EventListener = (e) => handler((e as CustomEvent<ConsentEvent>).detail)
    const existing = this._eventHandlers.get(handler) ?? []
    existing.push({ name, wrapped })
    this._eventHandlers.set(handler, existing)
    window.addEventListener(name, wrapped)
  }

  /**
   * Removes a previously registered event handler. The same function reference passed to
   * `on()` must be used here.
   */
  off(event: ConsentiEventName, handler: (data: ConsentEvent) => void): void {
    if (!isClient()) return
    const name = event.startsWith('consenti:') ? event : `consenti:${event}`
    const entries = this._eventHandlers.get(handler)
    if (!entries) return
    const idx = entries.findIndex((e) => e.name === name)
    if (idx === -1) return
    const entry = entries[idx]
    if (entry) window.removeEventListener(name, entry.wrapped)
    entries.splice(idx, 1)
    if (entries.length === 0) this._eventHandlers.delete(handler)
  }

  /**
   * Returns the current version of the package and the active profile/consent versions.
   * Useful for debugging and support diagnostics.
   */
  version(): { package: string; profileVersion: number | null; consentVersion: number } {
    return {
      package: __CONSENTI_VERSION__,
      profileVersion: this.profile?.version ?? null,
      consentVersion: 1,
    }
  }

  /**
   * Toggles or sets dark mode at runtime without re-initialising the widget.
   * When `enable` is omitted, the current dark mode state is toggled.
   */
  setDarkMode(enable?: boolean): void {
    if (!isClient()) return
    this.config.darkMode = enable === undefined ? !this.config.darkMode : enable
    this.applyDarkMode()
    const isDark = this.config.darkMode ?? false
    document.getElementById('consenti-modal')?.classList.toggle('consenti-root--dark', isDark)
  }

  /**
   * Applies partial theme token overrides at runtime, merging them into the current theme.
   * CSS custom properties on the root element are updated immediately.
   */
  setTheme(theme: Partial<ThemeConfig>): void {
    if (!isClient()) return
    this.config.core.theme = Object.assign({}, this.config.core.theme, theme)
    this.applyTheme()
  }

  /**
   * Deep-merges a partial config into the current widget config.
   * Theme and dark mode side-effects are re-applied immediately.
   * Changes to locale or profile require an explicit `switchLocale()` or `init()` call.
   */
  setConfig(config: DeepPartial<ConsentiConfig>): void {
    this.config = deepMerge<ConsentiConfig>(this.config, config)
    if (isClient()) {
      this.applyTheme()
      this.applyDarkMode()
    }
  }

  /**
   * Merges a partial profile override into the current profile and re-renders any visible UI.
   * Does not make a network request — the resolved base profile from the last `init()` is reused.
   *
   * No-op before `init()` completes (while `resolvedBase` is null).
   */
  setProfile(override: DeepPartial<ResolvedProfile>): void {
    if (!isClient() || !this.resolvedBase) return

    this.config.profileOverride = this.config.profileOverride
      ? deepMerge<DeepPartial<ResolvedProfile>>(this.config.profileOverride, override)
      : override

    this.profile = deepMerge<ResolvedProfile>(this.resolvedBase, this.config.profileOverride!)

    const modalWasOpen = this.modal?.isOpen() ?? false
    if (modalWasOpen) this.modal?.close()

    if (this._bannerVariant !== null) {
      const wasGpc = this._bannerVariant === 'gpc'
      this._bannerVariant = null
      this.showBanner(wasGpc)
    }

    if (modalWasOpen) this.showModal()
  }

  /**
   * Destroys the widget — removes all DOM elements, disconnects the BroadcastChannel,
   * and calls `destroy()` on all registered plugins.
   *
   * After `destroy()`, the instance should not be used again.
   */
  destroy(): void {
    for (const plugin of this.plugins) {
      try { plugin.destroy() } catch { /* ignore — plugin cleanup must not throw */ }
    }
    this.modal?.destroy()
    this.renderer?.unmount()
    this.broadcastChannel.disconnect()
    if (isClient()) {
      for (const entries of this._eventHandlers.values()) {
        for (const { name, wrapped } of entries) {
          window.removeEventListener(name, wrapped)
        }
      }
      this._eventHandlers.clear()
    }
    this.banner = null
    this.modal = null
    this.renderer = null
    this.consentStore = null
    this.eventBus = null
    this.initialized = false
  }
}
