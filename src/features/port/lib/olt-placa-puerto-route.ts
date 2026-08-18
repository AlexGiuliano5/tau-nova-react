import { z } from 'zod'

/**
 * Placa/slot en ruta y llamadas BFF: 1-based.
 * La grilla de distribución OLT usa hasta ~16 columnas (índice 0..15 → placa 1..16), pero
 * el equipo puede devolver slot físico mayor; el máximo amplío cubre esos IDs.
 */
export const OLT_PLACA_SLOT_MIN = 1
export const OLT_PLACA_SLOT_MAX = 128
export const OLT_PUERTO_MIN = 0
export const OLT_PUERTO_MAX = 32

const placaPuertoSegmentSchema = z.object({
  placa: z.coerce.number().int().min(OLT_PLACA_SLOT_MIN).max(OLT_PLACA_SLOT_MAX),
  puerto: z.coerce.number().int().min(OLT_PUERTO_MIN).max(OLT_PUERTO_MAX),
})

const puertoOnlySchema = z.coerce.number().int().min(OLT_PUERTO_MIN).max(OLT_PUERTO_MAX)

/**
 * Resuelve placa/puerto de la URL.
 * Compat: slot 0 en BFF llega como `/placa/0/...` → se normaliza a placa 1.
 */
export function parseOltPlacaPuertoSegments(
  placa: string,
  puerto: string,
): { placa: number; puerto: number } | null {
  const direct = placaPuertoSegmentSchema.safeParse({ placa, puerto })
  if (direct.success) return direct.data

  const placaAsInt = z.coerce.number().int().safeParse(placa)
  const puertoParsed = puertoOnlySchema.safeParse(puerto)
  if (placaAsInt.success && puertoParsed.success && placaAsInt.data === 0) {
    return { placa: 1, puerto: puertoParsed.data }
  }

  return null
}

export function buildPortEntityId(olt: string, placa: number, puerto: number): string {
  return `${olt.trim()}/${placa}/${puerto}`
}

export function buildPortTablaHref(oltRouteParam: string, placa: number, puerto: number): string {
  return `/ftth/olt/${encodeURIComponent(oltRouteParam)}/placa/${placa}/puerto/${puerto}/tabla`
}
