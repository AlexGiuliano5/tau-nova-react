import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import type { BffOntInfoByOntResponse } from '@/features/ont/types/ont'
import { parseJsonResponse } from '@/shared/api/bff'
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

  const response = await apiFetch('/api/services/ont/InfoByOnt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oltId, ontId: normalizedOntId }),
    signal,
  })

  if (response.status === 204) return { ok: false, error: 'auth' }
  if (response.status === 206) return { ok: false, error: 'no-data' }
  if (!response.ok) return { ok: false, error: 'unknown' }

  const data = await parseJsonResponse(response)
  if (!data || typeof data !== 'object') return { ok: false, error: 'unknown' }

  const source = data as Record<string, unknown>
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
