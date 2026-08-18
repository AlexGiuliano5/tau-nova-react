import type {
  BffSlotPortMatrix,
  BffSlotPortMatrixCell,
  OltSlotPortCellTotals,
  OltSlotPortGridModel,
  SlotPortSeverity,
} from '@/features/olt/types/slot-port'
import { SlotPortSeverity as Severity } from '@/features/olt/types/slot-port'

export function buildOltSlotPortGridModel(
  oltDisplay: string,
  matrix: BffSlotPortMatrix,
): OltSlotPortGridModel {
  const rows: OltSlotPortGridModel['rows'] = []
  const rowCount = matrix.length
  let totalSlots = 0

  for (let i = 0; i < rowCount; i++) {
    const port = rowCount - 1 - i
    const cells = matrix[i].map((cell) =>
      cell
        ? {
            severity: mapSeverity(cell.severity),
            label: cell.index,
            totals: mapTotals(cell),
          }
        : null,
    )
    if (cells.length > totalSlots) totalSlots = cells.length
    rows.push({ port, cells })
  }

  return { oltDisplay, totalSlots, rows }
}

function mapTotals(cell: BffSlotPortMatrixCell): OltSlotPortCellTotals {
  return {
    good: toCount(cell.good),
    reducedRobustness: toCount(cell.reduced_robustness),
    switchedOff: toCount(cell.switched_off),
    degraded: toCount(cell.degraded),
    interrupted: toCount(cell.interrupted),
  }
}

function toCount(raw: string | undefined): number {
  if (!raw) return 0
  const n = Number.parseInt(raw.trim(), 10)
  return Number.isFinite(n) ? n : 0
}

function mapSeverity(raw: string): SlotPortSeverity {
  const v = raw.trim().toLowerCase()
  switch (v) {
    case Severity.Ok:
      return Severity.Ok
    case Severity.Warning:
      return Severity.Warning
    case Severity.Critical:
      return Severity.Critical
    default:
      return Severity.Ok
  }
}
