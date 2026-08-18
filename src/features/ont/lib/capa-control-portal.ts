export type CapaControlPortalTone = 'green' | 'red' | 'neutral'

export interface CapaControlPortalPresentation {
  tone: CapaControlPortalTone
  displayCode: string
  description: string
}

export function resolveCapaControlPortalPresentation(
  portal: string | null | undefined,
  options?: { allOtherFieldsEmpty?: boolean },
): CapaControlPortalPresentation {
  const raw = portal?.trim() ?? ''
  const normalized = raw.toLowerCase() === 'null' ? '' : raw

  if (!normalized) {
    if (options?.allOtherFieldsEmpty) {
      return { tone: 'neutral', displayCode: 'Sin Datos', description: 'Sin Datos' }
    }
    return { tone: 'green', displayCode: '—', description: 'Navegación OK' }
  }

  if (normalized === 'PC-107') {
    return { tone: 'red', displayCode: normalized, description: 'Suspendido' }
  }

  if (normalized === 'PC-001' || normalized === 'PC-002') {
    return {
      tone: 'red',
      displayCode: normalized,
      description: 'Rechazo (Cliente inexistente)',
    }
  }

  return { tone: 'neutral', displayCode: normalized, description: normalized }
}
