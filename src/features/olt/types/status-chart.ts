import type { FtthDataIssue } from '@/features/ftth/lib/card-issue'

export type OltStatusTimeFilter = '2H' | '3H' | '6H' | '3D' | '5D' | '7D'

export const OLT_STATUS_TIME_FILTER_OPTIONS: ReadonlyArray<{
  value: OltStatusTimeFilter
  label: string
}> = [
  { value: '2H', label: '2H' },
  { value: '3H', label: '3H' },
  { value: '6H', label: '6H' },
  { value: '3D', label: '3D' },
  { value: '5D', label: '5D' },
  { value: '7D', label: '7D' },
]

export const DEFAULT_OLT_STATUS_TIME_FILTER: OltStatusTimeFilter = '3D'

export const OLT_STATUS_TIME_FILTER_VALUES: readonly OltStatusTimeFilter[] =
  OLT_STATUS_TIME_FILTER_OPTIONS.map((option) => option.value)

export interface BffHistoricStatusOLTResponse {
  olt: string
  slot: string
  port: string
  chartDataTimes: string[]
  chartDataValues: BffChartDataValue[]
}

export interface BffChartDataValue {
  Good: string
  Total: string
  'Switched Off': string
  Interrupted: string
  'Reduced Robustness': string
  Degraded: string
}

export type OltStatusChartRow = {
  x: string
  label: string
  good: number | null
  total: number | null
  switchedOff: number | null
  interrupted: number | null
  degraded: number | null
}

export interface OltStatusGraphResult {
  rows: OltStatusChartRow[]
  issue: FtthDataIssue
}
