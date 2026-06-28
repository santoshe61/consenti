# TCF v2.2 Implementation Guide

IAB Europe's Transparency and Consent Framework (TCF) v2.2 is the standard for programmatic advertising consent. It is required for CMPs operating in the IAB ecosystem (RTB, DSPs, SSPs).

## When you need TCF

TCF is needed if your site uses:
- Programmatic advertising (RTB / header bidding)
- Google Ad Manager with EU consent mode
- Any ad tech vendor registered in the IAB Global Vendor List (GVL)

If you only use first-party analytics and your own tools, you do not need TCF.

## Enabling TCF mode

```ts
createConsenti({
  tcf: {
    enabled: true,
    cmpId: 9999,        // Your CMP ID from IAB registration
    cmpVersion: 1,
  },
})
```

**Important:** You must register as a CMP with IAB Europe at https://iabeurope.eu/tcf-2-0/ before going live. Registration is free.

## What Consenti implements

### Backend

- `tcf.enabled: true` — activates TCF mode
- Global Vendor List (GVL) is fetched from `https://vendor-list.consensu.org/v3/vendor-list.json` and cached for 7 days
- `tcf_string` column is added to consent records (migration v3)
- `POST /consent` accepts `tcfString` in the payload and stores it
- `GET /consent/:visitorId` returns `tcfString` when present
- `GET /tcf/vendors?page=1&limit=100` — paginated GVL vendor list (max 200 per page)

### Mapping cookies to GVL vendors

In the dashboard **Cookie Template Editor**, enable the **TCF Vendors** column toggle. Each cookie row gains a vendor picker that searches the GVL by name. Selecting a vendor auto-fills `tcfVendorId` and `tcfPurposes`.

When a consent record is submitted, Consenti builds the TC string from only the cookies the visitor granted, using their `tcfVendorId` and `tcfPurposes` fields. Cookies without a `tcfVendorId` are ignored in TC string generation.

### TC string format

Consenti uses a simplified base64url-encoded JSON format for TC strings. For full IAB TCF v2.2 binary bitfield compliance, install the `iabtcf-core` package and pre-process the TC string before submitting to the API.

```bash
npm install iabtcf-core
```

```ts
import { TCModel, TCString } from '@iabtcf/core'

const model = new TCModel(gvl)
model.cmpId = 9999
model.purposeConsents.set([1, 2, 3])
const tcString = TCString.encode(model)
```

### Frontend (apps/ui)

The `__tcfapi` stub lives in `@consenti/ui` and is enabled by `core.tcf: { enabled: true }` in the widget config. It implements the four required commands:

- `getTCData` — returns the TC string and consent status
- `ping` — returns CMP status (required for IAB compliance)
- `addEventListener` — registers a listener for consent updates
- `removeEventListener` — unregisters a listener

## GVL caching

The GVL is fetched once at startup and refreshed every 7 days. If the fetch fails, the cached version is returned. To force a refresh, restart the server.

## Testing

Use the [IAB TCF Validator](https://www.iab.com/guidelines/transparency-consent-framework/) to validate your TC string before going live.
