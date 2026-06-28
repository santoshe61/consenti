import type { ComponentChildren } from 'preact'
import { useAuth } from '../context/auth'

interface Props {
  perm: string
  children: ComponentChildren
  fallback?: ComponentChildren
}

export function PermissionGate({ perm, children, fallback = null }: Props) {
  const { user } = useAuth()
  if (!user?.permissions.includes(perm)) return <>{fallback}</>
  return <>{children}</>
}
