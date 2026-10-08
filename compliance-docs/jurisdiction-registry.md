# Jurisdiction Registry — Maintained + Supported tiers only

Scope mirrors `ECOSYSTEM.md` → "Compliance Regulations Covered" exactly. 10 rows: 5 Maintained, 5
Supported. Do not add rows for DPDPA, IAB TCF/GPP, or any Routing-only country here — see
`README.md` → "Scope reminder" for why.

`last_reviewed` starts at `2026-01-01` for every row as the baseline — that's the date the
homepage/comparison-table "as of" line already cites elsewhere in the docs, used here as the last
point this project can vouch for having checked these laws as a whole. **Update it per-row after
every real quarterly run** (`AGENT-BRIEF.md` §6) — do not bulk-update rows that weren't actually
scanned.

Source columns give root domains deliberately, not deep links — regulator sites restructure often
enough that a pinned deep link rots faster than it stays useful. The agent is expected to navigate
or search within the given domain for current guidance each run.

---

## Maintained tier

| Regulation | Jurisdiction(s) | Regulator | Source(s) to check | Current Consenti mapping | last_reviewed |
|---|---|---|---|---|---|
| GDPR | EU / EEA (all member states, e.g. `FR`, `DE` in the map) | European Data Protection Board (EDPB); national DPAs | `edpb.europa.eu`; `eur-lex.europa.eu` (Regulation (EU) 2016/679 consolidated text) | `opt-in` group; `compliance: ['gdpr','eprivacy']` per country — `packages/utils/src/compliance.ts:554-555` (France/Germany shown, pattern repeats per EU country) | 2026-10-08 |
| UK-GDPR | United Kingdom (`UK`) | Information Commissioner's Office (ICO) | `ico.org.uk` | `opt-in` group; `compliance: ['uk-gdpr','pecr']` — `packages/utils/src/compliance.ts:823` | 2026-10-08 |
| CCPA | California, USA (`US` → `CA` region) | California Privacy Protection Agency (CPPA); CA Attorney General | `cppa.ca.gov`; `oag.ca.gov/privacy/ccpa` | `opt-out-strict` group (California region entry) — `packages/utils/src/compliance.ts:615` | 2026-10-08 |
| CPRA | California, USA (same region entry as CCPA — CPRA amends CCPA) | California Privacy Protection Agency (CPPA) | `cppa.ca.gov` | Same as CCPA row — `packages/utils/src/compliance.ts:615`; see `CPRA_CATEGORIES` at `packages/utils/src/compliance.ts:187` | 2026-10-08 |
| LGPD | Brazil (`BR`) | Autoridade Nacional de Proteção de Dados (ANPD) | `gov.br/anpd` | `opt-in-brazil` group; `compliance: ['lgpd']` — `packages/utils/src/compliance.ts:644` | 2026-07-30 |

## Supported tier (no currency claim beyond this quarterly cycle)

| Regulation | Jurisdiction(s) | Regulator | Source(s) to check | Current Consenti mapping | last_reviewed |
|---|---|---|---|---|---|
| PIPEDA / Law 25 | Canada (`CA`), with Quebec (`QC`) carved out separately | Office of the Privacy Commissioner of Canada (OPC) — PIPEDA; Commission d'accès à l'information (CAI) — Law 25 | `priv.gc.ca`; `cai.gouv.qc.ca` | Canada default `general-privacy-consent`; Quebec region override → `opt-in` (Law 25 stricter carve-out) — `packages/utils/src/compliance.ts:595,600` | 2026-10-08 |
| POPIA | South Africa (`ZA`) | Information Regulator (South Africa) | `justice.gov.za/inforeg` | `general-privacy-consent` group; `compliance: ['popia']` — `packages/utils/src/compliance.ts:781` | 2026-10-08 |
| PDPA-TH | Thailand (`TH`) | Personal Data Protection Committee (PDPC Thailand) | `pdpc.or.th` | `opt-in` group (GDPR-style); `compliance: ['pdpa-th']` — `packages/utils/src/compliance.ts:693` | 2026-07-30 |
| APPI | Japan (`JP`) | Personal Information Protection Commission (PPC Japan) | `ppc.go.jp` | `general-privacy-consent` group; `compliance: ['appi']` — `packages/utils/src/compliance.ts:698` | 2026-10-08 |
| KVKK | Türkiye (`TR`) | Kişisel Verileri Koruma Kurumu (KVKK authority) | `kvkk.gov.tr` | `opt-in` group; `compliance: ['kvkk']` — `packages/utils/src/compliance.ts:588` | 2026-10-08 |

---

## Adjacent, out-of-scope-for-this-kit (context only, do not scan as part of a quarterly run)

| Item | Why it's not here |
|---|---|
| DPDPA (India) | "In development" tier — tracked against its own phased 2025–2027 rollout, not a stable-law quarterly cycle. See `plans/PENDING-cursor-review-work-items.md` and the DPDPA regulation page's own effective-date notes. |
| IAB TCF v2.3 / GPP | "Partial" tier — an encoding/peer-dependency track, not a jurisdiction. See `plans/PENDING-cursor-review-work-items.md` item #3. |
| Every other country in `EMBEDDED_COMPLIANCE_MAP` (~200 remaining) | Routing-only — UX-template routing with no legal-currency claim attached, so there's nothing for this process to keep current. |

## Promoting or demoting a jurisdiction between tiers

If a Supported-tier row should become Maintained (or vice versa), or a Routing-only country should
be promoted into Supported: update this file **and** `ECOSYSTEM.md`'s tier table **and** the
regulation's own docs page in the same change — the three must never disagree about which tier a
regulation is in.
