import { findGridColumnIndex, normalizeSerial } from '@/features/ont/lib/olt-realtime-metrics-grid'
import type { OntNeighborsGridModel } from '@/features/ont/types/ont'

export interface OntNeighborPreviewItem {
  serial: string
  estado: string
  ontRx: string
  oltRx: string
}

/** Filas compactas para el preview mobile de vecinos (como tau-nova). */
export function buildNeighborPreviewItems(
  model: OntNeighborsGridModel,
): OntNeighborPreviewItem[] {
  const { columnNames, rows } = model
  const serialIdx = findGridColumnIndex(columnNames, ['serial'])
  const estadoIdx = findGridColumnIndex(columnNames, ['estado'])
  const ontRxIdx = findGridColumnIndex(columnNames, ['ont rx pwr', 'ont rx'])
  const oltRxIdx = findGridColumnIndex(columnNames, ['olt rx pwr', 'olt rx'])

  if (serialIdx < 0 || estadoIdx < 0 || ontRxIdx < 0 || oltRxIdx < 0) {
    return []
  }

  return rows.map((row) => ({
    serial: cell(row[`c${serialIdx}`]),
    estado: cell(row[`c${estadoIdx}`]),
    ontRx: cell(row[`c${ontRxIdx}`]),
    oltRx: cell(row[`c${oltRxIdx}`]),
  }))
}

export function mergePreviewOntRxRealtime(
  list: OntNeighborPreviewItem[],
  bySerial: Map<string, string>,
): OntNeighborPreviewItem[] {
  return list.map((item) => {
    const hit = bySerial.get(normalizeSerial(item.serial))
    if (!hit) return item
    return { ...item, ontRx: hit }
  })
}

function cell(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : 'Sin Datos'
}
