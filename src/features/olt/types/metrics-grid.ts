import type { FtthDataIssue } from '@/features/ftth/lib/card-issue'

export interface OltMetricsGridDataSchema {
  columnNames: string[]
  columnDataTypes: string[]
}

export interface OltMetricsGridCoordinate {
  serial: string
  lat: string | null
  lon: string | null
}

export interface BffOltMetricsGridResponse {
  dataSchema: OltMetricsGridDataSchema
  rows: Array<Array<number | null | string>>
  extraData: {
    coordinates: OltMetricsGridCoordinate[]
  }
  pageNumber: number
  pageSize: number
  totalPages: number
  totalRecords: number
}

export interface OltMetricsGridPagingPayload {
  pageNumber: number
  pageSize: number
  allRecords: boolean
  sort: {
    column: string | null
    order: 'asc' | 'desc' | null
  }
  filters: Record<string, unknown>
}

export interface OltMetricsGridPageModel {
  columnNames: string[]
  rows: OltMetricsGridRowRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalRecords: number
}

export type OltMetricsGridPreviewActionResult = {
  model: OltMetricsGridPageModel
  issue: FtthDataIssue
}

export interface OltMetricsGridRowRecord {
  rowKey: string
  [field: string]: string | undefined
}
