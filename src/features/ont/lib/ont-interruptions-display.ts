import type { OntHistoricDownItem } from '@/features/ont/types/ont'

const MONTH_SHORT_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

export function hasMeaningfulInterruptionValue(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  return normalized.length > 0 && normalized !== '-' && normalized !== 'Sin Datos'
}

export function resolveIsOngoingInterruption(duration: string, dateEnd?: string): boolean {
  // Duración vacía/`-` = caída abierta. Si hay dateEnd significativo, ya cerró.
  if (hasMeaningfulInterruptionValue(dateEnd)) return false
  return !hasMeaningfulInterruptionValue(duration)
}

/** Formatea fechas tipo `01-07`, `01/07` o `2026-07-01` → `01 Jul`. */
export function formatInterruptionDayMonth(date: string): string {
  const normalized = date.trim()
  if (!normalized || normalized === 'Sin Datos') return date

  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const day = Number.parseInt(isoMatch[3], 10)
    const month = Number.parseInt(isoMatch[2], 10)
    return formatDayMonthParts(day, month) ?? date
  }

  const shortMatch = normalized.match(/^(\d{1,2})[-/](\d{1,2})/)
  if (shortMatch) {
    const day = Number.parseInt(shortMatch[1], 10)
    const month = Number.parseInt(shortMatch[2], 10)
    return formatDayMonthParts(day, month) ?? date
  }

  return date
}

function formatDayMonthParts(day: number, month: number): string | null {
  if (!Number.isFinite(day) || !Number.isFinite(month) || month < 1 || month > 12) return null
  const monthLabel = MONTH_SHORT_ES[month - 1]
  return `${String(day).padStart(2, '0')} ${monthLabel}`
}

/** Recorta hora `15:00:00` → `15:00`. */
export function formatInterruptionTime(time: string): string {
  const normalized = time.trim()
  if (!normalized || normalized === 'Sin Datos') return time

  const match = normalized.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return time
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

/**
 * Parsea duraciones del BFF (`1 dias 02 horas`, `45 minutos`, `2 horas`) a minutos.
 * Devuelve null si no se puede interpretar.
 */
export function parseInterruptionDurationToMinutes(duration: string): number | null {
  if (!hasMeaningfulInterruptionValue(duration)) return null

  const normalized = duration
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  let totalMinutes = 0
  let matched = false

  const dayMatch = normalized.match(/(\d+)\s*d[ií]?as?/)
  if (dayMatch) {
    totalMinutes += Number.parseInt(dayMatch[1], 10) * 24 * 60
    matched = true
  }

  const hourMatch = normalized.match(/(\d+)\s*horas?/)
  if (hourMatch) {
    totalMinutes += Number.parseInt(hourMatch[1], 10) * 60
    matched = true
  }

  const minuteMatch = normalized.match(/(\d+)\s*min(?:uto)?s?/)
  if (minuteMatch) {
    totalMinutes += Number.parseInt(minuteMatch[1], 10)
    matched = true
  }

  if (!matched) return null
  return totalMinutes
}

export function formatAccumulatedInterruptionDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 minutos'

  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []

  if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`)
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`)
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`)
  }

  return parts.length === 0 ? '0 minutos' : parts.join(' ')
}

/** Badge corto: `1 día 2 horas` / `45 min`. */
export function formatInterruptionDurationBadge(duration: string): string {
  const minutes = parseInterruptionDurationToMinutes(duration)
  if (minutes === null) return duration

  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const mins = minutes % 60

  if (days > 0 && hours > 0) {
    return `${days} ${days === 1 ? 'día' : 'días'} ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  if (days > 0) return `${days} ${days === 1 ? 'día' : 'días'}`
  if (hours > 0 && mins > 0) return `${hours}h ${mins} min`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  return `${mins} min`
}

export function formatDisplayInterruptionDuration(duration: string): string {
  if (!hasMeaningfulInterruptionValue(duration)) return 'En curso'
  const minutes = parseInterruptionDurationToMinutes(duration)
  if (minutes === null) return duration
  return formatAccumulatedInterruptionDuration(minutes)
}

export function buildInterruptionsSummary(interruptions: OntHistoricDownItem[]): {
  totalCount: number
  accumulatedLabel: string
  lastEventDate: string
  lastEventTime: string
} {
  const totalCount = interruptions.length

  const accumulatedMinutes = interruptions.reduce((sum, item) => {
    if (item.isOngoing) return sum
    const minutes = parseInterruptionDurationToMinutes(item.duration)
    return minutes === null ? sum : sum + minutes
  }, 0)

  const lastItem = [...interruptions].sort((a, b) => {
    const aTime = a.timestampMs ?? 0
    const bTime = b.timestampMs ?? 0
    return bTime - aTime
  })[0]

  return {
    totalCount,
    accumulatedLabel:
      accumulatedMinutes > 0 ? formatAccumulatedInterruptionDuration(accumulatedMinutes) : '—',
    lastEventDate: lastItem ? formatInterruptionDayMonth(lastItem.date) : '—',
    lastEventTime: lastItem ? formatInterruptionTime(lastItem.time) : '',
  }
}

export function sortInterruptionsNewestFirst(
  interruptions: OntHistoricDownItem[],
): OntHistoricDownItem[] {
  return [...interruptions].sort((a, b) => {
    if (a.isOngoing !== b.isOngoing) return a.isOngoing ? -1 : 1
    const aTime = a.timestampMs ?? 0
    const bTime = b.timestampMs ?? 0
    return bTime - aTime
  })
}

export function splitInterruptionDateTime(value: string): { date: string; time: string } {
  const normalized = value.trim()
  if (!normalized) return { date: 'Sin Datos', time: 'Sin Datos' }

  const isoParts = normalized.split('T')
  if (isoParts.length === 2) {
    return {
      date: isoParts[0],
      time: isoParts[1].replace('Z', '').split('.')[0] ?? 'Sin Datos',
    }
  }

  const spacedParts = normalized.split(/\s+/)
  if (spacedParts.length >= 2) {
    return { date: spacedParts[0], time: spacedParts[1] }
  }

  return { date: normalized, time: 'Sin Datos' }
}

export function parseInterruptionTimestamp(value: string): number | null {
  const dateByNativeParser = new Date(value)
  if (!Number.isNaN(dateByNativeParser.getTime())) {
    return dateByNativeParser.getTime()
  }

  const shortMatch = value.trim().match(/^(\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{1,2})/)
  if (!shortMatch) return null

  const day = Number.parseInt(shortMatch[1], 10)
  const month = Number.parseInt(shortMatch[2], 10)
  const hour = Number.parseInt(shortMatch[3], 10)
  const minute = Number.parseInt(shortMatch[4], 10)

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const parsedWithCurrentYear = new Date(currentYear, month - 1, day, hour, minute)
  if (Number.isNaN(parsedWithCurrentYear.getTime())) return null

  if (parsedWithCurrentYear.getTime() - now.getTime() > 24 * 60 * 60 * 1000) {
    const parsedWithPreviousYear = new Date(currentYear - 1, month - 1, day, hour, minute)
    if (!Number.isNaN(parsedWithPreviousYear.getTime())) {
      return parsedWithPreviousYear.getTime()
    }
  }

  return parsedWithCurrentYear.getTime()
}
