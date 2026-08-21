export type OntStatusKey =
  | 'GOOD'
  | 'INTERRUPTED'
  | 'SWITCHED_OFF'
  | 'REDUCED_ROBUSTNESS'
  | 'DEGRADED'

const labelByKey: Record<OntStatusKey, string> = {
  GOOD: 'Disponible',
  INTERRUPTED: 'Interrumpida',
  SWITCHED_OFF: 'Apagada',
  REDUCED_ROBUSTNESS: 'Degradado',
  DEGRADED: 'Degradado',
}

const MISSING_STATUS_KEYS = new Set(['', '-', '—', 'UNKNOWN', 'DESCONOCIDO', 'SIN_DATOS'])

function isOntStatusKey(value: string): value is OntStatusKey {
  return value in labelByKey
}

export function normalizeOntStatusKey(raw: string): OntStatusKey | string {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, '_')
  if (MISSING_STATUS_KEYS.has(normalized)) return ''
  if (normalized === 'OK') return 'GOOD'
  if (
    normalized === 'REDUCES_ROBUSTNESS' ||
    normalized === 'REDUCED_ROBUSTNESS' ||
    normalized === 'REDUCED'
  ) {
    return 'REDUCED_ROBUSTNESS'
  }
  if (normalized === 'SWITCHEDOFF') return 'SWITCHED_OFF'
  if (normalized === 'INTERRUP') return 'INTERRUPTED'
  return normalized
}

export function formatOntStatusLabel(raw: string): string {
  const key = normalizeOntStatusKey(raw)
  if (!key) return 'Sin Datos'
  if (isOntStatusKey(key)) return labelByKey[key]
  return 'Sin Datos'
}

/** Clase de fila para estados con chip de alerta. */
export function ontStatusRowClassName(estadoRaw: string): string {
  const key = normalizeOntStatusKey(estadoRaw)
  if (key === 'INTERRUPTED') return 'ftth-grid-row--interrupted'
  if (key === 'DEGRADED' || key === 'REDUCED_ROBUSTNESS') return 'ftth-grid-row--degraded'
  return ''
}

export type OntStatusFilterBucket =
  | 'GOOD'
  | 'DEGRADED'
  | 'INTERRUPTED'
  | 'SWITCHED_OFF'
  | 'MISSING'

export const ONT_STATUS_FILTER_OPTIONS: {
  bucket: OntStatusFilterBucket
  label: string
}[] = [
  { bucket: 'GOOD', label: 'Disponible' },
  { bucket: 'DEGRADED', label: 'Degradado' },
  { bucket: 'INTERRUPTED', label: 'Interrumpida' },
  { bucket: 'SWITCHED_OFF', label: 'Apagada' },
  { bucket: 'MISSING', label: 'Sin Datos' },
]

export function ontStatusFilterBucket(raw: string): OntStatusFilterBucket {
  const key = normalizeOntStatusKey(raw)
  if (key === 'GOOD') return 'GOOD'
  if (key === 'DEGRADED' || key === 'REDUCED_ROBUSTNESS') return 'DEGRADED'
  if (key === 'INTERRUPTED') return 'INTERRUPTED'
  if (key === 'SWITCHED_OFF') return 'SWITCHED_OFF'
  return 'MISSING'
}

export function emptyOntStatusFilterCounts(): Record<OntStatusFilterBucket, number> {
  return {
    GOOD: 0,
    DEGRADED: 0,
    INTERRUPTED: 0,
    SWITCHED_OFF: 0,
    MISSING: 0,
  }
}

export function countOntStatusFilterBuckets(
  values: Iterable<string>,
): Record<OntStatusFilterBucket, number> {
  const counts = emptyOntStatusFilterCounts()
  for (const raw of values) {
    counts[ontStatusFilterBucket(raw)] += 1
  }
  return counts
}

export function readOntStatusFilterSelection(entry: unknown): OntStatusFilterBucket[] {
  if (!entry || typeof entry !== 'object') return []
  const value = (entry as { value?: unknown }).value
  if (!Array.isArray(value)) return []
  const allowed = new Set(ONT_STATUS_FILTER_OPTIONS.map((option) => option.bucket))
  return value.filter((item): item is OntStatusFilterBucket => allowed.has(item))
}

const aggregateMetricLabels: Record<string, string> = {
  Total: 'Total',
  Good: 'Disponibles',
  Interrupted: 'Interrumpidas',
  'Switched Off': 'Apagadas',
  Degraded: 'Degradadas',
  'Reduced Robustness': 'Degradadas',
}

/** Etiquetas para métricas agregadas de gráficos OLT/puerto (claves del BFF). */
export function formatOntAggregateMetricLabel(metric: string): string {
  const trimmed = metric.trim()
  if (!trimmed) return 'Sin Datos'
  return aggregateMetricLabels[trimmed] ?? trimmed
}
