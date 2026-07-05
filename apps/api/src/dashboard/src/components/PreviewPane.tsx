import { useState, useEffect, useRef } from 'preact/hooks'
import { Maximize2, Minimize2 } from 'lucide-react'
import type { FunctionComponent } from 'preact'
import widgetJs from '@consenti/ui/dist/index.umd.js?raw'
import { CONSENTI_CSS as widgetCss } from '@consenti/ui/src/styles/consenti-css'
import { useTheme } from '../context/theme'

interface IconProps { size?: number; className?: string }
const Maximize2Icon = Maximize2 as unknown as FunctionComponent<IconProps>
const Minimize2Icon = Minimize2 as unknown as FunctionComponent<IconProps>

export type PreviewMode = 'main' | 'gpc' | 'modal'

interface PreviewPaneProps {
  draft: object
  debounceMs?: number
  expandable?: boolean
  height?: string
  previewMode?: PreviewMode
}

const PREVIEW_MODE_LABELS: Record<PreviewMode, string> = {
  main: 'Main Banner',
  gpc: 'GPC Banner',
  modal: 'Modal',
}

function mapButton(btn: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {
    text: btn['text'],
    style: btn['type'],
    action: btn['action'],
  }
  if (btn['cookies'] !== undefined) out['cookies'] = btn['cookies']
  if (btn['url'] !== undefined) out['url'] = btn['url']
  return out
}

function withButtons(section: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!section) return undefined
  const buttons = section['buttons'] as Record<string, unknown>[] | undefined
  return { ...section, buttons: (buttons ?? []).map(mapButton) }
}

function hasLocaleSwitcher(section: Record<string, unknown> | undefined): boolean {
  return section?.['showLocaleSwitcher'] === true
}

function buildSrcdoc(draft: object, dark: boolean, mode: PreviewMode): string {
  const d = draft as Record<string, unknown>
  const translations = d['translations'] as Record<string, Record<string, unknown>> | undefined
  const defaultLocale = (d['defaultLocale'] as string | undefined) ?? 'en'
  const locale = translations?.[defaultLocale] as Record<string, unknown> | undefined

  const mainBanner = withButtons(locale?.['mainBanner'] as Record<string, unknown> | undefined)
  const gpcBanner = withButtons(locale?.['gpcBanner'] as Record<string, unknown> | undefined)
  const preferenceModal = withButtons(locale?.['preferenceModal'] as Record<string, unknown> | undefined)

  const needsLocales =
    hasLocaleSwitcher(locale?.['mainBanner'] as Record<string, unknown> | undefined) ||
    hasLocaleSwitcher(locale?.['gpcBanner'] as Record<string, unknown> | undefined) ||
    hasLocaleSwitcher(locale?.['preferenceModal'] as Record<string, unknown> | undefined)

  const override = {
    defaultLocale,
    ...(needsLocales ? { locales: ['en', 'fr'] } : {}),
    cookies: d['cookies'],
    mainBanner,
    gpcBanner,
    preferenceModal,
  }

  const profileJson = JSON.stringify(override)
  const bgColor = dark ? '#111827' : '#f5f5f5'

  // Initial script to show the right element when the iframe first loads
  const initScript =
    mode === 'modal'
      ? `w.onReady(function() { w.showModal() })`
      : mode === 'gpc'
        ? `w.onReady(function() { w.deleteConsent().then(function() { w.showBanner(true) }) })`
        : `w.onReady(function() { w.deleteConsent().then(function() { w.showBanner() }) })`

  // postMessage listener to switch modes without reloading the iframe
  const switchScript = `
window.addEventListener('message', function(e) {
  if (!e.data || typeof e.data.type !== 'string') return
  var type = e.data.type
  if (type === 'preview:main') {
    if (w.modalVisibility()) w.hideModal()
    w.showBanner(false)
  } else if (type === 'preview:gpc') {
    if (w.modalVisibility()) w.hideModal()
    w.showBanner(true)
  } else if (type === 'preview:modal') {
    if (!w.modalVisibility()) w.showModal()
  }
})`

  return `<!DOCTYPE html>
<html lang="en"${dark ? ' class="dark"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${widgetCss}</style>
<style>body{margin:0;font-family:sans-serif;background:${bgColor}}</style>
</head>
<body>
<script>${widgetJs}</script>
<script>
const { ConsentiSetup } = window.Consenti
const w = new ConsentiSetup({
  darkMode: ${dark},
  core: { profileId: 0 },
  profileOverride: ${profileJson},
})
${initScript}
${switchScript}
</script>
</body>
</html>`
}

export function PreviewPane({ draft, debounceMs = 600, expandable = false, height = '360px', previewMode }: PreviewPaneProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [expanded, setExpanded] = useState(false)
  const isControlled = previewMode !== undefined
  const [internalMode, setInternalMode] = useState<PreviewMode>('main')
  const activeMode: PreviewMode = isControlled ? previewMode : internalMode

  const [srcdoc, setSrcdoc] = useState(() => buildSrcdoc(draft, isDark, activeMode))
  const [key, setKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const prevModeRef = useRef<PreviewMode>(activeMode)
  const activeModeRef = useRef<PreviewMode>(activeMode)
  activeModeRef.current = activeMode

  // When mode changes: send postMessage to switch what's visible — no iframe reload
  useEffect(() => {
    if (prevModeRef.current === activeMode) return
    prevModeRef.current = activeMode
    iframeRef.current?.contentWindow?.postMessage({ type: `preview:${activeMode}` }, '*')
  }, [activeMode])

  // When draft or dark mode changes: rebuild the srcdoc and reload the iframe,
  // keeping the current mode so the refreshed iframe starts on the right element
  useEffect(() => {
    const timer = setTimeout(() => {
      const mode = activeModeRef.current
      setSrcdoc(buildSrcdoc(draft, isDark, mode))
      setKey(k => k + 1)
      // After a full reload the iframe starts in the correct mode via its init script,
      // so reset the ref so the mode effect won't send a redundant postMessage next render
      prevModeRef.current = mode
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [draft, debounceMs, isDark])

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (expanded) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  const containerStyle = expanded
    ? { position: 'fixed' as const, inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column' as const }
    : {}

  return (
    <div
      class={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900${expanded ? ' shadow-2xl' : ''}`}
      style={containerStyle}
    >
      <div class="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="shrink-0">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Live Preview</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 ml-2">Updates after you stop typing</span>
          </div>
          {!isControlled && (
            <div class="flex items-center gap-1">
              {(Object.keys(PREVIEW_MODE_LABELS) as PreviewMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInternalMode(m)}
                  class={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${internalMode === m
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {PREVIEW_MODE_LABELS[m]}
                </button>
              ))}
            </div>
          )}
        </div>
        {expandable && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
          >
            {expanded
              ? <><Minimize2Icon size={12} /> Collapse</>
              : <><Maximize2Icon size={12} /> Expand</>}
          </button>
        )}
      </div>
      <iframe
        ref={iframeRef}
        key={key}
        srcdoc={srcdoc}
        class="w-full border-none block"
        style={expanded ? { flex: 1, minHeight: 0 } : { height }}
        sandbox="allow-scripts allow-same-origin"
        title="Banner preview"
      />
    </div>
  )
}
