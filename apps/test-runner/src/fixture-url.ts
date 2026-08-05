import type { ConsentiConfig, DeepPartial } from '@consenti/types'
import type { WidgetState } from './types.js'

export interface FixtureUrlOptions {
  jurisdiction: string
  state: WidgetState
  locale: string
  configOptions?: DeepPartial<ConsentiConfig>
}

/** Builds the fixture page URL shared by visual capture and functional tests. */
export function buildFixtureUrl(fixtureBaseUrl: string, options: FixtureUrlOptions): string {
  const url = new URL(fixtureBaseUrl)
  url.searchParams.set('jurisdiction', options.jurisdiction)
  url.searchParams.set('state', options.state)
  url.searchParams.set('locale', options.locale)
  if (options.configOptions && Object.keys(options.configOptions).length > 0) {
    url.searchParams.set('configOptions', JSON.stringify(options.configOptions))
  }
  return url.toString()
}

// Stubs the GPC signal ahead of widget boot — `browser-engine`'s initScripts run via
// `context.addInitScript`, before any page script, which is required: setting this after
// the page has already loaded would miss ConsentiSetup's own boot-time GPC detection.
export const GPC_STUB_SCRIPT = `Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })`
