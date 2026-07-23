import type { ProfileConfig, ConsentValue, MainBanner, GpcBanner, PreferenceModal } from './ui'
import type { ComplianceGroupId } from './compliance'

/** Resolved content for one non-default locale — template shape merged with that locale's
 * author text, computed client-side (dashboard) the same way the default locale's content on
 * `StoredProfileJson` is. Never persisted in the DB row; `ProfileService` writes it straight to
 * that locale's on-disk version file. Keyed by locale code on `CreateProfileInput`/
 * `UpdateProfileInput.localeContent` — only locales actually touched this save need an entry;
 * any other locale already in `profileJson.locales` is carried forward unchanged from the
 * previous version. */
export interface LocaleContentInput {
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
}

// ─── Server config ────────────────────────────────────────────────────────────

export interface StorageConfig {
  driver: 'sqlite' | 'better-sqlite3' | 'node-sqlite3-wasm' | 'node:sqlite' | 'mongodb' | 'mysql' | 'postgresql' | 'json'
  path?: string
  uri?: string
  database?: string
  host?: string
  port?: number
  user?: string
  password?: string
  /** Postgres/MySQL only. Max pool connections. Default: 10 (both drivers' own default — set
   * explicitly here so it's a documented, tunable value rather than an implicit library default). */
  poolMax?: number
  /**
   * Postgres/MySQL only. Milliseconds before an in-flight query is aborted, so one slow/runaway
   * query can't hold a pool connection indefinitely. Unset by default: a forced default could
   * silently break legitimate long-running operations (e.g. exporting millions of records) that
   * this project has no way to load-test — opt in once you've measured your own worst-case query.
   */
  statementTimeoutMs?: number
  /** Postgres only. Milliseconds a client may sit idle inside an open transaction before being
   * terminated — protects against a `BEGIN` with no matching `COMMIT`/`ROLLBACK` holding a
   * connection forever. Unset by default, same reasoning as `statementTimeoutMs`. */
  idleInTransactionTimeoutMs?: number
}

export interface OidcConfig {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string
  claimsMapping?: {
    roles?: string
    email?: string
  }
}

export interface SamlConfig {
  issuer: string
  entryPoint: string
  cert: string
  callbackUrl: string
}

export interface AuthConfig {
  mode: 'local' | 'jwt' | 'custom' | 'oidc' | 'saml'
  jwtSecret?: string
  validateUser?: (req: unknown) => Promise<AdminUser | null>
  adminEmail?: string
  adminPassword?: string
  oidc?: OidcConfig
  saml?: SamlConfig
}

export interface RateLimitConfig {
  enabled?: boolean
  windowMs?: number
  maxRequests?: number
}

export type GeoResult = {
  country: string | null
  region: string | null
  locale: string | null
}

export type CountryResolverFn = (ctx: {
  ip: string
  language: string
  timezone: string
}) => Promise<GeoResult>

export interface S3ApiConfig {
  enabled: boolean
  region: string
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

export interface ProfileSummary {
  id: string
  name: string
  defaultLocale: string
  complianceGroup: ComplianceGroupId | null
  customComplianceGroup: string | null
  isActive: boolean
  consentTemplateName: string | null
  uiTemplateName: string | null
  createdAt: string
  updatedAt: string
}

/**
 * One snapshot in a profile's edit history. `Profile.id` is stable across edits; each save
 * increments `Profile.version` in place and writes a new snapshot under that version number.
 */
export interface ProfileVersionEntry {
  version: number
  createdAt: string
  locales: string[]
}

/**
 * A profile-id directory found on disk with no matching DB row — the profile was deleted
 * (or predates the current versioning model) but its version-snapshot history wasn't. Built
 * from a directory listing only (id, version count, last-modified) — no file content is read
 * until a specific version is opened via the normal version-history endpoints.
 */
export interface ArchivedProfileSummary {
  id: string
  versionCount: number
  lastModified: string
}

export interface OptInFilters {
  profileId?: string
  complianceGroup?: string
  from?: string
  to?: string
  locale?: string
}

export interface OptInByLocale {
  total: number
  granted: number
  denied: number
  managed: number
}

export interface OptInByDate {
  date: string
  total: number
  granted: number
  denied: number
  managed: number
}

export interface OptInStats {
  total: number
  granted: number
  denied: number
  managed: number
  grantedPct: number
  deniedPct: number
  managedPct: number
  byLocale: Record<string, OptInByLocale>
  byDate: OptInByDate[]
}

export type ComplianceMapOverride =
  | 'default'          // use embedded map
  | ComplianceMapData  // operator-supplied full map
  | 'auto'             // fetch from complianceMapUrl at startup, refresh every 24h

export interface ComplianceMapData {
  version: string
  countries: Record<string, CountryComplianceEntry>
}

export interface CountryComplianceEntry {
  complianceGroup: ComplianceGroupId
  default: ComplianceGroupId
  description: string
  overriddenRegions?: Record<string, {
    complianceGroup: ComplianceGroupId
    description: string
  }>
}

export interface ComplianceViolation {
  cookieId: string
  field: string
  message: string
  rule: string
}

export interface ComplianceWarningItem {
  cookieId: string
  field: string
  message: string
  suggestion: string
}

export interface ComplianceValidationResult {
  valid: boolean
  errors: ComplianceViolation[]
  warnings: ComplianceWarningItem[]
}

/** One mandatory-content field left blank — see `validateProfileContent`
 * (`apps/api/src/services/profile-content-validator.service.ts`). */
export interface ContentValidationError {
  locale: string
  section: 'mainBanner' | 'gpcBanner' | 'preferenceModal'
  /** Dot-path within the section, e.g. `'htmlText'`, `'buttons.accept-all'`, `'categories.marketing.heading'`. */
  field: string
  message: string
}

export interface ContentValidationResult {
  valid: boolean
  errors: ContentValidationError[]
}

export interface ComplianceConfig {
  /** @deprecated use type */
  gdpr?: boolean
  /** @deprecated use type */
  ccpa?: boolean
  gpc?: boolean | 'strict'
  type?: ComplianceGroupId | 'auto'
  /** @deprecated use 'default' instead of 'language' or 'timezone'; 'geoip' and 'hosted-geoip-lite' removed */
  geoDataProvider?: 'default' | 'maxmind' | 'language' | 'timezone' | 'geoip' | 'hosted-geoip-lite' | CountryResolverFn
  autoComplianceMap?: ComplianceMapOverride
  complianceMapUrl?: string
}

export interface DashboardConfig {
  enabled?: boolean
  path?: string
}

export interface MultiTenantConfig {
  enabled: boolean
}

export interface AgeGateConfig {
  enabled: boolean
  minimumAge: number
  requireParentalConsent?: boolean
}

export interface TcfConfig {
  enabled: boolean
  cmpId: number
  cmpVersion: number
}

export interface DataRetentionConfig {
  purgeAfterDays: number
  /** When set, audit log entries older than this are purged on the same daily timer as consent
   * record retention. Independent of `purgeAfterDays` since audit trails are often required to
   * be kept longer than the consent records they reference for compliance/investigation
   * purposes. Unset by default — audit logs are kept indefinitely unless explicitly configured. */
  auditLogPurgeAfterDays?: number
}

export interface BrandingConfig {
  /** Display name shown in the dashboard (login page, header, browser tab). Default: 'Consenti'. */
  appName?: string
  /**
   * Logo to display in the dashboard. Accepts a public URL (https://…) or a local
   * filesystem path — when a path is given, the file is copied into the dashboard
   * dist and served as a static asset automatically.
   */
  appLogoPath?: string
  /** When true, hides the "Powered by Consenti" badge in the dashboard. Default: false. */
  hidePoweredBy?: boolean
}

export interface ConsentiServerConfig {
  basePath?: string
  dashboard?: boolean | DashboardConfig
  storage?: StorageConfig
  auth?: AuthConfig
  rateLimit?: RateLimitConfig
  compliance?: ComplianceConfig
  multiTenant?: MultiTenantConfig
  plugins?: ConsentiServerPlugin[]
  ageGate?: AgeGateConfig
  tcf?: TcfConfig
  dataRetention?: DataRetentionConfig
  maxBodySize?: number
  trustedProxies?: string[]
  branding?: BrandingConfig
  s3Api?: S3ApiConfig
  /** When set, every consent record is HMAC-SHA256 signed at create/update time (hex-encoded,
   * stored in `signature`) and the signature is checked on `GET /consent/:visitorId/verify`.
   * No-op and no schema burden when unset — opt-in tamper-evidence for server-stored records,
   * independent of the widget's own cookie-signing (`core.cookieSigningKey`). */
  consentSigningKey?: string
  /** Called after every profile activate/deactivate/delete. isPurge=true means invalidate; false means warm. */
  handleCache?: (paths: string[], profileId: string, isPurge: boolean) => void
}

// ─── DB domain types ──────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

/** Tenant-wide dashboard-managed defaults, shown on the API Config page. */
export interface TenantSettings {
  /** Public API origin allowlist. Distinct from `ProfileConfig.allowedOrigins`, which the
   * origin check on `POST /consent` prefers when a profile sets its own list; this is the
   * fallback. The public API has no auth token, so this is its only access gate. */
  allowedOrigins?: string[]
  /** Admin API origin allowlist — an additional CORS-layer check on top of Bearer-token auth
   * for browser-originated `/consenti/admin/*` requests. Empty/unset means no restriction
   * (Bearer token auth alone still applies); only enforced when the request carries an
   * `Origin` header — server-to-server callers are unaffected. */
  adminAllowedOrigins?: string[]
  /** Whether this tenant has completed (or skipped) the first-run setup wizard. Gates the
   * one-time `#/setup` redirect in the dashboard — never reset once true. Default: false. */
  setupCompleted?: boolean
}

export interface ApiKey {
  id: string
  tenantId: string
  keyHash: string
  name: string
  isActive: boolean
  /** User id of the admin who created this key. Undefined for keys created before this field existed. */
  createdBy?: string
  /** Optional expiry set at creation. Checked lazily at auth time and on list — no background sweep. */
  expireBy?: string
  createdAt: string
  updatedAt?: string
}

export interface Profile {
  id: string
  tenantId: string
  name: string
  defaultLocale: string
  /** Starts at 1, incremented in place on every save. The row itself is mutated, never replaced — see {@link ProfileVersionEntry} for the on-disk snapshot history this produces. */
  version: number
  profileJson: StoredProfileJson
  createdAt: string
  updatedAt: string
}

export interface ConsentDbRecord {
  id: string
  tenantId: string
  visitorId: string
  profileId: string
  locale: string
  consentJson: ConsentValue
  gpcDetected: boolean
  source: 'banner' | 'api' | 'import'
  ageVerified?: boolean
  parentalConsentToken?: string
  tcfString?: string
  /** HMAC-SHA256 signature over the record's core fields, hex-encoded. Only present when
   * `consentSigningKey` is configured — opt-in tamper-evidence for server-stored records,
   * independent of the widget's own cookie-signing (`core.cookieSigningKey`). */
  signature?: string
  createdAt: string
  updatedAt: string
}

export interface ConsentHistoryEntry {
  id: string
  tenantId: string
  consentRecordId: string
  visitorId: string
  oldJson: ConsentValue | null
  newJson: ConsentValue
  action: 'created' | 'updated' | 'withdrawn'
  createdAt: string
}

export interface Visitor {
  id: string
  tenantId: string
  visitorId: string
  country?: string
  region?: string
  city?: string
  ipHash?: string
  userAgentHash?: string
  firstSeen: string
  lastSeen: string
}

export interface AdminUser {
  id: string
  tenantId: string
  name: string
  email: string
  passwordHash: string
  isActive: boolean
  totpEnabled?: boolean
  totpSecret?: string
  /** Empty array = access to all tenants. Non-empty = restricted to listed tenant IDs. */
  allowedTenants?: string[]
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  tenantId: string
  name: string
  description?: string
}

export interface Permission {
  id: string
  name: string
  description?: string
}

/** Proof that the consent banner was rendered to a visitor — recorded even if they never
 * interact with it, distinct from (and never merged into) an actual consent decision. */
export interface NoticeShownRecord {
  id: string
  tenantId: string
  visitorId: string
  profileId: string
  locale: string
  createdAt: string
}

export interface CreateNoticeShownInput {
  tenantId: string
  visitorId: string
  profileId: string
  locale: string
}

export interface AuditLog {
  id: string
  tenantId: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldData?: unknown
  newData?: unknown
  createdAt: string
}

/** List-view shape for consents — omits the fields not shown in a table row (`consentJson`,
 * `parentalConsentToken`, `tcfString`, `signature`), so paginated list queries don't have to pull
 * those blobs off disk for every row. Fetch the full `ConsentDbRecord` via `getConsent(visitorId)`
 * when a single record's full detail is actually needed (e.g. opening a detail modal). */
export type ConsentSummary = Omit<ConsentDbRecord, 'consentJson' | 'parentalConsentToken' | 'tcfString' | 'signature'>

/** List-view shape for audit logs — omits `oldData`/`newData` (full before/after snapshots) for
 * the same reason as `ConsentSummary`. Fetch the full `AuditLog` via `getAuditLogById(id)` when a
 * single entry's full detail is needed. */
export type AuditLogSummary = Omit<AuditLog, 'oldData' | 'newData'>

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateProfileInput {
  tenantId: string
  name: string
  defaultLocale: string
  profileJson: StoredProfileJson
  /** Non-default locales' resolved content for this save — see {@link LocaleContentInput}. */
  localeContent?: Record<string, LocaleContentInput>
}

export interface UpdateProfileInput {
  name?: string
  defaultLocale?: string
  profileJson?: StoredProfileJson
  /** Explicit new version number — set by `ProfileService.update()` to `old.version + 1` for a content edit. Omitted for isActive-only flips (activate/deactivate), which leave the version unchanged. */
  version?: number
  /** Non-default locales' resolved content for this save — see {@link LocaleContentInput}. Any
   * locale in `profileJson.locales` not present here is carried forward unchanged from the
   * previous version's on-disk file. */
  localeContent?: Record<string, LocaleContentInput>
}

export interface CreateConsentInput {
  tenantId: string
  visitorId: string
  profileId: string
  locale: string
  consentJson: ConsentValue
  gpcDetected: boolean
  source: 'banner' | 'api' | 'import'
  ageVerified?: boolean
  parentalConsentToken?: string
  tcfString?: string
  signature?: string
}

export interface UpdateConsentInput {
  consentJson: ConsentValue
  locale?: string
  gpcDetected?: boolean
  signature?: string
}

export interface CreateVisitorInput {
  tenantId: string
  visitorId: string
  country?: string
  region?: string
  city?: string
  ipHash?: string
  userAgentHash?: string
}

export interface UpdateVisitorInput {
  country?: string
  region?: string
  city?: string
  lastSeen?: string
}

export interface CreateUserInput {
  tenantId: string
  name: string
  email: string
  passwordHash: string
  allowedTenants?: string[]
}

export interface UpdateUserInput {
  name?: string
  email?: string
  passwordHash?: string
  isActive?: boolean
  totpSecret?: string | null
  totpEnabled?: boolean
  allowedTenants?: string[]
}

export interface CreateAuditLogInput {
  tenantId: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldData?: unknown
  newData?: unknown
}

// ─── Filter / pagination types ────────────────────────────────────────────────

export interface ConsentFilters {
  tenantId: string
  profileId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
  /** Free-text search across visitorId, profileId, locale, source. */
  q?: string
}

export interface VisitorFilters {
  tenantId: string
  from?: string
  to?: string
  page?: number
  limit?: number
  /** Free-text search across visitorId, country. */
  q?: string
}

export interface AuditFilters {
  tenantId: string
  action?: string
  resourceType?: string
  from?: string
  to?: string
  page?: number
  limit?: number
  /** Free-text search across action, resourceType, resourceId, userId. */
  q?: string
}

/** Page of results plus the total row count matching the same filters (ignoring page/limit) —
 * lets callers compute total page count for numbered pagination without a second round trip. */
export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ConsentVerifyResult {
  valid: boolean
  reasons: Array<'profile_changed' | 'consent_expired' | 'hmac_invalid'>
  /** The id of the profile currently active for this consent's compliance group, if any. */
  currentProfileId?: string
  /** The id of the profile this consent was originally collected against. */
  consentProfileId?: string
}

export interface JwtPayload {
  sub: string
  email: string
  roles: string[]
  permissions: string[]
  iat: number
  exp: number
}

export type SafeAdminUser = Omit<AdminUser, 'passwordHash'>

// ─── Role / permission input types ────────────────────────────────────────────

export interface CreateRoleInput {
  tenantId: string
  name: string
  description?: string
}

export interface UpdateRoleInput {
  name?: string
  description?: string
}

// ─── Stats types ──────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalConsents: number
  acceptedPct: number
  rejectedPct: number
  totalVisitors: number
  gpcDetectedCount: number
}

export type CategoryStats = Record<string, { granted: number; denied: number; objected: number }>

export interface TimelineEntry {
  date: string
  count: number
}

export interface CountryStat {
  country: string
  count: number
}

export interface GpcStats {
  detected: number
  total: number
  rate: number
}

export interface CreateApiKeyInput {
  tenantId: string
  name: string
  keyHash: string
  createdBy?: string
  expireBy?: string
}

export interface CreateTenantInput {
  name: string
  slug: string
}

export interface UpdateTenantInput {
  name?: string
  slug?: string
}

// ─── Storage adapter ──────────────────────────────────────────────────────────

export interface StorageAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  migrate(): Promise<void>

  createProfile(data: CreateProfileInput): Promise<Profile>
  updateProfile(id: string, data: UpdateProfileInput): Promise<Profile>
  deleteProfile(id: string): Promise<void>
  getProfile(id: string): Promise<Profile | null>
  getProfiles(tenantId: string): Promise<Profile[]>
  findActiveProfileByComplianceGroup(tenantId: string, complianceGroup: string): Promise<Profile | null>
  /** Lightweight list — no profile_json blob; single JOIN for template names. */
  listProfilesSummary(tenantId: string): Promise<ProfileSummary[]>
  findProfilesUsingConsentTemplate(templateId: string): Promise<ProfileSummary[]>
  findProfilesUsingUITemplate(templateId: string): Promise<ProfileSummary[]>
  getOptInStats(tenantId: string, filters: OptInFilters): Promise<OptInStats>

  createConsent(data: CreateConsentInput): Promise<ConsentDbRecord>
  updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord>
  deleteConsent(visitorId: string): Promise<void>
  getConsent(visitorId: string): Promise<ConsentDbRecord | null>
  getConsents(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>>
  streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord>

  createVisitor(data: CreateVisitorInput): Promise<Visitor>
  updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor>
  deleteVisitor(visitorId: string): Promise<void>
  getVisitor(visitorId: string): Promise<Visitor | null>
  getVisitors(filters: VisitorFilters): Promise<PagedResult<Visitor>>

  getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]>
  streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog>

  createNoticeShown(data: CreateNoticeShownInput): Promise<NoticeShownRecord>
  getNoticeShownForVisitor(visitorId: string): Promise<NoticeShownRecord[]>

  getOverviewStats(tenantId: string): Promise<OverviewStats>
  getCategoryStats(tenantId: string): Promise<CategoryStats>
  getTimeline(tenantId: string, days?: number): Promise<TimelineEntry[]>
  getCountries(tenantId: string): Promise<CountryStat[]>
  getGpcStats(tenantId: string): Promise<GpcStats>

  getTenants(): Promise<Tenant[]>
  createTenant(data: CreateTenantInput): Promise<Tenant>
  updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant>
  deleteTenant(id: string): Promise<void>
  /** Returns `{}` (all fields unset) if no settings row exists yet for this tenant. */
  getSettings(tenantId: string): Promise<TenantSettings>
  updateSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings>
  createApiKey(data: CreateApiKeyInput): Promise<ApiKey>
  getApiKeyByHash(keyHash: string): Promise<ApiKey | null>
  revokeApiKey(id: string): Promise<void>
  /** Re-enables a previously revoked key (same hash, no new secret). Clears `expireBy` if it's
   * in the past, so a lazily-expired key doesn't immediately re-expire on the next check. */
  reactivateApiKey(id: string): Promise<void>
  /** Permanently removes the key row — unlike `revokeApiKey`, this cannot be undone. */
  deleteApiKey(id: string): Promise<void>
  getApiKeys(tenantId: string): Promise<ApiKey[]>
  purgeExpiredConsents(olderThanDays: number): Promise<number>
  purgeExpiredAuditLogs(olderThanDays: number): Promise<number>

  createConsentTemplate(data: import('./ui').CreateConsentTemplateInput): Promise<import('./ui').ServerConsentTemplate>
  updateConsentTemplate(id: string, data: import('./ui').UpdateConsentTemplateInput): Promise<import('./ui').ServerConsentTemplate>
  deleteConsentTemplate(id: string): Promise<void>
  getConsentTemplate(id: string): Promise<import('./ui').ServerConsentTemplate | null>
  getConsentTemplates(tenantId: string): Promise<import('./ui').ServerConsentTemplate[]>
  copyConsentTemplate(id: string, newName: string): Promise<import('./ui').ServerConsentTemplate>

  createUITemplate(data: import('./ui').CreateUITemplateInput): Promise<import('./ui').ServerUITemplate>
  updateUITemplate(id: string, data: import('./ui').UpdateUITemplateInput): Promise<import('./ui').ServerUITemplate>
  deleteUITemplate(id: string): Promise<void>
  getUITemplate(id: string): Promise<import('./ui').ServerUITemplate | null>
  getUITemplates(tenantId: string): Promise<import('./ui').ServerUITemplate[]>
  copyUITemplate(id: string, newName: string): Promise<import('./ui').ServerUITemplate>

  createUser(data: CreateUserInput): Promise<AdminUser>
  updateUser(id: string, data: UpdateUserInput): Promise<AdminUser>
  deleteUser(id: string): Promise<void>
  getUserById(id: string): Promise<AdminUser | null>
  getUserByEmail(email: string): Promise<AdminUser | null>
  getUsers(tenantId: string): Promise<AdminUser[]>
  countUsers(tenantId?: string): Promise<number>

  getRoles(tenantId: string): Promise<Role[]>
  createRole(data: CreateRoleInput): Promise<Role>
  updateRole(id: string, data: UpdateRoleInput): Promise<Role>
  deleteRole(id: string): Promise<void>
  getAllPermissions(): Promise<Permission[]>
  getPermissionsForRole(roleId: string): Promise<Permission[]>
  getUserRoles(userId: string, tenantId?: string): Promise<Role[]>
  assignRole(userId: string, roleId: string, tenantId?: string): Promise<void>
  revokeRole(userId: string, roleId: string, tenantId?: string): Promise<void>
  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>
  revokePermissionFromRole(roleId: string, permissionId: string): Promise<void>

  createLog(data: CreateAuditLogInput): Promise<void>
  getLogs(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>>
  getAuditLogById(id: string): Promise<AuditLog | null>
}

// ─── Plugin system ────────────────────────────────────────────────────────────

export interface PluginContext {
  storage: StorageAdapter
  config: ConsentiServerConfig
}

export abstract class ConsentiServerPlugin {
  abstract name: string

  initialize?(context: PluginContext): Promise<void>
  destroy?(): Promise<void>

  beforeConsentSave?(data: CreateConsentInput): Promise<CreateConsentInput>
  afterConsentSave?(record: ConsentDbRecord): Promise<void>
  beforeConsentUpdate?(data: UpdateConsentInput): Promise<UpdateConsentInput>
  afterConsentUpdate?(record: ConsentDbRecord): Promise<void>
  beforeProfileFetch?(id: string): Promise<string>
  afterProfileFetch?(profile: Profile): Promise<Profile>
  beforeUserCreate?(data: CreateUserInput): Promise<CreateUserInput>
  afterUserCreate?(user: AdminUser): Promise<void>
}

// ─── Dashboard runtime config ────────────────────────────────────────────────

/**
 * Configuration injected into the dashboard SPA at serve time via
 * window.__CONSENTI_CONFIG__. The object is deep-frozen and non-writable —
 * treat it as read-only.
 */
export interface ConsentiRuntimeConfig {
  /** Display name shown in the dashboard header, login page, and browser tab. */
  appName: string
  /** Resolved logo URL (relative path or absolute URL). Null when no logo is configured. */
  appLogoPath: string | null
  /** Whether to show the "Powered by Consenti" badge. */
  hidePoweredBy: boolean
  /** URL prefix Consenti is mounted at — used by the dashboard to build API base URLs. */
  basePath: string
  /** Active compliance config from server. */
  compliance: {
    type?: string
    gpc?: boolean | 'strict'
  }
  /** Active admin auth mode — dashboard-only features like password reset are gated on 'local'. */
  authMode: AuthConfig['mode']
}

// ─── Server-side stored profile shape ──────────────────────────────────────────

/**
 * The server's stored shape of `Profile.profileJson` — extends the shared `ProfileConfig`
 * (`./ui`, also used by `apps/ui`'s local `ConsentiProfile`/`registerProfile()` authoring, which
 * genuinely needs the full multi-locale `translations`/`localeContents` blob for its own
 * no-backend use case and must stay untouched).
 *
 * On the server, only `defaultLocale`'s own resolved content is ever stored here —
 * `mainBanner`/`gpcBanner`/`preferenceModal` (inherited from `ProfileConfig` as-is: template shape
 * merged with the author's text, optional fields simply omitted rather than blank — never a
 * multi-locale map). Every other locale's content lives only in its own per-version JSON file on
 * disk (`profiles/{tenant}/{id}/{version}/{locale}.json`, see `ProfileService`), never in the DB
 * row — `translations`/`localeContents` (both full multi-locale blobs) are dropped entirely.
 */
export interface StoredProfileJson extends Omit<ProfileConfig, 'translations' | 'localeContents'> {
  /** Every locale this profile has content for — drives the dashboard's tab list. Content for any
   * locale other than `defaultLocale` lives only in that locale's on-disk version file, not here. */
  locales: string[]
}

/** Loose runtime JSON shape of a profile as returned by the admin API — same fields as
 * `StoredProfileJson`, all optional (a response may not populate every field). */
export type ProfileJson = Partial<StoredProfileJson>

/** Profile as returned by admin dashboard API endpoints (uses loose profileJson). */
export interface DashboardProfile {
  id: string
  tenantId: string
  name: string
  defaultLocale: string
  version: number
  profileJson: ProfileJson
  createdAt: string
  updatedAt: string
}

/** Safe admin user view with roles (no password hash or TOTP secrets). */
export type DashboardAdminUser = Omit<AdminUser, 'passwordHash' | 'totpEnabled' | 'totpSecret'> & {
  roles?: { id: string; name: string }[]
}

/** Current authenticated user decoded from JWT. */
export interface CurrentUser {
  sub: string
  email: string
  name?: string
  roles: string[]
  permissions: string[]
}
