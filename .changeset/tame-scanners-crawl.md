---
'@consenti/browser-engine': patch
---

Fixed a resource leak in `launchSession()`: if anything after `chromium.launch()` failed (most
commonly `page.goto()` timing out or hitting a DNS/connection error — the normal case for a
crawler visiting arbitrary URLs), the already-launched browser process was never closed and ran
until the OS reaped it. Now the browser is closed on any failure before the error is re-thrown.
