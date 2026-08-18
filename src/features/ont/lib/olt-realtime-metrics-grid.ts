import type { BffInfoRealTimeByOltRow } from '@/features/ont/api/info-realtime-by-olt'
import type { OltMetricsGridRowRecord } from '@/features/ont/types/ont'

export const OLT_REALTIME_GRID_FIELD_MAP: ReadonlyArray<{
  apiKey: keyof BffInfoRealTimeByOltRow
  candidates: string[]
}> = [
  { apiKey: 'ontRxPower', candidates: ['ont rx pwr', 'ont rx'] },
  { apiKey: 'ontTxPower', candidates: ['ont tx pwr', 'ont tx'] },
  { apiKey: 'ESTADO', candidates: ['estado'] },
  {
    apiKey: 'ontUpBytes',
    candidates: ['ont up bytes', 'ont up', 'up bytes', 'traffic up', 'trafico us'],
  },
  {
    apiKey: 'ontBiasCurrent',
    candidates: ['ont bias', 'bias current', 'ont biascurrent', 'ont bias current', 'ontbiascurrent'],
  },
  { apiKey: 'ontVoltage', candidates: ['ont volt', 'ont voltage'] },
  {
    apiKey: 'ontTemperature',
    candidates: ['ont temp', 'ont temperature', 'ont temp laser'],
  },
]

export type PortRealtimeColumnMap = {
  serialIdx: number
  fieldToColIndex: Partial<Record<keyof BffInfoRealTimeByOltRow, number>>
}

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function findGridColumnIndex(columnNames: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map((candidate) => normalizeLabel(candidate))
  return columnNames.findIndex((columnName) =>
    normalizedCandidates.includes(normalizeLabel(columnName)),
  )
}

export function normalizeSerial(value: unknown): string {
  if (typeof value === 'string') return value.trim().toLowerCase()
  if (typeof value === 'number') return String(value).trim().toLowerCase()
  return ''
}

export function resolvePortRealtimeColumnMap(
  columnNames: string[],
): PortRealtimeColumnMap | null {
  const serialIdx = findGridColumnIndex(columnNames, ['serial'])
  if (serialIdx < 0) return null

  const fieldToColIndex: Partial<Record<keyof BffInfoRealTimeByOltRow, number>> = {}
  for (const { apiKey, candidates } of OLT_REALTIME_GRID_FIELD_MAP) {
    const idx = findGridColumnIndex(columnNames, candidates)
    if (idx >= 0) fieldToColIndex[apiKey] = idx
  }

  return Object.keys(fieldToColIndex).length > 0
    ? { serialIdx, fieldToColIndex }
    : null
}

function cellDisplayFromApi(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : 'Sin Datos'
}

export function rowsToSerialPatches(
  rows: BffInfoRealTimeByOltRow[],
  fieldToColIndex: Partial<Record<keyof BffInfoRealTimeByOltRow, number>>,
): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>()

  for (const item of rows) {
    const serialKey = normalizeSerial(item.serial)
    if (!serialKey) continue

    const patch: Record<string, string> = {}
    for (const key of Object.keys(fieldToColIndex) as Array<keyof BffInfoRealTimeByOltRow>) {
      const colIdx = fieldToColIndex[key]
      if (colIdx === undefined) continue
      patch[`c${colIdx}`] = cellDisplayFromApi(String(item[key] ?? ''))
    }
    if (Object.keys(patch).length > 0) map.set(serialKey, patch)
  }

  return map
}

export function mergeSerialPatchesIntoRows(
  rows: OltMetricsGridRowRecord[],
  serialIdx: number,
  patches: Map<string, Record<string, string>>,
): OltMetricsGridRowRecord[] {
  return rows.map((row) => {
    const key = normalizeSerial(row[`c${serialIdx}`])
    const patch = key ? patches.get(key) : undefined
    return patch ? { ...row, ...patch } : row
  })
}

export function formatOntMetricCardDateTime(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Sin Datos'
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(parsed)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00'
  return `${read('day')}/${read('month')}/${read('year')}, ${read('hour')}:${read('minute')}:${read('second')}`
}
