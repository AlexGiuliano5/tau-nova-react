import { resolveCapaControlSerialNumber } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export interface BffOntCapaControlData {
  access: string
  ipAddress: string
  portal: string | null
  startTime: string
  hdmSip: string
  serial: string
  error: boolean
  message: string
}

export type CapaControlResult =
  | { ok: true; data: BffOntCapaControlData }
  | { ok: false; error: 'auth' | 'bff' | 'unknown' }

export async function fetchOntCapaControl(
  serialNumber: string,
  forzar = false,
  signal?: AbortSignal,
): Promise<CapaControlResult> {
  const normalizedSerial = resolveCapaControlSerialNumber(serialNumber)
  if (!normalizedSerial) return { ok: false, error: 'unknown' }

  try {
    const response = await apiFetch('/api/services/ont/capacontrol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serialNumber: normalizedSerial, forzar }),
      signal,
    })

    if (response.status === 204) return { ok: false, error: 'auth' }
    const raw = await parseJsonResponse(response)
    if (!response.ok) return { ok: false, error: 'unknown' }

    const data = extractCapaControlData(raw)
    if (!data) return { ok: false, error: 'bff' }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

function extractCapaControlData(raw: unknown): BffOntCapaControlData | null {
  if (!raw || typeof raw !== 'object') return null
  const root = raw as Record<string, unknown>
  const payload =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root

  const serial = toStringOrEmpty(payload.serial).trim()
  const hasRecognizedFields =
    Boolean(serial) ||
    Boolean(toStringOrEmpty(payload.access).trim()) ||
    Boolean(toStringOrEmpty(payload.ipAddress).trim()) ||
    payload.error === true ||
    payload.error === false

  if (!hasRecognizedFields) return null

  const portalRaw = payload.portal
  const portal =
    portalRaw === null || portalRaw === undefined
      ? null
      : toStringOrEmpty(portalRaw).trim() || null

  return {
    access: toStringOrEmpty(payload.access),
    ipAddress: toStringOrEmpty(payload.ipAddress),
    portal,
    startTime: toStringOrEmpty(payload.startTime),
    hdmSip:
      toStringOrEmpty(payload.hdmSip) ||
      toStringOrEmpty(payload.sip) ||
      toStringOrEmpty(payload.sipIp),
    serial,
    error: payload.error === true,
    message: toStringOrEmpty(payload.message),
  }
}
