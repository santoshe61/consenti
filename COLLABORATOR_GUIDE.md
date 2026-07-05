# Collaborator Guide

How to contribute to Consenti and how releases reach npm.

---

## Versioning model

All packages always share the same version number:

| Package | Published to npm | Version tracked |
|---|---|---|
| `@consenti/ui` | yes | yes |
| `@consenti/api` | yes | yes |
| `@consenti/types` | no (internal) | yes — mirrors the release version |
| `consenti-monorepo` (root) | no | yes — mirrors the release version |

This is enforced by Changesets **fixed mode**. When any package gets a bump, all three workspace packages move to the same version simultaneously. Users never need a compatibility matrix — install matching versions of `@consenti/ui` and `@consenti/api` and everything works.

Semver rules:
- `patch` (0.1.x) — bug fixes, internal refactors, no public API change
- `minor` (0.x.0) — new backwards-compatible features
- `major` (x.0.0) — breaking API changes (discuss with maintainer first)

---

## What is a Collaborator?

A collaborator has write access to the repository and can:

- Review and merge pull requests
- Triage issues (add labels, close duplicates, request info)
- Create branches directly without forking
- Approve and trigger releases

Collaborators must not:
- Force-push to `master` or `next` without maintainer approval
- Publish packages unilaterally — all releases go through the automated workflow
- Change license, project scope, or locked tech decisions without maintainer sign-off

---

## For contributors (developers)

### One-time setup

```bash
git clone https://github.com/santoshe61/consenti.git
cd consenti
npm install
```

### Per-change workflow

#### 1. Create a branch and make your changes

```bash
git checkout -b feat/my-feature
# ... write code, run tests ...
```

#### 2. Write a changeset before committing

A changeset is a small markdown file that records what changed and what kind of version bump it warrants. You must include one with every PR that changes `apps/ui`, `apps/api`, or `packages/types`.

```bash
npx changeset
```

The CLI walks you through three prompts:

**a) Which packages changed?** — use spacebar to select:
```
◉ @consenti/ui      ← select if you touched apps/ui
◉ @consenti/api     ← select if you touched apps/api
○ @consenti/types   ← only if you changed packages/types
```

In practice you will almost always select both `@consenti/ui` and `@consenti/api` because a backend API change usually has a corresponding frontend integration change and vice versa.

**b) What kind of bump?**
```
patch  → bug fix, internal change, no public API change
minor  → new feature, backwards compatible
major  → breaking change
```

**c) A one-line summary of the change:**
```
Added GPC signal detection with configurable handling modes
```

This creates a file like `.changeset/happy-frogs-sleep.md`:

```markdown
---
"@consenti/ui": minor
"@consenti/api": minor
---

Added GPC signal detection with configurable handling modes
```

#### 3. Commit everything in one go

```bash
git add .
git commit -m "feat: add GPC signal detection"
# the .changeset/*.md file goes in the same commit as the code change
```

#### 4. Open a pull request to `master`

CI runs typecheck, lint, build, and audit on every PR. All must pass before merge.

The Changesets bot will comment on your PR confirming it found a changeset. If you deliberately did not include one (see below), the bot's warning can be ignored.

### When NOT to write a changeset

- Changes only to `apps/docs` — documentation does not need a version bump
- Dev tooling changes (GitHub Actions, lint config, tsconfig)
- Typo fixes or comment corrections with zero user-facing effect

Open the PR without a changeset for these cases. A maintainer can add a `changeset-skip` label to suppress the bot warning.

### Code review checklist

Before marking your PR ready for review, verify:

- [ ] `npx turbo typecheck` passes
- [ ] `npx turbo lint` passes
- [ ] `npx turbo build` succeeds
- [ ] Changeset file included (or deliberately omitted for docs/tooling)
- [ ] If touching a feature area, the relevant `plans/` file was followed
- [ ] No new runtime deps added to `apps/ui` or `apps/api`
- [ ] New public types go in `packages/types`, not local files
- [ ] All `window`/`document`/`navigator` access guarded with `isClient()`

---

## For maintainers

### How the full automation works

```
Developer PR merges to main
        │
        ▼
GitHub Action (publish.yml) fires on every push to main
        │
        ├─── Pending .changeset/*.md files exist?
        │         │
        │         ▼  YES
        │    Changesets Action runs `changeset version`:
        │      • bumps versions in all package.json files (fixed mode → all same)
        │      • updates CHANGELOG.md for @consenti/ui and @consenti/api
        │      • runs sync-root-version.mjs (mirrors version to root package.json)
        │      • deletes the .changeset/*.md files
        │    → Opens or updates a PR titled "chore: version packages"
        │
        └─── No pending changesets (the version PR was just merged)?
                  │
                  ▼  YES
             Changesets Action runs `changeset publish`:
               • runs `npx turbo build` to produce fresh dist artifacts
               • publishes @consenti/ui to npm with provenance
               • publishes @consenti/api to npm with provenance
               • pushes git tags: @consenti/ui@x.y.z, @consenti/api@x.y.z
```

### The "Version Packages" PR — your release decision

After one or more feature PRs land on `master`, the Action automatically opens (or updates) a PR titled **"chore: version packages"**. This PR contains:

- Bumped `package.json` versions in all packages
- Updated `CHANGELOG.md` for `@consenti/ui` and `@consenti/api`
- The `.changeset/*.md` files removed

**Merging this PR is your decision to release.** Nothing publishes until you merge it. Take your time to review.

What to check before merging:

1. The version number is correct (does major/minor/patch match the actual changes?)
2. The CHANGELOG entries are clear and accurate enough for users
3. CI passes on the PR itself
4. You are ready for this version to be public — there is no rollback

```bash
# To preview version bumps locally before merging (does NOT publish):
npm run version-packages
git diff                 # inspect the bumped versions and CHANGELOG
git checkout .           # undo the local preview
```

### After the "Version Packages" PR merges

The Action publishes automatically — you do nothing else. Watch progress in the **Actions** tab. When it succeeds:

- Both packages are live on npm at the new version
- Git tags are pushed (`@consenti/ui@0.3.0`, `@consenti/api@0.3.0`)
- CHANGELOG.md is committed to `master`

Optionally create a GitHub Release from the new tag with the changelog text. This is cosmetic but improves discoverability.

### Code review responsibilities

When reviewing any PR:

1. **Read the relevant plan** — if the change touches a feature area, read the plan file in `plans/` first to verify the implementation matches the design intent.
2. **Verify the mandatory checklist in AGENTS.md** — docs updated, changelog entry written if needed, no breaking changes without a major bump.
3. **Zero-dep rule** — `apps/ui` and `apps/api` must not gain new runtime deps.
4. **Type placement** — all new public types must be in `packages/types`, not local type files.
5. **SSR guards** — every `window`/`document`/`navigator` access must be behind `isClient()`.
6. **Layer boundaries** — routes must not import repositories; services must not import routes.

Do not approve PRs you authored yourself (except trivial chores).

### Merging pull requests

- Use **squash merge** for feature branches — keeps `main` history clean.
- Use **merge commit** for long-lived branches (`next` → `main`) to preserve history.
- Never rebase or amend commits on `master` or `next`.
- Delete the source branch after merge.

### One-time secrets setup (do this once per repo)

The release Action needs one secret:

**`NPM_TOKEN`** — an npm automation token

1. npmjs.com → your account → Access Tokens → Generate New Token → choose **Automation**
2. GitHub repo: Settings → Secrets and variables → Actions → New repository secret
3. Name: `NPM_TOKEN`, Value: the token from step 1

`GITHUB_TOKEN` is provided automatically by GitHub Actions — no setup needed.

The `publish.yml` workflow already declares the required permissions (`contents: write`, `pull-requests: write`) so the Action can open the version PR and push tags without any extra configuration.

### Emergency hotfix (publishing without a PR)

If you need to publish immediately without going through the changeset PR flow:

```bash
# 1. Bump versions locally
npm run version-packages

# 2. Commit and push to main
git add .
git commit -m "chore: version packages"
git push

# The Action detects no pending changesets on the next push and publishes automatically.
```

To publish directly from your machine (bypasses the Action entirely):

```bash
export NODE_AUTH_TOKEN=<your-npm-token>
npm run publish-packages
```

### Triaging issues

- Add `bug`, `enhancement`, `good first issue`, `question`, or `wontfix` labels promptly.
- Close issues that are duplicates or out of scope with a brief explanation.
- For security reports that arrive as public issues: immediately convert to a private GitHub Security Advisory, close the public issue, and notify the reporter privately.

---

## Pre-release (next channel)

To publish a `0.3.0-next.0` pre-release from the `next` branch:

```bash
git checkout next

# Enter pre-release mode (do this once per pre-release cycle)
npx changeset pre enter next

# Write changesets and commit as normal
npx changeset

# Bump to pre-release version (e.g. 0.3.0-next.0)
npx changeset version

# Publish under the `next` npm dist-tag
npx changeset publish --tag next

# When ready to cut the stable release, exit pre-release mode
npx changeset pre exit
```

Consumers install pre-releases explicitly:
```bash
npm install @consenti/ui@next @consenti/api@next
```

---

## Quick reference

| Task | Command |
|---|---|
| Write a changeset | `npx changeset` |
| Preview version bumps (no publish) | `npm run version-packages` then `git checkout .` |
| Publish manually from local | `npm run publish-packages` |
| Enter pre-release mode | `npx changeset pre enter next` |
| Exit pre-release mode | `npx changeset pre exit` |
| List pending changesets | `ls .changeset/` |
| View what will be published | `npx changeset status` |

---

## Questions?

Open a GitHub Discussion or contact the maintainer at support@consenti.dev.
