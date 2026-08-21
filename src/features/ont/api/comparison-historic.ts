import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { normalizeOntStatusKey, type OntStatusKey } from '@/features/ont/lib/ont-status-labels'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

/** Tabs de comparativa / gráficos históricos (misma lista que tau-nova). */
export type ComparisonGraphId =
  | 'estado'
  | 'trafico-us'
  | 'trafico-ds'
  | 'ont-rx'
  | 'ont-tx'
  | 'ont-voltage'
  | 'ont-temp-laser'
  | 'olt-rx'
  | 'olt-tx'
  | 'ont-bip-us'
  | 'ont-bip-ds'

export type HistoricalByOntMetricName =
  | 'Ont Rx Pwr'
  | 'Ont Tx Pwr'
  | 'Ont Volt'
  | 'Ont Temp'
  | 'Olt Rx Pwr'
  | 'Olt Tx Pwr'
  | 'Ont Bip US'
  | 'Ont Bip DS'

/** @deprecated usar ComparisonGraphId */
export type ComparisonMetricId = HistoricalByOntMetricName

export type HistoricChartDays =
  | 'PT1H'
  | 'PT2H'
  | 'PT3H'
  | 'PT6H'
  | 'PT12H'
  | 'P1D'
  | 'P3D'
  | 'P5D'
  | 'P7D'
export type HistoricStatusTimeFilter = '2H' | '3H' | '6H' | '3D' | '5D' | '7D'

export const DEFAULT_HISTORIC_CHART_DAYS: HistoricChartDays = 'PT12H'
export const DEFAULT_HISTORIC_STATUS_TIME_FILTER: HistoricStatusTimeFilter = '2H'

export const HISTORIC_CHART_DAY_OPTIONS: ReadonlyArray<{ value: HistoricChartDays; label: string }> =
  [
    { value: 'PT1H', label: '1H' },
    { value: 'PT6H', label: '6H' },
    { value: 'PT12H', label: '12H' },
    { value: 'P1D', label: '1D' },
    { value: 'P3D', label: '3D' },
    { value: 'P7D', label: '7D' },
  ]

export const HISTORIC_STATUS_TIME_FILTER_OPTIONS: ReadonlyArray<{
  value: HistoricStatusTimeFilter
  label: string
}> = [
  { value: '2H', label: '2H' },
  { value: '3H', label: '3H' },
  { value: '6H', label: '6H' },
  { value: '3D', label: '3D' },
  { value: '5D', label: '5D' },
  { value: '7D', label: '7D' },
]

/** Convierte el filtro de UI (2H…7D) al `days` ISO que espera `historicalbyont`. */
export function historicPeriodToIsoDays(filter: HistoricStatusTimeFilter): HistoricChartDays {
  switch (filter) {
    case '2H':
      return 'PT2H'
    case '3H':
      return 'PT3H'
    case '6H':
      return 'PT6H'
    case '3D':
      return 'P3D'
    case '5D':
      return 'P5D'
    case '7D':
      return 'P7D'
  }
}

export const GRAPH_ID_TO_HISTORICAL_METRIC: Partial<
  Record<ComparisonGraphId, HistoricalByOntMetricName>
> = {
  'ont-rx': 'Ont Rx Pwr',
  'ont-tx': 'Ont Tx Pwr',
  'ont-voltage': 'Ont Volt',
  'ont-temp-laser': 'Ont Temp',
  'olt-rx': 'Olt Rx Pwr',
  'olt-tx': 'Olt Tx Pwr',
  'ont-bip-us': 'Ont Bip US',
  'ont-bip-ds': 'Ont Bip DS',
}

export function isPowerGraph(
  id: ComparisonGraphId,
): id is 'ont-rx' | 'ont-tx' | 'olt-rx' | 'olt-tx' {
  return id === 'ont-rx' || id === 'ont-tx' || id === 'olt-rx' || id === 'olt-tx'
}

export function isMetricGraph(id: ComparisonGraphId): boolean {
  return id in GRAPH_ID_TO_HISTORICAL_METRIC
}

export function isStatusOrTrafficGraph(id: ComparisonGraphId): boolean {
  return id === 'estado' || id === 'trafico-us' || id === 'trafico-ds'
}

export interface ComparisonSeriesPoint {
  time: string
  label: string
  value: number | null
  statusLabel?: string
}

export interface ComparisonOntSeries {
  serial: string
  status: 'ok' | 'no-data' | 'error'
  points: ComparisonSeriesPoint[]
  unit?: string
}

const CHART_STATUS_ORDER = [
  'GOOD',
  'DEGRADED',
  'INTERRUPTED',
  'SWITCHED_OFF',
] as const satisfies readonly OntStatusKey[]

const CHART_STATUS_MAX = CHART_STATUS_ORDER.length - 1

const STATUS_TO_VALUE = new Map<string, number>(
  CHART_STATUS_ORDER.map((status, index) => [status, CHART_STATUS_MAX - index]),
)

export const HISTORIC_STATUS_Y_TICKS = CHART_STATUS_ORDER.map(
  (_, index) => CHART_STATUS_MAX - index,
)

export function formatHistoricStatusTick(value: number): string {
  const status = CHART_STATUS_ORDER.find(
    (_, index) => CHART_STATUS_MAX - index === Math.round(value),
  )
  if (!status) return ''
  switch (status) {
    case 'GOOD':
      return 'Disponible'
    case 'DEGRADED':
      return 'Degradado'
    case 'INTERRUPTED':
      return 'Interrumpido'
    case 'SWITCHED_OFF':
      return 'Apagado'
  }
}

export async function fetchOntComparisonSeries(
  input: {
    ontSerial: string
    oltId: string
    graphId: ComparisonGraphId
    days?: HistoricChartDays
    timeFilter?: HistoricStatusTimeFilter
  },
  signal?: AbortSignal,
): Promise<ComparisonOntSeries> {
  if (input.graphId === 'estado') {
    return fetchHistoricStatusSeries(input, signal)
  }
  if (input.graphId === 'trafico-us' || input.graphId === 'trafico-ds') {
    return fetchHistoricTrafficSeries(
      {
        ontSerial: input.ontSerial,
        oltId: input.oltId,
        graphId: input.graphId,
        timeFilter: input.timeFilter,
      },
      signal,
    )
  }
  const metric = GRAPH_ID_TO_HISTORICAL_METRIC[input.graphId]
  if (!metric) {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }
  return fetchHistoricalByOntSeries(
    {
      ontSerial: input.ontSerial,
      oltId: input.oltId,
      metric,
      days: input.days,
    },
    signal,
  )
}

/** Compat: métricas potencia vía historicalbyont. */
export async function fetchOntHistoricalMetricSeries(
  input: {
    ontSerial: string
    oltId: string
    metric: HistoricalByOntMetricName
    days?: string
  },
  signal?: AbortSignal,
): Promise<ComparisonOntSeries> {
  return fetchHistoricalByOntSeries(input, signal)
}

async function fetchHistoricalByOntSeries(
  input: {
    ontSerial: string
    oltId: string
    metric: HistoricalByOntMetricName
    days?: string
  },
  signal?: AbortSignal,
): Promise<ComparisonOntSeries> {
  const ontId = normalizeOntId(input.ontSerial) || input.ontSerial.trim()
  const oltId = input.oltId.trim()
  if (!ontId || !oltId) {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }

  try {
    const response = await apiFetch('/api/services/ont/historicalbyont', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ontId,
        oltId,
        metric: input.metric,
        days: input.days ?? DEFAULT_HISTORIC_CHART_DAYS,
      }),
      signal,
    })

    if (response.status === 206) {
      return { serial: input.ontSerial, status: 'no-data', points: [] }
    }
    if (!response.ok) {
      return { serial: input.ontSerial, status: 'error', points: [] }
    }

    const raw = await parseJsonResponse(response)
    if (!raw || typeof raw !== 'object') {
      return { serial: input.ontSerial, status: 'error', points: [] }
    }

    const source = raw as Record<string, unknown>
    const timesRaw = source.chartDataTimes ?? source.ChartDataTimes
    const valuesRaw = source.chartDataValues ?? source.ChartDataValues
    const unit =
      typeof source.chartDataUnit === 'string'
        ? source.chartDataUnit
        : typeof source.ChartDataUnit === 'string'
          ? source.ChartDataUnit
          : undefined

    if (!Array.isArray(timesRaw) || !valuesRaw || typeof valuesRaw !== 'object') {
      return { serial: input.ontSerial, status: 'no-data', points: [] }
    }

    const values = pickSeriesValues(valuesRaw as Record<string, unknown>, ontId)
    const points: ComparisonSeriesPoint[] = []
    for (let index = 0; index < timesRaw.length; index += 1) {
      const time = String(timesRaw[index] ?? '')
      points.push({
        time,
        label: formatTimeLabel(time),
        value: parseNumericPoint(values[index]),
      })
    }

    return {
      serial: input.ontSerial,
      status: points.some((point) => point.value !== null) ? 'ok' : 'no-data',
      points,
      unit,
    }
  } catch {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }
}

async function fetchHistoricStatusSeries(
  input: {
    ontSerial: string
    oltId: string
    timeFilter?: HistoricStatusTimeFilter
  },
  signal?: AbortSignal,
): Promise<ComparisonOntSeries> {
  const ontId = normalizeOntId(input.ontSerial) || input.ontSerial.trim()
  const oltId = input.oltId.trim()
  if (!ontId || !oltId) {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }

  try {
    const response = await apiFetch('/api/services/ont/historicstatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ontId,
        oltId,
        timeFilter: input.timeFilter ?? DEFAULT_HISTORIC_STATUS_TIME_FILTER,
      }),
      signal,
    })

    if (response.status === 206) {
      return { serial: input.ontSerial, status: 'no-data', points: [] }
    }
    if (!response.ok) {
      return { serial: input.ontSerial, status: 'error', points: [] }
    }

    const raw = await parseJsonResponse(response)
    if (!raw || typeof raw !== 'object') {
      return { serial: input.ontSerial, status: 'error', points: [] }
    }

    const source = pickNestedSource(raw as Record<string, unknown>)
    const timesRaw = source.chartDataTimes ?? source.ChartDataTimes
    const valuesRaw = source.chartDataValues ?? source.ChartDataValues
    const statusListRaw = source.statusList ?? source.StatusList

    const points: ComparisonSeriesPoint[] = []

    if (Array.isArray(timesRaw) && valuesRaw && typeof valuesRaw === 'object') {
      const values = pickSeriesValues(valuesRaw as Record<string, unknown>, ontId)
      const len = Math.min(timesRaw.length, values.length)
      for (let index = 0; index < len; index += 1) {
        const time = String(timesRaw[index] ?? '')
        const statusKey = normalizeChartStatus(String(values[index] ?? ''))
        points.push({
          time: `${index}:${time}`,
          label: formatTimeLabel(time) || time,
          value: STATUS_TO_VALUE.get(statusKey) ?? null,
          statusLabel: statusKey,
        })
      }
    } else if (Array.isArray(statusListRaw)) {
      for (let index = 0; index < statusListRaw.length; index += 1) {
        const item = statusListRaw[index]
        if (!item || typeof item !== 'object') continue
        const row = item as Record<string, unknown>
        const time = String(row.time ?? '')
        const statusKey = normalizeChartStatus(String(row.status ?? ''))
        points.push({
          time: `${index}:${time}`,
          label: formatTimeLabel(time) || time,
          value: STATUS_TO_VALUE.get(statusKey) ?? null,
          statusLabel: statusKey,
        })
      }
    } else {
      return { serial: input.ontSerial, status: 'no-data', points: [] }
    }

    return {
      serial: input.ontSerial,
      status: points.some((point) => point.value !== null) ? 'ok' : 'no-data',
      points,
    }
  } catch {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }
}

async function fetchHistoricTrafficSeries(
  input: {
    ontSerial: string
    oltId: string
    graphId: 'trafico-us' | 'trafico-ds'
    timeFilter?: HistoricStatusTimeFilter
  },
  signal?: AbortSignal,
): Promise<ComparisonOntSeries> {
  const ontId = normalizeOntId(input.ontSerial) || input.ontSerial.trim()
  const oltId = input.oltId.trim()
  if (!ontId || !oltId) {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }

  const metric = input.graphId === 'trafico-us' ? 'ontUpBytes' : 'ontDownBytes'

  try {
    const response = await apiFetch('/api/services/ont/historictraffic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ontId,
        oltId,
        metric,
        timeFilter: input.timeFilter ?? DEFAULT_HISTORIC_STATUS_TIME_FILTER,
      }),
      signal,
    })

    if (response.status === 206) {
      return { serial: input.ontSerial, status: 'no-data', points: [] }
    }
    if (!response.ok) {
      return { serial: input.ontSerial, status: 'error', points: [] }
    }

    const raw = await parseJsonResponse(response)
    if (!raw || typeof raw !== 'object') {
      return { serial: input.ontSerial, status: 'error', points: [] }
    }

    const source = raw as Record<string, unknown>
    const timesRaw = source.chartDataTimes ?? source.ChartDataTimes
    const valuesRaw = source.chartDataValues ?? source.ChartDataValues
    const unit =
      typeof source.chartDataUnit === 'string'
        ? source.chartDataUnit
        : typeof source.ChartDataUnit === 'string'
          ? source.ChartDataUnit
          : undefined

    if (!Array.isArray(timesRaw) || !valuesRaw || typeof valuesRaw !== 'object') {
      return { serial: input.ontSerial, status: 'no-data', points: [] }
    }

    const values = pickSeriesValues(valuesRaw as Record<string, unknown>, ontId)
    const points: ComparisonSeriesPoint[] = []
    for (let index = 0; index < timesRaw.length; index += 1) {
      const time = String(timesRaw[index] ?? '')
      const value = parseNumericPoint(values[index])
      if (value === null) continue
      points.push({
        time: `${index}:${time}`,
        label: time || formatTimeLabel(time),
        value,
      })
    }

    return {
      serial: input.ontSerial,
      status: points.length > 0 ? 'ok' : 'no-data',
      points,
      unit,
    }
  } catch {
    return { serial: input.ontSerial, status: 'error', points: [] }
  }
}

function normalizeChartStatus(raw: string): OntStatusKey {
  const key = normalizeOntStatusKey(raw)
  if (key === 'REDUCED_ROBUSTNESS' || key === 'DEGRADED') return 'DEGRADED'
  if (key === 'GOOD' || key === 'INTERRUPTED' || key === 'SWITCHED_OFF') return key
  return 'SWITCHED_OFF'
}

function pickNestedSource(root: Record<string, unknown>): Record<string, unknown> {
  if (
    Array.isArray(root.chartDataTimes) ||
    Array.isArray(root.ChartDataTimes) ||
    Array.isArray(root.statusList) ||
    Array.isArray(root.StatusList)
  ) {
    return root
  }
  for (const candidate of [root.data, root.dataSchema, root.result]) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>
    }
  }
  return root
}

function pickSeriesValues(chartDataValues: Record<string, unknown>, ontId: string): string[] {
  const direct = chartDataValues[ontId]
  if (Array.isArray(direct)) return direct.map((item) => String(item ?? ''))

  const matchingKey = Object.keys(chartDataValues).find(
    (key) => key.trim().toLowerCase() === ontId.trim().toLowerCase(),
  )
  if (matchingKey && Array.isArray(chartDataValues[matchingKey])) {
    return (chartDataValues[matchingKey] as unknown[]).map((item) => String(item ?? ''))
  }

  const firstNonEmpty = Object.values(chartDataValues).find(
    (value) => Array.isArray(value) && value.length > 0,
  )
  return Array.isArray(firstNonEmpty)
    ? firstNonEmpty.map((item) => String(item ?? ''))
    : []
}

function parseNumericPoint(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const normalized = String(raw).trim()
  if (!normalized) return null
  const parsed = Number(normalized.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatTimeLabel(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}
