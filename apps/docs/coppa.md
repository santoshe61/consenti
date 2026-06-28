# COPPA Compliance Guide

COPPA (Children's Online Privacy Protection Act) applies to websites and online services directed at children under 13 in the United States.

## Configuration

Enable the age gate in your `createConsenti()` config:

```ts
createConsenti({
  ageGate: {
    enabled: true,
    minimumAge: 13,
    requireParentalConsent: true,
  },
})
```

## How it works

When `ageGate.enabled: true`:

1. The frontend widget shows an age verification screen before the consent banner
2. If the user indicates they are under `minimumAge`, consent submission is blocked
3. If `requireParentalConsent: true`, the form collects a `parentalConsentToken` (e.g. a signed token from your parental consent flow)
4. The `age_verified` and `parental_consent_token` fields are stored on the consent record

## API fields

Consent records include two additional fields when COPPA is active:

```json
{
  "visitorId": "uuid",
  "consentJson": { "analytics": "denied" },
  "ageVerified": true,
  "parentalConsentToken": "signed-token-from-parent-flow"
}
```

## Parental consent flow

Consenti does not implement the parental consent flow itself — it stores the token your system generates. A typical flow:

1. Child enters age, is redirected to parental consent page
2. Parent enters email, receives verification link
3. Parent clicks link → your system generates a signed JWT
4. JWT is passed as `parentalConsentToken` when submitting consent

## Dashboard filtering

In the admin dashboard, consent records with `age_verified: true` are flagged so compliance officers can audit them separately.

## Important notes

- COPPA applies to **operators**, not technology vendors. You are responsible for implementing the full parental consent flow.
- Consenti provides the infrastructure; your legal team determines whether COPPA applies to your service.
- For services **not** directed at children: implement age screening, redirect users who indicate they are under 13 away from your service entirely (do not simply deny consent).
