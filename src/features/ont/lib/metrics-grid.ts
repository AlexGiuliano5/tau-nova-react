import type { OltMetricsGridRowRecord } from '@/features/ont/types/ont'

function cellToDisplay(value: unknown): string {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : 'Sin Datos'
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return 'Sin Datos'
}

export function mapMetricsGridToRowRecords(
  columnNames: string[],
  rows: Array<Array<number | string | null>>,
): OltMetricsGridRowRecord[] {
  return rows.map((row, rowIndex) => {
    const record: OltMetricsGridRowRecord = { rowKey: `r-${rowIndex}` }
    for (let i = 0; i < columnNames.length; i++) {
      record[`c${i}`] = cellToDisplay(row[i])
    }
    return record
  })
}

export function toStringOrEmpty(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}
