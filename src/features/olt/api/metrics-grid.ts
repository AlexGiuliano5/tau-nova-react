import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { toOltMetricsGridPageModel } from '@/features/olt/lib/metrics-grid.mapper'
import type {
  BffOltMetricsGridResponse,
  OltMetricsGridPageModel,
  OltMetricsGridPagingPayload,
  OltMetricsGridPreviewActionResult,
} from '@/features/olt/types/metrics-grid'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

const PREVIEW_PAGE_SIZE = 5

export type OltMetricsGridPageSize = 25 | 50 | 100

function emptyModel(pageSize: number): OltMetricsGridPageModel {
  return {
    columnNames: [],
    rows: [],
    pageNumber: 1,
    pageSize,
    totalPages: 0,
    totalRecords: 0,
  }
}

export async function fetchOltMetricsGridPreview(
  oltFromRoute: string,
  signal?: AbortSignal,
): Promise<OltMetricsGridPreviewActionResult> {
  const result = await fetchOltMetricsGridPage(
    oltFromRoute,
    { pageNumber: 1, pageSize: PREVIEW_PAGE_SIZE },
    signal,
  )

  if (!result.ok) {
    return {
      model: emptyModel(PREVIEW_PAGE_SIZE),
      issue: result.error === 'no-data' ? 'no-data' : result.error === 'auth' ? 'error' : result.error,
    }
  }

  if (result.model.rows.length === 0) {
    return { model: result.model, issue: 'no-data' }
  }
  return { model: result.model, issue: 'none' }
}

export async function fetchOltMetricsGridPage(
  oltFromRoute: string,
  input: {
    pageNumber: number
    pageSize: number
    sortColumn?: string | null
    sortOrder?: 'asc' | 'desc' | null
  },
  signal?: AbortSignal,
): Promise<
  | { ok: true; model: OltMetricsGridPageModel }
  | { ok: false; error: 'auth' | 'no-data' | 'error' | 'unexpected' }
> {
  const oltId = normalizeOltRouteParam(oltFromRoute)
  if (!oltId) return { ok: false, error: 'error' }

  const pageSize = input.pageSize > 0 ? Math.floor(input.pageSize) : 25
  const pageNumber = input.pageNumber > 0 ? Math.floor(input.pageNumber) : 1

  const paging: OltMetricsGridPagingPayload = {
    pageNumber,
    pageSize,
    allRecords: false,
    sort: {
      column: input.sortColumn?.trim() || null,
      order: input.sortOrder === 'asc' || input.sortOrder === 'desc' ? input.sortOrder : null,
    },
    filters: {},
  }

  try {
    const response = await apiFetch('/api/services/olt/metricsGrid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oltId, paging }),
      signal,
    })

    if (response.status === 204) return { ok: false, error: 'auth' }
    if (response.status === 206) return { ok: false, error: 'no-data' }
    if (response.status === 202 || !response.ok) return { ok: false, error: 'error' }

    const raw = await parseJsonResponse(response)
    const normalized = normalizeOltMetricsGridPayload(raw)
    if (!normalized) return { ok: false, error: 'unexpected' }

    return { ok: true, model: toOltMetricsGridPageModel(normalized) }
  } catch {
    return { ok: false, error: 'unexpected' }
  }
}

function normalizeOltMetricsGridPayload(raw: unknown): BffOltMetricsGridResponse | null {
  if (!raw || typeof raw !== 'object') return null

  const o = raw as Record<string, unknown>
  const schema = o.dataSchema
  if (!schema || typeof schema !== 'object') return null

  const sch = schema as Record<string, unknown>
  const columnNames = asStringArray(sch.columnNames)
  const columnDataTypes = asStringArrayLoose(sch.columnDataTypes)
  const rows = asRows(o.rows)
  if (!columnNames || !rows) return null

  const pageNumber = asPositiveInt(o.pageNumber) ?? 1
  const pageSize = asPositiveInt(o.pageSize) ?? 25
  const totalRecords = asNonNegativeInt(o.totalRecords) ?? rows.length
  const totalPagesFromApi = asNonNegativeInt(o.totalPages)
  const totalPages =
    totalPagesFromApi !== null
      ? totalPagesFromApi
      : totalRecords === 0
        ? 0
        : Math.max(1, Math.ceil(totalRecords / pageSize))

  const extraDataRaw = o.extraData
  const extraData =
    extraDataRaw && typeof extraDataRaw === 'object'
      ? (extraDataRaw as Record<string, unknown>)
      : null

  return {
    dataSchema: { columnNames, columnDataTypes },
    rows,
    extraData: { coordinates: asCoordinates(extraData?.coordinates) },
    pageNumber,
    pageSize,
    totalPages,
    totalRecords,
  }
}

function asCoordinates(
  value: unknown,
): Array<{ serial: string; lat: string | null; lon: string | null }> {
  if (!Array.isArray(value)) return []
  const out: Array<{ serial: string; lat: string | null; lon: string | null }> = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const source = item as Record<string, unknown>
    const serial = typeof source.serial === 'string' ? source.serial : ''
    if (!serial) continue
    out.push({
      serial,
      lat: typeof source.lat === 'string' ? source.lat : null,
      lon: typeof source.lon === 'string' ? source.lon : null,
    })
  }
  return out
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const out: string[] = []
  for (const item of value) {
    if (typeof item === 'string') out.push(item)
    else if (typeof item === 'number' && Number.isFinite(item)) out.push(String(item))
    else return null
  }
  return out
}

function asStringArrayLoose(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (typeof item === 'string' ? item : String(item ?? '')))
}

function asRows(value: unknown): Array<Array<number | null | string>> | null {
  if (!Array.isArray(value)) return null
  const normalizedRows: Array<Array<number | null | string>> = []
  for (const row of value) {
    if (!Array.isArray(row)) continue
    normalizedRows.push(
      row.map((cell) => {
        if (cell === null) return null
        if (typeof cell === 'string' || typeof cell === 'number') return cell
        return ''
      }),
    )
  }
  return normalizedRows
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value)
  }
  return null
}

function asNonNegativeInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value)
  }
  return null
}
