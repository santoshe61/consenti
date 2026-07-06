import { createContext } from 'preact'
import { useContext, useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

interface BrandingState {
  appName: string
  appLogoPath: string | null
  hidePoweredBy: boolean
}

const DEFAULTS: BrandingState = { appName: 'Consenti', appLogoPath: './logo-dark.svg', hidePoweredBy: false }

function readBranding(): BrandingState {
  const cfg = window.__CONSENTI_CONFIG__
  if (!cfg) return DEFAULTS
  return {
    appName: cfg.appName,
    appLogoPath: cfg.appLogoPath,
    hidePoweredBy: cfg.hidePoweredBy,
  }
}

const BrandingContext = createContext<BrandingState>(DEFAULTS)

export function BrandingProvider({ children }: { children: ComponentChildren }) {
  const [branding] = useState<BrandingState>(readBranding)
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  return useContext(BrandingContext)
}
