/**
 * Utilities for materialising server config into the dashboard SPA.
 *
 * Data is injected as an inline <script> that writes window.__CONSENTI_CONFIG__
 * using Object.defineProperty with writable:false + configurable:false, then
 * deep-freezes the value so neither the object nor any nested property can be
 * mutated from the browser.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { BrandingConfig, ComplianceConfig, ConsentiRuntimeConfig } from '@consenti/types'

function resolveappLogoPath(dashboardDir: string, branding: BrandingConfig): string | null {
  const { appLogoPath } = branding
  if (!appLogoPath) return null

  if (/^(https?:\/\/|data:)/i.test(appLogoPath)) return appLogoPath

  if (existsSync(appLogoPath)) {
    const ext = extname(appLogoPath) || '.png'
    const destName = `logo${ext}`
    try {
      if (!existsSync(dashboardDir)) mkdirSync(dashboardDir, { recursive: true })
      copyFileSync(appLogoPath, join(dashboardDir, destName))
      return `./logo${ext}`
    } catch {
      console.warn(`[Consenti] branding: could not copy logo from "${appLogoPath}" — logo will not be shown`)
      return null
    }
  }

  console.warn(`[Consenti] branding: appLogoPath "${appLogoPath}" does not exist — logo will not be shown`)
  return null
}

export function buildConsentiRuntimeConfig(
  dashboardDir: string,
  basePath: string,
  branding: BrandingConfig = {},
  compliance: ComplianceConfig = {},
): ConsentiRuntimeConfig {
  const resolvedCompliance: ConsentiRuntimeConfig['compliance'] = {}
  if (compliance.type !== undefined) resolvedCompliance.type = compliance.type
  if (compliance.gpc !== undefined) resolvedCompliance.gpc = compliance.gpc

  return {
    appName: branding.appName ?? 'Consenti',
    appLogoPath: branding?.appLogoPath ?? "/logo-dark.svg", // resolveappLogoPath(dashboardDir, branding),
    hidePoweredBy: branding.hidePoweredBy ?? false,
    basePath,
    compliance: resolvedCompliance,
  }
}

export function buildConsentiConfigScript(cfg: ConsentiRuntimeConfig): string {
  // Escape </script> to prevent early tag termination, then emit a self-contained IIFE
  // that locks the config via Object.defineProperty + deep-freeze.
  const json = JSON.stringify(cfg).replace(/<\/script>/gi, '<\\/script>')
  return `<script>(function(){` +
    `function d(o){if(o&&typeof o==='object')Object.keys(o).forEach(function(k){d(o[k])});return Object.freeze(o)}` +
    `Object.defineProperty(window,'__CONSENTI_CONFIG__',{value:d(${json}),writable:false,configurable:false,enumerable:true})` +
    `})()</script>`
}

export function injectConfigScript(html: Uint8Array, script: string): string {
  const str = Buffer.from(html).toString('utf-8')
  return str.includes('</head>')
    ? str.replace('</head>', `${script}</head>`)
    : str.replace('</body>', `${script}</body>`)
}
