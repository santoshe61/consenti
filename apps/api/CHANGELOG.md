# @consenti/api

## 0.3.0

### Minor Changes

- ee33430: consent-authoring revamp, profile history, and TCF/RTL/age-gate widget features (0.3.0)

## 0.2.0

### Minor Changes

- e22b457: chore: New compliances, ui and api methods introduced

### Patch Changes

- e22b457: fix: mobile modal layout, scroll lock, security hardening, and deep profileOverride merge

  - Restructure modal header to column layout with absolutely-positioned controls
    so heading and subheading stack correctly on narrow screens
  - Lock body scroll (save/restore overflow) when modal opens in overlay or
    fullscreen mode; restore on close and destroy
  - Move subheading into header and htmlText/receipt into body div for correct
    DOM order
  - Sanitize DPDPA grievance email to prevent XSS in modal innerHTML
  - Reject javascript: src URLs and on\* event-handler attributes in ConsentScript
  - Replace shallow profileOverride merge with deepMerge so nested profile
    keys (e.g. cookies, theme) are properly overridden
  - Add changeset config, sync-root-version script, and updated CI/publish workflows
  - Add banner and logo assets; update COLLABORATOR_GUIDE, tsconfig, and lockfile

- e22b457: remove /author page, rebuild footer with SEO grid, update compliance and UI docs pages
