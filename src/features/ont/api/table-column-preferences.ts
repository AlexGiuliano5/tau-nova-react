import { useAuthStore } from '@/features/auth/store/auth-store'
import {
  resolveViewportColumnLayout,
  type FtthTableColumnPreferences,
} from '@/features/ont/lib/table-column-preferences'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export const FTTH_TABLE_COLUMN_PREFERENCES_ELEMENT = 'Tablas FTTH'
export const FTTH_TABLE_COLUMN_PREFERENCES_SISTEMA = 'TAU Nova'

function hasPreferenceFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function parsePreferencesPayload(
  raw: unknown,
  columnKeys: string[],
): FtthTableColumnPreferences | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (record.version !== 1) return null
  if (!record.desktop || !record.mobile) return null
  if (typeof record.desktop !== 'object' || typeof record.mobile !== 'object') return null

  return {
    version: 1,
    desktop: resolveViewportColumnLayout(
      record.desktop as FtthTableColumnPreferences['desktop'],
      columnKeys,
    ),
    mobile: resolveViewportColumnLayout(
      record.mobile as FtthTableColumnPreferences['mobile'],
      columnKeys,
    ),
  }
}

export async function loadFtthTableColumnPreferences(
  tableId: string,
  columnKeys: string[],
  signal?: AbortSignal,
): Promise<FtthTableColumnPreferences | null> {
  const legajo = useAuthStore.getState().user?.legajo?.trim()
  if (!legajo || columnKeys.length === 0) return null

  try {
    const response = await apiFetch('/api/services/preferences/byUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legajo,
        sistema: FTTH_TABLE_COLUMN_PREFERENCES_SISTEMA,
        elemento: FTTH_TABLE_COLUMN_PREFERENCES_ELEMENT,
        opcion: tableId,
      }),
      signal,
    })
    if (!response.ok) return null

    const parsed = await parseJsonResponse(response)
    if (!parsed || typeof parsed !== 'object') return null

    const raw = parsed as Record<string, unknown>
    if (!hasPreferenceFlag(raw.tienePreferencia ?? raw.TienePreferencia)) return null

    const rawValor = raw.valor ?? raw.Valor
    const valor =
      typeof rawValor === 'string'
        ? rawValor
        : rawValor && typeof rawValor === 'object'
          ? JSON.stringify(rawValor)
          : ''
    if (!valor) return null

    return parsePreferencesPayload(JSON.parse(valor) as unknown, columnKeys)
  } catch {
    return null
  }
}

export async function saveFtthTableColumnPreferences(
  tableId: string,
  preferences: FtthTableColumnPreferences,
): Promise<{ ok: boolean; error?: 'auth' | 'unknown' }> {
  const legajo = useAuthStore.getState().user?.legajo?.trim()
  if (!legajo) return { ok: false, error: 'auth' }

  try {
    const response = await apiFetch('/api/services/preferences/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legajo,
        sistema: FTTH_TABLE_COLUMN_PREFERENCES_SISTEMA,
        elemento: FTTH_TABLE_COLUMN_PREFERENCES_ELEMENT,
        opcion: tableId,
        valor: JSON.stringify(preferences),
      }),
    })

    if (response.status === 204 || response.status === 401 || response.status === 403) {
      return { ok: false, error: 'auth' }
    }
    if (!response.ok) return { ok: false, error: 'unknown' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}
