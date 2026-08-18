import clsx from 'clsx'
import { FilterMatchMode } from 'primereact/api'
import { Column } from 'primereact/column'
import type {
  DataTableFilterMeta,
  DataTableSortEvent,
  DataTableStateEvent,
} from 'primereact/datatable'
import { DataTable } from 'primereact/datatable'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  IoCheckmarkSharp,
  IoChevronBack,
  IoChevronForward,
  IoPlaySkipBack,
  IoPlaySkipForward,
} from 'react-icons/io5'
import { Link } from 'react-router-dom'

import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { fetchOntCapaControl } from '@/features/ont/api/capa-control'
import { fetchInfoRealTimeByOlt } from '@/features/ont/api/info-realtime-by-olt'
import { NeighborsEstadoIcon } from '@/features/ont/components/NeighborsEstadoIcon'
import { NeighborsMobileToolbar } from '@/features/ont/components/NeighborsMobileToolbar'
import { NeighborsTableToolbar } from '@/features/ont/components/NeighborsTableToolbar'
import {
  buildRecalculateActionLabel,
  useRecalculateCooldown,
} from '@/features/ont/hooks/use-recalculate-cooldown'
import { useOntTableColumnPreferences } from '@/features/ont/hooks/use-ont-table-column-preferences'
import { resolveCapaControlPortalPresentation } from '@/features/ont/lib/capa-control-portal'
import {
  findGridColumnIndex,
  formatOntMetricCardDateTime,
  resolvePortRealtimeColumnMap,
  rowsToSerialPatches,
  normalizeSerial,
} from '@/features/ont/lib/olt-realtime-metrics-grid'
import {
  buildLastEventTimeBySerial,
  buildNeighborRealtimeCellComparisons,
  formatMetricDisplayValue,
  getFtthOntGridColumnKind,
  getFtthOntGridFilterLayout,
  getOltRxCellClass,
  getOltTxCellClass,
  getOntRxCellClass,
  OltRxMetricSpan,
  OltTxMetricSpan,
  OntRxMetricSpan,
  realtimeCellComparisonKey,
  resolveMetricValueForStyling,
  wrapRealtimeMetricCell,
  type RealtimeCellComparison,
} from '@/features/ont/lib/ftth-grid-metric-styles'
import { formatOntSerial, normalizeOntId } from '@/features/ont/lib/ont-serial'
import type { OntNeighborsGridModel, OltMetricsGridRowRecord } from '@/features/ont/types/ont'
import {
  FTTH_DATA_TABLE_SHELL_PAGE_ROWS_CLASSNAME,
  FTTH_DESKTOP_DATATABLE_FILTER_CLASSNAME,
  ONT_NEIGHBORS_TABLE_FULL_CLASSNAME,
} from '@/features/ont/ui/table/tableClassNames'
import { MobileColumnOrderSheet } from '@/features/ont/ui/table/MobileColumnOrderSheet'

import '@/features/ont/styles/ftth-datatable.css'

type RowsPerPage = 25 | 50 | 100

type NeighborRow = OltMetricsGridRowRecord & {
  capaAccess?: string
  capaIpAddress?: string
  capaPortal?: string
  capaStartTime?: string
  outage?: string
}

type DisplayColumn =
  | { kind: 'data'; preferenceKey: string; name: string; index: number; field: string }
  | {
      kind: 'synthetic'
      preferenceKey: string
      id: 'capaAccess' | 'capaIpAddress' | 'capaPortal' | 'capaStartTime' | 'outage'
      header: string
      field: string
    }

const ROW_OPTIONS: RowsPerPage[] = [25, 50, 100]
const EMPTY = 'Sin Datos'
const CAPA_LOADING = '__capa_loading__'
const REALTIME_LOADING = '__realtime_loading__'
const FILTER_DELAY_MS = 400

type RealtimeFeedback = { kind: 'success' | 'error'; message: string }

interface NeighborsTableProps {
  model: OntNeighborsGridModel
  highlightSerial?: string
  showMap?: boolean
  onToggleMap?: () => void
  onSelectedSerialsChange?: (serials: string[]) => void
  /** Sin borde/card propia: va dentro del split blanco. */
  embedded?: boolean
  realtimeTarget?: { olt: string; slot: string; port: string } | null
  showCompare?: boolean
  onCompare?: (selectedSerials: string[]) => void
  onCloseCompare?: () => void
  /**
   * Título del toolbar desktop.
   * `null` = sin título (p. ej. puerto, ya hay h2 en la card).
   * `undefined` = default vecinos.
   */
  toolbarTitle?: string | null
  /** Preferencia de columnas BFF (`ont` | `puerto` | …). Default `ont`. */
  tablePreferenceId?: string
  /** Empty/issue shell title when no columns. */
  emptyTitle?: string
  emptyContext?: string
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

function cellValue(row: NeighborRow, columnIndex: number): string {
  const raw = String(row[`c${columnIndex}`] ?? '').trim()
  return raw.length > 0 ? raw : EMPTY
}

function findColumnIndex(columnNames: string[], pattern: RegExp): number {
  return columnNames.findIndex((name) => pattern.test(name))
}

function buildDisplayColumns(columnNames: string[]): DisplayColumn[] {
  const columns: DisplayColumn[] = columnNames.map((name, index) => ({
    kind: 'data',
    preferenceKey: name,
    name,
    index,
    field: `c${index}`,
  }))

  const estadoIdx = findColumnIndex(columnNames, /^estado$/i)
  const serialIdx = findColumnIndex(columnNames, /serial/i)
  const insertAt = (estadoIdx >= 0 ? estadoIdx : serialIdx >= 0 ? serialIdx : -1) + 1

  const synthetic: DisplayColumn[] = [
    {
      kind: 'synthetic',
      preferenceKey: 'capaAccess',
      id: 'capaAccess',
      header: 'Access',
      field: 'capaAccess',
    },
    {
      kind: 'synthetic',
      preferenceKey: 'capaIpAddress',
      id: 'capaIpAddress',
      header: 'IP',
      field: 'capaIpAddress',
    },
    {
      kind: 'synthetic',
      preferenceKey: 'capaPortal',
      id: 'capaPortal',
      header: 'Portal',
      field: 'capaPortal',
    },
    {
      kind: 'synthetic',
      preferenceKey: 'capaStartTime',
      id: 'capaStartTime',
      header: 'Levantó por última vez',
      field: 'capaStartTime',
    },
    {
      kind: 'synthetic',
      preferenceKey: 'outage',
      id: 'outage',
      header: 'Outage',
      field: 'outage',
    },
  ]

  if (insertAt <= 0) return [...columns, ...synthetic]
  return [...columns.slice(0, insertAt), ...synthetic, ...columns.slice(insertAt)]
}

function formatCapaStartTime(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return EMPTY
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

function buildEmptyFilters(fields: string[]): DataTableFilterMeta {
  const filters: DataTableFilterMeta = {}
  for (const field of fields) {
    filters[field] = { value: null, matchMode: FilterMatchMode.CONTAINS }
  }
  return filters
}

function readFilterText(entry: unknown): string {
  if (!entry || typeof entry !== 'object') return ''
  const source = entry as { value?: unknown; constraints?: Array<{ value?: unknown }> }
  const raw = Object.hasOwn(source, 'value')
    ? source.value
    : (source.constraints?.[0]?.value ?? null)
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

function isNumericLike(value: string): boolean {
  const normalized = value.replace(',', '.').trim()
  if (!normalized || normalized === EMPTY) return false
  return /^-?\d+(\.\d+)?$/.test(normalized)
}

function compareValues(a: string, b: string): number {
  if (isNumericLike(a) && isNumericLike(b)) {
    return Number(a.replace(',', '.')) - Number(b.replace(',', '.'))
  }
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

function PortalCell({ portal }: { portal: string | undefined }) {
  if (!portal || portal === CAPA_LOADING) {
    return <CapaSpinner />
  }
  if (portal === EMPTY) {
    return <span className="text-(--text-secondary)">{EMPTY}</span>
  }

  const presentation = resolveCapaControlPortalPresentation(
    portal === '—' ? null : portal,
    { allOtherFieldsEmpty: portal === EMPTY },
  )
  const title = `${presentation.displayCode} · ${presentation.description}`

  if (presentation.tone === 'green') {
    return (
      <span title={title} className="inline-flex">
        <IoCheckmarkSharp
          size={15}
          className="rounded-full bg-(--state-01) p-px text-white"
          aria-label={title}
        />
      </span>
    )
  }

  if (presentation.tone === 'red') {
    return (
      <span title={title} className="inline-flex text-(--state-03)">
        {presentation.displayCode}
      </span>
    )
  }

  return (
    <span title={title} className="text-(--text-secondary)">
      {presentation.displayCode}
    </span>
  )
}

function CapaSpinner() {
  return (
    <div
      className="flex min-h-[1.35rem] items-center justify-center py-0.5"
      role="status"
      aria-busy="true"
    >
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent dark:border-violet-400 dark:border-t-transparent" />
    </div>
  )
}

function CapaTextCell({ value }: { value: string | undefined }) {
  if (!value || value === CAPA_LOADING) return <CapaSpinner />
  return <span className={value === EMPTY ? 'text-(--text-secondary)' : undefined}>{value}</span>
}

export function NeighborsTable({
  model,
  highlightSerial,
  showMap = false,
  onToggleMap,
  onSelectedSerialsChange,
  embedded = false,
  realtimeTarget = null,
  showCompare = false,
  onCompare,
  onCloseCompare,
  toolbarTitle,
  tablePreferenceId = 'ont',
  emptyTitle = 'Información de las ONT vecinas',
  emptyContext = 'los vecinos del puerto',
}: NeighborsTableProps) {
  const isDesktop = useIsDesktop()
  const { columnNames } = model
  const displayColumns = useMemo(() => buildDisplayColumns(columnNames), [columnNames])
  const serialColIndex = useMemo(
    () => findColumnIndex(columnNames, /serial/i),
    [columnNames],
  )
  const realtimeColumnMap = useMemo(
    () => resolvePortRealtimeColumnMap(columnNames),
    [columnNames],
  )
  const preferenceKeys = useMemo(
    () => displayColumns.map((column) => column.preferenceKey),
    [displayColumns],
  )
  const labelByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const column of displayColumns) {
      map.set(
        column.preferenceKey,
        column.kind === 'data' ? column.name : column.header,
      )
    }
    return map
  }, [displayColumns])

  const {
    columnOrderItems,
    defaultColumnOrderItems,
    visibleColumnKeys,
    applyFromColumnOrderItems,
  } = useOntTableColumnPreferences({
    tableId: tablePreferenceId,
    columnKeys: preferenceKeys,
    isDesktop,
    labelByKey,
  })

  const visibleColumns = useMemo(() => {
    const byKey = new Map(displayColumns.map((column) => [column.preferenceKey, column]))
    return visibleColumnKeys
      .map((key) => byKey.get(key))
      .filter((column): column is DisplayColumn => Boolean(column))
  }, [displayColumns, visibleColumnKeys])

  const filterFields = useMemo(
    () => visibleColumns.map((column) => column.field),
    [visibleColumns],
  )

  const baseRows = useMemo<NeighborRow[]>(
    () =>
      model.rows.map((row) => ({
        ...row,
        outage: EMPTY,
      })),
    [model.rows],
  )

  const [tableRows, setTableRows] = useState<NeighborRow[]>(baseRows)
  const [selectedRows, setSelectedRows] = useState<NeighborRow[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [columnSheetOpen, setColumnSheetOpen] = useState(false)
  const [filters, setFilters] = useState<DataTableFilterMeta>(() =>
    buildEmptyFilters(filterFields),
  )
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(0)
  const [first, setFirst] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPage>(25)
  const [realtimeLoading, setRealtimeLoading] = useState(false)
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealtimeFeedback | null>(null)
  const [realtimeCellComparisons, setRealtimeCellComparisons] = useState<
    Record<string, RealtimeCellComparison>
  >({})
  const [lastEventTimeBySerial, setLastEventTimeBySerial] = useState<Record<string, string>>(
    {},
  )
  const { secondsRemaining, isOnCooldown, startCooldown } = useRecalculateCooldown()

  const estadoColIndex = useMemo(
    () => findColumnIndex(columnNames, /^estado$/i),
    [columnNames],
  )

  useEffect(() => {
    setTableRows((previous) =>
      baseRows.map((row) => {
        const prior = previous.find((item) => item.rowKey === row.rowKey)
        if (
          !prior ||
          prior.capaAccess === undefined ||
          prior.capaAccess === CAPA_LOADING
        ) {
          return row
        }
        return {
          ...row,
          capaAccess: prior.capaAccess,
          capaIpAddress: prior.capaIpAddress,
          capaPortal: prior.capaPortal,
          capaStartTime: prior.capaStartTime,
        }
      }),
    )
    setSelectedRows([])
    setShowOnlySelected(false)
    setSortField(undefined)
    setSortOrder(0)
    setFirst(0)
    setRealtimeFeedback(null)
    setRealtimeCellComparisons({})
    setLastEventTimeBySerial({})
  }, [baseRows])

  useEffect(() => {
    setFilters((previous) => {
      const next = buildEmptyFilters(filterFields)
      for (const field of filterFields) {
        if (previous[field]) next[field] = previous[field]
      }
      return next
    })
  }, [filterFields])

  useEffect(() => {
    if (!realtimeFeedback) return
    const id = window.setTimeout(() => setRealtimeFeedback(null), 7000)
    return () => window.clearTimeout(id)
  }, [realtimeFeedback])

  useEffect(() => {
    if (!onSelectedSerialsChange) return
    if (serialColIndex < 0) {
      onSelectedSerialsChange([])
      return
    }
    const serials = selectedRows
      .map((row) => cellValue(row, serialColIndex))
      .filter((serial) => serial && serial !== EMPTY && serial !== REALTIME_LOADING)
    onSelectedSerialsChange(serials)
  }, [selectedRows, serialColIndex, onSelectedSerialsChange])

  const getSelectedSerials = useCallback(() => {
    if (serialColIndex < 0) return []
    return selectedRows
      .map((row) => cellValue(row, serialColIndex))
      .filter((serial) => serial && serial !== EMPTY && serial !== REALTIME_LOADING)
  }, [selectedRows, serialColIndex])

  const handleRealtimeRecalculate = useCallback(async () => {
    if (
      !realtimeTarget ||
      tableRows.length === 0 ||
      isOnCooldown ||
      realtimeLoading ||
      !realtimeColumnMap
    ) {
      return
    }

    startCooldown()
    const tableRowsBeforeLoading = tableRows
    const selectedRowsBeforeLoading = selectedRows
    setRealtimeFeedback(null)
    setRealtimeLoading(true)
    setRealtimeCellComparisons({})

    const fechaEncuestaIdx = findGridColumnIndex(columnNames, [
      'fecha de encuesta',
      'fecha encuesta',
    ])

    const markLoading = (row: NeighborRow): NeighborRow => {
      const next: NeighborRow = { ...row }
      for (const columnIndex of Object.values(realtimeColumnMap.fieldToColIndex)) {
        if (columnIndex === undefined) continue
        next[`c${columnIndex}`] = REALTIME_LOADING
      }
      if (fechaEncuestaIdx >= 0) {
        next[`c${fechaEncuestaIdx}`] = REALTIME_LOADING
      }
      return next
    }

    setTableRows((prev) => prev.map(markLoading))
    setSelectedRows((prev) => prev.map(markLoading))

    try {
      const result = await fetchInfoRealTimeByOlt(realtimeTarget)
      if (!result.ok) {
        setTableRows(tableRowsBeforeLoading)
        setSelectedRows(selectedRowsBeforeLoading)
        setRealtimeFeedback({
          kind: 'error',
          message: neighborRealtimeErrorMessage(result.error),
        })
        return
      }

      const patches = rowsToSerialPatches(result.data, realtimeColumnMap.fieldToColIndex)

      if (fechaEncuestaIdx >= 0) {
        for (const apiRow of result.data) {
          const serial = normalizeSerial(apiRow.serial)
          const patch = serial ? patches.get(serial) : undefined
          if (!patch) continue
          const fecha = formatOntMetricCardDateTime(apiRow.eventTime)
          if (fecha !== 'Sin Datos') {
            patch[`c${fechaEncuestaIdx}`] = fecha
          }
        }
      }

      if (patches.size === 0) {
        setTableRows(tableRowsBeforeLoading)
        setSelectedRows(selectedRowsBeforeLoading)
        setRealtimeFeedback({
          kind: 'error',
          message: 'El recálculo no devolvió columnas compatibles con la tabla.',
        })
        return
      }

      const applyPatches = (rowsToPatch: NeighborRow[]) =>
        rowsToPatch.map((row) => {
          const serial = normalizeSerial(String(row[`c${realtimeColumnMap.serialIdx}`] ?? ''))
          const patch = serial ? patches.get(serial) : undefined
          return patch ? { ...row, ...patch } : row
        })

      setTableRows((prev) => applyPatches(prev))
      setSelectedRows((prev) => applyPatches(prev))
      setRealtimeCellComparisons(
        buildNeighborRealtimeCellComparisons({
          rowsBeforeRecalculation: tableRowsBeforeLoading,
          apiRows: result.data,
          serialIdx: realtimeColumnMap.serialIdx,
          fieldToColIndex: realtimeColumnMap.fieldToColIndex,
          previousEventTimeBySerial: lastEventTimeBySerial,
        }),
      )
      setLastEventTimeBySerial((prev) => buildLastEventTimeBySerial(prev, result.data))
      setRealtimeFeedback({
        kind: 'success',
        message: 'Métricas en tiempo real actualizadas para las ONT de este puerto.',
      })
    } catch {
      setTableRows(tableRowsBeforeLoading)
      setSelectedRows(selectedRowsBeforeLoading)
      setRealtimeFeedback({
        kind: 'error',
        message: neighborRealtimeErrorMessage('unknown'),
      })
    } finally {
      setRealtimeLoading(false)
    }
  }, [
    columnNames,
    isOnCooldown,
    lastEventTimeBySerial,
    realtimeColumnMap,
    realtimeLoading,
    realtimeTarget,
    selectedRows,
    startCooldown,
    tableRows,
  ])

  const canRecalculate =
    Boolean(realtimeTarget) &&
    Boolean(realtimeColumnMap) &&
    tableRows.length > 0 &&
    !isOnCooldown &&
    !realtimeLoading

  const recalculateLabel = buildRecalculateActionLabel({
    isLoading: realtimeLoading,
    cooldownSeconds: secondsRemaining,
  })

  const sortedRows = useMemo(() => {
    if (!sortField || sortOrder === 0) return tableRows
    const next = [...tableRows]
    next.sort((a, b) => {
      const left = String(a[sortField] ?? '')
      const right = String(b[sortField] ?? '')
      const cmp = compareValues(left, right)
      return sortOrder === 1 ? cmp : -cmp
    })
    return next
  }, [tableRows, sortField, sortOrder])

  const filteredRows = useMemo(() => {
    const source = showOnlySelected ? selectedRows : sortedRows
    return source.filter((row) =>
      filterFields.every((field) => {
        const query = readFilterText(filters[field])
        if (!query) return true
        const value = String(row[field] ?? '').toLowerCase()
        if (field.startsWith('c') && /serial/i.test(columnNames[Number(field.slice(1))] ?? '')) {
          return (
            value.includes(query) ||
            formatOntSerial(value).toLowerCase().includes(query)
          )
        }
        return value.includes(query)
      }),
    )
  }, [
    sortedRows,
    selectedRows,
    showOnlySelected,
    filterFields,
    filters,
    columnNames,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const currentPage = Math.min(Math.floor(first / rowsPerPage) + 1, totalPages)
  const pageRows = useMemo(() => {
    if (showOnlySelected) return filteredRows
    const start = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, currentPage, rowsPerPage, showOnlySelected])

  useEffect(() => {
    const maxFirst = Math.max(0, (totalPages - 1) * rowsPerPage)
    if (first > maxFirst) setFirst(maxFirst)
  }, [first, rowsPerPage, totalPages])

  const pageRowsKey = pageRows.map((row) => row.rowKey).join('|')

  useEffect(() => {
    if (serialColIndex < 0 || pageRows.length === 0) return
    const controller = new AbortController()

    const targets = pageRows
      .map((row) => {
        const raw = cellValue(row, serialColIndex)
        if (!raw || raw === EMPTY || raw === REALTIME_LOADING) return null
        const serial = (normalizeOntId(raw) || raw).toLowerCase()
        if (row.capaAccess !== undefined && row.capaAccess !== CAPA_LOADING) return null
        return { rowKey: row.rowKey, serial }
      })
      .filter((item): item is { rowKey: string; serial: string } => Boolean(item))

    if (targets.length === 0) return

    setTableRows((prev) =>
      prev.map((row) => {
        if (!targets.some((t) => t.rowKey === row.rowKey)) return row
        if (row.capaAccess !== undefined && row.capaAccess !== CAPA_LOADING) return row
        return {
          ...row,
          capaAccess: CAPA_LOADING,
          capaIpAddress: CAPA_LOADING,
          capaPortal: CAPA_LOADING,
          capaStartTime: CAPA_LOADING,
        }
      }),
    )

    void Promise.all(
      targets.map(async ({ rowKey, serial }) => {
        const result = await fetchOntCapaControl(serial, false, controller.signal)
        if (controller.signal.aborted) return

        const patch: Partial<NeighborRow> =
          !result.ok || result.data.error
            ? {
                capaAccess: EMPTY,
                capaIpAddress: EMPTY,
                capaPortal: EMPTY,
                capaStartTime: EMPTY,
              }
            : {
                capaAccess: result.data.access.trim() || EMPTY,
                capaIpAddress: result.data.ipAddress.trim() || EMPTY,
                capaPortal:
                  result.data.portal === null || result.data.portal === undefined
                    ? '—'
                    : result.data.portal.trim() || EMPTY,
                capaStartTime: formatCapaStartTime(result.data.startTime),
              }

        setTableRows((prev) =>
          prev.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)),
        )
        setSelectedRows((prev) =>
          prev.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)),
        )
      }),
    )

    return () => controller.abort()
    // pageRows se lee vía pageRowsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita re-fetch por identidad de pageRows
  }, [pageRowsKey, serialColIndex])

  const highlightHex = highlightSerial?.trim().toLowerCase() ?? ''

  const showRowFilters = isDesktop && showFilters
  const hasActiveFilters =
    showRowFilters &&
    filterFields.some((field) => Boolean(readFilterText(filters[field])))

  const handleCompareClick = () => {
    if (showCompare) {
      onCloseCompare?.()
      return
    }
    const serials = getSelectedSerials()
    if (serials.length < 2) return
    onCompare?.(serials)
  }

  const handleToggleSelectionFilter = () => {
    if (showOnlySelected) {
      setShowOnlySelected(false)
      setSelectedRows([])
      return
    }
    if (selectedRows.length === 0) return
    setShowOnlySelected(true)
    setFirst(0)
  }

  const tableClassName = clsx(
    ONT_NEIGHBORS_TABLE_FULL_CLASSNAME,
    !isDesktop && 'ftth-grid-table--mobile-hscroll',
    showRowFilters && FTTH_DESKTOP_DATATABLE_FILTER_CLASSNAME,
    hasActiveFilters && 'ftth-grid-has-active-filter',
    '[&_.p-datatable-table]:w-max',
    '[&_.p-datatable-thead>tr>th]:overflow-visible',
    isDesktop
      ? '[&_.p-datatable-tbody>tr>td]:overflow-visible'
      : '[&_.p-datatable-tbody>tr>td]:overflow-hidden',
    '[&_.p-datatable-tbody>tr>td]:text-ellipsis',
  )

  if (columnNames.length === 0) {
    return (
      <FtthCardIssueState
        title={emptyTitle}
        issue="no-data"
        context={emptyContext}
        cardClassName="rounded-2xl border bg-(--card) p-6 shadow-sm"
        bodyClassName="min-h-[120px]"
      />
    )
  }

  const resolvedToolbarTitle =
    toolbarTitle === undefined ? 'Información de las ONT vecinas' : toolbarTitle

  return (
    <div
      className={clsx(
        FTTH_DATA_TABLE_SHELL_PAGE_ROWS_CLASSNAME,
        'w-full min-w-0 bg-(--table-content)',
        isDesktop
          ? embedded
            ? 'rounded-none border-0 p-0 shadow-none'
            : 'rounded-xl border border-[#d9e0e8] shadow-[0_1px_6px_rgb(15_23_42/0.05)] dark:border-white/10'
          : 'gap-4 rounded-none border-0 bg-transparent p-0 shadow-none',
      )}
    >
      {isDesktop ? (
        <NeighborsTableToolbar
          title={resolvedToolbarTitle}
          showMap={showMap}
          canToggleMap={Boolean(onToggleMap)}
          onToggleMap={onToggleMap}
          canCompare={selectedRows.length >= 2 || showCompare}
          showCompare={showCompare}
          onCompare={handleCompareClick}
          onRecalculate={() => void handleRealtimeRecalculate()}
          recalculateLoading={realtimeLoading}
          recalculateLabel={recalculateLabel}
          canRecalculate={canRecalculate}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          selectedCount={selectedRows.length}
          showOnlySelected={showOnlySelected}
          onToggleSelectionFilter={handleToggleSelectionFilter}
          onOpenColumnOrder={() => setColumnSheetOpen(true)}
        />
      ) : (
        <NeighborsMobileToolbar
          canRecalculate={canRecalculate}
          recalculateLoading={realtimeLoading}
          recalculateLabel={buildRecalculateActionLabel({
            baseLabel: 'Recalcular',
            isLoading: realtimeLoading,
            cooldownSeconds: secondsRemaining,
          })}
          onRecalculate={() => void handleRealtimeRecalculate()}
          canCompare={selectedRows.length >= 2}
          onCompare={handleCompareClick}
          showOnlySelected={showOnlySelected}
          canToggleSelectionFilter={showOnlySelected || selectedRows.length > 0}
          onToggleSelectionFilter={handleToggleSelectionFilter}
          canOpenColumnOrder={preferenceKeys.length > 0}
          onOpenColumnOrder={() => setColumnSheetOpen(true)}
        />
      )}

      {realtimeFeedback ? (
        <div
          className={clsx(
            isDesktop ? 'mx-1 mt-2' : 'mx-3 sm:mx-6',
            'rounded-md border px-3 py-2 text-xs',
            realtimeFeedback.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
          )}
          role="status"
        >
          {realtimeFeedback.message}
        </div>
      ) : null}

      <div
        className={clsx(
          'relative flex min-h-0 min-w-0 flex-col dark:bg-(--card)',
          isDesktop ? '-mx-0 border-t border-black/10 pt-2 dark:border-white/10' : '-mx-3 pt-2',
        )}
      >
        <div className="min-h-0 min-w-0">
          <DataTable
            value={pageRows}
            dataKey="rowKey"
            selection={selectedRows}
            onSelectionChange={(event) => {
              const next = Array.isArray(event.value) ? event.value : []
              setSelectedRows(next)
            }}
            selectionMode="multiple"
            size="small"
            lazy
            paginator={false}
            scrollable={false}
            tableStyle={{ width: 'max-content', minWidth: '100%' }}
            className={tableClassName}
            emptyMessage={
              showOnlySelected ? 'Ningún registro seleccionado' : EMPTY
            }
            filters={showRowFilters ? filters : undefined}
            onFilter={
              showRowFilters
                ? (event: DataTableStateEvent) => {
                    setFilters(event.filters ?? buildEmptyFilters(filterFields))
                    setFirst(0)
                  }
                : undefined
            }
            filterDisplay={showRowFilters ? 'row' : 'menu'}
            filterDelay={showRowFilters ? FILTER_DELAY_MS : undefined}
            filterLocale={showRowFilters ? 'es' : undefined}
            sortMode="single"
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={(event: DataTableSortEvent) => {
              setSortField(event.sortField)
              setSortOrder((event.sortOrder as 1 | -1 | 0) ?? 0)
              setFirst(0)
            }}
            removableSort
            rowClassName={(row) => {
              const serialRaw =
                serialColIndex >= 0 ? cellValue(row, serialColIndex) : ''
              const serialNorm =
                serialRaw && serialRaw !== EMPTY && serialRaw !== REALTIME_LOADING
                  ? (normalizeOntId(serialRaw) || serialRaw).toLowerCase()
                  : ''
              return highlightHex && serialNorm === highlightHex
                ? 'bg-(--primary)/8 dark:bg-(--secondary)/15'
                : ''
            }}
          >
            {isDesktop ? (
              <Column
                header="#"
                body={(_row, options) => {
                  const idx = options.rowIndex ?? 0
                  return showOnlySelected ? idx + 1 : first + idx + 1
                }}
                exportable={false}
              />
            ) : null}
            <Column
              selectionMode="multiple"
              frozen={!isDesktop}
              alignFrozen={!isDesktop ? 'left' : undefined}
              headerClassName={!isDesktop ? 'ftth-mobile-sticky-select' : undefined}
              bodyClassName={!isDesktop ? 'ftth-mobile-sticky-select' : undefined}
            />
            {visibleColumns.map((column) =>
              renderNeighborColumn(column, {
                estadoColIndex,
                realtimeCellComparisons,
                isDesktop,
                enableFilters: showRowFilters,
              }),
            )}
          </DataTable>
        </div>

        {!showOnlySelected ? (
          <div
            className={clsx(
              'flex shrink-0 flex-wrap items-center gap-3 border-t border-(--table-stroke) bg-(--table-content) px-1 pt-2.5',
              isDesktop ? 'justify-between' : 'justify-center',
            )}
          >
            <div className="flex items-center gap-1">
              <PagerButton
                ariaLabel="Primera página"
                disabled={currentPage <= 1}
                onClick={() => setFirst(0)}
              >
                <IoPlaySkipBack size={14} />
              </PagerButton>
              <PagerButton
                ariaLabel="Página anterior"
                disabled={currentPage <= 1}
                onClick={() => setFirst(Math.max(0, first - rowsPerPage))}
              >
                <IoChevronBack size={14} />
              </PagerButton>
              <span className="px-2 text-xs text-(--text-secondary)">
                Página {currentPage} de {totalPages}
              </span>
              <PagerButton
                ariaLabel="Página siguiente"
                disabled={currentPage >= totalPages}
                onClick={() => setFirst(first + rowsPerPage)}
              >
                <IoChevronForward size={14} />
              </PagerButton>
              <PagerButton
                ariaLabel="Última página"
                disabled={currentPage >= totalPages}
                onClick={() => setFirst((totalPages - 1) * rowsPerPage)}
              >
                <IoPlaySkipForward size={14} />
              </PagerButton>
            </div>
            <label className="flex items-center gap-2 text-xs text-(--text-secondary)">
              Filas
              <select
                value={rowsPerPage}
                className="h-8 rounded-md border border-(--table-stroke) bg-(--card) px-2 text-(--text-primary)"
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value) as RowsPerPage)
                  setFirst(0)
                }}
              >
                {ROW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>

      <MobileColumnOrderSheet
        open={columnSheetOpen}
        title="Configurar columnas"
        items={columnOrderItems}
        defaultItems={defaultColumnOrderItems}
        onClose={() => setColumnSheetOpen(false)}
        onApply={(items) => {
          applyFromColumnOrderItems(items)
          setColumnSheetOpen(false)
        }}
      />
    </div>
  )
}

function renderNeighborColumn(
  column: DisplayColumn,
  options: {
    estadoColIndex: number
    realtimeCellComparisons: Record<string, RealtimeCellComparison>
    isDesktop: boolean
    enableFilters: boolean
  },
): ReactNode {
  if (column.kind === 'synthetic') {
    const filterLayout = getFtthOntGridFilterLayout('plain', column.header)
    return (
      <Column
        key={column.field}
        field={column.field}
        header={column.header}
        sortable={column.id !== 'outage' && column.id !== 'capaPortal'}
        filter={options.enableFilters}
        filterPlaceholder={options.enableFilters ? 'Buscar' : undefined}
        showFilterMenu={options.enableFilters}
        showClearButton={options.enableFilters}
        headerClassName={filterLayout?.colClass}
        pt={
          filterLayout
            ? { filterInput: { className: filterLayout.filterInputClass } }
            : undefined
        }
        body={(row: NeighborRow) => {
          if (column.id === 'capaPortal') {
            return <PortalCell portal={row.capaPortal} />
          }
          if (column.id === 'outage') {
            return <span className="text-(--text-secondary)">{EMPTY}</span>
          }
          return <CapaTextCell value={row[column.field]} />
        }}
      />
    )
  }

  const metricKind = getFtthOntGridColumnKind(column.name)
  const isEstado = metricKind === 'estado'
  const isSerial = metricKind === 'serial'
  const filterLayout = getFtthOntGridFilterLayout(metricKind, column.name)

  return (
    <Column
      key={column.field}
      field={column.field}
      header={column.name}
      sortable
      filter={options.enableFilters}
      filterPlaceholder={options.enableFilters ? 'Buscar' : undefined}
      showFilterMenu={options.enableFilters}
      showClearButton={options.enableFilters}
      headerClassName={filterLayout?.colClass}
      pt={
        filterLayout
          ? { filterInput: { className: filterLayout.filterInputClass } }
          : undefined
      }
      body={(row: NeighborRow) => {
        const raw = String(row[`c${column.index}`] ?? '')
        if (raw === REALTIME_LOADING) return <CapaSpinner />

        const estadoRaw =
          options.estadoColIndex >= 0
            ? String(row[`c${options.estadoColIndex}`] ?? '')
            : ''
        const comparison =
          options.realtimeCellComparisons[
            realtimeCellComparisonKey(row.rowKey, column.field)
          ]

        if (isEstado) {
          return <NeighborsEstadoIcon estadoRaw={raw.trim() || EMPTY} />
        }

        if (isSerial) {
          const value = raw.trim() || EMPTY
          if (value === EMPTY) {
            return <span className="text-(--text-secondary)">{EMPTY}</span>
          }
          const display =
            !options.isDesktop && value.length > 6
              ? `${value.slice(0, 4)}...${value.slice(-4)}`
              : value
          return (
            <Link
              to={`/ftth/ont/${encodeURIComponent(value)}/info`}
              className="font-medium text-(--primary) underline underline-offset-2 decoration-(--primary)/35 hover:decoration-(--primary) dark:text-(--secondary) dark:decoration-(--secondary)/40"
            >
              {display}
            </Link>
          )
        }

        let cell: ReactNode
        if (metricKind === 'ontRx') {
          cell = <OntRxMetricSpan value={raw} estadoRaw={estadoRaw} />
        } else if (metricKind === 'oltRx') {
          cell = <OltRxMetricSpan value={raw} estadoRaw={estadoRaw} />
        } else if (metricKind === 'oltTx') {
          cell = <OltTxMetricSpan value={raw} estadoRaw={estadoRaw} />
        } else if (metricKind === 'ontTx') {
          const display = formatMetricDisplayValue(raw, estadoRaw)
          cell = (
            <span className={display === EMPTY ? 'text-(--text-secondary)' : undefined}>
              {display}
            </span>
          )
        } else {
          const value = raw.trim() || EMPTY
          cell = (
            <span className={value === EMPTY ? 'text-(--text-secondary)' : undefined}>
              {value}
            </span>
          )
        }

        return wrapRealtimeMetricCell({
          cell,
          comparison,
          kind: metricKind,
          isDesktop: options.isDesktop,
        })
      }}
      bodyClassName={(row: NeighborRow) => {
        const raw = String(row[`c${column.index}`] ?? '')
        if (raw === REALTIME_LOADING) return ''
        const estadoRaw =
          options.estadoColIndex >= 0
            ? String(row[`c${options.estadoColIndex}`] ?? '')
            : ''
        const styleValue = resolveMetricValueForStyling(raw, estadoRaw)
        if (metricKind === 'ontRx') return getOntRxCellClass(styleValue)
        if (metricKind === 'oltRx') return getOltRxCellClass(styleValue)
        if (metricKind === 'oltTx') return getOltTxCellClass(styleValue)
        return ''
      }}
    />
  )
}

function neighborRealtimeErrorMessage(
  error: 'auth' | 'bff' | 'validation' | 'unknown',
): string {
  switch (error) {
    case 'validation':
      return 'OLT, slot o puerto inválidos para la solicitud en tiempo real.'
    case 'bff':
      return 'El servicio en tiempo real respondió con error o sin datos.'
    case 'auth':
      return 'Sesión expirada o sin permisos. Volvé a iniciar sesión.'
    default:
      return 'No se pudieron actualizar los datos. Intentá de nuevo en unos segundos.'
  }
}

function PagerButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--table-stroke) text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  )
}
