import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

const ONT_INFO_REALTIME_BY_ONT_METRICS =
  'ontRxPower,ontTxPower,ontStatus,ontVoltage,ontTemperature,ESTADO'

export interface BffInfoRealTimeByOntData {
  eventTime: string
  serial: string
  ontRxPower: string
  ontTxPower: string
  ontStatus: string
  ontUpBytes: string
  ontBiasCurrent: string
  ontVoltage: string
  ontTemperature: string
  ESTADO?: string
}

export type InfoRealTimeByOntResult =
  | { ok: true; data: BffInfoRealTimeByOntData }
  | { ok: false; error: 'auth' | 'bff' | 'unknown' }

export async function fetchInfoRealTimeByOnt(
  ontId: string,
  signal?: AbortSignal,
): Promise<InfoRealTimeByOntResult> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId) return { ok: false, error: 'unknown' }

  try {
    const response = await apiFetch('/api/services/ftth/infoRealTimeByOnt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ont: normalizedOntId,
        metrics: ONT_INFO_REALTIME_BY_ONT_METRICS,
      }),
      signal,
    })

    if (response.status === 204) return { ok: false, error: 'auth' }
    if (!response.ok) return { ok: false, error: 'unknown' }

    const raw = await parseJsonResponse(response)
    const data = extractRealtimeByOntData(raw, normalizedOntId)
    if (!data) return { ok: false, error: 'bff' }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

function extractRealtimeByOntData(
  raw: unknown,
  fallbackOntId: string,
): BffInfoRealTimeByOntData | null {
  if (!raw || typeof raw !== 'object') return null
  const root = raw as Record<string, unknown>
  if (root.error === true) return null

  const data = coalesceDataObject(root.data)
  if (!data) return null

  const serial = toStringOrEmpty(data.serial).trim() || fallbackOntId.trim()
  if (!serial) return null

  return {
    eventTime: toStringOrEmpty(data.eventTime),
    serial,
    ontRxPower: toStringOrEmpty(data.ontRxPower),
    ontTxPower: toStringOrEmpty(data.ontTxPower),
    ontStatus: toStringOrEmpty(data.ontStatus),
    ontUpBytes: toStringOrEmpty(data.ontUpBytes),
    ontBiasCurrent: toStringOrEmpty(data.ontBiasCurrent),
    ontVoltage: toStringOrEmpty(data.ontVoltage),
    ontTemperature: toStringOrEmpty(data.ontTemperature),
    ESTADO: toStringOrEmpty(data.ESTADO),
  }
}

function coalesceDataObject(data: unknown): Record<string, unknown> | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  if (Array.isArray(data)) {
    const first = data.find((item) => item && typeof item === 'object')
    return first ? (first as Record<string, unknown>) : null
  }
  return null
}
