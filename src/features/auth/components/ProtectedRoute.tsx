import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'

export function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
