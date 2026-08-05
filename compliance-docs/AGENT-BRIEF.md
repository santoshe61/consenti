# Quarterly Compliance Review — Agent Brief

You are running the quarterly compliance-currency review described publicly on the Consenti
docs site (`/guides/what-is-consenti`, section "How Consenti aims to stay
compliant"). Read `compliance-docs/README.md` first if you haven't — it explains where your
output goes and what happens after you're done.

**Your job is research and drafting only.** You do not edit `apps/`, `packages/`, or any docs
page. You do not post to GitHub Discussions. You produce one file:
`compliance-docs/reviews/YYYY-QN.md`, built from `compliance-docs/templates/quarterly-report-TEMPLATE.md`,
plus updated `last_reviewed` dates in `compliance-docs/jurisdiction-registry.md`. A human takes it
from there.

---

## 0. Dates — read this before anything else

- You will be told today's actual date at kickoff. **Use that date, not any date you infer from
  training data, conversation metadata, or a guess.** If you were not told today's date
  explicitly, stop and ask for it before proceeding — do not assume.
- Determine the current calendar quarter from that date: Q1 = Jan–Mar, Q2 = Apr–Jun,
  Q3 = Jul–Sep, Q4 = Oct–Dec. Your output filename is `reviews/<year>-Q<n>.md` for the quarter
  containing today's date.
- For **each jurisdiction**, your review window is `(that jurisdiction's last_reviewed date in
  jurisdiction-registry.md) → (today)`. Windows differ per jurisdiction if they were last reviewed
  at different times (e.g. after an interim scan) — do not assume every row shares one window.
- **Never treat your own training-data knowledge cutoff as a substitute for checking a live
  source.** Laws change; your training data has a fixed cutoff that is almost certainly older than
  "today." Every factual claim about a law's current state must trace to a source you fetched
  *this run*, with a retrieval date you record. If your tools cannot reach the live web in this
  session, say so explicitly in the report instead of answering from memory.

---

## 1. Scope — read `jurisdiction-registry.md`

Open `compliance-docs/jurisdiction-registry.md`. It lists exactly 10 in-scope rows — the
Maintained + Supported tiers from `ECOSYSTEM.md`. **Do not expand scope** to DPDPA, TCF/GPP, or
any Routing-only country even if you notice something interesting about them in passing — note it
in the report's "Out of scope, flagged anyway" section instead (see template) and move on.

For each row, the registry gives you:
- The regulation id and the jurisdiction(s)/country codes it covers
- The regulator/authority whose guidance is authoritative
- One or more starting sources to check (official regulator sites — navigate/search within them
  for current guidance; don't assume a specific deep-linked page still exists, root domains are
  given deliberately since paths rot)
- The current Consenti compliance-group mapping and a `file:line` pointer into
  `packages/utils/src/compliance.ts`
- `last_reviewed` — the start of this row's review window (see §0)

---

## 2. Step 0 of your run — validate the previous quarter

Before scanning anything new:

1. Find the most recent file in `compliance-docs/reviews/` (by filename, e.g. `2026-Q2.md` before
   `2026-Q3.md`). If there is none, this is the first run — write "No previous review exists; this
   is the baseline run" in the template's validation section and skip to §3.
2. For every item that report listed under "Proposed changes," check whether it actually shipped:
   - Search `CHANGELOG.md` for a matching entry.
   - Search `git log` (if you have shell access) for commits referencing the jurisdiction or the
     specific file the change targeted.
   - Re-read the current code at the `file:line` the previous report pointed at, to confirm the
     described change is actually present now.
3. Classify each previous-quarter proposed change as one of: **Shipped** (confirmed in
   CHANGELOG/git/code), **Partially shipped** (some but not all of the proposal landed — describe
   the gap), **Not shipped** (no evidence found — carry it forward as still-open in this quarter's
   findings, don't silently drop it), or **Superseded** (events since then made the proposal moot —
   explain why).
4. This validation table is mandatory in your output even if everything shipped cleanly — it's
   the mechanism that keeps this process honest over time.

---

## 3. Step 1 — scan each in-scope jurisdiction

For each of the 10 rows in the registry, within its review window:

- Check the regulator source(s) listed for: new legislation, amendments to the existing law,
  binding regulator guidance/enforcement decisions that change practical requirements, and
  announced-but-not-yet-effective changes with a future effective date (flag these separately —
  don't treat "passed but not yet in force" the same as "already in force").
- For jurisdictions with **phased or multi-part regimes** you're not the primary tracker for
  (none currently in the Maintained/Supported scope, but if a row's description mentions a phase),
  note the phase explicitly rather than treating the whole law as either "done" or "not done."
- If you find nothing that changed in the window, say so explicitly per row — "No change found in
  window `<dates>`, sources checked: `<list>`, retrieved `<date>`" is a complete and valid finding.
  Silence is not an acceptable substitute for "checked, found nothing."
- If a source is unreachable, paywalled, or you're not confident you found the authoritative
  version, mark that row **UNVERIFIED** and say exactly what you tried — don't fill the gap with
  an inference.

---

## 4. Step 2 — classify impact, for every actual finding

For each real change found (not the "no change" rows), classify it as one of:

- **No product impact** — legal change doesn't change what Consenti needs to do (e.g. a fine
  increase, an enforcement action against an unrelated company).
- **Compliance-group default change** — the change affects what `complianceGroup`/`default`
  should be for that jurisdiction's row(s) in `EMBEDDED_COMPLIANCE_MAP`.
- **New field/profile requirement** — the change requires a new profile field, cookie category
  flag, or config option that doesn't exist yet (model this the way `dataFiduciary`/
  `grievanceEmail` were added for DPDPA, or `cpraCategory` for CPRA — check
  `packages/utils/src/compliance.ts` and `packages/types` for the existing pattern before
  proposing a new shape).
- **Docs-only update** — code is already correct; a regulation page or table is what's stale.
- **Uncertain — needs human legal review** — you found a real change but can't confidently map it
  to a product requirement. Say what you know and stop there; do not guess at a code change for
  this one.

---

## 5. Step 3 — draft (don't apply) suggested code changes

For every finding classified as a code-affecting change:

- Point to the exact current code (`file:line`) that would need to change.
- Describe the proposed new value/shape in prose or a short diff-style snippet **inside the
  report** — do not open an Edit/Write tool against the actual source files. This is a proposal
  for public comment, not a merge.
- Note anything the change would break or require migrating (e.g. "changing Canada's default from
  `general-privacy-consent` to `opt-in` would be a stricter-default behavior change for existing
  installs, not just a map edit — flag for the comment period specifically").
- If the same underlying finding suggests both a code change and a docs change, list both — don't
  pick one.

---

## 6. Step 4 — write the report

Copy `compliance-docs/templates/quarterly-report-TEMPLATE.md` to
`compliance-docs/reviews/<year>-Q<n>.md` and fill in every section — don't remove sections that
end up empty, write "None found this quarter" instead so the next run (and any human reader) can
tell "checked, nothing" apart from "forgot to check."

Then update `compliance-docs/jurisdiction-registry.md`: set `last_reviewed` to today's date for
every row you actually scanned this run (not rows you skipped or marked UNVERIFIED without
checking any source — leave those at their prior date so the next run knows to try again from the
same starting point).

---

## Hard rules (do not violate)

1. **No code edits, no docs edits, no PRs, no Discussions posts.** Output is the report file and
   registry date updates only.
2. **No claim about current law without a live-fetched source and a retrieval date recorded next
   to it.** Training-data recall is not a source.
3. **No expanding scope** beyond the 10 registry rows without a human asking you to.
4. **No silently dropping a previous quarter's unshipped proposal** — carry it forward until it's
   confirmed shipped or explicitly superseded.
5. **No inventing regulation section numbers, case names, or guidance titles.** If you're not
   certain of an exact citation, describe the requirement in plain language and mark the citation
   `UNVERIFIED — could not confirm exact source`.
6. **State today's date and every review window explicitly in the report.** A reader six months
   from now should be able to tell exactly what period this run covered without cross-referencing
   anything else.
