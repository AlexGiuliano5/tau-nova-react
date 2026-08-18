import clsx from 'clsx'
import { FilterMatchMode } from 'primereact/api'
import { Column } from 'primereact/column'
import type {
  DataTableFilterMeta,
  DataTableSortEvent,
  DataTableStateEvent,
} from 'primereact/datatable'
import { DataTable } from 'primereact/datatable'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  IoChevronBack,
  IoChevronForward,
  IoPlaySkipBack,
  IoPlaySkipForward,
} from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'

import { CardSpinner } from '@/features/ftth/components/CardSpinner'
import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import type { FtthDisplayIssue } from '@/features/ftth/lib/card-issue'
import {
  fetchOltMetricsGridPage,
  type OltMetricsGridPageSize,
} from '@/features/olt/api/metrics-grid'
import type {
  OltMetricsGridPageModel,
  OltMetricsGridRowRecord,
} from '@/features/olt/types/metrics-grid'
import { NeighborsEstadoIcon } from '@/features/ont/components/NeighborsEstadoIcon'
import { NeighborsTableToolbar } from '@/features/ont/components/NeighborsTableToolbar'
import { useOntTableColumnPreferences } from '@/features/ont/hooks/use-ont-table-column-preferences'
import {
  formatMetricDisplayValue,
  getFtthOntGridColumnKind,
  getOltRxCellClass,
  getOltTxCellClass,
  getOntRxCellClass,
  OltRxMetricSpan,
  OltTxMetricSpan,
  OntRxMetricSpan,
  resolveMetricValueForStyling,
} from '@/features/ont/lib/ftth-grid-metric-styles'
import { MobileColumnOrderSheet } from '@/features/ont/ui/table/MobileColumnOrderSheet'
import {
  FTTH_DATA_TABLE_SHELL_PAGE_ROWS_CLASSNAME,
  FTTH_DESKTOP_DATATABLE_FILTER_CLASSNAME,
  ONT_NEIGHBORS_TABLE_FULL_CLASSNAME,
} from '@/features/ont/ui/table/tableClassNames'

import '@/features/ont/styles/ftth-datatable.css'

export type OltOntMetricsGridPageLoadState = {
  loading: boolean
  blockingIssue: FtthDisplayIssue | null
}

interface Props {
  oltRouteParam: string
  onPageLoadStateChange?: (state: OltOntMetricsGridPageLoadState) => void
  /** Sin borde/card propia: va dentro del split de comparación. */
  embedded?: boolean
  showCompare?: boolean
  onCompare?: (serials: string[]) => void
  onCloseCompare?: () => void
  onSelectedSerialsChange?: (serials: string[]) => void
}


const EMPTY = 'Sin Datos'
const FILTER_DELAY_MS = 400
const ROW_OPTIONS: OltMetricsGridPageSize[] = [25, 50, 100]
const cardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-3'

type SortOrderApi = 'asc' | 'desc' | null

function withRowKeys(data: OltMetricsGridPageModel): OltMetricsGridRowRecord[] {
  return data.rows.map((row, idx) => ({
    ...row,
    rowKey: `p${data.pageNumber}-i${idx}`,
  }))
}

function toPageSize(value: number | undefined): OltMetricsGridPageSize {
  return value === 50 || value === 100 ? value : 25
}

function buildEmptyFilters(fields: string[]): DataTableFilterMeta {
  return Object.fromEntries(
    fields.map((field) => [field, { value: null, matchMode: FilterMatchMode.CONTAINS }]),
  )
}

function readFilterText(entry: unknown): string {
  if (!entry || typeof entry !== 'object') return ''
  const value = (entry as { value?: unknown }).value
  return typeof value === 'string' ? value.trim() : ''
}

export function OltOntMetricsGridFull({
  oltRouteParam,
  onPageLoadStateChange,
  embedded = false,
  showCompare = false,
  onCompare,
  onCloseCompare,
  onSelectedSerialsChange,
}: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [tableRows, setTableRows] = useState<OltMetricsGridRowRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize, setPageSize] = useState<OltMetricsGridPageSize>(25)
  const [pageNumber, setPageNumber] = useState(1)
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(0)
  const [apiSortColumn, setApiSortColumn] = useState<string | null>(null)
  const [apiSortOrder, setApiSortOrder] = useState<SortOrderApi>(null)
  const [filters, setFilters] = useState<DataTableFilterMeta>({})
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRows, setSelectedRows] = useState<OltMetricsGridRowRecord[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [columnSheetOpen, setColumnSheetOpen] = useState(false)
  const [pageLoadIssue, setPageLoadIssue] = useState<FtthDisplayIssue | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const serialColumnIndex = useMemo(
    () => columnNames.findIndex((name) => getFtthOntGridColumnKind(name) === 'serial'),
    [columnNames],
  )
  const estadoColumnIndex = useMemo(
    () => columnNames.findIndex((name) => getFtthOntGridColumnKind(name) === 'estado'),
    [columnNames],
  )

  const preferenceKeys = useMemo(() => columnNames.map((name) => name), [columnNames])
  const labelByKey = useMemo(
    () => new Map(columnNames.map((name) => [name, name] as const)),
    [columnNames],
  )

  const {
    layout: columnLayout,
    columnOrderItems,
    defaultColumnOrderItems,
    applyFromColumnOrderItems,
  } = useOntTableColumnPreferences({
    tableId: 'olt',
    columnKeys: preferenceKeys,
    isDesktop: true,
    labelByKey,
  })

  const visibleColumns = useMemo(() => {
    const order = columnLayout.columnOrder.length
      ? columnLayout.columnOrder
      : preferenceKeys
    const hidden = new Set(columnLayout.hiddenColumns)
    return order
      .filter((key) => !hidden.has(key))
      .map((key) => {
        const index = columnNames.indexOf(key)
        return index >= 0 ? { key, name: key, index, field: `c${index}` } : null
      })
      .filter((col): col is { key: string; name: string; index: number; field: string } =>
        Boolean(col),
      )
  }, [columnLayout.columnOrder, columnLayout.hiddenColumns, columnNames, preferenceKeys])

  const filterFields = useMemo(() => visibleColumns.map((col) => col.field), [visibleColumns])

  useEffect(() => {
    setFilters((prev) => {
      const next = buildEmptyFilters(filterFields)
      for (const field of filterFields) {
        if (prev[field]) next[field] = prev[field]
      }
      return next
    })
  }, [filterFields.join('|')])

  const applyPage = useCallback((model: OltMetricsGridPageModel) => {
    setColumnNames(model.columnNames)
    setTableRows(withRowKeys(model))
    setTotalRecords(model.totalRecords)
    setPageSize(toPageSize(model.pageSize))
    setPageNumber(Math.max(1, model.pageNumber))
  }, [])

  const fetchPage = useCallback(
    async (
      nextPage: number,
      nextPageSize: OltMetricsGridPageSize,
      sortColumn: string | null,
      sortOrd: SortOrderApi,
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setSelectedRows([])
      setShowOnlySelected(false)
      setPageLoadIssue(null)

      try {
        const result = await fetchOltMetricsGridPage(
          oltRouteParam,
          {
            pageNumber: nextPage,
            pageSize: nextPageSize,
            sortColumn,
            sortOrder: sortOrd,
          },
          controller.signal,
        )
        if (controller.signal.aborted) return

        if (!result.ok) {
          setTableRows([])
          setTotalRecords(0)
          setPageLoadIssue(result.error === 'no-data' ? 'no-data' : 'unexpected')
          return
        }

        if (result.model.columnNames.length === 0) {
          setTableRows([])
          setTotalRecords(0)
          setPageLoadIssue('no-data')
          return
        }

        applyPage(result.model)
        setApiSortColumn(sortColumn)
        setApiSortOrder(sortOrd)

        if (sortColumn && sortOrd) {
          const idx = result.model.columnNames.findIndex(
            (name) => name.toLowerCase() === sortColumn.toLowerCase(),
          )
          if (idx >= 0) {
            setSortField(`c${idx}`)
            setSortOrder(sortOrd === 'asc' ? 1 : -1)
          } else {
            setSortField(undefined)
            setSortOrder(0)
          }
        } else {
          setSortField(undefined)
          setSortOrder(0)
        }
        setPageLoadIssue(null)
      } catch {
        if (!controller.signal.aborted) {
          setPageLoadIssue('unexpected')
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setLoading(false)
        }
      }
    },
    [applyPage, oltRouteParam],
  )

  useEffect(() => {
    void fetchPage(1, 25, null, null)
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [fetchPage])

  useEffect(() => {
    onPageLoadStateChange?.({
      loading,
      blockingIssue: !loading && tableRows.length === 0 ? pageLoadIssue : null,
    })
  }, [loading, onPageLoadStateChange, pageLoadIssue, tableRows.length])

  const hasActiveFilters = useMemo(
    () => filterFields.some((field) => Boolean(readFilterText(filters[field]))),
    [filterFields, filters],
  )

  const clientFilteredRows = useMemo(() => {
    if (!hasActiveFilters) return tableRows
    return tableRows.filter((row) =>
      filterFields.every((field) => {
        const query = readFilterText(filters[field]).toLowerCase()
        if (!query) return true
        return String(row[field] ?? '')
          .toLowerCase()
          .includes(query)
      }),
    )
  }, [filterFields, filters, hasActiveFilters, tableRows])

  const displayRows = showOnlySelected
    ? selectedRows
    : hasActiveFilters
      ? clientFilteredRows
      : tableRows

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1)

  const getSelectedSerials = useCallback(() => {
    if (serialColumnIndex < 0) return []
    const field = `c${serialColumnIndex}`
    const serials: string[] = []
    for (const row of selectedRows) {
      const raw = String(row[field] ?? '').trim()
      if (!raw || raw === EMPTY) continue
      if (!serials.includes(raw)) serials.push(raw)
    }
    return serials
  }, [selectedRows, serialColumnIndex])

  useEffect(() => {
    onSelectedSerialsChange?.(getSelectedSerials())
  }, [getSelectedSerials, onSelectedSerialsChange])

  const canCompare = selectedRows.length >= 2 || showCompare

  const handleCompare = () => {
    if (showCompare) {
      onCloseCompare?.()
      return
    }
    const serials = getSelectedSerials()
    if (serials.length < 2) return
    if (onCompare) {
      onCompare(serials)
      return
    }
    // Fallback: página dedicada (p. ej. force full en layouts que no montan el split).
    const params = new URLSearchParams({
      olt: oltRouteParam,
      onts: serials.join(','),
    })
    void navigate(`/ftth/ont/comparar-historicos?${params.toString()}`)
  }

  const handleRecalculate = () => {
    const serials = getSelectedSerials()
    if (serials.length < 2) return
    const params = new URLSearchParams({ onts: serials.join(',') })
    void navigate(`/ftth/herramientas/recalcular-onts?${params.toString()}`)
  }

  const tableClassName = clsx(
    ONT_NEIGHBORS_TABLE_FULL_CLASSNAME,
    showFilters && FTTH_DESKTOP_DATATABLE_FILTER_CLASSNAME,
    hasActiveFilters && 'ftth-grid-has-active-filter',
    '[&_.p-datatable-table]:w-max',
    '[&_.p-datatable-thead>tr>th]:overflow-visible',
    '[&_.p-datatable-tbody>tr>td]:overflow-visible',
  )

  if (!loading && pageLoadIssue && tableRows.length === 0) {
    return (
      <FtthCardIssueState
        title="Información de las ONT"
        issue={pageLoadIssue}
        context="la información de las ONT"
        cardClassName={cardClassName}
        bodyClassName="min-h-[200px]"
      />
    )
  }

  return (
    <div
      className={clsx(
        FTTH_DATA_TABLE_SHELL_PAGE_ROWS_CLASSNAME,
        'w-full min-w-0 bg-(--table-content)',
        embedded
          ? 'h-full min-h-0 overflow-hidden rounded-none border-0'
          : 'm-4 rounded-xl border border-[#d9e0e8] shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 dark:border-white/10',
      )}
    >
      <NeighborsTableToolbar
        title="Información de las ONT"
        showMapButton={false}
        canCompare={canCompare}
        showCompare={showCompare}
        onCompare={handleCompare}
        showRecalculateButton
        canRecalculate={selectedRows.length >= 2}
        onRecalculate={handleRecalculate}
        recalculateLabel="Recalcular ONTs"
        recalculateTooltip="Ir a herramientas con las ONT seleccionadas"
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        selectedCount={selectedRows.length}
        showOnlySelected={showOnlySelected}
        onToggleSelectionFilter={() => {
          if (showOnlySelected) {
            setShowOnlySelected(false)
            setSelectedRows([])
            return
          }
          if (selectedRows.length === 0) return
          setShowOnlySelected(true)
        }}
        onOpenColumnOrder={() => setColumnSheetOpen(true)}
      />

      <div className="relative -mx-1 flex min-h-0 min-w-0 flex-col pt-2 dark:bg-(--card)">
        {loading ? (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px] dark:bg-black/45"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="mx-4 flex h-32 w-[min(18rem,calc(100%-2rem))] items-center justify-center rounded-xl border border-(--table-stroke) bg-(--card) shadow-lg">
              <CardSpinner label="Actualizando tabla…" />
            </div>
          </div>
        ) : null}

        <div
          className={clsx(
            'min-h-0 min-w-0 overflow-x-auto',
            loading && 'min-h-48 opacity-[0.38]',
          )}
        >
          <DataTable
            value={displayRows}
            dataKey="rowKey"
            selection={selectedRows}
            onSelectionChange={(event) => {
              const next = Array.isArray(event.value) ? event.value : []
              setSelectedRows(next)
            }}
            selectionMode="multiple"
            size="small"
            lazy={!showOnlySelected}
            paginator={false}
            scrollable={false}
            tableStyle={{ width: 'max-content', minWidth: '100%' }}
            className={tableClassName}
            emptyMessage={
              showOnlySelected ? 'Ningún registro seleccionado' : EMPTY
            }
            filters={showFilters ? filters : undefined}
            onFilter={
              showFilters
                ? (event: DataTableStateEvent) => {
                    setFilters(event.filters ?? buildEmptyFilters(filterFields))
                  }
                : undefined
            }
            filterDisplay={showFilters ? 'row' : 'menu'}
            filterDelay={showFilters ? FILTER_DELAY_MS : undefined}
            filterLocale={showFilters ? 'es' : undefined}
            sortMode="single"
            sortField={showOnlySelected ? undefined : sortField}
            sortOrder={showOnlySelected ? undefined : sortOrder}
            onSort={
              showOnlySelected
                ? undefined
                : (event: DataTableSortEvent) => {
                    const field = event.sortField
                    const order = (event.sortOrder as 1 | -1 | 0) ?? 0
                    if (!field || order === 0) {
                      void fetchPage(1, pageSize, null, null)
                      return
                    }
                    const idx = Number.parseInt(field.replace(/^c/, ''), 10)
                    const columnName =
                      Number.isFinite(idx) && idx >= 0 ? columnNames[idx] : undefined
                    if (!columnName) return
                    void fetchPage(1, pageSize, columnName, order === 1 ? 'asc' : 'desc')
                  }
            }
            removableSort
          >
            <Column
              header="#"
              body={(_row, options) => {
                const idx = options.rowIndex ?? 0
                return showOnlySelected || hasActiveFilters
                  ? idx + 1
                  : (pageNumber - 1) * pageSize + idx + 1
              }}
              exportable={false}
            />
            <Column selectionMode="multiple" />
            {visibleColumns.map((column) =>
              renderOltGridColumn(column, {
                estadoColumnIndex,
                enableFilters: showFilters,
              }),
            )}
          </DataTable>
        </div>

        {!showOnlySelected ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-(--table-stroke) bg-(--table-content) px-1 pt-2.5">
            <div className="flex items-center gap-1">
              <PagerButton
                ariaLabel="Primera página"
                disabled={pageNumber <= 1 || loading}
                onClick={() => void fetchPage(1, pageSize, apiSortColumn, apiSortOrder)}
              >
                <IoPlaySkipBack size={14} />
              </PagerButton>
              <PagerButton
                ariaLabel="Página anterior"
                disabled={pageNumber <= 1 || loading}
                onClick={() =>
                  void fetchPage(pageNumber - 1, pageSize, apiSortColumn, apiSortOrder)
                }
              >
                <IoChevronBack size={14} />
              </PagerButton>
              <span className="px-2 text-xs text-(--text-secondary)">
                Página {pageNumber} de {totalPages}
                {totalRecords > 0 ? ` · ${totalRecords} registros` : ''}
              </span>
              <PagerButton
                ariaLabel="Página siguiente"
                disabled={pageNumber >= totalPages || loading}
                onClick={() =>
                  void fetchPage(pageNumber + 1, pageSize, apiSortColumn, apiSortOrder)
                }
              >
                <IoChevronForward size={14} />
              </PagerButton>
              <PagerButton
                ariaLabel="Última página"
                disabled={pageNumber >= totalPages || loading}
                onClick={() =>
                  void fetchPage(totalPages, pageSize, apiSortColumn, apiSortOrder)
                }
              >
                <IoPlaySkipForward size={14} />
              </PagerButton>
            </div>
            <label className="flex items-center gap-2 text-xs text-(--text-secondary)">
              Filas
              <select
                value={pageSize}
                disabled={loading}
                className="h-8 rounded-md border border-(--table-stroke) bg-(--card) px-2 text-(--text-primary)"
                onChange={(event) => {
                  const next = toPageSize(Number(event.target.value))
                  void fetchPage(1, next, apiSortColumn, apiSortOrder)
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

function renderOltGridColumn(
  column: { key: string; name: string; index: number; field: string },
  options: { estadoColumnIndex: number; enableFilters: boolean },
): ReactNode {
  const metricKind = getFtthOntGridColumnKind(column.name)
  const isEstado = metricKind === 'estado'
  const isSerial = metricKind === 'serial'

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
      body={(row: OltMetricsGridRowRecord) => {
        const raw = String(row[`c${column.index}`] ?? '')
        const estadoRaw =
          options.estadoColumnIndex >= 0
            ? String(row[`c${options.estadoColumnIndex}`] ?? '')
            : ''

        if (isEstado) {
          return <NeighborsEstadoIcon estadoRaw={raw.trim() || EMPTY} />
        }
        if (isSerial) {
          const value = raw.trim() || EMPTY
          if (value === EMPTY) {
            return <span className="text-(--text-secondary)">{EMPTY}</span>
          }
          // Desktop OLT: serial largo completo (como SerialFullLink en tau-nova).
          return (
            <Link
              to={`/ftth/ont/${encodeURIComponent(value)}/info`}
              className="inline-flex items-center whitespace-nowrap rounded px-1 py-0.5 text-center font-medium text-(--primary) transition-colors hover:underline dark:text-(--secondary)"
            >
              {value}
            </Link>
          )
        }
        if (metricKind === 'ontRx') {
          return <OntRxMetricSpan value={raw} estadoRaw={estadoRaw} />
        }
        if (metricKind === 'oltRx') {
          return <OltRxMetricSpan value={raw} estadoRaw={estadoRaw} />
        }
        if (metricKind === 'oltTx') {
          return <OltTxMetricSpan value={raw} estadoRaw={estadoRaw} />
        }
        const display = formatMetricDisplayValue(raw, estadoRaw)
        return (
          <span className={display === EMPTY ? 'text-(--text-secondary)' : undefined}>
            {display}
          </span>
        )
      }}
      bodyClassName={(row: OltMetricsGridRowRecord) => {
        const raw = String(row[`c${column.index}`] ?? '')
        const estadoRaw =
          options.estadoColumnIndex >= 0
            ? String(row[`c${options.estadoColumnIndex}`] ?? '')
            : ''
        const styleValue = resolveMetricValueForStyling(raw, estadoRaw)
        if (metricKind === 'ontRx') return `text-center ${getOntRxCellClass(styleValue)}`.trim()
        if (metricKind === 'oltRx') return `text-center ${getOltRxCellClass(styleValue)}`.trim()
        if (metricKind === 'oltTx') return `text-center ${getOltTxCellClass(styleValue)}`.trim()
        return 'text-center'
      }}
    />
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--table-stroke) text-(--text-primary) transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/8"
    >
      {children}
    </button>
  )
}
