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

export function ontMetricThresholdTitleForGraph(
  graphId: 'ont-rx' | 'ont-tx' | 'olt-rx' | 'olt-tx',
): string {
  switch (graphId) {
    case 'ont-rx':
      return 'ONT RX'
    case 'ont-tx':
      return 'ONT TX'
    case 'olt-rx':
      return 'OLT RX'
    case 'olt-tx':
      return 'OLT TX'
  }
}

export function resolveOntMetricThresholdSegment(
  value: number,
  config: OntMetricThresholdConfig,
): OntMetricThresholdSegment | null {
  const lastIndex = config.segments.length - 1
  return (
    config.segments.find((segment, index) => {
      if (index === lastIndex) {
        return value >= segment.start && value <= segment.end
      }
      return value >= segment.start && value < segment.end
    }) ?? null
  )
}
