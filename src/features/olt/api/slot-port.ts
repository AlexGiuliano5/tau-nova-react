import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { buildOltSlotPortGridModel } from '@/features/olt/lib/slot-port-grid.mapper'
import type {
  BffSlotPortMatrix,
  BffSlotPortMatrixCell,
  OltSlotPortGridActionResult,
} from '@/features/olt/types/slot-port'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export async function fetchOltSlotPortGrid(
  oltFromRoute: string,
  signal?: AbortSignal,
): Promise<OltSlotPortGridActionResult> {
  const olt = normalizeOltRouteParam(oltFromRoute)
  if (!olt) return { model: null, issue: 'error' }

  try {
    const response = await apiFetch('/api/services/port/slotportarray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ olt }),
      signal,
    })

    if (response.status === 204) return { model: null, issue: 'error' }
    if (response.status === 206) return { model: null, issue: 'no-data' }
    if (response.status === 202 || !response.ok) return { model: null, issue: 'error' }

    const raw = await parseJsonResponse(response)
    const matrix = parseIndexMatrix(raw)
    if (!matrix) return { model: null, issue: 'unexpected' }

    const model = buildOltSlotPortGridModel(olt, matrix)
    if (!model.rows.length) return { model: null, issue: 'no-data' }

    return { model, issue: 'none' }
  } catch {
    return { model: null, issue: 'unexpected' }
  }
}

function parseIndexMatrix(raw: unknown): BffSlotPortMatrix | null {
  const rows = extractRowsFromPayload(raw)
  if (!rows) return null

  const normalized: BffSlotPortMatrix = []
  for (const row of rows) {
    if (!Array.isArray(row)) return null
    normalized.push(row.map(normalizeMatrixCell))
  }
  return normalized
}

function extractRowsFromPayload(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) {
    if (raw.length === 0) return []
    if (Array.isArray(raw[0])) return raw
    return null
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const fromIndex = o.index ?? o.Index
    if (Array.isArray(fromIndex) && (fromIndex.length === 0 || Array.isArray(fromIndex[0]))) {
      return fromIndex as unknown[]
    }
  }
  return null
}

function normalizeMatrixCell(value: unknown): BffSlotPortMatrixCell | null {
  if (value === null || value === undefined || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  const severity = typeof o.severity === 'string' ? o.severity : ''
  const label = stringifyIndexField(o.index)
  if (!label) return null

  return {
    severity,
    index: label,
    ...(typeof o.up === 'string' ? { up: o.up } : {}),
    ...(typeof o.down === 'string' ? { down: o.down } : {}),
    ...(typeof o.good === 'string' ? { good: o.good } : {}),
    ...(typeof o.reduced_robustness === 'string'
      ? { reduced_robustness: o.reduced_robustness }
      : {}),
    ...(typeof o.switched_off === 'string' ? { switched_off: o.switched_off } : {}),
    ...(typeof o.degraded === 'string' ? { degraded: o.degraded } : {}),
    ...(typeof o.interrupted === 'string' ? { interrupted: o.interrupted } : {}),
  }
}

function stringifyIndexField(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}
