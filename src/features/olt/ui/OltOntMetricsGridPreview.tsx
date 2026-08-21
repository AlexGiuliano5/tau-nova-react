import { Column } from 'primereact/column'
import type { DataTableSortEvent } from 'primereact/datatable'
import { DataTable } from 'primereact/datatable'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { NeighborsEstadoIcon } from '@/features/ont/components/NeighborsEstadoIcon'
import {
  getFtthOntGridColumnKind,
  OltRxMetricSpan,
  OltTxMetricSpan,
  OntRxMetricSpan,
  formatMetricDisplayValue,
} from '@/features/ont/lib/ftth-grid-metric-styles'
import { formatOntSerial, normalizeOntId } from '@/features/ont/lib/ont-serial'
import { ontStatusRowClassName } from '@/features/ont/lib/ont-status-labels'
import { ONT_NEIGHBORS_TABLE_PREVIEW_CLASSNAME } from '@/features/ont/ui/table/tableClassNames'
import {
  FTTH_ONT_GRID_PREVIEW_MAX_COLUMNS,
  pickPreviewColumnIndices,
} from '@/features/olt/lib/metrics-preview-columns'
import type {
  OltMetricsGridPageModel,
  OltMetricsGridRowRecord,
} from '@/features/olt/types/metrics-grid'

import '@/features/ont/styles/ftth-datatable.css'

interface Props {
  model: OltMetricsGridPageModel
}

type PreviewRow = Record<string, string | number | undefined> & {
  __previewId: string
  __estado: string
}

export function OltOntMetricsGridPreview({ model }: Props) {
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(0)

  const columnIndices = useMemo(
    () => pickPreviewColumnIndices(model.columnNames, FTTH_ONT_GRID_PREVIEW_MAX_COLUMNS),
    [model.columnNames],
  )

  const previewHeaders = useMemo(
    () => columnIndices.map((i) => model.columnNames[i] ?? ''),
    [columnIndices, model.columnNames],
  )

  const columnKinds = useMemo(
    () => previewHeaders.map((h) => getFtthOntGridColumnKind(h)),
    [previewHeaders],
  )

  const estadoColumnIndex = useMemo(
    () => model.columnNames.findIndex((name) => getFtthOntGridColumnKind(name) === 'estado'),
    [model.columnNames],
  )

  const baseRows = useMemo<PreviewRow[]>(() => {
    return model.rows.map((row, idx) => {
      const estadoRaw =
        estadoColumnIndex >= 0
          ? String((row as OltMetricsGridRowRecord)[`c${estadoColumnIndex}`] ?? '')
          : ''
      const out: PreviewRow = { __previewId: `p-${idx}`, __estado: estadoRaw }
      columnIndices.forEach((srcIdx, j) => {
        const field = `c${srcIdx}`
        const cell = (row as OltMetricsGridRowRecord)[field] ?? 'Sin Datos'
        out[`p${j}`] = cell
        const kind = columnKinds[j]
        if (kind === 'ontRx' || kind === 'oltRx' || kind === 'oltTx') {
          out[`s${j}`] = toMetricNumber(String(cell))
        }
      })
      return out
    })
  }, [model.rows, columnIndices, columnKinds, estadoColumnIndex])

  const rows = useMemo(() => {
    if (!sortField || sortOrder === 0) return baseRows
    const copy = [...baseRows]
    copy.sort((a, b) => comparePreviewRows(a, b, sortField, sortOrder as 1 | -1))
    return copy
  }, [baseRows, sortField, sortOrder])

  if (model.columnNames.length === 0) {
    return (
      <FtthDataIssueNotice presentation="inline" issue="no-data" context="la información de las ONT" />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <DataTable
        value={rows}
        dataKey="__previewId"
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
        rowClassName={(row) => ontStatusRowClassName(String((row as PreviewRow).__estado ?? ''))}
      >
        {previewHeaders.map((header, j) => {
          const kind = columnKinds[j]
          const valueField = `p${j}`
          const sortKey =
            kind === 'ontRx' || kind === 'oltRx' || kind === 'oltTx' ? `s${j}` : valueField

          return (
            <Column
              key={`pv-${columnIndices[j]}`}
              field={valueField}
              header={header}
              sortable
              sortField={sortKey}
              headerClassName="text-center"
              bodyClassName="text-center"
              body={(row) => {
                const r = row as PreviewRow
                const raw = String(r[valueField] ?? '')
                if (kind === 'serial') return <SerialAbbreviatedLink serial={raw} />
                if (kind === 'estado') {
                  return <NeighborsEstadoIcon estadoRaw={raw} iconSize={16} />
                }
                if (kind === 'ontRx') {
                  return <OntRxMetricSpan value={raw} estadoRaw={r.__estado} />
                }
                if (kind === 'oltRx') {
                  return <OltRxMetricSpan value={raw} estadoRaw={r.__estado} />
                }
                if (kind === 'oltTx') {
                  return <OltTxMetricSpan value={raw} estadoRaw={r.__estado} />
                }
                return formatMetricDisplayValue(raw, r.__estado)
              }}
            />
          )
        })}
      </DataTable>
      {model.totalRecords > 0 ? (
        <span className="text-center text-xs text-(--text-secondary)">
          Mostrando {model.rows.length} de {model.totalRecords} registros
        </span>
      ) : null}
    </div>
  )
}

function SerialAbbreviatedLink({ serial }: { serial: string }) {
  const normalized = normalizeOntId(serial)
  if (!normalized) return <span>{serial || 'Sin Datos'}</span>
  return (
    <Link
      to={`/ftth/ont/${encodeURIComponent(normalized)}/info`}
      className="font-semibold text-(--primary) hover:underline dark:text-(--secondary)"
    >
      {formatOntSerial(normalized)}
    </Link>
  )
}

function toMetricNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

function comparePreviewRows(
  a: PreviewRow,
  b: PreviewRow,
  field: string,
  order: 1 | -1,
): number {
  const left = a[field]
  const right = b[field]
  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * order
  }
  return String(left ?? '').localeCompare(String(right ?? ''), 'es', {
    numeric: true,
    sensitivity: 'base',
  }) * order
}
