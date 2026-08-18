import { fetchTreeFtthByUser } from '@/features/ftth/api/tree'
import { isValidTreeData } from '@/features/ftth/lib/tree-cache'
import { fetchTreeFtthFull } from '@/features/tree-preferences/api/tree-full'
import { buildFtthTreePreferencesViewModel } from '@/features/tree-preferences/lib/view-model'
import type {
  FtthHiddenRegion,
  FtthTreePreferencesLoadResult,
  SaveFtthTreePreferencesResult,
} from '@/features/tree-preferences/types'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export async function loadFtthTreePreferences(
  legajo: string,
  signal?: AbortSignal,
): Promise<FtthTreePreferencesLoadResult> {
  const normalizedLegajo = legajo.trim()
  if (!normalizedLegajo) return { ok: false, error: 'auth' }

  const [regionsResult, treeResult] = await Promise.all([
    fetchHiddenRegions(normalizedLegajo, signal),
    fetchTreeFtthFull(signal),
  ])

  if (!regionsResult.ok) {
    return { ok: false, error: regionsResult.error === 'auth' ? 'auth' : 'regions' }
  }

  if (!treeResult.ok) {
    if (treeResult.error === 'auth') return { ok: false, error: 'auth' }
    return { ok: false, error: treeResult.error === 'empty' ? 'tree' : 'unknown' }
  }

  const viewModel = buildFtthTreePreferencesViewModel(
    treeResult.data.tree,
    regionsResult.data,
  )

  return { ok: true, ...viewModel }
}

export async function saveFtthTreePreferences(
  legajo: string,
  opciones: FtthHiddenRegion[],
): Promise<SaveFtthTreePreferencesResult> {
  const normalizedLegajo = legajo.trim()
  if (!normalizedLegajo) return { ok: false, error: 'auth' }

  if (!Array.isArray(opciones)) {
    return { ok: false, error: 'validation' }
  }

  try {
    const response = await apiFetch('/api/services/preferences/ftth/regiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legajo: normalizedLegajo,
        opciones,
      }),
    })

    if (response.status === 204) return { ok: false, error: 'auth' }
    if (!response.ok) return { ok: false, error: 'save' }

    await parseJsonResponse(response).catch(() => null)

    const treeData = await fetchTreeFtthByUser()
    return {
      ok: true,
      treeData: isValidTreeData(treeData) ? treeData : null,
    }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

async function fetchHiddenRegions(
  legajo: string,
  signal?: AbortSignal,
): Promise<
  | { ok: true; data: FtthHiddenRegion[] }
  | { ok: false; error: 'auth' | 'unknown' }
> {
  try {
    const response = await apiFetch(
      `/api/services/preferences/ftth/regiones/${encodeURIComponent(legajo)}`,
      { method: 'GET', signal },
    )

    if (response.status === 204) return { ok: false, error: 'auth' }
    if (response.status === 202 || !response.ok) return { ok: false, error: 'unknown' }

    const raw = await parseJsonResponse(response)
    return { ok: true, data: normalizeHiddenRegions(raw) }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

function normalizeHiddenRegions(raw: unknown): FtthHiddenRegion[] {
  if (!Array.isArray(raw)) return []

  const regions: FtthHiddenRegion[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const source = item as Record<string, unknown>
    const pais = readStringField(source, 'pais', 'Pais')
    const region = readStringField(source, 'region', 'Region')
    const subregion = readStringField(source, 'subregion', 'Subregion', 'subRegion')
    if (!pais && !region && !subregion) continue
    regions.push({ pais, region, subregion })
  }
  return regions
}

function readStringField(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}
