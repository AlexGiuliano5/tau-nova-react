import { parseJsonResponse } from '@/shared/api/bff'

/**
 * Envelope de las APIs Nova (`status` del JSON no tiene que coincidir con el HTTP).
 * Éxito 200 · sin datos 206 · error técnico 202 · request inválido 400 · auth 204.
 */
export type ApiEnvelopeError = 'auth' | 'no-data' | 'bff-error' | 'unknown'

export type ApiEnvelopeResult<T> =
  | { ok: true; data: T; detail: string }
  | { ok: false; error: ApiEnvelopeError; detail: string }

interface ApiEnvelopeShape {
  status: number
  detail: string
  data: unknown
}

export async function readApiEnvelope(response: Response): Promise<ApiEnvelopeResult<unknown>> {
  if (response.status === 204) {
    return { ok: false, error: 'auth', detail: '' }
  }

  const parsed = await parseJsonResponse(response)
  const envelope = asApiEnvelope(parsed)

  if (!envelope) {
    if (response.status === 206) return { ok: false, error: 'no-data', detail: '' }
    if (response.status === 202) return { ok: false, error: 'bff-error', detail: '' }
    return { ok: false, error: 'unknown', detail: '' }
  }

  if (envelope.status === 200) {
    if (envelope.data == null) {
      return { ok: false, error: 'no-data', detail: envelope.detail }
    }
    return { ok: true, data: envelope.data, detail: envelope.detail }
  }

  if (envelope.status === 206) {
    return { ok: false, error: 'no-data', detail: envelope.detail }
  }

  if (envelope.status === 202) {
    return { ok: false, error: 'bff-error', detail: envelope.detail }
  }

  return { ok: false, error: 'unknown', detail: envelope.detail }
}

function asApiEnvelope(value: unknown): ApiEnvelopeShape | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const source = value as Record<string, unknown>
  if (typeof source.status !== 'number') return null
  return {
    status: source.status,
    detail: typeof source.detail === 'string' ? source.detail : '',
    data: source.data,
  }
}
