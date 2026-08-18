import { findGridColumnIndex } from '@/features/ont/lib/olt-realtime-metrics-grid'

export const FTTH_ONT_GRID_PREVIEW_MAX_COLUMNS = 4

const PRIORITY_CANDIDATES: string[][] = [
  ['serial'],
  ['estado'],
  ['ont rx pwr', 'ont rx'],
  ['olt rx pwr', 'olt rx'],
]

export function pickPreviewColumnIndices(columnNames: string[], maxColumns: number): number[] {
  const picked: number[] = []
  for (const candidates of PRIORITY_CANDIDATES) {
    if (picked.length >= maxColumns) break
    const idx = findGridColumnIndex(columnNames, candidates)
    if (idx >= 0 && !picked.includes(idx)) picked.push(idx)
  }
  for (let i = 0; i < columnNames.length && picked.length < maxColumns; i++) {
    if (!picked.includes(i)) picked.push(i)
  }
  return picked.slice(0, maxColumns)
}
