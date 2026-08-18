import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export const OLT_INFO_REALTIME_BY_OLT_METRICS =
  'ontRxPower,ontTxPower,ESTADO,ontUpBytes,ontBiasCurrent,ontVoltage,ontTemperature'

export interface BffInfoRealTimeByOltRow {
  eventTime: string
  serial: string
  ontRxPower: string
  ontTxPower: string
  ESTADO: string
  ontUpBytes: string
  ontBiasCurrent: string
  ontVoltage: string
  ontTemperature: string
}

export type InfoRealTimeByOltResult =
  | { ok: true; data: BffInfoRealTimeByOltRow[] }
  | { ok: false; error: 'auth' | 'bff' | 'validation' | 'unknown' }

export async function fetchInfoRealTimeByOlt(
  input: { olt: string; slot: string; port: string },
  signal?: AbortSignal,
): Promise<InfoRealTimeByOltResult> {
  const olt = input.olt.trim()
  const slot = input.slot.trim()
  const port = input.port.trim()
  if (!olt || !slot || !port) return { ok: false, error: 'validation' }

  try {
    const response = await apiFetch('/api/services/ftth/infoRealTimeByOlt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        olt,
        slot,
        port,
        metrics: OLT_INFO_REALTIME_BY_OLT_METRICS,
      }),
      signal,
    })

    if (response.status === 204) return { ok: false, error: 'auth' }
    if (!response.ok) return { ok: false, error: 'unknown' }

    const raw = await parseJsonResponse(response)
    const rows = extractRealtimeByOltRows(raw)
    if (!rows) return { ok: false, error: 'bff' }
    return { ok: true, data: rows }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

/**
 * Soporta:
 * - lista de wrappers `[{ error, message, data }, ...]`
 * - objeto único `{ error, data, message }`
 * - data/filas directas (implementaciones anteriores)
 */
function extractRealtimeByOltRows(raw: unknown): BffInfoRealTimeByOltRow[] | null {
  if (!raw) return null

  const list = coalesceRowArray(raw)
  if (!list) return null

  const mapped = list
    .map(mapRealtimeByOltRow)
    .filter((row): row is BffInfoRealTimeByOltRow => Boolean(row))
  return mapped.length > 0 ? mapped : null
}

function coalesceRowArray(input: unknown): unknown[] | null {
  if (Array.isArray(input)) {
    const out: unknown[] = []
    for (const entry of input) {
      if (!entry || typeof entry !== 'object') continue
      const o = entry as Record<string, unknown>
      if (o.error === true) continue
      if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
        out.push(o.data)
      } else if (typeof o.serial === 'string' || typeof o.serial === 'number') {
        out.push(o)
      }
    }
    return out.length > 0 ? out : null
  }

  if (input && typeof input === 'object') {
    const o = input as Record<string, unknown>
    if (o.error === true) return null

    if (Array.isArray(o.data)) {
      return coalesceRowArray(o.data)
    }

    if (o.data && typeof o.data === 'object') {
      return coalesceRowArray(o.data)
    }

    const nested = o.rows ?? o.items ?? o.records
    if (Array.isArray(nested)) return nested

    if (typeof o.serial === 'string' || typeof o.serial === 'number') {
      return [o]
    }
  }

  return null
}

function mapRealtimeByOltRow(entry: unknown): BffInfoRealTimeByOltRow | null {
  if (!entry || typeof entry !== 'object') return null
  const o = entry as Record<string, unknown>
  const serial = toStringOrEmpty(o.serial).trim()
  if (!serial) return null

  return {
    eventTime: toStringOrEmpty(o.eventTime),
    serial,
    ontRxPower: toStringOrEmpty(o.ontRxPower),
    ontTxPower: toStringOrEmpty(o.ontTxPower),
    ESTADO: toStringOrEmpty(o.ESTADO) || toStringOrEmpty(o.estado),
    ontUpBytes: toStringOrEmpty(o.ontUpBytes),
    ontBiasCurrent: toStringOrEmpty(o.ontBiasCurrent),
    ontVoltage: toStringOrEmpty(o.ontVoltage),
    ontTemperature: toStringOrEmpty(o.ontTemperature),
  }
}
