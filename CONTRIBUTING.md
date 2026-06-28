# Contributing to Consenti

Thank you for your interest in contributing. This document covers everything you need to set up your environment, open a pull request, and get your code merged.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS or later (`node --version` should start with `v20`, `v22`, or `v24`; v22 or v24 recommended) |
| npm | ≥ 10 |
| Git | any recent version |

We recommend using [nvm](https://github.com/nvm-sh/nvm). A `.nvmrc` is included — run `nvm use` in the repo root.

---

## Development Setup

```bash
git clone https://github.com/santoshe61/consenti.git
cd consenti
npm install
npx turbo build        # build all packages once (types package must be built first)
npm run dev --workspace=apps/docs   # docs + playground + API on http://localhost:3000
```

For dashboard-only development:

```bash
npm run build:api --workspace=apps/api
npm run dev:all --workspace=apps/api   # API on :3001 + dashboard Vite on :5173
```

Dev login: `user@consenti.dev` / `Consenti@123`

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable. Published releases come from here. |
| `next` | Pre-release. Merged to `main` at release. |
| `feat/*` | Feature branches — branch from `main`, PR back to `main`. |
| `fix/*` | Bug fix branches. |
| `chore/*` | Non-code changes (docs, config, tooling). |

Always branch from `main` unless you are working on pre-release features that explicitly target `next`.

---

## Making a Change

1. **Find or create an issue** — describe what you want to build or fix before writing code.
2. **Read the relevant plan** — every significant design decision is already documented in `plans/`. Do not propose architecture changes without first reading the applicable plan file.
3. **Branch** — `git checkout -b feat/your-feature-name`
4. **Code** — follow the conventions in [AGENTS.md](./AGENTS.md).
5. **Verify** — run the checklist below before committing.
6. **Changelog** — create `changelog/YYYY-MM-DD-V{n}.md` (see template in AGENTS.md §6).
7. **Pull request** — target `main`, fill in the PR template.

---

## Before Submitting

Run all of these locally. CI runs the same checks and will block unclean PRs.

```bash
npx turbo typecheck   # zero TypeScript errors required
npx turbo lint        # ESLint must pass
npx turbo test        # all tests must pass
```

### Checklist

- [ ] `turbo typecheck` — zero errors
- [ ] `turbo lint` — zero warnings in changed files
- [ ] `turbo test` — all tests pass
- [ ] Changelog entry added at `changelog/YYYY-MM-DD-V{n}.md`
- [ ] Docs updated in `apps/docs` if any public API surface changed
- [ ] Breaking changes documented in the changelog entry and in [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- [ ] No new external runtime dependencies added to `apps/ui` or `apps/api`
- [ ] TypeScript strict mode — no `any`, all public types exported from `packages/types`

---

## Code Conventions

All conventions are defined in [AGENTS.md](./AGENTS.md). Key points:

- **Zero runtime deps** in `apps/ui` and `apps/api` — browser/Node built-ins only.
- **TypeScript strict** — `no-any`, named exports only, types in `packages/types`.
- **CSS** — `.consenti-` BEM prefix everywhere, CSS custom properties for theming.
- **SSR guard** — every `window`/`document` access must be behind `isClient()`.
- **Layer isolation** — Routes → Services → Repositories → StorageAdapter → DB.
- **No comments** explaining what code does — only comments explaining a non-obvious why.

---

## Commit Messages

Use the conventional commits format:

```
type(scope): short description

Optional body explaining why, not what.
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`
Scopes: `ui`, `api`, `docs`, `types`, `dashboard`, `core`

Examples:
```
feat(ui): add locale switcher dropdown to banner
fix(api): hash IP before storage in SQLite adapter
chore(docs): update migration guide for V2 button API
```

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR. Large rewrites should be discussed in an issue first.
- Fill in the PR description template: what changed, why, how to test it.
- Link to the relevant issue with `Closes #NNN`.
- All CI checks must pass before review.
- At least one maintainer approval is required to merge.

---

## Reporting Bugs

Open a GitHub issue with:
- Consenti version (`@consenti/ui@x.y.z`)
- Node version (`node --version`)
- Minimal reproduction (code or repo link if possible)
- Expected vs actual behavior

For security vulnerabilities, see [SECURITY.md](./SECURITY.md) — do **not** open a public issue.

---

## Getting Help

- Open a [GitHub Discussion](https://github.com/santoshe61/consenti/discussions) for questions.
- Tag issues with `good first issue` if they are beginner-friendly.
- Read [AGENTS.md](./AGENTS.md) — it answers most architectural questions.

---

## License

By contributing you agree that your contributions will be licensed under the [Apache 2.0 License](./LICENSE).
