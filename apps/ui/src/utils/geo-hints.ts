export function getBrowserGeoHints(): { tz: string; lang: string; langs: string[] } {
  return {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    langs: Array.from(navigator.languages),
  }
}
