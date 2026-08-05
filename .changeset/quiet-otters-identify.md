---
'@consenti/types': minor
'@consenti/ui': minor
---

Added `getVisitor()` to the widget API — a snapshot of the current visitor's identity: the stable per-browser `visitorId` (`null` until a consent decision has actually happened; it's never minted just to answer this call), whether they're `'authenticated'` or `'anonymous'`, and the app `userId` (same value as `getUserId()`). Wired into the React/Vue/Angular integrations alongside the existing `getUserId`/`setUserId`.

Also documented `getUserId()`/`setUserId()`/`getVisitor()` on the `/docs/ui/methods` page — they were implemented but missing from the docs.
