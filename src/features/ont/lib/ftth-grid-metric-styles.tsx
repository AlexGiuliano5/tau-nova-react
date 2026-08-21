import type { ReactNode } from 'react'
import clsx from 'clsx'
import { IoRemove, IoTrendingDown, IoTrendingUp } from 'react-icons/io5'

import type { BffInfoRealTimeByOltRow } from '@/features/ont/api/info-realtime-by-olt'
import {
  findGridColumnIndex,
  normalizeSerial,
} from '@/features/ont/lib/olt-realtime-metrics-grid'
import {
  getOntMetricThresholdConfig,
  resolveOntMetricThresholdSegment,
  type OntMetricThresholdTone,
} from '@/features/ont/lib/ont-metric-thresholds'
import { normalizeOntStatusKey } from '@/features/ont/lib/ont-status-labels'

const ONT_RX_THRESHOLDS = { crit: -27, warn: -24.5, poe: -12 }
const OLT_RX_THRESHOLDS = { crit: -30, warn: -27.5, poe: -15 }
/** Olt Tx: valores menores a 4.5 → rojo; el resto verde. */
const OLT_TX_RED_BELOW = 4.5

export type FtthOntGridColumnKind =
  | 'serial'
  | 'estado'
  | 'ontRx'
  | 'ontTx'
  | 'oltRx'
  | 'oltTx'
  | 'plain'

export type RealtimeCellComparison = {
  previousValue: string
  currentValue: string
  previousEventTime: string
  currentEventTime: string
}

export const REALTIME_TOOLTIP_KINDS = new Set<FtthOntGridColumnKind>([
  'ontRx',
  'ontTx',
  'oltRx',
  'oltTx',
])

export function getFtthOntGridColumnKind(columnHeader: string): FtthOntGridColumnKind {
  const single = [columnHeader]
  if (findGridColumnIndex(single, ['serial']) === 0) return 'serial'
  if (findGridColumnIndex(single, ['estado']) === 0) return 'estado'
  if (findGridColumnIndex(single, ['ont rx pwr', 'ont rx']) === 0) return 'ontRx'
  if (findGridColumnIndex(single, ['ont tx pwr', 'ont tx']) === 0) return 'ontTx'
  if (findGridColumnIndex(single, ['olt rx pwr', 'olt rx']) === 0) return 'oltRx'
  if (findGridColumnIndex(single, ['olt tx pwr', 'olt tx']) === 0) return 'oltTx'
  return 'plain'
}

/** Texto libre largo: filtro y columna al máximo (flex). */
const PLAIN_COLUMN_LONG_TEXT_HEADER =
  /descrip|coment|nota|nombre|fabricant|modelo|versi[oó]n|direcc|ubic|address|hostname|usuario|\buser\b/i

/** Valores acotados pero no tan cortos como dBm (fechas, causas, “Sin Datos” frecuente). */
const PLAIN_COLUMN_MEDIUM_HEADER =
  /última|ultima|inactiv|causa|fecha|hora|levantó|levanto|encuesta/i

const PLAIN_SHORT_HEADER_NORMALIZED = new Set([
  'altura',
  'piso',
  'depto',
  'departamento',
  'slot',
  'port',
  'puerto',
  '#',
])

export const FTTH_ONT_GRID_COMPACT_NUMERIC_COL_CLASS = 'ftth-grid-col--compact-numeric'
export const FTTH_ONT_GRID_COMPACT_MEDIUM_COL_CLASS = 'ftth-grid-col--compact-medium'
export const FTTH_ONT_GRID_COMPACT_SHORT_COL_CLASS = 'ftth-grid-col--compact-short'

export type FtthOntGridColumnFilterTier = 'wide' | 'numeric' | 'medium' | 'short'

export type FtthOntGridFilterLayout = {
  colClass: string
  filterInputClass: string
}

function isPlainShortValueHeader(header: string): boolean {
  return PLAIN_SHORT_HEADER_NORMALIZED.has(header.trim().toLowerCase())
}

export function getFtthOntGridColumnFilterTier(
  kind: FtthOntGridColumnKind,
  header: string,
): FtthOntGridColumnFilterTier {
  if (kind === 'serial' || kind === 'estado') return 'wide'
  if (kind === 'ontRx' || kind === 'ontTx' || kind === 'oltRx' || kind === 'oltTx') {
    return 'numeric'
  }
  if (PLAIN_COLUMN_LONG_TEXT_HEADER.test(header)) return 'wide'
  if (isPlainShortValueHeader(header)) return 'short'
  if (PLAIN_COLUMN_MEDIUM_HEADER.test(header)) return 'medium'
  return 'numeric'
}

/** Clases para acotar filtro + columna; `null` si la columna va ancha (serial, estado, texto largo). */
export function getFtthOntGridFilterLayout(
  kind: FtthOntGridColumnKind,
  header: string,
): FtthOntGridFilterLayout | null {
  const tier = getFtthOntGridColumnFilterTier(kind, header)
  if (tier === 'wide') return null
  if (tier === 'short') {
    return {
      colClass: FTTH_ONT_GRID_COMPACT_SHORT_COL_CLASS,
      filterInputClass: 'p-fluid p-column-filter-element ftth-grid-column-filter--compact-short',
    }
  }
  if (tier === 'medium') {
    return {
      colClass: FTTH_ONT_GRID_COMPACT_MEDIUM_COL_CLASS,
      filterInputClass: 'p-fluid p-column-filter-element ftth-grid-column-filter--compact-medium',
    }
  }
  return {
    colClass: FTTH_ONT_GRID_COMPACT_NUMERIC_COL_CLASS,
    filterInputClass: 'p-fluid p-column-filter-element ftth-grid-column-filter--compact',
  }
}

export function getOntRxColor(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return 'var(--text-secondary)'
  if (value < ONT_RX_THRESHOLDS.crit) return 'var(--state-03)'
  if (value < ONT_RX_THRESHOLDS.warn) return 'var(--card-orange)'
  if (value > ONT_RX_THRESHOLDS.poe) return 'var(--primary-2)'
  return 'var(--state-01)'
}

export function getOntRxCellClass(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return ''
  if (value < ONT_RX_THRESHOLDS.crit) return '!bg-(--state-03)/15'
  if (value < ONT_RX_THRESHOLDS.warn) return '!bg-(--card-orange)/15'
  return ''
}

export function getOltRxColor(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return 'var(--text-secondary)'
  if (value < OLT_RX_THRESHOLDS.crit) return 'var(--state-03)'
  if (value < OLT_RX_THRESHOLDS.warn) return 'var(--card-orange)'
  if (value > OLT_RX_THRESHOLDS.poe) return 'var(--state-02)'
  return 'var(--state-01)'
}

export function getOltRxCellClass(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return ''
  if (value < OLT_RX_THRESHOLDS.crit) return '!bg-(--state-03)/15'
  if (value < OLT_RX_THRESHOLDS.warn) return '!bg-(--card-orange)/15'
  return ''
}

export function getOltTxColor(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return 'var(--text-secondary)'
  return value < OLT_TX_RED_BELOW ? 'var(--state-03)' : 'var(--state-01)'
}

export function getOltTxCellClass(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return ''
  return value < OLT_TX_RED_BELOW ? '!bg-(--state-03)/15' : ''
}

function isInterruptedEstado(estadoRaw: string): boolean {
  return normalizeOntStatusKey(estadoRaw) === 'INTERRUPTED'
}

function isZeroLikeMetricValue(value: string): boolean {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return false
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed === 0
}

export function formatMetricDisplayValue(value: string, estadoRaw?: string): string {
  if (estadoRaw && isInterruptedEstado(estadoRaw) && isZeroLikeMetricValue(value)) {
    return 'Sin Datos'
  }
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'Sin Datos'
}

export function resolveMetricValueForStyling(value: string, estadoRaw?: string): string {
  if (estadoRaw && isInterruptedEstado(estadoRaw) && isZeroLikeMetricValue(value)) {
    return ''
  }
  return value
}

const metricPillBaseClassName =
  'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight tabular-nums'

function metricThresholdPillClassName(tone: OntMetricThresholdTone): string {
  switch (tone) {
    case 'red':
      return 'bg-(--tag-state-03) text-(--state-03) dark:bg-(--state-03)/20 dark:text-[#ff9aa0]'
    case 'orange':
    case 'yellow':
      return 'bg-(--tag-state-02) text-[#9a7400] dark:bg-(--state-02)/25 dark:text-[#f0c56a]'
    case 'green':
      return 'bg-(--tag-state-01) text-(--state-01) dark:bg-(--state-01)/20 dark:text-[#9ad48a]'
    case 'blue':
      return 'bg-(--primary-2)/15 text-(--primary-2) dark:bg-(--secondary)/18 dark:text-(--secondary)'
    default:
      return 'bg-(--card-gray) text-(--text-secondary) dark:bg-white/10'
  }
}

function shortenThresholdLabel(label: string): string {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'advertencia') return 'advert.'
  return normalized
}

function ThresholdMetricPill({
  value,
  estadoRaw,
  metricTitle,
}: {
  value: string
  estadoRaw?: string
  metricTitle: string
}) {
  const display = formatMetricDisplayValue(value, estadoRaw)
  if (display === 'Sin Datos') {
    return <span className="text-(--text-secondary)">Sin Datos</span>
  }

  const styleValue = resolveMetricValueForStyling(value, estadoRaw)
  const parsed = Number.parseFloat(styleValue.replace(',', '.'))
  const config = getOntMetricThresholdConfig(metricTitle)
  const segment =
    config && Number.isFinite(parsed)
      ? resolveOntMetricThresholdSegment(parsed, config)
      : null

  if (!segment || segment.tone === 'green') {
    return <span>{display}</span>
  }

  const suffix = shortenThresholdLabel(segment.label)
  return (
    <span
      title={`${display} · ${segment.label}`}
      className={clsx(metricPillBaseClassName, metricThresholdPillClassName(segment.tone))}
    >
      {display} · {suffix}
    </span>
  )
}

export function OntRxMetricSpan({
  value,
  estadoRaw,
}: {
  value: string
  estadoRaw?: string
}) {
  return <ThresholdMetricPill value={value} estadoRaw={estadoRaw} metricTitle="ONT RX" />
}

export function OltRxMetricSpan({
  value,
  estadoRaw,
}: {
  value: string
  estadoRaw?: string
}) {
  return <ThresholdMetricPill value={value} estadoRaw={estadoRaw} metricTitle="OLT RX" />
}

export function OltTxMetricSpan({
  value,
  estadoRaw,
}: {
  value: string
  estadoRaw?: string
}) {
  return <ThresholdMetricPill value={value} estadoRaw={estadoRaw} metricTitle="OLT TX" />
}

function parseRealtimeMetricNumber(value: string): number | null {
  const normalized = value.trim()
  if (!normalized || normalized === 'Sin Datos') return null
  const parsed = Number.parseFloat(normalized.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function toNonEmptyRealtimeValue(value: string): string {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'Sin Datos'
}

export function getRealtimeRecalculationDirection(
  previousValue: string,
  currentValue: string,
): 'up' | 'down' | 'equal' {
  const previousNumericValue = parseRealtimeMetricNumber(previousValue)
  const currentNumericValue = parseRealtimeMetricNumber(currentValue)

  if (previousNumericValue !== null && currentNumericValue !== null) {
    if (currentNumericValue === previousNumericValue) return 'equal'
    if (currentNumericValue < previousNumericValue) return 'down'
    return 'up'
  }

  const previousLabel = toNonEmptyRealtimeValue(previousValue)
  const currentLabel = toNonEmptyRealtimeValue(currentValue)
  if (previousLabel === currentLabel) return 'equal'
  if (previousLabel !== 'Sin Datos' && currentLabel === 'Sin Datos') return 'down'
  return 'up'
}

/** Badge del ícono ↑/↓ (mismos cortes que ONT Rx en nova). */
export function getRealtimeBadgeClassName(currentValue: string): string {
  const parsedCurrentValue = parseRealtimeMetricNumber(currentValue)
  if (parsedCurrentValue !== null) {
    if (parsedCurrentValue < -27) {
      return 'border border-(--card-red)/45 bg-(--card-red)/12 text-(--card-red)'
    }
    if (parsedCurrentValue < -24.5) {
      return 'border border-(--card-orange)/45 bg-(--card-orange)/12 text-(--card-orange)'
    }
    if (parsedCurrentValue > -12) {
      return 'border border-(--primary-2)/35 bg-(--primary-2)/12 text-(--primary-2)'
    }
    return 'border border-(--card-green)/45 bg-(--card-green)/12 text-(--state-01)'
  }
  return 'border border-(--secondary)/35 bg-(--violeta-iconos-teco)/70 text-(--secondary-3)'
}

export function realtimeCellComparisonKey(rowKey: string, field: string): string {
  return `${rowKey}::${field}`
}

export function formatRealtimeEventTimeLabel(value: string): string {
  const normalized = value.trim()
  if (!normalized) return 'Sin Datos'
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return normalized
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

function toRealtimeCellValue(value: string): string {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'Sin Datos'
}

export function buildNeighborRealtimeCellComparisons(input: {
  rowsBeforeRecalculation: Array<{ rowKey: string; [key: string]: unknown }>
  apiRows: BffInfoRealTimeByOltRow[]
  serialIdx: number
  fieldToColIndex: Partial<Record<keyof BffInfoRealTimeByOltRow, number>>
  previousEventTimeBySerial: Record<string, string>
}): Record<string, RealtimeCellComparison> {
  const bySerial = new Map<string, BffInfoRealTimeByOltRow>()
  for (const apiRow of input.apiRows) {
    const serialKey = normalizeSerial(apiRow.serial)
    if (serialKey) bySerial.set(serialKey, apiRow)
  }

  const comparisons: Record<string, RealtimeCellComparison> = {}

  for (const row of input.rowsBeforeRecalculation) {
    const serialKey = normalizeSerial(String(row[`c${input.serialIdx}`] ?? ''))
    if (!serialKey) continue
    const apiRow = bySerial.get(serialKey)
    if (!apiRow) continue

    const previousEventTime = input.previousEventTimeBySerial[serialKey] ?? ''
    const currentEventTime = apiRow.eventTime ?? ''

    for (const [apiKey, columnIndex] of Object.entries(input.fieldToColIndex) as Array<
      [keyof BffInfoRealTimeByOltRow, number | undefined]
    >) {
      if (columnIndex === undefined) continue
      const field = `c${columnIndex}`
      comparisons[realtimeCellComparisonKey(row.rowKey, field)] = {
        previousValue: String(row[field] ?? ''),
        currentValue: toRealtimeCellValue(String(apiRow[apiKey] ?? '')),
        previousEventTime,
        currentEventTime,
      }
    }
  }

  return comparisons
}

export function buildLastEventTimeBySerial(
  previousBySerial: Record<string, string>,
  apiRows: BffInfoRealTimeByOltRow[],
): Record<string, string> {
  const nextBySerial = { ...previousBySerial }
  for (const apiRow of apiRows) {
    const serialKey = normalizeSerial(apiRow.serial)
    if (serialKey) nextBySerial[serialKey] = apiRow.eventTime ?? ''
  }
  return nextBySerial
}

export function wrapRealtimeMetricCell(options: {
  cell: ReactNode
  comparison?: RealtimeCellComparison
  kind: FtthOntGridColumnKind
  isDesktop: boolean
}): ReactNode {
  const { cell, comparison, kind, isDesktop } = options
  if (!comparison) return cell

  const direction = getRealtimeRecalculationDirection(
    comparison.previousValue,
    comparison.currentValue,
  )

  const badged = (
    <div className="inline-flex items-center justify-center gap-1">
      <span>{cell}</span>
      <span
        className={clsx(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          getRealtimeBadgeClassName(comparison.currentValue),
        )}
        title={
          direction === 'down'
            ? 'Valor recalculado hacia abajo'
            : direction === 'equal'
              ? 'Valor recalculado sin cambios'
              : 'Valor recalculado hacia arriba'
        }
      >
        {direction === 'down' ? (
          <IoTrendingDown className="h-2.5 w-2.5 shrink-0" />
        ) : direction === 'equal' ? (
          <IoRemove className="h-2.5 w-2.5 shrink-0" />
        ) : (
          <IoTrendingUp className="h-2.5 w-2.5 shrink-0" />
        )}
      </span>
    </div>
  )

  if (!REALTIME_TOOLTIP_KINDS.has(kind) || !isDesktop) {
    return badged
  }

  return (
    <div className="group relative inline-flex items-center justify-center">
      {badged}
      <div className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-30 hidden w-[320px] -translate-x-1/2 rounded-lg border border-black/10 bg-white/95 p-2 text-[11px] text-(--text-primary) shadow-[0_8px_20px_rgb(0_0_0/0.2)] backdrop-blur-[1px] group-hover:block group-focus-within:block dark:border-white/15 dark:bg-(--card)">
        <div className="grid grid-cols-2 gap-x-2 text-center text-(--text-secondary)">
          <span>Valor anterior</span>
          <span>Valor actual</span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-2 text-center">
          <span className="truncate rounded-md border border-black/10 bg-black/5 px-1.5 py-1 font-semibold dark:border-white/15 dark:bg-white/5">
            {toNonEmptyRealtimeValue(comparison.previousValue)}
          </span>
          <span className="truncate rounded-md border border-black/10 bg-black/5 px-1.5 py-1 font-semibold dark:border-white/15 dark:bg-white/5">
            {toNonEmptyRealtimeValue(comparison.currentValue)}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-2 text-center text-(--text-secondary)">
          <span>Hora anterior</span>
          <span>Hora actual</span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-2 text-center">
          <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-1 text-[10px] leading-tight font-medium whitespace-normal wrap-break-word dark:border-white/15 dark:bg-white/5">
            {formatRealtimeEventTimeLabel(comparison.previousEventTime)}
          </span>
          <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-1 text-[10px] leading-tight font-medium whitespace-normal wrap-break-word dark:border-white/15 dark:bg-white/5">
            {formatRealtimeEventTimeLabel(comparison.currentEventTime)}
          </span>
        </div>
      </div>
    </div>
  )
}
