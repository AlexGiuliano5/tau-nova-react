import type { FtthDataIssue } from '@/features/ftth/lib/card-issue'

/** Semáforo por celda: verde | amarillo | rojo. */
export enum SlotPortSeverity {
  Ok = 'ok',
  Warning = 'warning',
  Critical = 'critical',
}

export interface BffSlotPortMatrixCell {
  severity: string
  index: string
  up?: string
  down?: string
  good?: string
  reduced_robustness?: string
  switched_off?: string
  degraded?: string
  interrupted?: string
}

export type BffSlotPortMatrix = Array<Array<BffSlotPortMatrixCell | null>>

export interface OltSlotPortCellTotals {
  good: number
  reducedRobustness: number
  switchedOff: number
  degraded: number
  interrupted: number
}

export interface OltSlotPortCellView {
  severity: SlotPortSeverity
  label: string
  totals: OltSlotPortCellTotals
}

export interface OltSlotPortGridModel {
  oltDisplay: string
  totalSlots: number
  rows: Array<{
    port: number
    cells: Array<OltSlotPortCellView | null>
  }>
}

export type OltSlotPortGridActionResult = {
  model: OltSlotPortGridModel | null
  issue: FtthDataIssue
}
