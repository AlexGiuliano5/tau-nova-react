import { fetchInfoRealTimeByOnt, type BffInfoRealTimeByOntData } from '@/features/ont/api/info-realtime-by-ont'
import {
  buildOntContextFromLastMetric,
  fetchLastMetricByOnt,
} from '@/features/ont/api/last-metrics'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import type { OntContext } from '@/features/ont/types/ont'
import {
  formatOntMetricCardValue,
  getOntMetricCardStatusColor,
  getOntMetricCardUnit,
  type OntMetricCardModel,
} from '@/features/ont/lib/ont-metric-display'
import type { OntInfoDetails } from '@/features/ont/ui/OntInfoCard'

export type ResolveOntContextResult =
  | { ok: true; context: OntContext }
  | { ok: false; error: 'auth' | 'no-data' | 'unknown' }

/**
 * Igual que tau-nova `resolveOntServerContext`:
 * - LastMetrics OK → modo normal (celda OLT/placa/puerto)
 * - LastMetrics 206/202 → probe `infoRealTimeByOnt` → si OK, modo infraco
 */
export async function resolveOntContext(
  ontId: string,
  signal?: AbortSignal,
): Promise<ResolveOntContextResult> {
  const lastMetric = await fetchLastMetricByOnt(ontId, signal)
  if (lastMetric.ok) {
    return { ok: true, context: buildOntContextFromLastMetric(lastMetric.data) }
  }

  if (lastMetric.error === 'auth') {
    return { ok: false, error: 'auth' }
  }

  // Infraco: 206 sin celda o 202 error BFF → validar con realtime
  if (lastMetric.error !== 'no-data' && lastMetric.error !== 'bff-error') {
    return { ok: false, error: 'unknown' }
  }

  const realtime = await fetchInfoRealTimeByOnt(ontId, signal)
  if (!realtime.ok) {
    if (realtime.error === 'auth') return { ok: false, error: 'auth' }
    return { ok: false, error: 'no-data' }
  }

  return {
    ok: true,
    context: buildOntContextFromInfraco(realtime.data, ontId),
  }
}

export function buildOntContextFromInfraco(
  realtime: BffInfoRealTimeByOntData,
  ontId: string,
): OntContext {
  const estado =
    realtime.ESTADO?.trim() || realtime.ontStatus?.trim() || 'Sin Datos'

  return {
    mode: 'infraco',
    olt: '',
    slot: '',
    port: '',
    estado,
    lastValues: [],
    entityId: '',
    realtime,
    ontId: normalizeOntId(ontId) || ontId.trim(),
  }
}

const INFRACO_METRIC_SEEDS: Array<{
  title: string
  field: keyof Pick<
    BffInfoRealTimeByOntData,
    'ontRxPower' | 'ontTxPower' | 'ontVoltage' | 'ontTemperature'
  >
}> = [
  { title: 'ONT RX', field: 'ontRxPower' },
  { title: 'ONT TX', field: 'ontTxPower' },
  { title: 'ONT VOLTAGE', field: 'ontVoltage' },
  { title: 'ONT TEMP LASER', field: 'ontTemperature' },
]

export function mapInfracoRealtimeToMetricCards(
  realtime: BffInfoRealTimeByOntData,
): OntMetricCardModel[] {
  return INFRACO_METRIC_SEEDS.map((seed) => {
    const actual = formatOntMetricCardValue(realtime[seed.field])
    return {
      title: seed.title,
      actual,
      min: 'Sin Datos',
      avg: 'Sin Datos',
      max: 'Sin Datos',
      unit: getOntMetricCardUnit(seed.title),
      color: getOntMetricCardStatusColor(seed.title, actual),
      eventTime: realtime.eventTime.trim() || undefined,
    }
  })
}

export function mapInfracoRealtimeToDetails(
  ontId: string,
  realtime: BffInfoRealTimeByOntData,
): OntInfoDetails {
  const ponId = (normalizeOntId(ontId) || ontId.trim() || 'Sin Datos').toUpperCase()
  const estado =
    realtime.ESTADO?.trim() || realtime.ontStatus?.trim() || 'Sin Datos'

  return {
    ponId,
    serial: ponId,
    vendor: 'Sin Datos',
    olt: 'Sin Datos',
    placa: 'Sin Datos',
    puerto: 'Sin Datos',
    estado: estado || 'Sin Datos',
    distancia: 'Sin Datos',
    ultimaVezActiva: realtime.eventTime.trim() || 'Sin Datos',
    ultimaVezInactiva: 'Sin Datos',
    causaUltimaInactividad: 'Sin Datos',
  }
}
