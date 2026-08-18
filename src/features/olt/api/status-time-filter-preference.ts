import { useAuthStore } from '@/features/auth/store/auth-store'
import {
  DEFAULT_OLT_STATUS_TIME_FILTER,
  OLT_STATUS_TIME_FILTER_VALUES,
  type OltStatusTimeFilter,
} from '@/features/olt/types/status-chart'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

const PREFERENCE_CONTEXT = {
  sistema: 'TAU Nova',
  elemento: 'FTTH - Filtro tiempo',
  opcion: 'grafico-estado-olt',
} as const

export async function fetchOltStatusTimeFilterPreference(
  signal?: AbortSignal,
): Promise<OltStatusTimeFilter> {
  const legajo = useAuthStore.getState().user?.legajo?.trim()
  if (!legajo) return DEFAULT_OLT_STATUS_TIME_FILTER

  try {
    const response = await apiFetch('/api/services/preferences/byUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legajo, ...PREFERENCE_CONTEXT }),
      signal,
    })

    if (!response.ok) return DEFAULT_OLT_STATUS_TIME_FILTER

    const parsed = await parseJsonResponse(response)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_OLT_STATUS_TIME_FILTER

    const raw = parsed as Record<string, unknown>
    const rawTiene =
      raw.tienePreferencia ?? raw.TienePreferencia ?? raw.tiene_preferencia
    const tiene =
      rawTiene === true || rawTiene === 1 || rawTiene === '1' || rawTiene === 'true'
    if (!tiene) return DEFAULT_OLT_STATUS_TIME_FILTER

    const rawValor = raw.valor ?? raw.Valor
    const valor = typeof rawValor === 'string' ? rawValor.trim().toUpperCase() : ''
    if (OLT_STATUS_TIME_FILTER_VALUES.includes(valor as OltStatusTimeFilter)) {
      return valor as OltStatusTimeFilter
    }
    return DEFAULT_OLT_STATUS_TIME_FILTER
  } catch {
    return DEFAULT_OLT_STATUS_TIME_FILTER
  }
}

export async function saveOltStatusTimeFilterPreference(
  timeFilter: OltStatusTimeFilter,
): Promise<void> {
  const legajo = useAuthStore.getState().user?.legajo?.trim()
  if (!legajo) return
  if (!OLT_STATUS_TIME_FILTER_VALUES.includes(timeFilter)) return

  try {
    await apiFetch('/api/services/preferences/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legajo,
        ...PREFERENCE_CONTEXT,
        valor: timeFilter,
      }),
    })
  } catch {
    // silence
  }
}
