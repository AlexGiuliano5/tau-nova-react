import type {
  BffOltMetricsGridResponse,
  OltMetricsGridPageModel,
  OltMetricsGridRowRecord,
} from '@/features/olt/types/metrics-grid'

function cellToDisplay(value: unknown): string {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : 'Sin Datos'
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return 'Sin Datos'
}

export function mapOltMetricsGridToRowRecords(
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

export function toOltMetricsGridPageModel(
  data: BffOltMetricsGridResponse,
): OltMetricsGridPageModel {
  const columnNames = data.dataSchema.columnNames
  return {
    columnNames,
    rows: mapOltMetricsGridToRowRecords(columnNames, data.rows),
    pageNumber: data.pageNumber,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    totalRecords: data.totalRecords,
  }
}
