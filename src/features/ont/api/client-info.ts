import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import type { OntClientInfo } from '@/features/ont/types/ont'
import { parseJsonResponse } from '@/shared/api/bff'
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

  const response = await apiFetch(
    `/api/services/ont/info/${encodeURIComponent(normalizedOnt)}`,
    { method: 'GET', signal },
  )

  if (response.status === 202 || !response.ok) return null

  const data = await parseJsonResponse(response)
  const payload = normalizeOntInfoPayload(data)
  if (!payload) return null

  const calle = toStringOrEmpty(payload.calle).trim()
  const altura =
    payload.altura == null || payload.altura === ''
      ? ''
      : String(payload.altura).trim()
  const direccion = [calle, altura].filter(Boolean).join(' ').trim()

  return {
    nombre: toTextOrNoData(payload.abonado),
    numeroCliente: toTextOrNoData(payload.serviceAccount),
    provincia: toTextOrNoData(payload.province),
    localidad: toTextOrNoData(payload.localidad),
    direccion: direccion || 'Sin Datos',
    pisoDpto: toTextOrNoData(payload.pisoDpto),
    telefonoFijo: toTextOrNoData(payload.teleF_CASA),
    telefonoMovil: toTextOrNoData(payload.teleF_PERSONA),
  }
}

function normalizeOntInfoPayload(data: unknown): Record<string, unknown> | null {
  const direct = mapOntInfoPayload(data)
  if (direct) return direct
  if (!data || typeof data !== 'object') return null

  for (const value of Object.values(data as Record<string, unknown>)) {
    const mapped = mapOntInfoPayload(value)
    if (mapped) return mapped
    if (Array.isArray(value)) {
      for (const item of value) {
        const mappedFromArray = mapOntInfoPayload(item)
        if (mappedFromArray) return mappedFromArray
      }
    }
  }
  return null
}

function mapOntInfoPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const source = data as Record<string, unknown>
  const requiredKeys = ['abonado', 'serviceAccount', 'localidad', 'province', 'calle']
  if (!requiredKeys.some((key) => key in source)) return null
  return source
}
