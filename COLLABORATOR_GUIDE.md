# Collaborator Guide

This guide is for people with commit access to the Consenti repository. If you are a first-time contributor, read [CONTRIBUTING.md](./CONTRIBUTING.md) instead.

---

## What Is a Collaborator?

A collaborator is a trusted contributor who has been granted write access to the repository. Collaborators can:

- Review and merge pull requests (with at least one approval from another collaborator or maintainer for significant changes)
- Triage issues (add labels, close duplicates, request info)
- Create and push branches directly (no fork required)
- Tag releases and publish packages

Collaborators are **not** permitted to:
- Force-push to `main` or `next` without explicit maintainer approval
- Publish packages unilaterally — all releases go through the release checklist
- Change the license, project scope, or core tech decisions without maintainer sign-off

---

## Becoming a Collaborator

Collaborator status is extended by invitation from the maintainer. There is no formal application process. Demonstrated qualities:

- Multiple high-quality merged contributions
- Good judgment in code review (catching bugs, enforcing conventions)
- Constructive and respectful communication
- Understanding of the project architecture (AGENTS.md and plan files)

---

## Code Review Responsibilities

Every PR needs at least one approving review before merge. As a collaborator, when reviewing:

1. **Read the plan first** — if a change touches a feature area, read the relevant `plans/` file to verify the implementation matches the design.
2. **Verify the checklist** — has the author updated docs, added a changelog entry, and checked for breaking changes?
3. **Check zero-dep rule** — `apps/ui` and `apps/api` must have zero new runtime deps.
4. **Check type placement** — all new public types must be in `packages/types`, not local files.
5. **Check SSR guards** — any `window`/`document`/`navigator` access must be behind `isClient()`.
6. **Check layer boundaries** — routes must not import repositories; services must not import routes.

Do not approve PRs you have authored yourself (except trivial chores like typo fixes).

---

## Merging Pull Requests

- Prefer **squash merge** for feature branches to keep `main` history clean.
- Use **merge commit** for long-lived branches (`next` → `main`) to preserve history.
- Never rebase or amend commits on `main` or `next`.
- Delete the source branch after merge.

---

## Triaging Issues

- Add `bug`, `enhancement`, `good first issue`, `question`, or `wontfix` labels promptly.
- Close issues that are duplicates or clearly out of scope, with a brief explanation.
- For security reports that arrive as public issues: immediately convert to a private advisory, close the public issue, and notify the reporter.

---

## Release Process

All releases follow the checklist in `plans/consenti.md`. In brief:

1. Ensure `turbo typecheck`, `turbo lint`, and `turbo test` all pass on `main`.
2. Run `npx changeset version` to bump package versions.
3. Update `CHANGELOG.md` with a summary line and link for the release.
4. Tag: `git tag ui/v{x.y.z}` and `git tag api/v{x.y.z}` as appropriate.
5. Run `npx turbo build` on a clean checkout to verify the build.
6. Publish: `npm publish --workspace=apps/ui` / `npm publish --workspace=apps/api`.
7. Push the tag and create a GitHub Release with release notes.

Only the maintainer or a collaborator explicitly delegated by the maintainer should publish to npm.

---

## Communication Norms

- Use GitHub Discussions for design questions and RFC proposals.
- Use GitHub Issues for bugs and well-scoped feature requests.
- Tag `@santoshe61` for decisions that affect the core architecture or release schedule.
- Be terse in code review comments — link to AGENTS.md or plan files rather than explaining conventions from scratch.

---

## Questions?

Open a GitHub Discussion or contact the maintainer at support@consenti.dev.
