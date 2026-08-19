import {
  formatOntStatusLabel,
  normalizeOntStatusKey,
  type OntStatusKey,
} from '@/features/ont/lib/ont-status-labels'
import type { PortTreeSeverity } from '@/features/port/types/port-tree'

/** Normaliza `severity` del BFF para el árbol de puerto. */
export function normalizePortTreeSeverity(value: unknown): PortTreeSeverity | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_')
  if (!normalized) return null

  if (normalized === 'GOOD' || normalized === 'OK') return 'GOOD'
  if (
    normalized === 'REDUCED_ROBUSTNESS' ||
    normalized === 'REDUCES_ROBUSTNESS' ||
    normalized === 'REDUCED'
  ) {
    return 'REDUCED_ROBUSTNESS'
  }
  if (normalized === 'DEGRADED') return 'DEGRADED'
  if (normalized === 'SWITCHED_OFF' || normalized === 'SWITCHEDOFF') return 'SWITCHED_OFF'
  if (normalized === 'INTERRUPTED' || normalized === 'INTERRUP') return 'INTERRUPTED'

  return null
}

export function formatPortTreeSeverityLabel(severity: PortTreeSeverity): string {
  return formatOntStatusLabel(severity)
}

export function formatPortTreeSeverityShort(severity: PortTreeSeverity): string {
  const key = normalizeOntStatusKey(severity)
  const short: Partial<Record<OntStatusKey, string>> = {
    GOOD: 'Disp.',
    INTERRUPTED: 'Interr.',
    SWITCHED_OFF: 'Apag.',
    REDUCED_ROBUSTNESS: 'Degr.',
    DEGRADED: 'Degr.',
  }
  if (key in short) return short[key as OntStatusKey] ?? 'S/D'
  return 'S/D'
}

export function portTreeSeverityBadgeClass(severity: PortTreeSeverity): string {
  switch (severity) {
    case 'GOOD':
      return 'bg-[var(--card-green)]/20 text-[var(--card-green)]'
    case 'REDUCED_ROBUSTNESS':
    case 'DEGRADED':
      return 'bg-[var(--card-yellow)]/45 text-(--text-primary)'
    case 'INTERRUPTED':
      return 'bg-[var(--card-red)]/20 text-[var(--card-red)]'
    case 'SWITCHED_OFF':
      return 'bg-(--text-primary)/10 text-(--text-primary)'
    default:
      return 'bg-(--text-secondary)/10 text-(--text-secondary)'
  }
}

export function portTreeSeverityCircleClass(severity?: PortTreeSeverity): string {
  switch (severity) {
    case 'GOOD':
      return 'bg-[var(--card-green)]'
    case 'REDUCED_ROBUSTNESS':
    case 'DEGRADED':
      return 'bg-[var(--card-yellow)]'
    case 'INTERRUPTED':
      return 'bg-[var(--card-red)]'
    case 'SWITCHED_OFF':
      return 'bg-(--text-primary)'
    default:
      return 'bg-(--primary) dark:bg-(--secondary)'
  }
}

export function portTreeSeverityBadgeTone(severity: PortTreeSeverity): {
  fill: string
  text: string
} {
  switch (severity) {
    case 'GOOD':
      return { fill: 'rgb(76 217 100 / 0.18)', text: '#4CD964' }
    case 'REDUCED_ROBUSTNESS':
    case 'DEGRADED':
      return { fill: 'rgb(250 204 21 / 0.22)', text: 'rgb(250 204 21 / 0.95)' }
    case 'INTERRUPTED':
      return { fill: 'rgb(239 68 68 / 0.2)', text: 'rgb(248 113 113 / 0.96)' }
    case 'SWITCHED_OFF':
      return { fill: 'rgb(148 163 184 / 0.3)', text: 'rgb(51 65 85 / 0.98)' }
    default:
      return { fill: 'rgb(148 163 184 / 0.22)', text: 'rgb(100 116 139 / 0.98)' }
  }
}
