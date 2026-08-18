export interface UserTokenInfo {
  fullname?: string
  legajo?: string
  roles?: string[]
}

export function parseUserTokenInfo(token: string): UserTokenInfo {
  const payload = parseJwtPayload(token)
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const data = payload as Record<string, unknown>
  const fullname = asString(data.fullname ?? data.nombre_usuario ?? data.name)
  const legajo = asString(data.legajo ?? data.user ?? data.username)
  const roles = asRolesArray(data.roles)

  return { fullname, legajo, roles }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload || typeof payload !== 'object') {
    return true
  }

  const exp = (payload as Record<string, unknown>).exp
  if (typeof exp !== 'number') {
    return true
  }

  return exp <= Math.floor(Date.now() / 1000)
}

function parseJwtPayload(token: string): unknown {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as unknown
  } catch {
    return null
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function asRolesArray(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    const role = value.trim()
    return role.length > 0 ? [role] : undefined
  }

  if (!Array.isArray(value)) {
    return undefined
  }

  const parsed = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return parsed.length > 0 ? parsed : undefined
}
