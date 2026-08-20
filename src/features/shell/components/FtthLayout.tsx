import { Navigate, Outlet } from 'react-router-dom'

import { hasFtthRole, hasPlantaInternaRole } from '@/features/auth/lib/roles'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useFtthTreeBootstrap } from '@/features/ftth/hooks/use-ftth-tree-bootstrap'
import { FtthTopBar } from '@/features/shell/components/FtthTopBar'
import {
  FtthMobileBottomNavSpacer,
  MobileBottomNav,
} from '@/features/shell/components/MobileBottomNav'
import { Sidebar } from '@/features/shell/components/Sidebar'

export function FtthLayout() {
  const user = useAuthStore((s) => s.user)
  const canAccessFtth = hasFtthRole(user?.roles)
  const canAccessPlantaInterna = hasPlantaInternaRole(user?.roles)
  useFtthTreeBootstrap()

  if (!canAccessFtth && canAccessPlantaInterna) {
    return <Navigate to="/planta-interna" replace />
  }

  return (
    <main className="h-dvh overflow-hidden bg-(--background) text-(--text-primary) transition-colors">
      <FtthTopBar />
      <div className="ftth-shell-scroll mt-[70px] flex h-[calc(100dvh-70px)] min-h-0 flex-col overflow-x-hidden overflow-y-auto md:mt-[64px] md:h-[calc(100dvh-64px)]">
        <Sidebar userInfo={user ?? undefined} />
        <div className="flex w-full flex-1 flex-col">
          <Outlet />
          <FtthMobileBottomNavSpacer />
        </div>
      </div>
      <MobileBottomNav />
    </main>
  )
}
