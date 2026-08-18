import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import type { BffLastMetricByOntResponse, OntContext } from '@/features/ont/types/ont'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export type LastMetricResult =
  | { ok: true; data: BffLastMetricByOntResponse }
  | { ok: false; error: 'auth' | 'no-data' | 'bff-error' | 'unknown' }

export async function fetchLastMetricByOnt(
  ontId: string,
  signal?: AbortSignal,
): Promise<LastMetricResult> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId) return { ok: false, error: 'unknown' }

  const response = await apiFetch('/api/services/ont/LastMetricsByOnt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ontId: normalizedOntId }),
    signal,
  })

  if (response.status === 204) return { ok: false, error: 'auth' }
  if (response.status === 206) return { ok: false, error: 'no-data' }
  if (response.status === 202) return { ok: false, error: 'bff-error' }
  if (!response.ok) return { ok: false, error: 'unknown' }

  const data = await parseJsonResponse(response)
  const normalized = normalizeLastMetricPayload(data)
  if (!normalized) return { ok: false, error: 'unknown' }
  return { ok: true, data: normalized }
}

export function buildOntContextFromLastMetric(
  data: BffLastMetricByOntResponse,
): OntContext {
  const olt = data.olt.trim()
  const slot = data.slot.trim()
  const port = data.port.trim()
  return {
    mode: 'normal',
    olt,
    slot,
    port,
    estado: data.estado,
    lastValues: data.lastValues,
    entityId: `${olt}/${slot}/${port}`,
  }
}

function normalizeLastMetricPayload(data: unknown): BffLastMetricByOntResponse | null {
  const direct = mapLastMetricPayload(data)
  if (direct) return direct
  if (!data || typeof data !== 'object') return null

  for (const value of Object.values(data as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const mapped = mapLastMetricPayload(item)
        if (mapped) return mapped
      }
    }
    const mapped = mapLastMetricPayload(value)
    if (mapped) return mapped
  }
  return null
}

function mapLastMetricPayload(data: unknown): BffLastMetricByOntResponse | null {
  if (!data || typeof data !== 'object') return null
  const source = data as Record<string, unknown>
  if (!('olt' in source) && !('slot' in source) && !('port' in source)) return null

  return {
    slot: toStringOrEmpty(source.slot),
    port: toStringOrEmpty(source.port),
    olt: toStringOrEmpty(source.olt),
    estado: toStringOrEmpty(source.estado),
    lastValues: Array.isArray(source.lastValues)
      ? source.lastValues
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            title: toStringOrEmpty(item.title),
            actual: toStringOrEmpty(item.actual),
            min: toStringOrEmpty(item.min),
            avg: toStringOrEmpty(item.avg),
            max: toStringOrEmpty(item.max),
            time: toStringOrEmpty(item.time),
          }))
          .filter((item) => item.title || item.actual)
      : [],
  }
}
