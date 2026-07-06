import type { Cookie, ProfileConfig, ConsentValue } from './ui'
import type { ComplianceGroupId } from './compliance'

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
  version: number
  isActive: boolean
  cookieTemplateName: string | null
  uiTemplateName: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileVersionEntry {
  version: number
  createdAt: string
  locales: string[]
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
  /** Called after every profile activate/deactivate/delete. isPurge=true means invalidate; false means warm. */
  handleCache?: (paths: string[], currentVersion: number, isPurge: boolean) => void
}

// ─── DB domain types ──────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface ApiKey {
  id: string
  tenantId: string
  keyHash: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface Profile {
  id: string
  tenantId: string
  name: string
  defaultLocale: string
  version: number
  profileJson: ProfileConfig
  createdAt: string
  updatedAt: string
}

export interface ConsentDbRecord {
  id: string
  tenantId: string
  visitorId: string
  profileId: string
  profileVersion: number
  locale: string
  consentJson: ConsentValue
  gpcDetected: boolean
  source: 'banner' | 'api' | 'import'
  ageVerified?: boolean
  parentalConsentToken?: string
  tcfString?: string
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

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateProfileInput {
  tenantId: string
  name: string
  defaultLocale: string
  profileJson: ProfileConfig
}

export interface UpdateProfileInput {
  name?: string
  defaultLocale?: string
  profileJson?: ProfileConfig
}

export interface CreateConsentInput {
  tenantId: string
  visitorId: string
  profileId: string
  profileVersion: number
  locale: string
  consentJson: ConsentValue
  gpcDetected: boolean
  source: 'banner' | 'api' | 'import'
  ageVerified?: boolean
  parentalConsentToken?: string
  tcfString?: string
}

export interface UpdateConsentInput {
  consentJson: ConsentValue
  locale?: string
  gpcDetected?: boolean
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
}

export interface VisitorFilters {
  tenantId: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface AuditFilters {
  tenantId: string
  action?: string
  resourceType?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ConsentVerifyResult {
  valid: boolean
  reasons: Array<'profile_version_mismatch' | 'consent_expired' | 'hmac_invalid'>
  currentProfileVersion?: number
  consentProfileVersion?: number
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
  findProfilesUsingCookieTemplate(templateId: string): Promise<ProfileSummary[]>
  findProfilesUsingUITemplate(templateId: string): Promise<ProfileSummary[]>
  getOptInStats(tenantId: string, filters: OptInFilters): Promise<OptInStats>

  createConsent(data: CreateConsentInput): Promise<ConsentDbRecord>
  updateConsent(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord>
  deleteConsent(visitorId: string): Promise<void>
  getConsent(visitorId: string): Promise<ConsentDbRecord | null>
  getConsents(filters: ConsentFilters): Promise<ConsentDbRecord[]>
  streamConsents(filters: ConsentFilters): AsyncIterable<ConsentDbRecord>

  createVisitor(data: CreateVisitorInput): Promise<Visitor>
  updateVisitor(visitorId: string, data: UpdateVisitorInput): Promise<Visitor>
  deleteVisitor(visitorId: string): Promise<void>
  getVisitor(visitorId: string): Promise<Visitor | null>
  getVisitors(filters: VisitorFilters): Promise<Visitor[]>

  getConsentHistory(visitorId: string): Promise<ConsentHistoryEntry[]>
  streamAuditLogs(filters: AuditFilters): AsyncIterable<AuditLog>

  getOverviewStats(tenantId: string): Promise<OverviewStats>
  getCategoryStats(tenantId: string): Promise<CategoryStats>
  getTimeline(tenantId: string, days?: number): Promise<TimelineEntry[]>
  getCountries(tenantId: string): Promise<CountryStat[]>
  getGpcStats(tenantId: string): Promise<GpcStats>

  getTenants(): Promise<Tenant[]>
  createTenant(data: CreateTenantInput): Promise<Tenant>
  updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant>
  deleteTenant(id: string): Promise<void>
  createApiKey(data: CreateApiKeyInput): Promise<ApiKey>
  getApiKeyByHash(keyHash: string): Promise<ApiKey | null>
  revokeApiKey(id: string): Promise<void>
  getApiKeys(tenantId: string): Promise<ApiKey[]>
  purgeExpiredConsents(olderThanDays: number): Promise<number>

  createCookieTemplate(data: import('./ui').CreateCookieTemplateInput): Promise<import('./ui').ServerCookieTemplate>
  updateCookieTemplate(id: string, data: import('./ui').UpdateCookieTemplateInput): Promise<import('./ui').ServerCookieTemplate>
  deleteCookieTemplate(id: string): Promise<void>
  getCookieTemplate(id: string): Promise<import('./ui').ServerCookieTemplate | null>
  getCookieTemplates(tenantId: string): Promise<import('./ui').ServerCookieTemplate[]>
  copyCookieTemplate(id: string, newName: string): Promise<import('./ui').ServerCookieTemplate>

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
  getLogs(filters: AuditFilters): Promise<AuditLog[]>
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
}

// ─── Dashboard view types ─────────────────────────────────────────────────────

/** Loose runtime JSON shape of a profile as stored and returned by the admin API. */
export interface ProfileJson {
  cookieTemplateId?: string
  uiTemplateId?: string
  localeContents?: Record<string, unknown>
  cookies?: Cookie[]
  translations?: Record<string, unknown>
  defaultLocale?: string
  darkMode?: boolean
  regulations?: string[]
  regulation?: string
  allowedOrigins?: string[]
  dpdpa?: Record<string, string>
  _meta?: { cookieTemplateId?: string; uiTemplateId?: string }
  complianceGroup?: string
  isActive?: boolean
  hidePoweredBy?: boolean
  allowReceipt?: boolean
  gpcMode?: 'ignore' | 'honor' | 'strict'
  /** Per-compliance extra config (e.g. DPDPA data fiduciary name). */
  complianceConfig?: Record<string, string>
}

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
