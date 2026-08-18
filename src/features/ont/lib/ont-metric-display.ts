export type MetricStatusColor =
  | 'card-green'
  | 'card-yellow'
  | 'card-orange'
  | 'card-red'
  | 'neutral'

export interface OntMetricCardModel {
  title: string
  actual: string
  min: string
  avg: string
  max: string
  unit: string
  color: MetricStatusColor
  time?: string
  loading?: boolean
  recalculated?: boolean
  previousActual?: string
  eventTime?: string
  previousEventTime?: string
}

export function getOntMetricCardUnit(title: string): string {
  const normalizedTitle = title.trim().toUpperCase()
  switch (normalizedTitle) {
    case 'ONT RX':
    case 'ONT TX':
    case 'OLT TX':
    case 'OLT RX':
      return 'dBm'
    case 'ONT VOLTAGE':
    case 'OLT VOLTAGE':
      return 'V'
    case 'ONT TEMPERATURE':
    case 'ONT TEMP LASER':
    case 'PORT TEMPERATURA':
    case 'PORT TEMPERATURE':
      return '°C'
    case 'ONT DISTANCE':
      return 'Mts'
    default:
      return normalizedTitle.includes('TEMPERATURE') ? '°C' : ''
  }
}

export function getOntMetricCardStatusColor(title: string, actual: string): MetricStatusColor {
  const normalizedTitle = title.trim().toUpperCase()
  const value = Number.parseFloat(actual.replace(',', '.'))
  if (Number.isNaN(value)) return 'neutral'

  if (normalizedTitle === 'ONT RX') {
    if (value < -27) return 'card-red'
    if (value < -24.5) return 'card-orange'
    if (value > -12) return 'card-yellow'
    return 'card-green'
  }
  if (normalizedTitle === 'OLT RX') {
    if (value < -30) return 'card-red'
    if (value < -27.5) return 'card-orange'
    if (value > -15) return 'card-yellow'
    return 'card-green'
  }
  if (normalizedTitle === 'OLT TX') {
    return value < -4.5 ? 'card-red' : 'card-green'
  }
  return 'neutral'
}

const placeholders = new Set(['', 'Sin Datos', '—', '-'])

export function formatOntMetricCardValue(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toFixed(2) : 'Sin Datos'
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (placeholders.has(normalized)) return normalized || 'Sin Datos'
    const parsed = Number.parseFloat(normalized.replace(/\s/g, '').replace(',', '.'))
    if (Number.isFinite(parsed)) return parsed.toFixed(2)
    return normalized
  }
  return 'Sin Datos'
}

export function formatOntMetricCardDateTime(value?: string): string {
  if (!value?.trim() || value.trim() === 'Sin Datos') return 'Sin Datos'
  return value.trim()
}

export function titleKey(title: string): string {
  return title.trim().toUpperCase().replace(/\s+/g, ' ')
}

export function applyOntAggByOntToMetricCards(
  cards: OntMetricCardModel[],
  aggWire: unknown,
): OntMetricCardModel[] {
  const rows = Array.isArray(aggWire) ? aggWire : []
  const byTitle = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const record = row as Record<string, unknown>
    const key = titleKey(String(record.title ?? ''))
    if (key) byTitle.set(key, record)
  }

  return cards.map((card) => {
    const actual = card.actual.trim()
    if (!actual || actual === 'Sin Datos' || actual === '-') {
      return { ...card, min: '-', avg: '-', max: '-' }
    }
    const row = byTitle.get(titleKey(card.title))
    const aggValue = (raw: unknown) => {
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw.toFixed(2)
      if (typeof raw === 'string' && raw.trim()) return formatOntMetricCardValue(raw)
      return '-'
    }
    return {
      ...card,
      min: aggValue(row?.min),
      avg: aggValue(row?.avg),
      max: aggValue(row?.max),
    }
  })
}

export function lastValuesToMetricCards(
  lastValues: Array<{ title: string; actual: string; time: string; min?: string; avg?: string; max?: string }>,
): OntMetricCardModel[] {
  return lastValues.map((metric) => {
    const actual = formatOntMetricCardValue(metric.actual)
    return {
      title: metric.title,
      actual,
      min: metric.min?.trim() || '-',
      avg: metric.avg?.trim() || '-',
      max: metric.max?.trim() || '-',
      time: metric.time,
      unit: getOntMetricCardUnit(metric.title),
      color: getOntMetricCardStatusColor(metric.title, actual),
    }
  })
}

function parseOntMetricActualNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized || normalized === 'Sin Datos' || normalized === '-' || normalized === '—') {
    return null
  }
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function ontMetricActualValueChanged(previousActual: string, currentActual: string): boolean {
  const previousNumber = parseOntMetricActualNumber(previousActual)
  const currentNumber = parseOntMetricActualNumber(currentActual)
  if (previousNumber !== null && currentNumber !== null) {
    return Math.abs(previousNumber - currentNumber) > 0.0005
  }
  return previousActual.trim() !== currentActual.trim()
}

/** Desenvuelve `{ data: [...] }` del BFF si hace falta. */
export function unwrapAggByOntWire(aggWire: unknown): unknown {
  if (Array.isArray(aggWire)) return aggWire
  if (aggWire && typeof aggWire === 'object') {
    const data = (aggWire as { data?: unknown }).data
    if (Array.isArray(data)) return data
  }
  return aggWire
}
