import { parseUserTokenInfo } from '@/features/auth/lib/jwt'
import { hasFtthRole, hasPlantaInternaRole } from '@/features/auth/lib/roles'

export function resolveAuthenticatedHomePath(token: string): string {
  const userInfo = parseUserTokenInfo(token)
  const canAccessFtth = hasFtthRole(userInfo.roles)
  const canAccessPlantaInterna = hasPlantaInternaRole(userInfo.roles)

  if (!canAccessFtth && canAccessPlantaInterna) {
    return '/planta-interna'
  }

  return '/ftth?refreshTree=1'
}
