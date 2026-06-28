import { useEffect, useRef, useState } from 'preact/hooks'
import { profilesApi } from '../api/profiles'

interface Props {
  draft: unknown
}

export function BannerPreview({ draft }: Props) {
  const [src, setSrc] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSrc(profilesApi.previewUrl(draft))
    }, 500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [draft])

  return (
    <div class="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div class="px-3 py-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-500 font-medium">
        Live Preview
      </div>
      {src ? (
        <iframe
          src={src}
          class="flex-1 w-full border-none"
          sandbox="allow-scripts allow-same-origin"
          title="Banner preview"
        />
      ) : (
        <div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Edit profile to see preview
        </div>
      )}
    </div>
  )
}
