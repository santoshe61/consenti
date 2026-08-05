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
  Category,
  ConsentiPlugin,
  ConsentiWidgetAPI,
  ConsentiMessage,
  ConsentiEventName,
  ThemeConfig,
  CoreConfig,
  DeepPartial,
  ConsentType,
  GpcMode,
  ConsentDbRecord,
  AgeGateConfig,
  IdentifyEventDetail,
  VisitorIdentity,
} from '../types'
import { buildCookieCategoryIndex, isMandatoryCookie, resolveTextDirection } from '@consenti/utils'
import { scanConsentScripts } from '../utils/script-scanner'
import type { ConsentScript } from '../utils/consent-script'
import type { CategoryScript } from '../utils/category-script'
import {
  getGoogleGTMConsent,
  getPurposeConsent,
  getCategoryConsent,
  getAdobeConsent,
  getMetaConsent,
  getMicrosoftClarityConsent,
  getTwilioSegmentConsent,
} from '../utils/consent-mapper'
import { CONSENTI_CSS } from '../styles/consenti-css'
import { isClient } from '../utils/ssr'
import { ConsentStorage } from '../utils/storage'
import { ConsentiChannel } from '../utils/broadcast'
import { generateReceipt, downloadReceipt } from '../utils/receipt'
import { generatePrefixedId } from '../utils/uuid'
import { getOrCreateVisitorId, peekVisitorId } from '../utils/visitor-id'
import { ConsentStore } from './consent-store'
import { EventBus } from './event-bus'
import { resolveProfile } from './profile-resolver'
import { detectGPC, applyGPCToConsent } from './gpc'
import { installTcfStub } from './tcf-stub'
import { installGppStub } from './gpp-stub'
import { Banner } from '../ui/banner'
import { Modal } from '../ui/modal'
import { AgeGate } from '../ui/age-gate'
import { Renderer } from '../ui/renderer'
import type { ButtonClickHandler } from '../ui/buttons'
import { deepMerge } from '../utils/locale'
import { logger, initConsole } from '../utils/console'

export class ConsentiSetup implements ConsentiWidgetAPI {
  private initialized = false
  private initializing = false
  private profile: ResolvedProfile | null = null
  private resolvedBase: ResolvedProfile | null = null
  /** cookieId → Category lookup, rebuilt whenever `profile` changes. Avoids rescanning categories on every consent action. */
  private categoryIndex: Map<string, Category> = new Map()
  /** Watchers created by the declarative `data-consenti-*` DOM scan — destroyed alongside the widget since they have no other owner. */
  private scannedScripts: Array<ConsentScript | CategoryScript> = []
  private consentStore: ConsentStore | null = null
  /**
   * Stable per-browser identifier. Created lazily the first time a consent decision actually
   * happens (manual submit, GPC auto-response, or relaying a decision already made in another
   * tab) — never minted before that, so an undecided visitor leaves nothing in storage. See
   * `getOrCreateVisitorId()`.
   */
  private visitorId(): string {
    return getOrCreateVisitorId(this.config.core.storage ?? 'cookie', this.config.core.cookieDomains)
  }
  private eventBus: EventBus | null = null
  private banner: Banner | null = null
  private modal: Modal | null = null
  private ageGate: AgeGate | null = null
  private renderer: Renderer | null = null
  /** Set once the age gate (if enabled) resolves; threaded onto every `submitConsent` call thereafter. */
  private _ageVerified: boolean | undefined = undefined
  private _parentalConsentToken: string | undefined = undefined
  private broadcastChannel = new ConsentiChannel()
  private readyResolve!: () => void
  private readyPromise: Promise<void>
  private plugins: ConsentiPlugin[] = []
  /** Signature from the most recent `writeAndSign` call. Included in consent receipts. */
  private lastSignature: string | undefined
  /** Tracks which banner variant is currently visible, or null when hidden. */
  private _bannerVariant: 'main' | 'gpc' | null = null
  /** Tracks which banner variant is currently mounted in the DOM (persists when banner is hidden). */
  private _bannerMounted: 'main' | 'gpc' | null = null
  /** Active focus trap keydown listener — removed when modal closes. */
  private _focusTrapListener: ((e: KeyboardEvent) => void) | null = null
  /** Inbound `consenti:listener:identify` window listener — installed once per init(), removed on destroy(). */
  private _identifyListener: EventListener | null = null
  /** Maps original handler functions to their DOM-wrapped listeners for on/off bookkeeping. */
  private _eventHandlers = new Map<
    (data: ConsentEvent) => void,
    Array<{ name: string; wrapped: EventListener }>
  >()
  /** `core` defaulted to `{}` in the constructor below — every one of its own fields is
   * optional, so this narrows back to non-optional for every other method in this class. */
  private config: ConsentiConfig & { core: CoreConfig }

  /**
   * Creates and initialises the consent widget.
   *
   * Construction is synchronous; the async `init()` is launched in the background.
   * Use `await widget.ready` or `widget.onReady(cb)` to run code after init completes.
   *
   * @param config - Widget configuration. See `ConsentiConfig` for all options. `core` may be
   *   omitted entirely — every one of its own fields is optional too.
   */
  constructor(config: ConsentiConfig) {
    this.config = { ...config, core: config.core ?? {} }
    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolve = resolve
    })

    if (!isClient()) return

    if (config.verbose) {
      initConsole(['error', 'info', 'warning', 'log'])
    } else {
      initConsole(this.config.core.console ?? ['error'])
    }


    if (config.api?.enabled && this.config.core.storage === 'localStorage') {
      logger.warn(
        'localStorage storage mode cannot be used with API mode ' +
        '(API sets cookies via Set-Cookie header). Falling back to cookie storage.',
      )
      this.config.core.storage = 'cookie'
    }

    if (config.autoInit !== false) {
      this.init().catch((err) => logger.warn('Init error:', err))
    }
  }

  private profileId(): string {
    return this.profile?.id ?? "0"
  }

  /** Patches `base` with `complianceGroupsOverride[base.complianceGroup]`, if both exist — the
   * per-group counterpart to `profileOverride`. Lets an author supply different text/buttons/
   * cookies per compliance group (built-in or custom) without authoring a separate profile for
   * each one. Applied before `profileOverride`, which still always wins as the final catch-all. */
  private applyComplianceGroupOverride(base: ResolvedProfile): ResolvedProfile {
    const override = base.complianceGroup
      ? this.config.complianceGroupsOverride?.[base.complianceGroup]
      : undefined
    return override ? deepMerge<ResolvedProfile>(base, override) : base
  }

  /**
   * Whether `window.__tcfapi`/`window.__gpp` should stay uninstalled because the corresponding
   * server-side registration (`compliance.tcf`/`compliance.gpp`) is unconfirmed (cmpId/cmpVersion
   * changed since the dashboard's confirmation checkbox was last checked, or never confirmed).
   * Standalone (no-backend) deployments have no governance layer to check against, so this always
   * resolves `false` there — the client-side config is used as configured, same as before this
   * feature existed. A network failure fails closed (`true`) rather than assuming the
   * unverifiable state is fine.
   */
  private async isRegistrationBlocked(enabled: boolean | undefined, statusPath: 'tcf' | 'gpp'): Promise<boolean> {
    if (!enabled || !this.config.api?.enabled) return false
    try {
      const { httpRequest } = await import('../utils/http')
      const base = this.config.api.baseUrl ?? window.location.origin
      const status = await httpRequest<{ blocked: boolean }>(
        `${base}/consenti/api/v1/${statusPath}/status`,
        {},
        this.config.api.authToken,
      )
      return status.blocked
    } catch {
      return true
    }
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

      // Kicked off in parallel with profile resolution (both are network calls when api.enabled)
      // so an already-confirmed registration — the overwhelmingly common case — never adds
      // sequential latency to the banner's first paint.
      const tcfBlockedPromise = this.isRegistrationBlocked(this.config.compliance?.tcf?.enabled, 'tcf')
      const gppBlockedPromise = this.isRegistrationBlocked(this.config.compliance?.gpp?.enabled, 'gpp')

      const resolvedProfile = await resolveProfile(this.config)
      this.resolvedBase = resolvedProfile

      // Apply widget-level config overrides on top of the resolved profile
      if (this.config.darkMode !== undefined) resolvedProfile.darkMode = this.config.darkMode

      const withGroupOverride = this.applyComplianceGroupOverride(resolvedProfile)

      const profile = this.config.profileOverride
        ? deepMerge<ResolvedProfile>(withGroupOverride, this.config.profileOverride)
        : withGroupOverride

      const gpcActive = detectGPC();

      // GPC handling — profileOverrides can override profile JSON when explicitly set
      profile.gpcMode = profile.gpcMode ?? "ignore"

      this.profile = profile
      this.categoryIndex = buildCookieCategoryIndex(profile.preferenceModal.categories)

      this.eventBus = new EventBus(this.profileId(), this.config.utils?.gtm)
      this.consentStore = new ConsentStore(
        this.profileId(),
        storageMode,
        this.config.core.cookieDomains,
        this.config.core.userId,
        this.config.core.cookieName,
      )
      this.consentStore.setProfileExpiry(profile.expiryDays ?? 365)
      this.consentStore.setProfileVersion(profile.version ?? 0)
      if (!(await tcfBlockedPromise)) {
        installTcfStub(() => ({
          profile: this.profile,
          consent: this.getConsent(),
          tcfConfig: this.config.compliance?.tcf,
        }))
      } else {
        logger.error(
          'TCF is configured but registration is unconfirmed (or unverifiable) — window.__tcfapi ' +
          'was not installed. Confirm the current cmpId/cmpVersion in the dashboard\'s TCF Registration panel.',
        )
      }
      if (!(await gppBlockedPromise)) {
        installGppStub(() => ({
          profile: this.profile,
          consent: this.getConsent(),
          gppConfig: this.config.compliance?.gpp,
        }))
      } else {
        logger.error(
          'GPP is configured but registration is unconfirmed (or unverifiable) — window.__gpp ' +
          'was not installed. Confirm the current cmpId/cmpVersion in the dashboard\'s GPP Registration panel.',
        )
      }
      this.renderer = new Renderer()
      if (!this.config.core.disableCssTemplate && CONSENTI_CSS) {
        this.renderer.injectStyles(CONSENTI_CSS)
      }
      this.banner = new Banner()
      this.modal = new Modal()

      this.applyTheme()
      this.applyDarkMode()
      this.applyDirection()
      this.applyAccessibility()
      this.applyStackButtonsBreakpoint()
      this.broadcastChannel.connect((msg) => this.handleBroadcastMessage(msg))
      this._installIdentifyListener()

      await this.runPlugins()

      // Determine signing key: API-returned key takes precedence, then config fallback
      const signingKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey

      const existing =
        signingKey
          ? await this.consentStore.readAndVerify(signingKey)
          : this.consentStore.read()
      const hasExisting = existing !== null

      const ageGateConfig = profile.ageGate
      if (ageGateConfig?.enabled && !hasExisting) {
        // Blocks the rest of init() (GPC/CCPA/CPRA/banner below) until the visitor answers,
        // resumed from `resolveAgeGate()` via `continueInit()`. `finishInit()` is deliberately
        // not called here — `ready` should only resolve once a determinate outcome is reached
        // (confirmed → continueInit's own finishInit; declined → the deny-all branches in
        // `resolveAgeGate()`), matching every other exit path in this method.
        this.showAgeGate(ageGateConfig, profile)
        return
      }

      await this.continueInit(profile, gpcActive, hasExisting)
    } finally {
      this.initializing = false
    }
  }

  /**
   * Everything after the "does consent already exist" check — GPC/CCPA/CPRA silent paths,
   * then the normal opt-in banner. Extracted from `init()` so the age gate (when enabled and
   * no consent exists yet) can defer this whole sequence until the visitor answers it via
   * `resolveAgeGate()`, then resume here with `hasExisting` fixed at `false`.
   */
  private async continueInit(profile: ResolvedProfile, gpcActive: boolean, hasExisting: boolean): Promise<void> {
    if (!this.consentStore || !this.eventBus) return

    this.eventBus.dispatch('consenti:bannerInitialized', {
      profileId: this.profileId(),
      hasExistingConsent: hasExisting,
      complianceGroup: profile.complianceGroup ?? "auto",
      gpcDetected: gpcActive,
      willShow: !hasExisting && !(gpcActive && profile.gpcMode === 'strict'),
    })

    if (profile.gpcMode !== 'ignore' && gpcActive) {
      const gpcConsent = applyGPCToConsent(profile.cookies, profile.preferenceModal.categories, {}, profile.gpcMode as GpcMode)

      if (profile.gpcMode === 'strict') {
        // Silent mode: write consent immediately, dispatch event, skip any banner
        await this.submitConsent(gpcConsent, true)
        this.finishInit()
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
        const gpcMeta = { gpcDetected: true, locale: this.config.core.locale ?? 'en', complianceGroup: profile.complianceGroup }
        if (gpcSigningKey) {
          this.lastSignature = await this.consentStore.writeAndSign(gpcConsent, gpcSigningKey, gpcMeta)
        } else {
          this.consentStore.write(gpcConsent, gpcMeta)
        }
        this.broadcastChannel.send({
          type: 'consentUpdated',
          consent: gpcConsent,
          profileId: this.profileId(),
        })
        this.eventBus.dispatch('consenti:consentSubmitted', {
          consentJson: gpcConsent,
          gpcDetected: true,
          consentId: generatePrefixedId('cons'),
          consentAction: this.deriveAction(gpcConsent, false),
          pageUrl: window.location.href,
          visitorId: this.visitorId(),
          timestamp: Math.round(Date.now() / 1000),
          profileId: this.profileId(),
        })
        this.showBanner(true)
        this.finishInit()
        return
      }
    }

    // Derive opt-out mode from profile complianceGroup (replaces old core.regulation field)
    const compGroup = profile.complianceGroup ?? ''
    const isOptOut = compGroup === 'opt-out'
    const isOptOutStrict = compGroup === 'opt-out-strict'

    this.getRootElement()?.setAttribute("data-consenti-cg", compGroup)
    if (this.config.verbose) {
      this.getRootElement()?.setAttribute("data-consenti-gpc", profile.gpcMode ?? "")
    }

    // CCPA opt-out: silently write all-granted on first visit; no banner. Regions with a
    // `requiresSensitiveOptIn` carve-out (e.g. Colorado) deny cpraCategory:'sensitive' cookies
    // instead — same silent-no-banner treatment, just opt-in for that one category, mirroring
    // how the opt-out-strict (CPRA) branch below already treats sensitive data.
    if (isOptOut && !hasExisting) {
      const defaultConsent: ConsentValue = {}
      for (const [cookieId, cookie] of Object.entries(profile.cookies)) {
        if (profile.requiresSensitiveOptIn && cookie.cpraCategory === 'sensitive' && !isMandatoryCookie(cookieId, this.categoryIndex)) {
          defaultConsent[cookieId] = 'denied'
        } else {
          defaultConsent[cookieId] = 'granted'
        }
      }
      const ccpaSigKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey
      const ccpaMeta = { locale: this.config.core.locale ?? 'en', complianceGroup: profile.complianceGroup }
      if (ccpaSigKey) {
        await this.consentStore.writeAndSign(defaultConsent, ccpaSigKey, ccpaMeta)
      } else {
        this.consentStore.write(defaultConsent, ccpaMeta)
      }
      this.finishInit()
      return
    }

    // CPRA: GPC active → treat it as if "Do Not Sell/Share" had been clicked (CPRA Regs
    // §7025): deny sale/sharing + sensitive, write immediately, show the GPC banner so the
    // visitor sees what was applied. GPC inactive → no silent default; show the main banner
    // and let the visitor decide, same as opt-in groups.
    if (isOptOutStrict && !hasExisting) {
      if (!gpcActive) {
        this.showBanner()
        this.finishInit()
        return
      }

      const defaultConsent: ConsentValue = {}
      for (const [cookieId, cookie] of Object.entries(profile.cookies)) {
        if (isMandatoryCookie(cookieId, this.categoryIndex)) { defaultConsent[cookieId] = 'granted'; continue }
        const denyByDefault = cookie.cpraCategory === 'sensitive' || cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing'
        defaultConsent[cookieId] = denyByDefault ? 'denied' : 'granted'
      }
      const sigKey = profile.cookieSigningKey ?? this.config.core.cookieSigningKey
      const cpraMeta = { gpcDetected: true, locale: this.config.core.locale ?? 'en', complianceGroup: profile.complianceGroup }
      if (sigKey) {
        this.lastSignature = await this.consentStore.writeAndSign(defaultConsent, sigKey, cpraMeta)
      } else {
        this.consentStore.write(defaultConsent, cpraMeta)
      }
      this.broadcastChannel.send({ type: 'consentUpdated', consent: defaultConsent, profileId: this.profileId() })
      this.eventBus.dispatch('consenti:consentSubmitted', {
        consentJson: defaultConsent,
        gpcDetected: true,
        consentId: generatePrefixedId('cons'),
        consentAction: this.deriveAction(defaultConsent, false),
        pageUrl: window.location.href,
        visitorId: this.visitorId(),
        timestamp: Math.round(Date.now() / 1000),
        profileId: this.profileId(),
      })
      this.showBanner(true)
      this.finishInit()
      return
    }

    // DPDPA: opt-in (same as GDPR — show banner). GPC is not a recognised opt-out under DPDPA.
    // (GDPR and DPDPA both fall through to showBanner below.)

    if (!hasExisting) {
      this.showBanner()
    }

    this.finishInit()
  }

  /** Mounts the age-gate prompt (`profile.ageGate`) in place of the normal banner flow. */
  private showAgeGate(ageGateConfig: AgeGateConfig, profile: ResolvedProfile): void {
    if (!this.renderer) return
    const minimumAge = ageGateConfig.minimumAge
    const root = this.renderer.mount(this.config.rootEl)
    this.ageGate = new AgeGate()
    const promptEl = this.ageGate.buildPrompt(
      minimumAge,
      () => void this.resolveAgeGate(true, ageGateConfig, profile),
      () => void this.resolveAgeGate(false, ageGateConfig, profile),
      profile.ageGateModal,
    )
    const overlayEl = this.ageGate.getOverlay()
    if (overlayEl) root.appendChild(overlayEl)
    root.appendChild(promptEl)
  }

  /**
   * Handles the visitor's age-gate answer.
   * - Confirmed → records `ageVerified: true` for all future `submitConsent` calls and
   *   resumes the normal init flow via `continueInit()`.
   * - Declined, no parental consent required → immediately submits a deny-all consent
   *   (mandatory cookies still granted), mirroring the GPC-strict silent-write pattern.
   * - Declined, parental consent required → same deny-all submission, plus a
   *   `parentalConsentToken` and a `consenti:parentalConsentRequired` event so the site
   *   owner can wire their own out-of-band verification flow (no email infra exists in
   *   this package to do that here).
   */
  private async resolveAgeGate(
    confirmed: boolean,
    ageGateConfig: AgeGateConfig,
    profile: ResolvedProfile,
  ): Promise<void> {
    this.ageGate?.remove()
    this.ageGate = null
    this._ageVerified = confirmed

    if (confirmed) {
      await this.continueInit(profile, detectGPC(), false)
      return
    }

    if (ageGateConfig.requireParentalConsent) {
      await this.submitConsent(this._buildDenyAllConsent())

      // Server-issued, potentially signed token when a backend is configured — the ownership
      // cookie the request route checks was just set by submitConsent() above. Falls back to a
      // client-generated, unsigned token (the old behavior) when there's no backend to ask.
      let token = generatePrefixedId('pcon')
      if (this.config.api?.enabled) {
        try {
          const base = this.config.api.baseUrl ?? window.location.origin
          const { httpRequest } = await import('../utils/http')
          const response = await httpRequest<{ token: string }>(
            `${base}/consenti/api/v1/consent/${this.visitorId()}/parental-consent-request`,
            { method: 'POST', body: JSON.stringify({ profileId: this.profileId() }) },
            this.config.api.authToken,
          )
          token = response.token
        } catch (err) {
          logger.warn('Parental-consent request failed; using local unsigned token:', err)
        }
      }
      this._parentalConsentToken = token
      this.eventBus?.dispatch('consenti:parentalConsentRequired', {
        parentalConsentToken: this._parentalConsentToken,
        profileId: this.profileId(),
        visitorId: this.visitorId(),
        timestamp: Math.round(Date.now() / 1000),
      })
      if (this.renderer) {
        const root = this.renderer.mount(this.config.rootEl)
        this.ageGate = new AgeGate()
        const msgEl = this.ageGate.buildParentalConsentMessage(() => {
          this.ageGate?.remove()
          this.ageGate = null
        }, profile.ageGateModal)
        root.appendChild(msgEl)
      }
    } else {
      await this.submitConsent(this._buildDenyAllConsent())
    }
    this.finishInit()
  }

  /**
   * Marks the widget ready and runs the declarative DOM-scan for
   * `data-consenti-consent-script`/`data-consenti-category-script` tags. Called from
   * every exit path of `init()` so the scan always runs exactly once per init cycle,
   * whether `init()` was triggered automatically (`autoInit !== false`) or explicitly
   * by the caller (`autoInit: false`) — it never runs before the widget actually has
   * a resolved profile to read consent from.
   */
  private finishInit(): void {
    this.initialized = true
    this.readyResolve()
    this.scannedScripts.push(...scanConsentScripts(this))
  }

  /** Installs the inbound `consenti:listener:identify` window listener — the event-driven
   * counterpart to `setUserId()`. Removes any previously-installed listener first so repeated
   * `init()` calls (e.g. from `switchLocale()`) don't stack up duplicate listeners. */
  private _installIdentifyListener(): void {
    if (!isClient()) return
    if (this._identifyListener) window.removeEventListener('consenti:listener:identify', this._identifyListener)
    const listener: EventListener = (e) => {
      const detail = (e as CustomEvent<IdentifyEventDetail>).detail
      void this.setUserId(detail.userId, detail.reConsent ?? true)
    }
    this._identifyListener = listener
    window.addEventListener('consenti:listener:identify', listener)
  }

  /** Returns the current logged-in application user ID, or `null` for an anonymous visitor. */
  getUserId(): string | null {
    return this.consentStore?.getAppUserId() ?? this.config.core.userId ?? null
  }

  /**
   * Sets the logged-in application user ID (`null` for anonymous/logout). If a stored consent
   * record exists and its user differs from `userId`, this is treated as a different data
   * subject on a shared device: by default it reconsents (deletes the existing record and
   * re-shows the banner) and logs a warning. Pass `reConsent: false` to just update the identity
   * without prompting again (still logs the warning). No-ops entirely — no warning, no
   * reconsent — when there is no prior consent record to compare against (true first-time visitor).
   */
  async setUserId(userId: string | null, reConsent = true): Promise<void> {
    if (!isClient() || !this.consentStore) return
    const previous = this.consentStore.getAppUserId() ?? ''
    const next = userId ?? ''
    if (previous === next) return

    if (userId === null) delete this.config.core.userId
    else this.config.core.userId = userId
    this.consentStore.setAppUserId(userId ?? undefined)

    if (!this.consentStore.hasConsent()) return // no prior consent record — nothing to reconcile

    logger.warn('User identity changed — ' + (reConsent ? 'reconsenting.' : 'consent record left as-is (reConsent: false).'))
    if (reConsent) await this.reConsent()
  }

  /**
   * Snapshot of the current visitor's identity. `visitorId` is the stable per-browser ID —
   * `null` until a consent decision has actually happened, since this never mints one just to
   * answer the call (see `getOrCreateVisitorId()`). `type` is `'authenticated'` whenever a
   * `userId` is set (via `setUserId()` or `core.userId`), `'anonymous'` otherwise.
   */
  getVisitor(): VisitorIdentity {
    const userId = this.getUserId()
    return {
      visitorId: peekVisitorId(this.config.core.storage ?? 'cookie'),
      type: userId ? 'authenticated' : 'anonymous',
      userId,
    }
  }

  /** Sets the `dir` attribute on the root element from `core.dir` (default `'auto'`, derived from `core.locale`). */
  private applyDirection(): void {
    if (!this.renderer) return
    const root = this.renderer.mount(this.config.rootEl)
    root.setAttribute('dir', resolveTextDirection(this.config.core.locale ?? 'en', this.config.core.dir))
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

  /** Applies `consenti--enhanced-a11y` class when `profile.enhanceAccessibility` is set. */
  private applyAccessibility(): void {
    if (!this.renderer) return
    const root = this.renderer.mount(this.config.rootEl)
    if (this.profile?.enhanceAccessibility) {
      root.classList.add('consenti--enhanced-a11y')
    } else {
      root.classList.remove('consenti--enhanced-a11y')
    }
  }

  /** Builds and appends the metadata footer strip to modal container. */
  private _appendMetaFooter(container: HTMLElement): void {
    const footer = document.createElement('div')
    footer.className = 'consenti-meta-footer'

    const consentId = this.consentStore?.getConsentId()
    if (consentId) {
      const idEl = document.createElement('span')
      idEl.className = 'consenti-meta-footer__item'
      idEl.title = consentId
      idEl.innerHTML = `ID: <code class="consenti-meta-footer__id">${consentId.slice(0, 10)}&hellip;</code>`
      footer.appendChild(idEl)
    }

    if (this.hasConsent()) {
      const visitorId = this.visitorId();
      const visitorEl = document.createElement('span')
      visitorEl.className = 'consenti-meta-footer__item'
      visitorEl.title = visitorId;
      visitorEl.innerHTML = `Visitor: <code class="consenti-meta-footer__id">${visitorId.slice(0, 10)}&hellip;</code>`
      footer.appendChild(visitorEl)
    }

    if (this.profile?.id) {
      const profileEl = document.createElement('span')
      profileEl.className = 'consenti-meta-footer__item'
      profileEl.title = this.profile.id;
      profileEl.innerHTML = `Profile: <code class="consenti-meta-footer__id">${this.profile.id.slice(0, 10)}&hellip; (v${this.profile?.version ?? 1})</code>`
      footer.appendChild(profileEl)
    }

    const consentDate = this.consentStore?.getConsentDate()
    if (consentDate) {
      const dateEl = document.createElement('span')
      dateEl.className = 'consenti-meta-footer__item'
      dateEl.innerHTML = `Date: <code class="consenti-meta-footer__id">${consentDate.toLocaleDateString()}</code>`
      footer.appendChild(dateEl)
    }

    container.appendChild(footer)
  }

  /**
   * Injects a `<style>` element into the root for `stackButtonsOnBreakpoint`.
   * Called once per profile load; a new style replaces the previous one.
   */
  private applyStackButtonsBreakpoint(): void {
    if (!this.renderer || !this.profile) return
    let bp = this.profile.mainBanner?.stackButtonsOnBreakpoint
    if (!bp || bp <= 0) return
    const root = this.renderer.mount(this.config.rootEl)
    const existing = root.querySelector('#consenti-stack-btn-style')
    existing?.remove()
    const style = document.createElement('style')
    style.id = 'consenti-stack-btn-style'
    style.textContent =
      `@media(max-width:${bp}px){` +
      `.consenti-banner__buttons{flex-direction:column;}` +
      `.consenti-banner__btn{width:100%;}` +
      `}`
    root.appendChild(style)
  }

  /** Installs a keyboard focus trap on `container` while the modal is open. */
  private _installFocusTrap(container: HTMLElement): void {
    this._removeFocusTrap()
    const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
    const listener = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => !el.closest('[aria-hidden="true"]'))
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    this._focusTrapListener = listener
    document.addEventListener('keydown', listener)
  }

  /** Removes the active focus trap keyboard listener. */
  private _removeFocusTrap(): void {
    if (this._focusTrapListener) {
      document.removeEventListener('keydown', this._focusTrapListener)
      this._focusTrapListener = null
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
      '--consenti-color-bg': theme.colorBg,
      '--consenti-color-text': theme.colorText,
      '--consenti-color-text-muted': theme.colorTextMuted,
      '--consenti-color-primary': theme.colorPrimary,
      '--consenti-color-primary-text': theme.colorPrimaryText,
      '--consenti-color-secondary': theme.colorSecondary,
      '--consenti-color-secondary-text': theme.colorSecondaryText,
      '--consenti-color-border': theme.colorBorder,
      '--consenti-color-secondary-border': theme.colorSecondaryBorder,
      '--consenti-color-overlay': theme.colorOverlay,
      '--consenti-color-accent': theme.colorAccent,
      '--consenti-color-accent-text': theme.colorAccentText,
      '--consenti-font-family': theme.fontFamily,
      '--consenti-font-family-mono': theme.fontFamilyMono,
      '--consenti-font-size-base': theme.fontSizeBase,
      '--consenti-font-size-heading': theme.fontSizeHeading,
      '--consenti-font-weight-heading': theme.fontWeightHeading,
      '--consenti-line-height': theme.lineHeight,
      '--consenti-spacing-xs': theme.spacingXs,
      '--consenti-spacing-sm': theme.spacingSm,
      '--consenti-spacing-md': theme.spacingMd,
      '--consenti-spacing-lg': theme.spacingLg,
      '--consenti-border-radius': theme.borderRadius,
      '--consenti-border-radius-btn': theme.borderRadiusBtn,
      '--consenti-shadow': theme.shadow,
      '--consenti-toggle-bg-on': theme.toggleBgOn,
      '--consenti-toggle-bg-partial': theme.toggleBgPartial,
      '--consenti-toggle-bg-off': theme.toggleBgOff,
      '--consenti-toggle-knob': theme.toggleKnob,
      '--consenti-toggle-width': theme.toggleWidth,
      '--consenti-toggle-height': theme.toggleHeight,
      '--consenti-z-banner': theme.zBanner,
      '--consenti-z-overlay': theme.zOverlay,
      '--consenti-z-modal': theme.zModal,
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
    for (const cookieId of Object.keys(this.profile?.cookies ?? {})) {
      consent[cookieId] = onlyMandatory && !isMandatoryCookie(cookieId, this.categoryIndex) ? 'denied' : 'granted'
    }
    return consent
  }

  private _buildDenyAllConsent(includingMandatory = false): ConsentValue {
    const consent: ConsentValue = {}
    for (const cookieId of Object.keys(this.profile?.cookies ?? {})) {
      consent[cookieId] = !includingMandatory && isMandatoryCookie(cookieId, this.categoryIndex) ? 'granted' : 'denied'
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
          for (const cookieId of Object.keys(this.profile?.cookies ?? {})) {
            if (isMandatoryCookie(cookieId, this.categoryIndex)) consent[cookieId] = 'granted'
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
          this.eventBus?.dispatch('consenti:bannerVisibility', { visible: false, action: true, variant: this._bannerVariant ?? 'main' })
          this._bannerVariant = null
          this.broadcastChannel.send({ type: 'bannerClosed' })
          void this.callPluginHook((p) => p.onBannerHide?.())
        }
      },
      onGrantSpecific: (cookieIds: string[]) => {
        const consent: ConsentValue = {}
        for (const cookieId of Object.keys(this.profile?.cookies ?? {})) {
          if (isMandatoryCookie(cookieId, this.categoryIndex) || cookieIds.includes(cookieId)) {
            consent[cookieId] = 'granted'
          } else {
            consent[cookieId] = 'denied'
          }
        }
        void this.submitConsent(consent)
        if (context === 'banner') this.hideBanner()
      },
      onForgetMe: () => {
        if (context === 'modal') this.hideModal()
        void this.forgetMe()
      },
    }
  }

  /**
   * Classifies a consent submission as `accept_all`, `reject_all`, `custom`, or `update`.
   * Used to enrich events and API payloads with intent metadata.
   */
  private deriveAction(fullConsent: ConsentValue, hadExistingConsent: boolean): ConsentAction {
    if (hadExistingConsent) return 'update'
    const nonMandatory = Object.keys(this.profile?.cookies ?? {}).filter((id) => !isMandatoryCookie(id, this.categoryIndex))
    if (nonMandatory.length === 0) return 'custom'
    const allGranted = nonMandatory.every((id) => fullConsent[id] === 'granted')
    const allDenied = nonMandatory.every(
      (id) => fullConsent[id] === 'denied' || fullConsent[id] === 'objected',
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
          consentJson: msg.consent,
          fromBroadcast: true,
          gpcDetected: detectGPC(),
          consentId: generatePrefixedId('cons'),
          consentAction: this.deriveAction(msg.consent, false),
          pageUrl: window.location.href,
          visitorId: this.visitorId(),
          timestamp: Math.round(Date.now() / 1000),
          profileId: this.profileId(),
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
   * Returns the stored consent map, optionally transformed for a specific vendor.
   * Pass `type` to get a vendor-ready object instead of the raw Consenti format.
   * Always returns `null` during SSR or when no consent has been saved.
   *
   * @param type - Output format:
   *   - omit / `'default'`  → raw ConsentValue, keyed by every cookie parameter ID in the profile
   *   - `'purpose'`         → consent per the fixed CookiePurpose taxonomy (necessary/functional/preferences/analytics/marketing)
   *   - `'category'`        → consent per the tenant's own authored preference-modal category, keyed by category ID
   *                           ('granted' only when every member parameter is granted; 'denied'/'objected' otherwise)
   *   - `'google-gtm'`      → Google Consent Mode v2 keys + ads_data_redaction, url_passthrough
   *   - `'adobe'`           → { analytics, target, manager, optimizer }
   *   - `'meta'`            → { pixel, api, plugins, facebookLogin }
   *   - `'microsoft-clarity'` → { session, heatmaps, performance }
   *   - `'twilio-segment'`  → { identify, page, track, group, alias }
   */
  getConsent(): ConsentValue | null
  getConsent(type: ConsentType): Record<string, string> | null
  getConsent(type?: ConsentType): ConsentValue | Record<string, string> | null {
    if (!isClient()) return null
    const consent = this.consentStore?.getConsent() ?? null
    if (!consent) return null
    const cookies = this.profile?.cookies ?? {}

    switch (type) {
      case 'google-gtm': return getGoogleGTMConsent(consent)
      case 'purpose': return getPurposeConsent(consent, cookies) as unknown as Record<string, string>
      case 'category': return getCategoryConsent(consent, this.profile?.preferenceModal?.categories ?? {}) as unknown as Record<string, string>
      case 'adobe': return getAdobeConsent(consent, cookies) as unknown as Record<string, string>
      case 'meta': return getMetaConsent(consent, cookies) as unknown as Record<string, string>
      case 'microsoft-clarity': return getMicrosoftClarityConsent(consent, cookies) as unknown as Record<string, string>
      case 'twilio-segment': return getTwilioSegmentConsent(consent, cookies) as unknown as Record<string, string>
      default: return consent
    }
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
   * @deprecated Use `getConsent('google-gtm')` instead.
   * Returns the consent map in Google Consent Mode v2 format.
   */
  getGTMConsent(): Record<string, string> | null {
    return this.getConsent('google-gtm') as Record<string, string> | null
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
  async submitConsent(consent: Partial<ConsentValue>, gpcDerived = false, source = 0): Promise<ConsentDbRecord | void> {
    if (!isClient() || !this.profile || !this.consentStore) return

    const compGroup = this.profile.complianceGroup ?? ''
    const hadExistingConsent = this.consentStore.hasConsent()
    // Reuse the existing local consent record id across resubmissions (rather than minting a
    // new one every time) so the cookie's `i` field keeps identifying the same logical
    // consent record. `this.visitorId()` (not this id) is what identifies the visitor to the
    // server and drives the DELETE/PUT ownership check — it's stable independent of consent.
    const consentId = this.consentStore.getConsentId() ?? generatePrefixedId('cons')
    const pageUrl = window.location.href

    const fullConsent: ConsentValue = {}
    for (const [cookieId, cookie] of Object.entries(this.profile.cookies)) {
      if (isMandatoryCookie(cookieId, this.categoryIndex)) {
        fullConsent[cookieId] = 'granted'
      } else if (compGroup === 'opt-out-strict') {
        const fallback = cookie.cpraCategory === 'sensitive' ? 'denied' : 'granted'
        fullConsent[cookieId] = consent[cookieId] ?? fallback
      } else {
        // preGrant only ever loosens the default toward 'granted' — it never forces denial,
        // and only applies when there's no stored decision for this parameter yet.
        const defaultDenied = compGroup !== 'opt-out' && compGroup !== 'notice-only'
        const fallback = cookie.preGrant ? 'granted' : (defaultDenied ? 'denied' : 'granted')
        fullConsent[cookieId] = consent[cookieId] ?? fallback
      }
    }

    const consentAction = this.deriveAction(fullConsent, hadExistingConsent)

    this.eventBus?.dispatch('consenti:consentBeingSubmitted', {
      consentJson: fullConsent,
      consentId,
      fromBroadcast: false,
      gpcDetected: detectGPC(),
      consentAction: this.deriveAction(fullConsent, false),
      pageUrl: window.location.href,
      visitorId: this.visitorId(),
      timestamp: Math.round(Date.now() / 1000),
      profileId: this.profileId(),
    })

    let apiResponse = null as unknown as ConsentDbRecord;
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
              visitorId: this.visitorId(),
              consentJson: fullConsent,
              locale: this.config.core.locale ?? 'en',
              gpcDetected: gpcDerived || detectGPC(),
              consentId,
              action: consentAction,
              pageUrl,
              ...(this._ageVerified !== undefined ? { ageVerified: this._ageVerified } : {}),
              ...(this._parentalConsentToken ? { parentalConsentToken: this._parentalConsentToken } : {}),
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
    const writeMeta = { source, gpcDetected: gpcDerived, consentId, locale: this.config.core.locale ?? 'en', complianceGroup: this.profile?.complianceGroup }
    if (signingKey) {
      this.lastSignature = await this.consentStore.writeAndSign(fullConsent, signingKey, writeMeta)
    } else {
      this.consentStore.write(fullConsent, writeMeta)
    }

    const receiptRequested = this.modal?.isReceiptRequested() ?? false
    if (receiptRequested && this.profile.allowReceipt) {
      const visitorId = this.visitorId()
      const currentConsentVersion = this.consentStore.getConsent();
      console.log({ currentConsentVersion });
      const receiptParams = {
        version: '1.0',
        visitorId,
        profileId: this.profileId(),
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
      consentJson: fullConsent,
      apiResponse,
      gpcDetected: gpcDerived,
      consentId,
      consentAction,
      pageUrl,
      fromBroadcast: false,
      visitorId: this.visitorId(),
      timestamp: Math.round(Date.now() / 1000),
      profileId: this.profileId(),
    })

    await this.callPluginHook((p) => p.onConsentSubmit?.(fullConsent))

    this.renderer?.announceToScreenReader('Your cookie preferences have been saved.')

    // Hide any visible UI after consent is saved so programmatic submitConsent()
    // calls also dismiss the banner/modal, not just button-triggered submissions.
    this.hideBanner()
    if (this.modal?.isOpen()) this.hideModal()

    return apiResponse;
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

    // If the same variant is already mounted (just hidden), reuse the DOM element.
    if (this._bannerMounted === variant) {
      this.banner.show()
      this._bannerVariant = variant
      this.eventBus?.dispatch('consenti:bannerVisibility', { visible: true, action: false, variant })
      void this.callPluginHook((p) => p.onBannerShow?.())
      return
    }

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
      this.config.hidePoweredBy ?? this.profile?.hidePoweredBy ?? true,
      variant,
    )

    root.appendChild(bannerEl)
    const overlay = this.banner.getOverlay()
    if (overlay) root.appendChild(overlay)
    this._bannerVariant = variant
    this._bannerMounted = variant
    this.eventBus?.dispatch('consenti:bannerVisibility', { visible: true, action: false, variant })
    void this.callPluginHook((p) => p.onBannerShow?.())
  }

  /** Hides the banner and notifies other tabs via BroadcastChannel. No-op if already hidden. */
  hideBanner(): void {
    if (this._bannerVariant === null) return
    this.banner?.hide()
    this.eventBus?.dispatch('consenti:bannerVisibility', { visible: false, action: true, variant: this._bannerVariant })
    this._bannerVariant = null
    this.broadcastChannel.send({ type: 'bannerClosed' })
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
      this.profile.cookies,
      existing,
      handlers,
      this.profile.allowReceipt ?? false,
      dpdpaCfg,
      locales,
      activeLocale,
      (locale) => { this.hideModal(); this.switchLocale(locale) },
      (this.config.hidePoweredBy ?? this.profile?.hidePoweredBy ?? true),
    )
    // Hide banner while modal is open so only one panel is visible at a time.
    this.banner?.hide()
    this.modal.open(triggerEl, this.renderer?.mount(this.config.rootEl))
    const modalEl = document.getElementById('consenti-modal')
    if (this.profile.showFooterMetadata && modalEl) {
      const container = modalEl.querySelector<HTMLElement>('.consenti-modal__container')
      if (container) this._appendMetaFooter(container)
    }
    if (this.profile.preferenceModal?.trapFocus && modalEl) {
      this._installFocusTrap(modalEl)
    }
    if (this._bannerVariant !== null) {
      this.eventBus?.dispatch('consenti:bannerVisibility', { visible: false, action: triggerEl ? true : false, variant: this._bannerVariant })
    }
    this.eventBus?.dispatch('consenti:modalVisibility', { visible: true, action: triggerEl ? true : false })
    void this.callPluginHook((p) => p.onModalShow?.())
  }

  /**
   * Closes the preference modal and returns focus to the element that opened it.
   * No-ops if the modal is already closed.
   * If the user has not yet given consent, the banner is re-shown automatically.
   */
  hideModal(): void {
    if (!this.modal?.isOpen()) return
    this._removeFocusTrap()
    this.modal.close()
    this.eventBus?.dispatch('consenti:modalVisibility', { visible: false, action: true })
    void this.callPluginHook((p) => p.onModalHide?.())

    // If no consent on record, bring the banner back so the user still sees the notice.
    if (!this.consentStore?.hasConsent() && this._bannerVariant !== null) {
      this.eventBus?.dispatch('consenti:bannerVisibility', { visible: true, action: true, variant: this._bannerVariant })
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
        const { httpRequest } = await import('../utils/http')
        await httpRequest(
          `${base}/consenti/api/v1/consent/${this.visitorId()}`,
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
   *
   * @param resetAgeGate - When `true` (default) and the profile has `ageGate.enabled`, the
   *                        age-gate prompt is shown again instead of jumping straight to the
   *                        banner — mirroring the original first-visit flow. Pass `false` to
   *                        skip it and go straight to the banner, keeping the visitor's prior
   *                        age-gate answer.
   */
  async reConsent(resetAgeGate = true): Promise<void> {
    await this.deleteConsent()
    if (resetAgeGate && this.profile?.ageGate?.enabled) {
      this._ageVerified = undefined
      this.showAgeGate(this.profile.ageGate, this.profile)
      return
    }
    this.showBanner()
  }

  /**
   * Self-service erasure entry point — GDPR Art. 17 / CCPA-CPRA / LGPD Art. 18 and equivalent
   * "right to be forgotten" rights, exercised from the widget itself. Wraps `reConsent()` (same
   * erase-then-reprompt behavior) with `consenti:forgetMeRequested` / `consenti:forgotten`
   * dispatched around it, so a host app can hook its own identity-verified erasure workflow
   * across other systems (CRM, DMP, analytics) — the CMP itself only ever erases its own consent
   * record. See the "Right to erasure" guide for the full picture, including the server-side
   * `consent:erased` eventBus event fired by `DELETE /consent/:visitorId`.
   *
   * Powers the preference modal's "Forget me" button (`preferenceModal.showForgetMe`, only
   * rendered when the visitor already has a stored consent decision). Also callable directly —
   * e.g. `widget.forgetMe()` from a custom footer link or privacy-settings page.
   *
   * @param resetAgeGate - Forwarded to `reConsent()` — see its docs.
   */
  async forgetMe(resetAgeGate = true): Promise<void> {
    if (!isClient()) return
    const visitorId = this.visitorId()
    const profileId = this.profileId()
    this.eventBus?.dispatch('consenti:forgetMeRequested', { visitorId, profileId, timestamp: Math.round(Date.now() / 1000) })
    await this.reConsent(resetAgeGate)
    this.eventBus?.dispatch('consenti:forgotten', { visitorId, profileId, timestamp: Math.round(Date.now() / 1000) })
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
    // In-memory only for this page session — resets to the configured default on refresh.
    // Only becomes persistent once a consent decision writes it into the `l` field of the
    // consent record itself (see submitConsent()).
    this.config.core.locale = locale
    // Teardown current UI and re-init with new locale
    this.banner?.remove()
    if (this.modal?.isOpen()) this.modal.close()
    this._bannerVariant = null
    this._bannerMounted = null
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
    const category = this.profile.preferenceModal.categories[categoryId]
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
    await this.submitConsent(this._buildGrantAllConsent(onlyMandatory), false, 1)
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
    await this.submitConsent(this._buildDenyAllConsent(includingMandatory), false, 1)
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
  version(): { package: string; profileVersion: string; consentVersion: string | null } {
    return {
      package: __CONSENTI_VERSION__,
      profileVersion: this.profile?.id ?? "0",
      consentVersion: null,
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
    const merged = deepMerge<ConsentiConfig>(this.config, config)
    this.config = { ...merged, core: merged.core ?? {} }
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

    const withGroupOverride = this.applyComplianceGroupOverride(this.resolvedBase)
    this.profile = deepMerge<ResolvedProfile>(withGroupOverride, this.config.profileOverride!)
    this.categoryIndex = buildCookieCategoryIndex(this.profile.preferenceModal.categories)

    const modalWasOpen = this.modal?.isOpen() ?? false
    if (modalWasOpen) this.modal?.close()

    if (this._bannerVariant !== null) {
      const wasGpc = this._bannerVariant === 'gpc'
      this._bannerVariant = null
      this._bannerMounted = null
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
    this._removeFocusTrap()
    if (isClient() && this._identifyListener) {
      window.removeEventListener('consenti:listener:identify', this._identifyListener)
      this._identifyListener = null
    }
    for (const plugin of this.plugins) {
      try { plugin.destroy() } catch { /* ignore — plugin cleanup must not throw */ }
    }
    for (const script of this.scannedScripts) script.destroy()
    this.scannedScripts = []
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
