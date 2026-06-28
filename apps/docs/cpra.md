# CPRA Guide (California Privacy Rights Act)

CPRA supersedes CCPA as of 1 January 2023. It adds new categories of data, strengthens the GPC obligation, and introduces "Do Not Share" alongside "Do Not Sell".

## CCPA vs. CPRA

| | CCPA | CPRA |
|---|---|---|
| In force | 2020 | Jan 2023 |
| GPC obligation | Required | Required |
| Do Not Sell | Yes | Yes |
| Do Not Share (cross-context behavioural advertising) | No | Yes |
| Sensitive data (opt-in required) | No | Yes |
| Enforcement | AG only | CPPA (dedicated agency) |

## Enabling CPRA mode

```ts
new ConsentiSetup({
  core: {
    regulation: 'cpra',
    autoHonorGPC: true,   // required — GPC denies sale and sharing cookies
  },
})
```

## Per-cookie category

In the dashboard **Cookie Template Editor**, enable the **CPRA Category** column and assign each cookie one of:

| Value | Meaning | GPC effect | First-visit default |
|---|---|---|---|
| `sale` | Sold to third parties | Always denied on GPC | Denied |
| `sharing` | Cross-context behavioural advertising | Always denied on GPC | Denied |
| `sensitive` | Sensitive personal data (health, race, etc.) | Always requires opt-in | Denied |
| *(unset)* | Standard cookie | Standard GPC behaviour | Granted |

## GPC behaviour

When GPC is detected under CPRA, Consenti automatically:

1. Denies **all cookies** with `cpraCategory: 'sale'`
2. Denies **all cookies** with `cpraCategory: 'sharing'`
3. Leaves other cookies at their submitted value
4. Stores `gpc_detected: true` on the consent record

Cookies with `cpraCategory: 'sensitive'` are always denied until the user explicitly opts in — GPC is not required for this, it is mandatory by law.

## Server-side enforcement

The backend re-applies CPRA rules on every `POST /consent` and `PUT /consent/:id` regardless of what the client sends:

```ts
// in consent.service.ts — enforced even if client bypasses GPC
if (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing') {
  effectiveConsent[cookie.id] = 'denied'
}
```

## Migration from CCPA

If you previously used `regulation: 'ccpa'`, change to `regulation: 'cpra'` and add `cpraCategory` to any cookies that involve selling or sharing data. Existing consent records remain valid — no re-consent is required unless your cookie categories change.
