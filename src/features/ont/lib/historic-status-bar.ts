import type { ComparisonSeriesPoint } from '@/features/ont/api/comparison-historic'

export type HistoricStatusBarKind = 'GOOD' | 'DEGRADED' | 'INTERRUPTED' | 'SWITCHED_OFF'

export const HISTORIC_STATUS_BAR_LEGEND: ReadonlyArray<{
  status: HistoricStatusBarKind
  label: string
  swatchClass: string
  barClass: string
}> = [
  {
    status: 'GOOD',
    label: 'Disponible',
    swatchClass: 'bg-(--state-01)',
    barClass: 'bg-(--state-01)',
  },
  {
    status: 'DEGRADED',
    label: 'Degradado',
    swatchClass: 'bg-(--state-02)',
    barClass: 'bg-(--state-02)',
  },
  {
    status: 'INTERRUPTED',
    label: 'Interrumpido',
    swatchClass: 'bg-(--state-03)',
    barClass: 'bg-(--state-03)',
  },
  {
    status: 'SWITCHED_OFF',
    label: 'Apagado',
    swatchClass: 'bg-(--gray-01)',
    barClass: 'bg-(--gray-01)',
  },
]

export interface HistoricStatusBarSegment {
  status: HistoricStatusBarKind
  label: string
  startLabel: string
  endLabel: string
  weight: number
}

export interface HistoricStatusBarTick {
  label: string
  offsetPercent: number
}

export interface HistoricStatusBarSample {
  status: HistoricStatusBarKind
  label: string
  timeLabel: string
  offsetPercent: number
}

export interface HistoricStatusBarModel {
  segments: HistoricStatusBarSegment[]
  ticks: HistoricStatusBarTick[]
  samples: HistoricStatusBarSample[]
}

export function toHistoricStatusBarKind(statusLabel?: string): HistoricStatusBarKind {
  if (statusLabel === 'GOOD') return 'GOOD'
  if (statusLabel === 'DEGRADED' || statusLabel === 'REDUCED_ROBUSTNESS') return 'DEGRADED'
  if (statusLabel === 'INTERRUPTED') return 'INTERRUPTED'
  return 'SWITCHED_OFF'
}

export function historicStatusBarLabel(status: HistoricStatusBarKind): string {
  return HISTORIC_STATUS_BAR_LEGEND.find((item) => item.status === status)?.label ?? 'Apagado'
}

export function buildHistoricStatusBarModel(
  points: ComparisonSeriesPoint[],
): HistoricStatusBarModel | null {
  if (points.length === 0) return null

  const weights = pointWeights(points)
  const segments: HistoricStatusBarSegment[] = []

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const status = toHistoricStatusBarKind(point.statusLabel)
    const label = historicStatusBarLabel(status)
    const previous = segments[segments.length - 1]
    if (previous && previous.status === status) {
      previous.weight += weights[index]
      previous.endLabel = point.label || previous.endLabel
      continue
    }
    segments.push({
      status,
      label,
      startLabel: point.label,
      endLabel: point.label,
      weight: weights[index],
    })
  }

  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0)
  if (totalWeight <= 0) return null

  const samples = buildSamples(points, weights, totalWeight)

  return {
    segments,
    ticks: buildTicksFromSamples(samples),
    samples,
  }
}

export function sampleAtPercent(
  samples: HistoricStatusBarSample[],
  percent: number,
): HistoricStatusBarSample | null {
  if (samples.length === 0) return null
  let nearest = samples[0]
  let bestDistance = Math.abs(percent - nearest.offsetPercent)
  for (let index = 1; index < samples.length; index += 1) {
    const distance = Math.abs(percent - samples[index].offsetPercent)
    if (distance < bestDistance) {
      nearest = samples[index]
      bestDistance = distance
    }
  }
  return nearest
}

function pointWeights(points: ComparisonSeriesPoint[]): number[] {
  const instants = points.map(parsePointInstant)
  const canUseTime = instants.every((instant) => instant !== null)

  if (!canUseTime || points.length === 1) {
    return points.map(() => 1)
  }

  const weights: number[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const delta = (instants[index + 1] as number) - (instants[index] as number)
    weights.push(delta > 0 ? delta : 1)
  }
  weights.push(weights[weights.length - 1] ?? 1)
  return weights
}

function parsePointInstant(point: ComparisonSeriesPoint): number | null {
  const raw = stripPointIndexPrefix(point.time)
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function formatStatusTickLabel(point: ComparisonSeriesPoint): string {
  const instant = parsePointInstant(point)
  if (instant === null) return point.label
  const parsed = new Date(instant)
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed)
  const day = parts.find((part) => part.type === 'day')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const hour = parts.find((part) => part.type === 'hour')?.value
  const minute = parts.find((part) => part.type === 'minute')?.value
  if (!day || !month || !hour || !minute) return point.label
  return `${day}-${month} ${hour}:${minute}`
}

function stripPointIndexPrefix(time: string): string {
  const separator = time.indexOf(':')
  return separator >= 0 ? time.slice(separator + 1) : time
}

function buildSamples(
  points: ComparisonSeriesPoint[],
  weights: number[],
  totalWeight: number,
): HistoricStatusBarSample[] {
  const samples: HistoricStatusBarSample[] = []
  let cumulative = 0

  for (let index = 0; index < points.length; index += 1) {
    const status = toHistoricStatusBarKind(points[index].statusLabel)
    const start = cumulative
    const center = start + weights[index] / 2
    samples.push({
      status,
      label: historicStatusBarLabel(status),
      timeLabel: formatStatusTickLabel(points[index]),
      offsetPercent: Math.min(100, (center / totalWeight) * 100),
    })
    cumulative += weights[index]
  }

  return samples
}

function buildTicksFromSamples(samples: HistoricStatusBarSample[]): HistoricStatusBarTick[] {
  if (samples.length === 0) return []

  const first = samples[0]
  const last = samples[samples.length - 1]
  const ticks: HistoricStatusBarTick[] = [
    { label: first.timeLabel, offsetPercent: first.offsetPercent },
  ]

  if (samples.length === 1) return ticks

  const minGapPercent = 10
  for (const sample of samples.slice(1, -1)) {
    const previous = ticks[ticks.length - 1]
    if (sample.offsetPercent - previous.offsetPercent < minGapPercent) continue
    if (last.offsetPercent - sample.offsetPercent < minGapPercent) continue
    ticks.push({
      label: sample.timeLabel,
      offsetPercent: sample.offsetPercent,
    })
  }

  ticks.push({ label: last.timeLabel, offsetPercent: last.offsetPercent })
  return ticks
}
