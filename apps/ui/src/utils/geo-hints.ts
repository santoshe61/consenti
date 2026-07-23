export function getBrowserGeoHints(): { tz: string; lang: string; langs: string[] } {
  return {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    langs: Array.from(navigator.languages),
  }
}

/** Returns a base64-encoded JSON payload of browser geo/locale hints for the `/resolve-profile` API. */
export function encodeGeoHints(locale?: string): string {
  const opts = Intl.DateTimeFormat().resolvedOptions()
  return btoa(JSON.stringify({
    timezone: opts.timeZone,
    languages: Array.from(navigator.languages ?? []),
    language: navigator.language ?? '',
    locale: locale ?? opts.locale ?? navigator.language ?? '',
  }))
}
