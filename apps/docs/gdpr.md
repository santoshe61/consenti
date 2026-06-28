# GDPR Compliance Guide

Consenti is built from the ground up around GDPR requirements. All core design decisions follow the six lawfulness principles in Article 5.

## Key requirements and how Consenti meets them

| Requirement | Implementation |
|---|---|
| Freely given | No content gating; overlay opacity defaults to 0 |
| Specific | Per-cookie granularity — each cookie has its own consent entry in `consentJson` |
| Informed | `htmlText` on categories, `legitimateInterest.description` for LI basis |
| Unambiguous | No pre-ticked boxes; all non-mandatory cookies default to `'denied'` |
| Easy to withdraw | `DELETE /consenti/api/v1/consent/:visitorId` (same prominence as granting) |
| Records kept | Immutable `consent_history` table; `audit_logs` for admin actions |

## Right to erasure (Article 17)

```http
DELETE /consenti/api/v1/consent/:visitorId
```

This deletes:
- All entries in `consent_records` for the visitor ID
- All entries in `consent_history` for the visitor ID
- The `visitors` record (IP hash, UA hash, geolocation)

The visitor ID itself is a random UUID and contains no PII.

## Data minimisation (Article 5(1)(c))

- IP addresses are stored as SHA-256 hashes only — the raw IP is never persisted
- User agents are stored as SHA-256 hashes only
- Consent records contain only: visitor UUID, profile ID, consent choices, timestamp, source

## Consent records as evidence

Every consent record includes:
- `profile_version` — which version of the cookie policy the user consented to
- `created_at` / `updated_at` — exact ISO 8601 timestamps
- `source` — `'banner'`, `'api'`, or `'import'`
- `consent_history` — immutable append-only log of every change

## Legitimate Interest (Article 6(1)(f))

Configure categories with `type: 'legitimate_interest'` in your profile:

```json
{
  "id": "ad_personalization",
  "type": "legitimate_interest",
  "legitimateInterest": {
    "enabled": true,
    "description": "We show relevant ads under legitimate interest."
  }
}
```

Status values for LI cookies:
- `"granted"` — user did not object
- `"objected"` — user exercised their right to object (GDPR Art. 21)

The `'objected'` status is only valid for `type: 'legitimate_interest'` cookies. The server rejects `'objected'` for standard consent cookies.

## Re-consent on profile version bump

When you update a profile (e.g. adding new cookies), the `version` field increments. The widget's `verify` endpoint returns `{ valid: false, reasons: ['profile_version_mismatch'] }` for consents given under an older version, triggering the banner to show again.
