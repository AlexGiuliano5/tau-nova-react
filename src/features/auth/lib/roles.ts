const FTTH_ROLE_VARIANTS = ['CONSULTA']
const PLANTA_INTERNA_ROLE_VARIANTS = ['Planta Interna']

export function hasFtthRole(roles?: string[]): boolean {
  return hasSomeRole(roles, FTTH_ROLE_VARIANTS)
}

export function hasPlantaInternaRole(roles?: string[]): boolean {
  return hasSomeRole(roles, PLANTA_INTERNA_ROLE_VARIANTS)
}

export function hasAnyAppRole(roles?: string[]): boolean {
  return hasFtthRole(roles) || hasPlantaInternaRole(roles)
}

function hasSomeRole(roles: string[] | undefined, expectedRoles: string[]): boolean {
  if (!roles?.length) {
    return false
  }
  return roles.some((role) => matchesExpectedRole(normalizeRole(role), expectedRoles))
}

function matchesExpectedRole(normalizedRole: string, expectedRoles: string[]): boolean {
  return expectedRoles.map(normalizeRole).includes(normalizedRole)
}

function normalizeRole(role: string): string {
  return role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}
