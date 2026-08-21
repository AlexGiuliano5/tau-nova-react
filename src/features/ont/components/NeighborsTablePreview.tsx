import { Column } from 'primereact/column'
import type { DataTableSortEvent } from 'primereact/datatable'
import { DataTable } from 'primereact/datatable'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchInfoRealTimeByOlt } from '@/features/ont/api/info-realtime-by-olt'
import { NeighborsEstadoIcon } from '@/features/ont/components/NeighborsEstadoIcon'
import {
  buildRecalculateActionLabel,
  useRecalculateCooldown,
} from '@/features/ont/hooks/use-recalculate-cooldown'
import {
  getOltRxCellClass,
  getOntRxCellClass,
  OltRxMetricSpan,
  OntRxMetricSpan,
  resolveMetricValueForStyling,
} from '@/features/ont/lib/ftth-grid-metric-styles'
import {
  mergePreviewOntRxRealtime,
  type OntNeighborPreviewItem,
} from '@/features/ont/lib/neighbors-preview'
import { normalizeSerial } from '@/features/ont/lib/olt-realtime-metrics-grid'
import { formatOntSerial, normalizeOntId } from '@/features/ont/lib/ont-serial'
import { ONT_NEIGHBORS_TABLE_PREVIEW_CLASSNAME } from '@/features/ont/ui/table/tableClassNames'

import '@/features/ont/styles/ftth-datatable.css'

const MAX_PREVIEW_ROWS = 5
const LOADING_CELL_VALUE = '__realtime_loading__'

interface Props {
  ont: string
  neighbors: OntNeighborPreviewItem[]
  realtimeTarget: { olt: string; slot: string; port: string } | null
}

type NeighborRowView = OntNeighborPreviewItem & {
  ontRxValue: number
  oltRxValue: number
}

export function NeighborsTablePreview({ ont, neighbors, realtimeTarget }: Props) {
  const [tableRows, setTableRows] = useState(neighbors)
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(0)
  const [realtimeLoading, setRealtimeLoading] = useState(false)
  const {
    secondsRemaining: recalculateCooldownSeconds,
    isOnCooldown: isRecalculateOnCooldown,
    startCooldown: startRecalculateCooldown,
  } = useRecalculateCooldown()
  const [realtimeFeedback, setRealtimeFeedback] = useState<string | null>(null)
  const mountedRef = useRef(false)
  const realtimeRequestGenRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      realtimeRequestGenRef.current += 1
    }
  }, [])

  useEffect(() => {
    setTableRows(neighbors)
  }, [neighbors])

  useEffect(() => {
    if (!realtimeFeedback) return
    const id = window.setTimeout(() => setRealtimeFeedback(null), 5000)
    return () => clearTimeout(id)
  }, [realtimeFeedback])

  const rows = useMemo<NeighborRowView[]>(
    () =>
      tableRows.map((item) => ({
        ...item,
        ontRxValue: toMetricNumber(item.ontRx),
        oltRxValue: toMetricNumber(item.oltRx),
      })),
    [tableRows],
  )

  const sortedRows = useMemo(() => {
    if (!sortField || sortOrder === 0) return rows
    const sorted = [...rows]
    sorted.sort((left, right) => compareRows(left, right, sortField, sortOrder))
    return sorted
  }, [rows, sortField, sortOrder])

  const visibleRows = useMemo(() => sortedRows.slice(0, MAX_PREVIEW_ROWS), [sortedRows])
  const canRealtimeRecalc =
    Boolean(realtimeTarget) &&
    tableRows.length > 0 &&
    !realtimeLoading &&
    !isRecalculateOnCooldown

  const handleRealtimeRecalculate = async () => {
    if (!realtimeTarget || tableRows.length === 0 || isRecalculateOnCooldown) return

    startRecalculateCooldown()
    const tableRowsBeforeLoading = tableRows
    const requestGen = realtimeRequestGenRef.current + 1
    realtimeRequestGenRef.current = requestGen
    setRealtimeFeedback(null)
    setRealtimeLoading(true)
    setTableRows((prev) =>
      prev.map((row) => ({
        ...row,
        ontRx: LOADING_CELL_VALUE,
      })),
    )

    try {
      const result = await fetchInfoRealTimeByOlt({
        olt: realtimeTarget.olt,
        slot: realtimeTarget.slot,
        port: realtimeTarget.port,
      })

      if (!mountedRef.current || realtimeRequestGenRef.current !== requestGen) return

      if (!result.ok) {
        setTableRows(tableRowsBeforeLoading)
        setRealtimeFeedback('No se pudieron actualizar los datos.')
        return
      }

      const bySerial = new Map<string, string>()
      for (const row of result.data) {
        const key = normalizeSerial(row.serial)
        if (!key) continue
        const ontRx = row.ontRxPower?.trim()
        bySerial.set(key, ontRx && ontRx.length > 0 ? ontRx : 'Sin Datos')
      }

      setTableRows((prev) => mergePreviewOntRxRealtime(prev, bySerial))
      setRealtimeFeedback('Métricas actualizadas en tiempo real.')
    } catch {
      if (!mountedRef.current || realtimeRequestGenRef.current !== requestGen) return
      setTableRows(tableRowsBeforeLoading)
      setRealtimeFeedback('No se pudo completar la solicitud.')
    } finally {
      if (mountedRef.current && realtimeRequestGenRef.current === requestGen) {
        setRealtimeLoading(false)
      }
    }
  }

  const fullTableHref = `/ftth/ont/${encodeURIComponent(ont)}/vecinos`

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold">Vecinos</h2>
        <button
          type="button"
          disabled={!canRealtimeRecalc}
          onClick={() => void handleRealtimeRecalculate()}
          className="h-8 shrink-0 rounded-lg bg-(--primary-2) px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-(--secondary-3)"
        >
          {buildRecalculateActionLabel({
            isLoading: realtimeLoading,
            cooldownSeconds: recalculateCooldownSeconds,
          })}
        </button>
      </div>

      {realtimeFeedback ? (
        <p
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300"
          role="status"
          aria-live="polite"
        >
          {realtimeFeedback}
        </p>
      ) : null}

      <DataTable
        value={visibleRows}
        tableStyle={{ minWidth: '100%', width: '100%' }}
        size="small"
        className={ONT_NEIGHBORS_TABLE_PREVIEW_CLASSNAME}
        emptyMessage="Sin Datos"
        sortMode="single"
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(event: DataTableSortEvent) => {
          setSortField(event.sortField)
          setSortOrder(event.sortOrder as 1 | -1 | 0)
        }}
      >
        <Column
          field="serial"
          header="Serial"
          body={(row: NeighborRowView) => <SerialAbbreviatedLink serial={row.serial} />}
          sortable
          headerClassName="text-center"
          bodyClassName="text-center"
        />
        <Column
          field="estado"
          header="Estado"
          body={(row: NeighborRowView) => (
            <NeighborsEstadoIcon estadoRaw={row.estado} iconSize={16} />
          )}
          sortable
          headerClassName="text-center"
          bodyClassName="text-center"
        />
        <Column
          field="ontRx"
          header="Ont Rx"
          body={(row: NeighborRowView) =>
            row.ontRx === LOADING_CELL_VALUE ? (
              <PreviewCellSpinner />
            ) : (
              <OntRxMetricSpan value={row.ontRx} estadoRaw={row.estado} />
            )
          }
          sortable
          sortField="ontRxValue"
          headerClassName="text-center"
          bodyClassName={(row: NeighborRowView) =>
            `text-center ${getOntRxCellClass(resolveMetricValueForStyling(row.ontRx, row.estado))}`.trim()
          }
        />
        <Column
          field="oltRx"
          header="Olt Rx"
          body={(row: NeighborRowView) => (
            <OltRxMetricSpan value={row.oltRx} estadoRaw={row.estado} />
          )}
          sortable
          sortField="oltRxValue"
          headerClassName="text-center"
          bodyClassName={(row: NeighborRowView) =>
            `text-center ${getOltRxCellClass(resolveMetricValueForStyling(row.oltRx, row.estado))}`.trim()
          }
        />
      </DataTable>

      {rows.length > MAX_PREVIEW_ROWS ? (
        <span className="text-center text-xs text-(--text-secondary)">
          Mostrando {MAX_PREVIEW_ROWS} de {rows.length} vecinos
        </span>
      ) : null}

      <Link
        to={fullTableHref}
        className="mt-1 flex w-full justify-center font-semibold text-(--primary) dark:text-(--secondary)"
      >
        Ver tabla completa
      </Link>
    </div>
  )
}

function SerialAbbreviatedLink({ serial }: { serial: string }) {
  const raw = serial.trim()
  const display =
    raw.length > 6 ? `${raw.slice(0, 4)}...${raw.slice(-4)}` : formatOntSerial(raw) || raw
  const hrefSerial = normalizeOntId(raw) || raw

  return (
    <Link
      to={`/ftth/ont/${encodeURIComponent(hrefSerial)}/info`}
      className="font-medium text-(--primary-2) underline-offset-2 hover:underline dark:text-(--secondary)"
    >
      {display}
    </Link>
  )
}

function PreviewCellSpinner() {
  return (
    <div
      className="flex min-h-[1.35rem] items-center justify-center py-0.5"
      role="status"
      aria-busy="true"
    >
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-(--primary-2) border-t-transparent dark:border-(--secondary)" />
    </div>
  )
}

function toMetricNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

function compareRows(
  left: NeighborRowView,
  right: NeighborRowView,
  field: string,
  order: 1 | -1 | 0,
): number {
  if (field === 'ontRxValue' || field === 'oltRxValue') {
    if (left[field] === right[field]) return 0
    return left[field] > right[field] ? order : -order
  }

  const leftText = String(left[field as keyof NeighborRowView] ?? '').toLowerCase()
  const rightText = String(right[field as keyof NeighborRowView] ?? '').toLowerCase()
  if (leftText === rightText) return 0
  return leftText > rightText ? order : -order
}
