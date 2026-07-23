import type { ConsentiServerConfig } from '@consenti/types'

const REDACTED = '••••••••'

/**
 * Builds a display-safe copy of the fully-merged server config for the setup wizard's
 * "resolved configuration" step. Allowlist-based, not a denylist — every field shown here is
 * named explicitly, so a future secret-bearing field added to `ConsentiServerConfig` is hidden
 * by default instead of leaking until someone remembers to redact it. Function-valued fields
 * (`validateUser`, `handleCache`, a custom `geoDataProvider`/`autoComplianceMap`) aren't
 * meaningful to display and are omitted rather than serialized.
 */
export function sanitizeConfigForDisplay(config: ConsentiServerConfig): Record<string, unknown> {
  const storage = config.storage
  const auth = config.auth
  const compliance = config.compliance
  const dashboard = config.dashboard

  return {
    basePath: config.basePath,
    dashboard: typeof dashboard === 'object'
      ? { enabled: dashboard.enabled, path: dashboard.path }
      : dashboard,
    ...(storage ? {
      storage: {
        driver: storage.driver,
        ...(storage.path !== undefined ? { path: storage.path } : {}),
        ...(storage.uri !== undefined ? { uri: REDACTED } : {}),
        ...(storage.database !== undefined ? { database: storage.database } : {}),
        ...(storage.host !== undefined ? { host: storage.host } : {}),
        ...(storage.port !== undefined ? { port: storage.port } : {}),
        ...(storage.user !== undefined ? { user: storage.user } : {}),
        ...(storage.password !== undefined ? { password: REDACTED } : {}),
        ...(storage.poolMax !== undefined ? { poolMax: storage.poolMax } : {}),
        ...(storage.statementTimeoutMs !== undefined ? { statementTimeoutMs: storage.statementTimeoutMs } : {}),
        ...(storage.idleInTransactionTimeoutMs !== undefined ? { idleInTransactionTimeoutMs: storage.idleInTransactionTimeoutMs } : {}),
      },
    } : {}),
    ...(auth ? {
      auth: {
        mode: auth.mode,
        ...(auth.adminEmail !== undefined ? { adminEmail: auth.adminEmail } : {}),
        ...(auth.adminPassword !== undefined ? { adminPassword: REDACTED } : {}),
        ...(auth.jwtSecret !== undefined ? { jwtSecret: REDACTED } : {}),
        ...(auth.oidc ? {
          oidc: { issuer: auth.oidc.issuer, clientId: auth.oidc.clientId, clientSecret: REDACTED, redirectUri: auth.oidc.redirectUri },
        } : {}),
        ...(auth.saml ? {
          saml: { issuer: auth.saml.issuer, entryPoint: auth.saml.entryPoint, cert: REDACTED, callbackUrl: auth.saml.callbackUrl },
        } : {}),
      },
    } : {}),
    ...(config.rateLimit ? { rateLimit: config.rateLimit } : {}),
    ...(compliance ? {
      compliance: {
        ...(compliance.type !== undefined ? { type: compliance.type } : {}),
        ...(compliance.gpc !== undefined ? { gpc: compliance.gpc } : {}),
        ...(compliance.geoDataProvider !== undefined ? {
          geoDataProvider: typeof compliance.geoDataProvider === 'function' ? '<custom function>' : compliance.geoDataProvider,
        } : {}),
        ...(compliance.complianceMapUrl !== undefined ? { complianceMapUrl: compliance.complianceMapUrl } : {}),
      },
    } : {}),
    ...(config.multiTenant ? { multiTenant: config.multiTenant } : {}),
    ...(config.plugins ? { plugins: { count: config.plugins.length } } : {}),
    ...(config.ageGate ? { ageGate: config.ageGate } : {}),
    ...(config.tcf ? { tcf: config.tcf } : {}),
    ...(config.dataRetention ? { dataRetention: config.dataRetention } : {}),
    ...(config.maxBodySize !== undefined ? { maxBodySize: config.maxBodySize } : {}),
    ...(config.trustedProxies ? { trustedProxies: config.trustedProxies } : {}),
    ...(config.branding ? { branding: config.branding } : {}),
    ...(config.s3Api ? {
      s3Api: { enabled: config.s3Api.enabled, region: config.s3Api.region, bucketName: config.s3Api.bucketName, accessKeyId: REDACTED, secretAccessKey: REDACTED },
    } : {}),
    ...(config.consentSigningKey !== undefined ? { consentSigningKey: REDACTED } : {}),
  }
}
