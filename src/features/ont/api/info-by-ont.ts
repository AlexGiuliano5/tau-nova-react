import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import type { BffOntInfoByOntResponse } from '@/features/ont/types/ont'
import { getNovaFacadeBaseUrl } from '@/shared/api/bff'
import { readApiEnvelope } from '@/shared/api/envelope'
import { apiFetch } from '@/shared/api/http'

export type InfoByOntResult =
  | { ok: true; data: BffOntInfoByOntResponse }
  | { ok: false; error: 'auth' | 'no-data' | 'unknown' }

export async function fetchOntInfoByOnt(
  oltId: string,
  ontId: string,
  signal?: AbortSignal,
): Promise<InfoByOntResult> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId) return { ok: false, error: 'unknown' }

  const response = await apiFetch('/ont/infoByOnt', {
    method: 'POST',
    baseUrl: getNovaFacadeBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ontId: normalizedOntId,
      oltId: oltId.trim() || null,
    }),
    signal,
  })

  const envelope = await readApiEnvelope(response)
  if (!envelope.ok) {
    if (envelope.error === 'auth') return { ok: false, error: 'auth' }
    if (envelope.error === 'no-data') return { ok: false, error: 'no-data' }
    return { ok: false, error: 'unknown' }
  }

  if (!envelope.data || typeof envelope.data !== 'object') {
    return { ok: false, error: 'unknown' }
  }

  const source = envelope.data as Record<string, unknown>
  return {
    ok: true,
    data: {
      lastUpTime: toStringOrEmpty(source.lastUpTime),
      lastDnTime: toStringOrEmpty(source.lastDnTime),
      downCause: toStringOrEmpty(source.downCause),
      distance: toStringOrEmpty(source.distance),
      equipmentType: toStringOrEmpty(source.equipmentType),
    },
  }
}
