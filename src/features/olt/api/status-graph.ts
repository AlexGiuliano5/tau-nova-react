import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { buildOltStatusChartRows } from '@/features/olt/lib/status-chart.mapper'
import {
  DEFAULT_OLT_STATUS_TIME_FILTER,
  OLT_STATUS_TIME_FILTER_VALUES,
  type BffChartDataValue,
  type BffHistoricStatusOLTResponse,
  type OltStatusGraphResult,
  type OltStatusTimeFilter,
} from '@/features/olt/types/status-chart'
import { apiFetch } from '@/shared/api/http'

export async function fetchOltStatusGraph(
  oltFromRoute: string,
  timeFilterFromRoute?: string,
  signal?: AbortSignal,
  options?: { slot?: string | number; port?: string | number },
): Promise<OltStatusGraphResult> {
  const olt = normalizeOltRouteParam(oltFromRoute)
  if (!olt) return { rows: [], issue: 'no-data' }
  const timeFilter = normalizeTimeFilter(timeFilterFromRoute)
  const slot =
    options?.slot === undefined || options.slot === null ? '' : String(options.slot).trim()
  const port =
    options?.port === undefined || options.port === null ? '' : String(options.port).trim()

  try {
    const response = await apiFetch('/api/services/graph/status/opp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        olt,
        slot,
        port,
        timeFilter,
      }),
      signal,
    })

    const rawText = await response.text()

    if (response.status === 204) return { rows: [], issue: 'error' }
    if (response.status === 206) return { rows: [], issue: 'no-data' }
    if (response.status === 202 || !response.ok) return { rows: [], issue: 'error' }

    let raw: unknown = null
    if (rawText) {
      try {
        raw = JSON.parse(rawText) as unknown
      } catch {
        raw = null
      }
    }

    const normalized = normalizeHistoricStatusOltPayload(raw)
    if (!normalized) return { rows: [], issue: 'unexpected' }

    const rows = buildOltStatusChartRows(normalized)
    if (rows.length === 0) return { rows: [], issue: 'no-data' }

    return { rows, issue: 'none' }
  } catch {
    return { rows: [], issue: 'unexpected' }
  }
}

function normalizeTimeFilter(value: string | undefined): OltStatusTimeFilter {
  const normalized = value?.trim().toUpperCase()
  if (normalized && OLT_STATUS_TIME_FILTER_VALUES.includes(normalized as OltStatusTimeFilter)) {
    return normalized as OltStatusTimeFilter
  }
  return DEFAULT_OLT_STATUS_TIME_FILTER
}

function normalizeHistoricStatusOltPayload(raw: unknown): BffHistoricStatusOLTResponse | null {
  if (!raw || typeof raw !== 'object') return null

  const o = raw as Record<string, unknown>
  const timesRaw = o.chartDataTimes ?? o.ChartDataTimes
  const valuesRaw = o.chartDataValues ?? o.ChartDataValues
  if (!Array.isArray(timesRaw) || !Array.isArray(valuesRaw)) return null

  return {
    olt: typeof o.olt === 'string' ? o.olt : '',
    slot: typeof o.slot === 'string' ? o.slot : '',
    port: typeof o.port === 'string' ? o.port : '',
    chartDataTimes: timesRaw.map((t) => (typeof t === 'string' ? t : String(t ?? ''))),
    chartDataValues: valuesRaw.map(normalizeChartDataValueRow),
  }
}

function normalizeChartDataValueRow(row: unknown): BffChartDataValue {
  const empty: BffChartDataValue = {
    Good: '',
    Total: '',
    'Switched Off': '',
    Interrupted: '',
    'Reduced Robustness': '',
    Degraded: '',
  }
  if (!row || typeof row !== 'object') return empty

  const r = row as Record<string, unknown>
  const pick = (canonical: keyof BffChartDataValue, ...aliases: string[]): string => {
    const direct = r[canonical]
    if (typeof direct === 'string') return direct
    if (typeof direct === 'number' && Number.isFinite(direct)) return String(direct)
    for (const a of aliases) {
      const v = r[a]
      if (typeof v === 'string') return v
      if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    }
    return ''
  }

  return {
    Good: pick('Good', 'good'),
    Total: pick('Total', 'total'),
    'Switched Off': pick('Switched Off', 'Switched_Off', 'switched_off', 'SwitchedOff'),
    Interrupted: pick('Interrupted', 'interrupted'),
    'Reduced Robustness': pick(
      'Reduced Robustness',
      'Reduced_Robustness',
      'reduced_robustness',
      'ReducedRobustness',
    ),
    Degraded: pick('Degraded', 'degraded'),
  }
}
