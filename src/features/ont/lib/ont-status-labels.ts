export type OntStatusKey =
  | 'GOOD'
  | 'INTERRUPTED'
  | 'SWITCHED_OFF'
  | 'REDUCED_ROBUSTNESS'
  | 'DEGRADED'
  | 'UNKNOWN'

const labelByKey: Record<OntStatusKey, string> = {
  GOOD: 'Disponible',
  INTERRUPTED: 'Interrumpida',
  SWITCHED_OFF: 'Apagada',
  REDUCED_ROBUSTNESS: 'Degradado',
  DEGRADED: 'Degradado',
  UNKNOWN: 'Desconocido',
}

function isOntStatusKey(value: string): value is OntStatusKey {
  return value in labelByKey
}

export function normalizeOntStatusKey(raw: string): OntStatusKey | string {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, '_')
  if (!normalized) return ''
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
  if (!key) return 'Sin datos'
  if (isOntStatusKey(key)) return labelByKey[key]
  return 'Desconocido'
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
  if (!trimmed) return 'Sin datos'
  return aggregateMetricLabels[trimmed] ?? trimmed
}
