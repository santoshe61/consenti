import { useEffect, useRef, useState } from 'preact/hooks'
import { Bold, Italic, List, ListOrdered, Link2, Unlink, Code2 } from 'lucide-react'
import { parseContent, serializeContent, jsonToHtml, htmlToJson } from '../utils/contentjson'

interface HtmlEditorProps {
  value: string  // JSON string (new format) or HTML string (legacy), or empty
  onChange: (v: string) => void  // always emits JSON string or ''
  placeholder?: string
  rows?: number
  label?: string
  required?: boolean
  hint?: string
}

export function HtmlEditor({
  value, onChange, placeholder, rows = 4, label, required, hint,
}: HtmlEditorProps) {
  const [mode, setMode] = useState<'rich' | 'code'>('rich')
  const editorRef = useRef<HTMLDivElement>(null)
  // Track the last JSON we emitted, so we don't re-apply our own onChange to the DOM
  const lastEmitted = useRef(value)
  // Code mode has its own local state so the textarea is responsive while typing
  const [codeHtml, setCodeHtml] = useState(() => jsonToHtml(parseContent(value)))

  const toHtml = (v: string) => jsonToHtml(parseContent(v))

  const emit = (html: string) => {
    const json = serializeContent(htmlToJson(html))
    lastEmitted.current = json
    onChange(json)
  }

  // Sync external value changes (e.g. locale switch) into both modes
  useEffect(() => {
    if (value === lastEmitted.current) return
    lastEmitted.current = value
    const html = toHtml(value)
    if (mode === 'rich' && editorRef.current) editorRef.current.innerHTML = html
    setCodeHtml(html)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore contenteditable when entering rich mode.
  // Uses codeHtml directly to avoid the lossy HTML→JSON→HTML round-trip that
  // drops any tags not in htmlToJson's switch (e.g. <table>, <figure>, custom tags).
  useEffect(() => {
    if (mode === 'rich' && editorRef.current) {
      editorRef.current.innerHTML = codeHtml
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchToCode = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      emit(html)
      setCodeHtml(html)
    }
    setMode('code')
  }

  const switchToRich = () => setMode('rich')

  // Use onMouseDown + preventDefault on toolbar buttons to avoid blur/focus loss
  const execCmd = (cmd: string, arg?: string) => {
    editorRef.current?.focus()
    // document.execCommand is deprecated but remains the only zero-dep way to do
    // inline formatting inside contenteditable in all supported browsers.
    document.execCommand(cmd, false, arg ?? '')
    if (editorRef.current) emit(editorRef.current.innerHTML)
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) execCmd('createLink', url)
  }

  const isEmpty = !value || !parseContent(value).length

  return (
    <div>
      {label && (
        <label class="block text-xs font-medium text-gray-600 mb-1">
          {label}{required && <span class="text-red-500 ml-0.5">*</span>}
          {hint && <span class="ml-1.5 text-gray-400 font-normal">{hint}</span>}
        </label>
      )}

      <div class="border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-shadow">
        {/* Tab bar + toolbar */}
        <div class="flex items-center border-b border-gray-200 bg-gray-50 min-h-[33px]">
          <div class="flex shrink-0 border-r border-gray-200">
            <TabBtn active={mode === 'rich'} onClick={switchToRich}>Text</TabBtn>
            <TabBtn active={mode === 'code'} onClick={switchToCode} icon={<Code2 size={11} />}>Code</TabBtn>
          </div>

          {mode === 'rich' && (
            <div class="flex items-center gap-px px-1.5">
              <ToolBtn title="Bold" onAct={() => execCmd('bold')}><Bold size={12} /></ToolBtn>
              <ToolBtn title="Italic" onAct={() => execCmd('italic')}><Italic size={12} /></ToolBtn>
              <Sep />
              <ToolBtn title="Bullet list" onAct={() => execCmd('insertUnorderedList')}><List size={12} /></ToolBtn>
              <ToolBtn title="Numbered list" onAct={() => execCmd('insertOrderedList')}><ListOrdered size={12} /></ToolBtn>
              <Sep />
              <ToolBtn title="Add link" onAct={insertLink}><Link2 size={12} /></ToolBtn>
              <ToolBtn title="Remove link" onAct={() => execCmd('unlink')}><Unlink size={12} /></ToolBtn>
            </div>
          )}
        </div>

        {/* Rich text editor (always mounted; hidden in code mode to preserve content) */}
        <div
          ref={editorRef}
          contentEditable
          class={`px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none prose prose-sm max-w-none ${mode === 'code' ? 'hidden' : ''}`}
          style={{ minHeight: `${rows * 1.625}rem` }}
          onInput={() => editorRef.current && emit(editorRef.current.innerHTML)}
          // Placeholder via CSS (empty:before) — defined in styles.css
          data-placeholder={isEmpty && mode === 'rich' ? (placeholder ?? '') : ''}
        />

        {/* Code / HTML editor */}
        {mode === 'code' && (
          <textarea
            class="w-full px-3 py-2 text-sm font-mono resize-y focus:outline-none bg-white"
            style={{ minHeight: `${rows * 1.625}rem` }}
            value={codeHtml}
            onInput={e => {
              const html = (e.target as HTMLTextAreaElement).value
              setCodeHtml(html)
              emit(html)
            }}
            placeholder={placeholder}
            spellcheck={false}
          />
        )}
      </div>

      {required && isEmpty && (
        <p class="text-xs text-red-500 mt-0.5">This field is required</p>
      )}
    </div>
  )
}

// ── Internal sub-components ────────────────────────────────────────────────────

function TabBtn({ active, onClick, children, icon }: {
  active: boolean; onClick: () => void; children: preact.ComponentChildren; icon?: preact.ComponentChildren
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      class={`flex items-center gap-1 text-xs px-3 py-1.5 transition-colors ${
        active ? 'bg-white text-gray-800 font-medium border-b-2 border-blue-500 -mb-px' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}{children}
    </button>
  )
}

function ToolBtn({ title, onAct, children }: { title: string; onAct: () => void; children: preact.ComponentChildren }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onAct() }}
      class="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div class="w-px h-3.5 bg-gray-200 mx-0.5" />
}
