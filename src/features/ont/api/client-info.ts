import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import type { OntClientInfo } from '@/features/ont/types/ont'
import { getNovaFacadeBaseUrl } from '@/shared/api/bff'
import { readApiEnvelope } from '@/shared/api/envelope'
import { apiFetch } from '@/shared/api/http'

/** Vacío / null / undefined → "Sin Datos" (igual que tau-nova `toTextOrNoData`). */
function toTextOrNoData(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : 'Sin Datos'
  }
  return 'Sin Datos'
}

function toStringOrEmpty(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export async function fetchOntClientInfo(
  ont: string,
  signal?: AbortSignal,
): Promise<OntClientInfo | null> {
  const normalizedOnt = normalizeOntId(ont)
  if (!normalizedOnt) return null

  const response = await apiFetch(`/ont/${encodeURIComponent(normalizedOnt)}/getCustomer`, {
    method: 'GET',
    baseUrl: getNovaFacadeBaseUrl(),
    signal,
  })

  const envelope = await readApiEnvelope(response)
  if (!envelope.ok) return null

  const payload = mapOntInfoPayload(envelope.data)
  if (!payload) return null

  const calle = toStringOrEmpty(payload.calle).trim()
  const altura =
    payload.altura == null || payload.altura === ''
      ? ''
      : String(payload.altura).trim()
  const direccion = [calle, altura].filter(Boolean).join(' ').trim()

  return {
    nombre: toTextOrNoData(payload.abonado),
    numeroCliente: 'Sin Datos',
    provincia: toTextOrNoData(payload.province),
    localidad: toTextOrNoData(payload.localidad),
    direccion: direccion || 'Sin Datos',
    pisoDpto: toTextOrNoData(payload.pisoDpto),
    telefonoFijo: toTextOrNoData(payload.teleF_CASA),
    telefonoMovil: toTextOrNoData(payload.teleF_PERSONA),
  }
}

function mapOntInfoPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const source = data as Record<string, unknown>
  const requiredKeys = ['abonado', 'localidad', 'province', 'calle']
  if (!requiredKeys.some((key) => key in source)) return null
  return source
}
