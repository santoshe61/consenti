# DPDPA Guide (India Digital Personal Data Protection Act 2023)

India's DPDPA came into force in August 2023. It is an opt-in model (similar to GDPR) and requires specific disclosures in the consent notice.

## Key requirements

| Requirement | Detail |
|---|---|
| Consent model | Opt-in — no silent consent |
| GPC | Not recognised under DPDPA |
| Data Fiduciary disclosure | Name of the entity processing data must appear in the consent notice |
| Grievance Officer | Email address for complaints must be disclosed |
| Purpose | Processing purpose must be described clearly |
| Withdrawal | Must be as easy as giving consent |
| Age | Under-18 requires verifiable parental consent |

## Enabling DPDPA mode

### Frontend widget

```ts
new ConsentiSetup({
  core: {
    regulation: 'dpdpa',
    // autoHonorGPC is ignored under DPDPA
  },
})
```

### Backend profile config

In the dashboard **Profile Editor**, select **DPDPA (India 2023)** as the regulation and fill in:

- **Data Fiduciary Name** — your company or product name as registered with the Data Protection Board
- **Grievance Officer Email** — the email address of the person responsible for handling data grievances
- **Purpose Description** *(optional)* — a plain-language description of why you collect personal data

These fields are stored in `profileJson.dpdpa` and rendered automatically in the consent modal footer.

### Programmatic config

```ts
// profileJson (stored in the database, editable via dashboard)
{
  regulation: 'dpdpa',
  dpdpa: {
    dataFiduciary: 'Acme Corp',
    grievanceEmail: 'privacy@acme.com',
    purposeDescription: 'To operate the website and send transactional emails.',
  },
}
```

## Modal grievance notice

When `regulation: 'dpdpa'` is active and the profile has a `dpdpa` block, the preference modal automatically renders a notice before the action buttons:

> **Data Fiduciary:** Acme Corp. **Purpose:** To operate the website and send transactional emails. You may withdraw consent at any time or contact our Grievance Officer at privacy@acme.com.

No additional template changes are needed.

## GPC

DPDPA does not recognise GPC as a valid consent signal. Even if the user's browser sends `navigator.globalPrivacyControl === true`, Consenti will **not** automatically deny cookies under DPDPA. The banner is shown on first visit for an explicit opt-in.

## Differences from GDPR

| | GDPR | DPDPA |
|---|---|---|
| Opt-in required | Yes | Yes |
| GPC | Optional to honour | Not applicable |
| Grievance Officer disclosure | Not required in banner | Required in consent notice |
| Data Fiduciary name | Not required in banner | Required in consent notice |
| Sensitive data | Special categories | Sensitive personal data |
