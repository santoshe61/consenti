# Compliance Review — Agent Kit

This directory operationalizes the process described on the docs site at
[`/guides/what-is-consenti`](../apps/docs/src/app/guides/what-is-consenti/page.tsx)
under **"How Consenti aims to stay compliant"**:

> Quarterly review → draft an implementation plan → publish for public comment (~1 month) →
> implement and publish → lighter interim scans between quarters.

That page describes the *intent*. These files are the *mechanism*: a self-contained brief you
hand to a research agent (Claude Code, a fresh Claude conversation, or a human doing the same
steps manually) once a quarter, plus a scope registry and report template so every run produces
the same shape of output and nothing drifts.

**This kit produces plans and reports for humans to review — it never edits product code or
docs pages itself, and never posts to GitHub Discussions itself.** A person always reviews the
report, decides what to act on, and does the actual posting/PRs.

---

## Files in this directory

| File | Purpose |
|------|---------|
| `AGENT-BRIEF.md` | The instructions to hand the research agent each quarter — scope, dates, sources, output format, hard rules. This is the only file you need to paste/reference to kick off a run. |
| `jurisdiction-registry.md` | Canonical list of in-scope jurisdictions (Maintained + Supported tiers only), each with its regulator, source(s) to check, current code mapping, and last-reviewed date. The agent reads this to know what's in scope and updates the "last reviewed" column when a run finishes. |
| `templates/quarterly-report-TEMPLATE.md` | The exact structure every quarterly report must follow. Copy it into `reviews/` and fill it in — don't freehand a different format. |
| `reviews/YYYY-QN.md` | One file per completed quarterly run, output of the brief. This is the history the *next* run's "validate previous quarter" step reads. Empty until the first real run. |

---

## How to run a quarter

1. **Open a fresh agent session** (don't reuse a long-running one — you want it reading sources
   fresh, not relying on earlier-in-conversation assumptions). Point it at `AGENT-BRIEF.md` and
   tell it to follow that file's instructions exactly, e.g.:

   > Read `compliance-docs/AGENT-BRIEF.md` and follow it. Today's date is `<actual date>`.

   Always state today's actual date explicitly in the kickoff message — don't let the agent infer
   it, since a stale or wrong "today" silently breaks the review-window math (see
   `AGENT-BRIEF.md` → "Dates" for why).

2. **Let it work.** It will: validate what actually shipped from the *previous* quarter's report
   (§0), scan every in-scope jurisdiction for changes since that jurisdiction's `last_reviewed`
   date in the registry (§1), draft findings + suggested code changes without applying them (§2–3),
   and write `reviews/YYYY-QN.md` from the template (§4).

3. **You review the output.** Read the report like any other PR: check the cited sources actually
   say what the agent claims, sanity-check the suggested code changes, and downgrade anything
   marked `UNVERIFIED` that you can't confirm yourself — don't ship those on the agent's say-so.

4. **Post it for public comment.** Per the docs-site process, the report (or a summary of it) goes
   to [GitHub Discussions](https://github.com/santoshe61/consenti/discussions) for roughly a
   month before anything ships. This step is manual — the agent drafts, a human posts.

5. **After the comment window, implement.** Ship the agreed changes, record them in
   `CHANGELOG.md` as usual, and update `jurisdiction-registry.md`'s `last_reviewed` dates to this
   quarter — the next run's §0 validation depends on that changelog entry existing.

6. **Interim scans (optional, between quarters).** If something urgent breaks (a regulator
   deadline, a fast-moving amendment), you can run just §1 of the brief scoped to the one
   jurisdiction in question instead of waiting for the next full quarter. Note it happened in the
   next full report's "Interim scans since last full review" section.

---

## Scope reminder

This kit **only** covers the **Maintained** and **Supported** tiers listed in
[`ECOSYSTEM.md`](../ECOSYSTEM.md) — GDPR, UK-GDPR, CCPA, CPRA, LGPD, PIPEDA/Law 25, POPIA,
PDPA-TH, APPI, KVKK. It deliberately excludes:

- **DPDPA (India)** — "In development," tracked separately against India's own phased 2025–2027
  rollout dates, not a stable-law quarterly cycle.
- **IAB TCF v2.3 / GPP** — "Partial," a spec-encoding/peer-dependency track, not a jurisdiction —
  see `plans/PENDING-cursor-review-work-items.md` item #3 instead.
- Every "Routing-only" country in the embedded compliance map that isn't in either tier — those
  get UX-template routing but no legal-currency claim, so there's nothing to keep current.

If a jurisdiction gets promoted or demoted between tiers, update `jurisdiction-registry.md` (add
or remove its row) and `ECOSYSTEM.md` together — don't let them disagree about scope.
