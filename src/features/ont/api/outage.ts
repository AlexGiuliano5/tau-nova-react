import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export type OntOutageStatus = 'outage' | 'no-outage' | 'unknown'

export interface OntOutageResult {
  status: OntOutageStatus
}

interface BffOntOutageResponse {
  serial: string
  clientId: string | null
  outages: unknown
  identifier: string | null
  status: string
}

/** Misma lógica que tau-nova `loadOntInfoAlertasCardData`. */
export async function fetchOntOutageStatus(
  serial: string,
  signal?: AbortSignal,
): Promise<OntOutageResult> {
  const normalizedInput = normalizeOntId(serial) || serial.trim()
  if (!normalizedInput || normalizedInput.toUpperCase() === 'SIN DATOS') {
    return { status: 'unknown' }
  }

  try {
    const response = await apiFetch('/api/ftth/outages/byMultipleSerial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serials: normalizedInput }),
      signal,
    })

    if (response.status === 204 || response.status === 401 || response.status === 403) {
      return { status: 'unknown' }
    }
    if (response.status === 202 || !response.ok) {
      return { status: 'unknown' }
    }

    const raw = await parseJsonResponse(response)
    const items = normalizeOutageResponse(raw)
    if (!items) return { status: 'unknown' }

    const matched = items.find(
      (item) => normalizeSerial(item.serial) === normalizeSerial(normalizedInput),
    )
    if (!matched) return { status: 'unknown' }

    if (matched.outages !== null && matched.outages !== undefined) {
      return { status: 'outage' }
    }
    if (hasValidOutageIdentifier(matched.identifier)) {
      return { status: 'no-outage' }
    }
    return { status: 'unknown' }
  } catch {
    return { status: 'unknown' }
  }
}

function normalizeOutageResponse(raw: unknown): BffOntOutageResponse[] | null {
  const array = unwrapArray(raw)
  if (!array) return null

  const parsed: BffOntOutageResponse[] = []
  for (const item of array) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const obj = item as Record<string, unknown>
    const serial = toStringOrEmpty(obj.serial).trim()
    if (!serial) continue
    parsed.push({
      serial,
      clientId: toNullableString(obj.clientId),
      outages: obj.outages ?? null,
      identifier: toNullableString(obj.identifier),
      status: toStringOrEmpty(obj.status).trim(),
    })
  }
  return parsed
}

function unwrapArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== 'object') return null
  const root = raw as Record<string, unknown>
  if (Array.isArray(root.data)) return root.data
  return null
}

function toNullableString(value: unknown): string | null {
  const normalized = toStringOrEmpty(value).trim()
  return normalized || null
}

function normalizeSerial(value: string): string {
  return value.trim().toUpperCase()
}

function hasValidOutageIdentifier(identifier: string | null): boolean {
  if (!identifier) return false
  const normalized = identifier.trim().replace(/\.$/, '').toUpperCase()
  if (!normalized) return false
  return normalized !== 'NO SE OBTUVO IDENTIFICADOR'
}
