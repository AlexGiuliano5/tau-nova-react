import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'

/** Si ya hay sesión, no mostrar login. */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated() && token) {
    return <Navigate to="/" replace />
  }

  return children
}
