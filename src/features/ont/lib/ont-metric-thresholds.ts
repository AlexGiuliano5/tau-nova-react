export type OntMetricThresholdTone = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'neutral'

export interface OntMetricThresholdSegment {
  label: string
  start: number
  end: number
  tone: OntMetricThresholdTone
}

export interface OntMetricThresholdConfig {
  min: number
  max: number
  segments: OntMetricThresholdSegment[]
  tickValues?: number[]
}

/** Umbrales de las métricas con color en Información de ONT: ONT RX, OLT RX, OLT TX. */
export function getOntMetricThresholdConfig(title: string): OntMetricThresholdConfig | null {
  const normalizedTitle = title.trim().toUpperCase()

  if (normalizedTitle === 'ONT RX') {
    return {
      min: -30,
      max: -8,
      segments: [
        { label: 'Crítico', start: -30, end: -27, tone: 'red' },
        { label: 'Advertencia', start: -27, end: -24.5, tone: 'orange' },
        { label: 'Óptimo', start: -24.5, end: -12, tone: 'green' },
        { label: 'POE', start: -12, end: -8, tone: 'blue' },
      ],
    }
  }

  if (normalizedTitle === 'OLT RX') {
    return {
      min: -34,
      max: -12,
      segments: [
        { label: 'Crítico', start: -34, end: -30, tone: 'red' },
        { label: 'Advertencia', start: -30, end: -27.5, tone: 'orange' },
        { label: 'Óptimo', start: -27.5, end: -15, tone: 'green' },
        { label: 'Alto', start: -15, end: -12, tone: 'yellow' },
      ],
    }
  }

  if (normalizedTitle === 'OLT TX') {
    return {
      min: -8,
      max: 8,
      segments: [
        { label: 'Crítico', start: -8, end: -4.5, tone: 'red' },
        { label: 'Óptimo', start: -4.5, end: 8, tone: 'green' },
      ],
      tickValues: [-4.5],
    }
  }

  return null
}

export function ontMetricThresholdTitleForGraph(graphId: string): string {
  switch (graphId) {
    case 'ont-rx':
      return 'ONT RX'
    case 'ont-tx':
      return 'ONT TX'
    case 'olt-rx':
      return 'OLT RX'
    case 'olt-tx':
      return 'OLT TX'
    case 'ont-voltage':
      return 'ONT VOLTAGE'
    case 'ont-temp-laser':
      return 'ONT TEMP LASER'
    default:
      return ''
  }
}

export function ontMetricThresholdSwatchClass(tone: OntMetricThresholdTone): string {
  switch (tone) {
    case 'red':
      return 'bg-(--card-red)'
    case 'orange':
      return 'bg-(--card-orange)'
    case 'yellow':
      return 'bg-(--card-yellow)'
    case 'green':
      return 'bg-(--card-green)'
    case 'blue':
      return 'bg-(--primary-2)'
    default:
      return 'bg-(--gray-03)'
  }
}

/** Fondos de banda para el gráfico histórico: mismos hues que la barra de la card. */
export function ontMetricThresholdBandFill(tone: OntMetricThresholdTone): string {
  switch (tone) {
    case 'red':
      return 'color-mix(in srgb, var(--card-red) 22%, var(--card))'
    case 'orange':
      return 'color-mix(in srgb, var(--card-orange) 28%, var(--card))'
    case 'yellow':
      return 'color-mix(in srgb, var(--card-yellow) 28%, var(--card))'
    case 'green':
      return 'color-mix(in srgb, var(--card-green) 22%, var(--card))'
    case 'blue':
      return 'color-mix(in srgb, var(--primary-2) 18%, var(--card))'
    default:
      return 'transparent'
  }
}

/** Estira el primer/último tramo para cubrir valores fuera de la escala (como el ACTUAL de la card). */
export function extendThresholdSegmentsToDomain(
  config: OntMetricThresholdConfig,
  domainMin: number,
  domainMax: number,
): OntMetricThresholdSegment[] {
  if (config.segments.length === 0) return []
  return config.segments.map((segment, index) => {
    if (index === 0) {
      return { ...segment, start: Math.min(segment.start, domainMin) }
    }
    if (index === config.segments.length - 1) {
      return { ...segment, end: Math.max(segment.end, domainMax) }
    }
    return segment
  })
}

export function resolveOntMetricThresholdSegment(
  value: number,
  config: OntMetricThresholdConfig,
): OntMetricThresholdSegment | null {
  const lastIndex = config.segments.length - 1
  const inRange = config.segments.find((segment, index) => {
    if (index === lastIndex) {
      return value >= segment.start && value <= segment.end
    }
    return value >= segment.start && value < segment.end
  })
  if (inRange) return inRange
  if (value < config.min) return config.segments[0] ?? null
  if (value > config.max) return config.segments[lastIndex] ?? null
  return null
}
