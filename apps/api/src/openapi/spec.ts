const SHARED_SCHEMAS = {
  ConsentRecord: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      visitorId: { type: 'string' },
      profileId: { type: 'string' },
      profileVersion: { type: 'integer' },
      locale: { type: 'string' },
      consentJson: { type: 'object', additionalProperties: { type: 'string', enum: ['granted', 'denied', 'objected'] } },
      gpcDetected: { type: 'boolean' },
      source: { type: 'string', enum: ['banner', 'api', 'import'] },
      ageVerified: { type: 'boolean' },
      tcfString: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateConsentInput: {
    type: 'object',
    required: ['visitorId', 'profileId', 'consentJson'],
    properties: {
      visitorId: { type: 'string' },
      profileId: { type: 'string' },
      consentJson: { type: 'object', additionalProperties: { type: 'string' } },
      gpcDetected: { type: 'boolean', default: false },
      source: { type: 'string', enum: ['banner', 'api', 'import'], default: 'banner' },
      ageVerified: { type: 'boolean' },
      parentalConsentToken: { type: 'string' },
      tcfString: { type: 'string' },
    },
  },
}

export const OPENAPI_PUBLIC_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Consenti Public API',
    version: '0.1.0',
    description: 'Visitor-facing endpoints for reading consent profiles and submitting/verifying consent. Rate-limited; no authentication required.',
    license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
  },
  servers: [
    { url: '/consenti/api', description: 'Consenti Public API' },
  ],
  paths: {
    '/v1/profiles/{id}': {
      get: {
        tags: ['Profile'],
        summary: 'Get profile in its default locale',
        description: 'Returns the resolved profile with banner and modal content for the profile\'s default locale. Includes `currentLocale`, `locales`, `cookies`, `mainBanner`, `preferenceModal`, and optionally `gpcBanner`.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Resolved profile for the default locale' },
          '404': { description: 'Profile not found' },
        },
      },
    },
    '/v1/profiles/{id}/{locale}': {
      get: {
        tags: ['Profile'],
        summary: 'Get profile resolved for a specific locale',
        description: 'Same response shape as `GET /v1/profiles/{id}` but resolved for the requested locale, falling back to the default locale for any missing translations.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'locale', in: 'path', required: true, schema: { type: 'string', example: 'fr' } },
        ],
        responses: {
          '200': { description: 'Resolved profile for the requested locale' },
          '404': { description: 'Profile not found' },
        },
      },
    },
    '/v1/consent': {
      post: {
        tags: ['Consent'],
        summary: 'Submit consent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateConsentInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Consent created or updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentRecord' } } } },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/v1/consent/{visitorId}': {
      get: {
        tags: ['Consent'],
        summary: 'Get consent for visitor',
        parameters: [{ name: 'visitorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Consent record', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsentRecord' } } } },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['Consent'],
        summary: 'Update consent',
        parameters: [{ name: 'visitorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated consent' } },
      },
      delete: {
        tags: ['Consent'],
        summary: 'GDPR erasure — delete all consent data for visitor',
        parameters: [{ name: 'visitorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Erased successfully' } },
      },
    },
    '/v1/consent/{visitorId}/verify': {
      get: {
        tags: ['Consent'],
        summary: 'Verify consent validity',
        parameters: [{ name: 'visitorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Verification result' } },
      },
    },
  },
  components: {
    schemas: SHARED_SCHEMAS,
  },
}

export const OPENAPI_ADMIN_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Consenti Admin API',
    version: '0.1.0',
    description: 'Authenticated endpoints for managing profiles, consent records, users, analytics, and exports. All routes (except `/auth/login`) require `Authorization: Bearer <JWT>`. Obtain a token via `POST /auth/login`.',
    license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
  },
  servers: [
    { url: '/consenti/admin', description: 'Consenti Admin API' },
  ],
  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email + password',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { '200': { description: 'JWT token' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Current admin user info' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Invalidate session',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/auth/oidc/authorize': {
      get: {
        tags: ['Auth'],
        summary: 'Start OIDC authorization (PKCE)',
        responses: { '302': { description: 'Redirect to OIDC provider' } },
      },
    },
    '/auth/oidc/callback': {
      get: {
        tags: ['Auth'],
        summary: 'OIDC callback — exchange code for token',
        responses: { '200': { description: 'JWT token' } },
      },
    },
    '/auth/saml/metadata': {
      get: {
        tags: ['Auth'],
        summary: 'SAML SP metadata XML',
        responses: { '200': { description: 'SAML metadata XML', content: { 'application/xml': {} } } },
      },
    },
    '/auth/saml/acs': {
      post: {
        tags: ['Auth'],
        summary: 'SAML Assertion Consumer Service',
        responses: { '200': { description: 'JWT token' } },
      },
    },
    '/auth/totp/setup': {
      post: {
        tags: ['Auth'],
        summary: 'Setup TOTP MFA',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'TOTP secret and QR URL' } },
      },
    },
    '/auth/totp/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify and enable TOTP',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'TOTP enabled' } },
      },
    },
    // ── Profiles ──────────────────────────────────────────────────────────
    '/profiles': {
      get: {
        tags: ['Profiles'],
        summary: 'List profiles',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Array of profiles' } },
      },
      post: {
        tags: ['Profiles'],
        summary: 'Create profile',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Created profile' } },
      },
    },
    // ── Consents ──────────────────────────────────────────────────────────
    '/consents': {
      get: {
        tags: ['Consents'],
        summary: 'List consent records',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'profileId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Paginated consent records' } },
      },
    },
    // ── Stats ─────────────────────────────────────────────────────────────
    '/stats/overview': {
      get: {
        tags: ['Stats'],
        summary: 'Overview statistics',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Totals and acceptance rates' } },
      },
    },
    '/stats/timeline': {
      get: {
        tags: ['Stats'],
        summary: 'Daily consent timeline',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }],
        responses: { '200': { description: 'Array of date+count' } },
      },
    },
    '/stats/countries': {
      get: {
        tags: ['Stats'],
        summary: 'Consent by country',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Country counts' } },
      },
    },
    '/stats/gpc': {
      get: {
        tags: ['Stats'],
        summary: 'GPC detection stats',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'GPC rate and counts' } },
      },
    },
    // ── Export ────────────────────────────────────────────────────────────
    '/export/consents': {
      get: {
        tags: ['Export'],
        summary: 'Export consent records',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'CSV or JSON download' } },
      },
    },
    // ── Tenants ───────────────────────────────────────────────────────────
    '/tenants': {
      get: {
        tags: ['Sites'],
        summary: 'List all sites/tenants',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Array of tenants' } },
      },
      post: {
        tags: ['Sites'],
        summary: 'Create a site/tenant',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' } }, required: ['name', 'slug'] } } } },
        responses: { '201': { description: 'Created tenant' } },
      },
    },
    '/tenants/{id}': {
      put: {
        tags: ['Sites'],
        summary: 'Update a site/tenant',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated tenant' } },
      },
      delete: {
        tags: ['Sites'],
        summary: 'Delete a site/tenant',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: SHARED_SCHEMAS,
  },
}
