# `@consenti/test-runner`

Internal QA tool for this monorepo's own `apps/ui` widget. It boots the real built widget
bundle in a fixture page, drives it into each supported state under real conditions (no
mocking, no calling private APIs), and checks it two ways:

- **Visual** — screenshots each state and diffs it pixel-by-pixel against a checked-in baseline.
- **Functional** — clicks the actual authored buttons/toggles and asserts the resulting consent
  is exactly what that button's config implies; verifies gated scripts load/unload with consent;
  verifies `reConsent()`/`forgetMe()`/`deleteConsent()` behave correctly.
- **Accessibility** (`dist/a11y-cli.js`, separate from the two above) — runs axe-core against the
  banner and preference modal for every jurisdiction, scoped to WCAG 2.x A/AA rules, and fails on
  any `serious`/`critical` violation. See "Accessibility" below.

**Not published.** `"private": true` — this is a repo-internal dev tool, not an npm package.
There is no `@consenti/test-runner` release and it is never part of `publish-packages`. If you
want to use it, clone the repo and run it from here, same as any other internal tool in this
monorepo.

It lives in `apps/` rather than `packages/` because nothing imports it as a library — it's a
runnable tool with its own CLI and its own fixture web server, the same shape as `apps/docs`
(also never published). `packages/browser-engine`, by contrast, *is* a library (imported by this
package and by `apps/scanner`), which is why it stays under `packages/`.

See `plans/DONE-test-runner.md` for the full design history and decisions.

## What it does

For every jurisdiction (`opt-in`, `opt-out`, `opt-out-strict`, `opt-in-dpdpa`, `opt-in-china`,
`opt-in-brazil`, `general-privacy-consent`, `notice-only`) × every widget state (`mainBanner`,
`gpcBanner`, `prefModal`, `ageGateModal`):

1. Launches a fresh, isolated browser session (via `@consenti/browser-engine`) against a small
   fixture page that boots the real `apps/ui/dist` bundle with that jurisdiction configured.
2. Waits for the widget to settle, then checks whether it actually reached the requested state.
   Some combos are genuinely unreachable under real conditions (e.g. `opt-out` never shows a
   `mainBanner` — it writes consent silently) — those are reported `not-applicable`, not a failure.
3. **Visual**: screenshots the state's own element (`#consenti-banner`, `#consenti-modal`, or
   `#consenti-age-gate`) and compares it against `baseline/<jurisdiction>/<state>.png`.
4. **Functional**: reads the resolved profile's actual authored buttons/categories/cookies
   (`widget.profile` — a real, ordinary runtime property; TypeScript's `private` is erased at
   compile time, this isn't private-method invocation) and, per state:
   - Clicks every `action: 'custom'` button (accept-all `'*'`, reject-all `'!'`, explicit cookie
     list) and asserts the resulting `getConsent()` matches exactly what that config implies.
   - Toggles every non-mandatory category in the preference modal and asserts only that
     category's member cookies changed, based on the toggle's own pre-click state (not a
     hardcoded default).
   - Injects a `data-consenti-consent-script` marker for **every** real cookie ID and asserts,
     at each checkpoint, that a gated script is present if and only if its cookie is currently
     `'granted'` — covers not-loaded-initially, loads-on-accept, and unloads-on-reject in one
     invariant that holds regardless of a jurisdiction's opt-in/opt-out defaults.
   - Calls `reConsent()` / `forgetMe()` / `deleteConsent()` and asserts consent clears and the
     banner reappears where expected.
5. Fails the run (non-zero exit) if any visual diff exceeds threshold or any functional
   assertion doesn't match.

`action: 'submit'` buttons in a banner/gpcBanner context (vs. the preference modal) only get a
weak "didn't crash" check — their outcome additionally depends on preGrant/compliance-group
fallback rules (`submitConsent()` in `consenti-setup.ts`) that this deliberately doesn't
re-implement. See the module doc in `src/functional.ts`.

> **Found via this tool**: every built-in profile originally authored its Accept-All/Reject
> buttons with `action: 'submit'` instead of `action: 'custom'`, which made "Accept All" and
> "Reject Optional" produce the *same* consent outcome in the banner (both fall through to
> `onSubmit()`'s mandatory-only + preGrant-fallback logic, ignoring `cookies` entirely). Fixed
> in `packages/utils/src/profiles/*/en.ts` — see `changelog/` for the entry. This is exactly the
> class of bug functional testing exists to catch.

## Prerequisites

1. **`apps/ui` must be built first** — this tool drives the real built bundle
   (`apps/ui/dist/index.mjs`), not raw `src`:
   ```bash
   npm run build --workspace=apps/ui
   ```
   It fails fast with a clear error if this hasn't been done.

2. **Playwright's Chromium binary must be installed once**:
   ```bash
   npm run install-browsers --workspace=packages/browser-engine
   ```
   (This is a scoped, opt-in step — it deliberately isn't a `postinstall` hook, since that would
   fire on every `npm install` at repo root for every contributor, including ones who never touch
   this tool. See `plans/DONE-browser-engine.md`.)

3. **Build this package**:
   ```bash
   npm run build --workspace=apps/test-runner
   ```

## Usage

Run the full matrix — visual + functional, all 8 jurisdictions × 4 states (the default; see
"Filtering" below for local-iteration scoping):

```bash
cd apps/test-runner
node dist/cli.js
```

Exits non-zero if any visual diff fails or any functional assertion fails/errors.

### Accepting a new baseline

No baseline exists yet for a combo, or you've intentionally changed the widget's appearance and
reviewed the new screenshots by eye:

```bash
node dist/cli.js --scope visual --update-baseline
```

This always accepts the current capture as the new baseline for every combo in scope — review
`baseline/` changes in your diff the same way you'd review any other code change before committing.

### Filtering (local iteration only)

CI always runs the full matrix with no filters. Locally, scope a run while iterating:

```bash
# Only functional checks, one jurisdiction — fast inner loop while fixing a bug
node dist/cli.js --jurisdiction opt-in --scope functional

# Only visual, a couple of states
node dist/cli.js --state ageGateModal,prefModal --scope visual

# Target a custom profile/complianceGroupsOverride/api-hosted profile instead of only the
# 8 built-in embedded ones
node dist/cli.js --config-options '{"profileOverride":{"mainBanner":{"heading":"Custom"}}}'
node dist/cli.js --config ./my-run.json
```

| Flag | Default | Description |
|---|---|---|
| `--jurisdiction <id[,id...]>` | all 8 | Comma-separated `ComplianceGroupId`s to test |
| `--state <name[,name...]>` | all 4 | `mainBanner`, `gpcBanner`, `prefModal`, `ageGateModal` |
| `--scope <visual\|functional\|both>` | `both` | Which check kind(s) to run |
| `--locale <locale>` | `en` | Locale passed to the fixture's `ConsentiSetup` config |
| `--threshold <0-1>` | `0.1` | Per-pixel `pixelmatch` sensitivity |
| `--max-diff-ratio <0-1>` | `0.01` | Fraction of pixels allowed to differ before a combo fails |
| `--update-baseline` | off | Accept every captured combo as the new baseline |
| `--results-dir <dir>` | `apps/test-runner/results/<ISO_DATE>` | Root directory for this run's `report.json`/`report.html`/`output/`/`diff/` |
| `--output <dir>` | `<resultsDir>/output` | Where captures for this run are written |
| `--baseline <dir>` | `apps/test-runner/baseline` | Where reference images are read/written |
| `--diff <dir>` | `<resultsDir>/diff` | Where mismatch diff images are written |
| `--config-options '<json>'` | `{}` | A `DeepPartial<ConsentiConfig>` merged into every combo's config — target a `profileOverride`, an `api`-hosted profile, or a `complianceGroupsOverride` map instead of only the 8 built-in embedded profiles |
| `--config <path>` | — | JSON file with any of the above keys (see precedence below) |

Precedence: CLI flags > `--config` file values > defaults (full matrix, `scope: 'both'`).

## Accessibility

A separate, smaller entry point from the visual/functional matrix above — different data shape
(a violations list, not a pixel diff or an expected/actual assertion), so it isn't folded into
`--scope`.

```bash
cd apps/test-runner
node dist/a11y-cli.js
```

For every jurisdiction × `mainBanner`/`prefModal` (the two states a visitor actually reads or
interacts with — `gpcBanner`/`ageGateModal` share the same markup patterns and aren't separately
covered, to keep CI runtime bounded), it launches a real session against the fixture, reaches that
state under real conditions (same not-applicable handling as the visual/functional matrix — e.g.
`opt-out`'s `mainBanner` never appears), and runs `@axe-core/playwright` scoped to that state's own
element (`#consenti-banner` / `#consenti-modal`), filtered to WCAG 2.x A/AA tags
(`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` — matching the AA-oriented claim in the root `README.md`,
not AAA-only rules nothing here promises). `minor`/`moderate` violations are surfaced in the log
but don't fail the run; `serious`/`critical` do (non-zero exit).

No flags today — this is new (2026-07-30) and hasn't needed the filtering/config-options surface
the visual/functional CLI has. Add it the same way (`config.ts`'s `parseCliArgs`) if that changes.

## Output

Every run gets its own dated results directory, `results/<ISO_DATE>/` (e.g. `results/2026-07-28/`)
— an accidental re-run never overwrites a previous run's report. If a run has already happened
today, the next one gets `results/<ISO_DATE>-V2/`, `-V3/`, etc. (same collision convention as this
repo's `changelog/YYYY-MM-DD-V{n}.md` files). Pass `--results-dir <dir>` to pin a fixed location
instead (e.g. for a CI job that always wants the latest run at a known path).

- `results/<ISO_DATE>/report.json` — full run report: every visual outcome + every functional check + summary counts
- `results/<ISO_DATE>/report.html` — self-contained, human-browsable rendering of the same report
  (thumbnails + diff images for visual, an expected/actual table for functional) — open it directly
  in a browser
- `results/<ISO_DATE>/output/<jurisdiction>/<state>.png` — this run's visual capture
- `results/<ISO_DATE>/diff/<jurisdiction>/<state>.png` — pixelmatch diff image, written only on mismatch
- `baseline/<jurisdiction>/<state>.png` — checked-in reference, reviewed like code (git-tracked,
  shared across runs — not per-date)

`results/` is entirely gitignored (regenerated every run); `baseline/` is the only image directory
that's git-tracked.

## CI

Wired into `.github/workflows/ci.yml`, running the full matrix (`scope: both`) on every PR/push
to `master`/`next` (no filters — see the table above, all flags are opt-in local-iteration
conveniences), followed by a separate `node dist/a11y-cli.js` step. Playwright's Chromium binary
is cached via `actions/cache`, keyed on the installed Playwright version + OS.

## Programmatic use

The package also exports its internals (`runMatrix`, `resolveRunConfig`, `captureCombo`,
`runFunctionalChecks`, `diffAgainstBaseline`, `writeHtmlReport`, etc.) from its root entry point,
for anything in this monorepo that wants to drive a run without shelling out to the CLI. There
are no external consumers of this today — it's exported on the same principle as any other
internal package, not because something already depends on it.
