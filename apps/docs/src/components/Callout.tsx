interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'danger'
  children: React.ReactNode
}

const styles = {
  info: 'bg-blue-50 border-blue-400 text-blue-900',
  warning: 'bg-amber-50 border-amber-400 text-amber-900',
  tip: 'bg-green-50 border-green-400 text-green-900',
  danger: 'bg-red-50 border-red-400 text-red-900',
}

const icons = {
  info: 'ℹ️',
  warning: '⚠️',
  tip: '💡',
  danger: '🚨',
}

export function Callout({ type = 'info', children }: CalloutProps) {
  return (
    <div className={`my-4 border-l-4 px-4 py-3 rounded-r-lg text-sm leading-relaxed ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  )
}
