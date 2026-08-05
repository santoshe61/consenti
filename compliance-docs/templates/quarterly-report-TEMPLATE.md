<!--
Copy this file to compliance-docs/reviews/<year>-Q<n>.md and fill in every section.
Do not delete a section for being empty — write "None found this quarter" instead.
See compliance-docs/AGENT-BRIEF.md for the full instructions this template implements.
-->

# Compliance Review — <Year> Q<N>

- **Run date:** <the actual date you were told at kickoff>
- **Quarter window:** <first day of quarter> – <run date>
- **Previous review:** <filename of the prior reviews/*.md, or "None — baseline run">

---

## 0. Validation of previous quarter's proposed changes

<If no previous review exists, write that here and skip to §1.>

| Previous proposal | Jurisdiction | Status | Evidence |
|---|---|---|---|
| <one-line description of what was proposed> | <regulation id> | Shipped / Partially shipped / Not shipped / Superseded | <CHANGELOG entry / commit / file:line confirming current state, or "no evidence found"> |

**Carried-forward items** (Not shipped, still open — restate as findings in §2 below rather than
losing them):
- <item, or "None">

---

## 1. Per-jurisdiction scan results

One row per jurisdiction in `jurisdiction-registry.md`, even when nothing changed.

| Regulation | Review window | Sources checked (with retrieval date) | Result |
|---|---|---|---|
| GDPR | <from> – <to> | <url — retrieved YYYY-MM-DD> | No change found / Change found (see §2) / UNVERIFIED (see note) |
| UK-GDPR | | | |
| CCPA | | | |
| CPRA | | | |
| LGPD | | | |
| PIPEDA / Law 25 | | | |
| POPIA | | | |
| PDPA-TH | | | |
| APPI | | | |
| KVKK | | | |

**UNVERIFIED notes** (any row marked UNVERIFIED above — say exactly what you tried and why it
didn't resolve):
- <jurisdiction>: <what was tried, what failed>

---

## 2. Findings requiring attention

<Repeat this block per finding. Omit entirely and write "No findings this quarter" if §1 turned up
nothing.>

### Finding: <short title>

- **Jurisdiction / regulation:** <id>
- **Source:** <url> — retrieved <date> — <publication or effective date of the change itself,
  and whether it's already in force or announced-for-future>
- **What changed:** <plain-language description — no invented section numbers; if you're not
  certain of the exact statutory citation, say so>
- **Impact classification:** No product impact / Compliance-group default change / New
  field-or-profile requirement / Docs-only update / Uncertain — needs human legal review
- **Suggested change (draft only — not applied):**
  - Code: `<file:line>` — <current value> → <proposed value>, or "N/A"
  - Docs: `<page path>` — <what needs to change>, or "N/A"
  - Behavior-change risk: <e.g. "would tighten an existing default for installs already in
    production — flag explicitly in the public-comment post">

---

## 3. Interim scans since last full review

<List any out-of-cycle scans run between the previous quarterly report and this one, per
README.md's "interim scans" step. "None" if none occurred.>

- <date>: <jurisdiction> — <what triggered it, what was found>

---

## 4. Out of scope, flagged anyway

<Anything noticed in DPDPA, TCF/GPP, or a Routing-only country while researching in-scope items,
worth a human's attention even though it wasn't this run's job to chase down. "None" if nothing.>

- <item>

---

## 5. Summary for public comment

<3–6 sentences a non-agent reader can post to GitHub Discussions as-is or lightly edited —
what changed, what's proposed, what needs a decision before it ships.>
