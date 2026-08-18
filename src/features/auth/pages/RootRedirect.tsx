import { Navigate } from 'react-router-dom'

import { resolveAuthenticatedHomePath } from '@/features/auth/lib/post-login'
import { useAuthStore } from '@/features/auth/store/auth-store'

/** `/` → home por roles, o login si no hay sesión. */
export function RootRedirect() {
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated() || !token) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={resolveAuthenticatedHomePath(token)} replace />
}
