import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export async function fetchOntAggByOnt(
  ontId: string,
  oltId: string,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId || !oltId.trim()) return null

  try {
    const response = await apiFetch('/api/services/ont/aggobyont', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ontId: normalizedOntId, oltId: oltId.trim() }),
      signal,
    })
    if (response.status === 204 || !response.ok) return null
    return parseJsonResponse(response)
  } catch {
    return null
  }
}
