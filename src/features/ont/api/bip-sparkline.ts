import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export type OntBipHistoricMetric = 'Ont Bip US' | 'Ont Bip DS'

export interface OntBipSparklinePoint {
  index: number
  value: number
}

export async function fetchOntBipSparklinePoints(
  ontId: string,
  oltId: string,
  metric: OntBipHistoricMetric,
  signal?: AbortSignal,
): Promise<OntBipSparklinePoint[]> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId || !oltId.trim()) return []

  const response = await apiFetch('/api/services/ont/historicalbyont', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ontId: normalizedOntId,
      oltId: oltId.trim(),
      metric,
      days: 'P3D',
    }),
    signal,
  })

  if (!response.ok) return []
  const raw = await parseJsonResponse(response)
  if (!raw || typeof raw !== 'object') return []

  const source = raw as Record<string, unknown>
  const timesRaw = source.chartDataTimes ?? source.ChartDataTimes
  const valuesRaw = source.chartDataValues ?? source.ChartDataValues
  if (!Array.isArray(timesRaw) || !valuesRaw || typeof valuesRaw !== 'object') return []

  const values = pickSeriesValues(valuesRaw as Record<string, unknown>, normalizedOntId)
  if (values.length === 0) return []

  const points: OntBipSparklinePoint[] = []
  for (let index = 0; index < timesRaw.length; index += 1) {
    const parsed = parseNumericPoint(values[index])
    if (parsed === null) continue
    points.push({ index, value: parsed })
  }
  return points
}

function pickSeriesValues(
  chartDataValues: Record<string, unknown>,
  ontId: string,
): string[] {
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
