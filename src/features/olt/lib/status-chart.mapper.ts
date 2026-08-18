import type {
  BffChartDataValue,
  BffHistoricStatusOLTResponse,
  OltStatusChartRow,
} from '@/features/olt/types/status-chart'

export function buildOltStatusChartRows(
  payload: BffHistoricStatusOLTResponse,
): OltStatusChartRow[] {
  const { chartDataTimes, chartDataValues } = payload
  const len = Math.min(chartDataTimes.length, chartDataValues.length)
  const rows: OltStatusChartRow[] = []

  for (let i = 0; i < len; i++) {
    const timeRaw = String(chartDataTimes[i] ?? '').trim()
    const point = normalizePoint(chartDataValues[i])
    rows.push({
      x: `${i}:${timeRaw}`,
      label: timeRaw,
      good: point.good,
      total: point.total,
      switchedOff: point.switchedOff,
      interrupted: point.interrupted,
      degraded: point.degraded,
    })
  }

  return rows
}

function normalizePoint(row: BffChartDataValue | undefined): {
  good: number | null
  total: number | null
  switchedOff: number | null
  interrupted: number | null
  degraded: number | null
} {
  if (!row) {
    return {
      good: null,
      total: null,
      switchedOff: null,
      interrupted: null,
      degraded: null,
    }
  }

  const reducedRobustness = parseNumericMetric(row['Reduced Robustness'])
  const degradedOnly = parseNumericMetric(row.Degraded)

  return {
    good: parseNumericMetric(row.Good),
    total: parseNumericMetric(row.Total),
    switchedOff: parseNumericMetric(row['Switched Off']),
    interrupted: parseNumericMetric(row.Interrupted),
    degraded: sumNullableMetrics(reducedRobustness, degradedOnly),
  }
}

function sumNullableMetrics(left: number | null, right: number | null): number | null {
  if (left === null && right === null) return null
  return (left ?? 0) + (right ?? 0)
}

function parseNumericMetric(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  if (s === '') return null
  const n = Number(s.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
