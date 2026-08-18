import { mapMetricsGridToRowRecords } from '@/features/ont/lib/metrics-grid'
import { buildNeighborMapPointsFromGrid } from '@/features/ont/lib/neighbors-map'
import type { OntNeighborsGridModel } from '@/features/ont/types/ont'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export type NeighborsResult =
  | { ok: true; data: OntNeighborsGridModel }
  | { ok: false; error: 'auth' | 'no-data' | 'unknown' }

export async function fetchOntNeighborsGrid(
  entityId: string,
  signal?: AbortSignal,
): Promise<NeighborsResult> {
  const response = await apiFetch('/api/services/port/metricsGrid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityId }),
    signal,
  })

  if (response.status === 204) return { ok: false, error: 'auth' }
  if (response.status === 206) return { ok: false, error: 'no-data' }
  if (response.status === 202 || !response.ok) return { ok: false, error: 'unknown' }

  const data = await parseJsonResponse(response)
  if (!data || typeof data !== 'object') return { ok: false, error: 'unknown' }

  const source = data as Record<string, unknown>
  const schema = source.dataSchema
  if (!schema || typeof schema !== 'object') return { ok: false, error: 'unknown' }

  const columnNames = (schema as { columnNames?: unknown }).columnNames
  if (!Array.isArray(columnNames) || !columnNames.every((c) => typeof c === 'string')) {
    return { ok: false, error: 'unknown' }
  }

  const rows = source.rows
  if (!Array.isArray(rows)) return { ok: false, error: 'unknown' }

  const normalizedRows = rows.filter(Array.isArray) as Array<Array<number | string | null>>
  const coordinates = parseCoordinates(source.extraData)
  const rowRecords = mapMetricsGridToRowRecords(columnNames, normalizedRows)
  const mapPoints = buildNeighborMapPointsFromGrid(columnNames, rowRecords, coordinates)
  const validCoordinates = mapPoints.filter(
    (point) => Number.isFinite(Number.parseFloat(point.lat)) && Number.isFinite(Number.parseFloat(point.lng)),
  ).length

  return {
    ok: true,
    data: {
      columnNames,
      rows: rowRecords,
      mapPoints,
      mapStats: {
        totalCoordinates: coordinates.length,
        validCoordinates,
      },
    },
  }
}

function parseCoordinates(
  extraData: unknown,
): Array<{ serial: string; lat: string | null; lon: string | null }> {
  if (!extraData || typeof extraData !== 'object') return []
  const coords = (extraData as Record<string, unknown>).coordinates
  if (!Array.isArray(coords)) return []

  return coords
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const coord = item as Record<string, unknown>
      return {
        serial: typeof coord.serial === 'string' ? coord.serial : '',
        lat: typeof coord.lat === 'string' ? coord.lat : null,
        lon: typeof coord.lon === 'string' ? coord.lon : null,
      }
    })
}
