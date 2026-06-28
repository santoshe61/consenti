interface OverlayOpacityInputProps {
  value: number
  onChange: (n: number) => void
}

export function OverlayOpacityInput({ value, onChange }: OverlayOpacityInputProps) {
  return (
    <div class="flex items-center gap-3">
      <input
        type="range"
        min="0"
        max="100"
        class="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 accent-blue-600 cursor-pointer"
        value={value}
        onInput={e => onChange(parseInt((e.target as HTMLInputElement).value))}
      />
      <span class="text-sm font-mono text-gray-700 w-10 text-right shrink-0">{value}%</span>
    </div>
  )
}
