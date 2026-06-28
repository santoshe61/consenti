# CCPA / US State Privacy Laws Guide

Consenti supports opt-out consent models required by CCPA, VCDPA, CPA, CTDPA, TDPSA, and similar US state laws.

## Opt-out model vs. GDPR opt-in

| | GDPR | CCPA / US States |
|---|---|---|
| Default | All non-mandatory cookies denied | All non-mandatory cookies granted |
| Trigger | Banner on first visit | Silent auto-consent; provide opt-out UI |
| GPC | Optional honour | Required to honour |

## Enabling CCPA mode

```ts
createConsenti({
  compliance: { ccpa: true, gpc: true },
})
```

In your frontend widget:

```ts
new ConsentiSetup({
  core: {
    profileId: 'my-profile',
    regulation: 'ccpa',  // sets all cookies to 'granted' on first load
    autoHonorGPC: true,  // required for CCPA compliance
  },
})
```

## GPC — Global Privacy Control

The GPC signal (`navigator.globalPrivacyControl === true`) is treated as an opt-out under CCPA (required by California AG guidance). When `autoHonorGPC: 'strict'` is set:

1. Widget detects GPC signal
2. Automatically denies all `listenGpc: true` cookies
3. Writes consent record immediately without showing banner
4. `gpc_detected: true` is stored on the consent record

## "Do Not Sell" / Opt-out button

Add a `'!'` button to let users opt out at any time:

```json
{
  "text": "Do Not Sell My Data",
  "type": "reject",
  "cookies": "!"
}
```

The `'!'` action sets all non-mandatory cookies to `'denied'` and writes the consent record.

## State-by-state coverage

| Law | Jurisdiction | Opt-out mechanism |
|---|---|---|
| CCPA / CPRA | California | GPC + `'!'` button |
| VCDPA | Virginia | Same as CCPA |
| CPA | Colorado | GPC required + opt-out UI |
| CTDPA | Connecticut | Same as CCPA |
| TDPSA | Texas | Same as CCPA |
| MHMDA | Washington (health data) | Requires explicit consent for health data |

All of these use the same consent record structure. No additional backend configuration is required beyond `regulation: 'ccpa'` in the frontend widget.
