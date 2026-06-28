# Pre-Release Documentation

This file documents features and APIs that are available on the `next` branch or under an alpha/beta tag but have **not yet been released as stable**.

Use this as a reference when testing pre-release versions. Content here may change before final release.

---

## How to Install a Pre-Release Version

```bash
# Install the latest next tag
npm install @consenti/ui@next
npm install @consenti/api@next
```

To pin a specific pre-release version:

```bash
npm install @consenti/ui@x.y.z-next.N
```

---

## Pre-Release Features

*No pre-release features documented yet.*

<!-- When working on a next-branch feature, document it here. Example:

### Feature Name

**Status:** Alpha — API may change before stable release
**Package(s):** `@consenti/ui` / `@consenti/api`
**Target stable:** vX.Y.Z

#### Description

What the feature does and why it exists.

#### API

```ts
// Example usage
```

#### Known Limitations

- ...

#### Feedback

Open a GitHub Discussion tagged `pre-release` to share feedback on this feature before it is stabilised.

-->

---

## Stability Definitions

| Label | Meaning |
|-------|---------|
| **Alpha** | Experimental. API will change. Do not use in production. |
| **Beta** | Mostly stable. API may have minor breaking changes before final release. |
| **RC** | Release candidate. No further API changes expected barring blockers. |
| **Stable** | Moved to CHANGELOG.md — use in production. |

---

*See [CHANGELOG.md](./CHANGELOG.md) for stable release history.*
*See [PRE_RELEASE_CHANGELOG.md](./PRE_RELEASE_CHANGELOG.md) for pre-release change entries.*
