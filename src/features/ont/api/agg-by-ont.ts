import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { getNovaFacadeBaseUrl } from '@/shared/api/bff'
import { readApiEnvelope } from '@/shared/api/envelope'
import { apiFetch } from '@/shared/api/http'

export async function fetchOntAggByOnt(
  ontId: string,
  oltId: string,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId || !oltId.trim()) return null

  try {
    const response = await apiFetch('/ont/aggMetricsByOnt', {
      method: 'POST',
      baseUrl: getNovaFacadeBaseUrl(),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ontId: normalizedOntId, oltId: oltId.trim() }),
      signal,
    })
    const envelope = await readApiEnvelope(response)
    if (!envelope.ok) return null
    return envelope.data
  } catch {
    return null
  }
}
