import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useParams } from 'react-router-dom'

import {
  DEFAULT_HISTORIC_STATUS_TIME_FILTER,
  HISTORIC_STATUS_TIME_FILTER_OPTIONS,
  historicPeriodToIsoDays,
  isPowerGraph,
  type ComparisonGraphId,
  type ComparisonOntSeries,
  type HistoricStatusTimeFilter,
} from '@/features/ont/api/comparison-historic'
import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { resolveFtthDisplayIssueToneClass } from '@/features/ftth/lib/card-issue'
import { useOntContextQuery } from '@/features/ont/hooks/use-ont-context-query'
import { useOntHistoricSeriesQuery } from '@/features/ont/hooks/use-ont-historic-series-query'
import {
  buildHistoricStatusBarModel,
  historicStatusBarLabel,
  toHistoricStatusBarKind,
} from '@/features/ont/lib/historic-status-bar'
import { ontMetricThresholdTitleForGraph } from '@/features/ont/lib/ont-metric-thresholds'
import { getOntMetricHeaderIcon } from '@/features/ont/lib/ont-metric-header-icon'
import { OntHistoricPowerChart, resolveHistoricPowerLatest, statusTextClass } from '@/features/ont/ui/OntHistoricPowerChart'
import { OntHistoricStatusBarChart } from '@/features/ont/ui/OntHistoricStatusBarChart'

const GRAPH_OPTIONS: Array<{ id: ComparisonGraphId; label: string; title: string }> = [
  { id: 'estado', label: 'Estado', title: 'Estado — ONT' },
  { id: 'ont-rx', label: 'ONT Rx', title: 'Potencia recibida — ONT' },
  { id: 'ont-tx', label: 'ONT Tx', title: 'Potencia transmitida — ONT' },
  { id: 'olt-rx', label: 'OLT Rx', title: 'Potencia recibida — OLT' },
  { id: 'olt-tx', label: 'OLT Tx', title: 'Potencia transmitida — OLT' },
  { id: 'trafico-us', label: 'Tráfico US', title: 'Tráfico US' },
  { id: 'trafico-ds', label: 'Tráfico DS', title: 'Tráfico DS' },
  { id: 'ont-voltage', label: 'ONT Voltage', title: 'ONT Voltage' },
  { id: 'ont-temp-laser', label: 'ONT Temp Laser', title: 'ONT Temp Laser' },
  { id: 'ont-bip-us', label: 'BIP US', title: 'BIP US' },
  { id: 'ont-bip-ds', label: 'BIP DS', title: 'BIP DS' },
]

const DEFAULT_OPEN: ComparisonGraphId[] = ['estado']

export function OntHistoricGraphsPage({ isActive = true }: { isActive?: boolean }) {
  const { ont = '' } = useParams()
  const ontContext = useOntContextQuery(ont)
  const isInfraco = ontContext.data?.mode === 'infraco'
  const oltId = ontContext.data?.olt?.trim() ?? ''

  const [openGraphIds, setOpenGraphIds] = useState<ComparisonGraphId[]>(DEFAULT_OPEN)
  // Fuerza re-medición de ResponsiveContainer al volver a la solapa
  const [chartHostKey, setChartHostKey] = useState(0)

  useEffect(() => {
    if (isActive) {
      setChartHostKey((key) => key + 1)
    }
  }, [isActive])

  const toggleGraph = (id: ComparisonGraphId) => {
    setOpenGraphIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev],
    )
  }

  const closeGraph = (id: ComparisonGraphId) => {
    setOpenGraphIds((prev) => prev.filter((item) => item !== id))
  }

  const openOptions = openGraphIds
    .map((id) => GRAPH_OPTIONS.find((option) => option.id === id))
    .filter((option): option is (typeof GRAPH_OPTIONS)[number] => Boolean(option))

  if (ontContext.isPending && !ontContext.data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <ChartSpinner className="h-16" />
      </div>
    )
  }

  if (isInfraco) {
    return (
      <FtthCardIssueState
        title="Gráficos históricos"
        issue="no-data"
        message="En modo infraco no hay celda OLT/placa/puerto; los gráficos históricos no están disponibles."
        cardClassName="mx-4 my-6 rounded-xl border bg-(--card) p-6 shadow-sm xl:mx-3"
        bodyClassName="min-h-[120px]"
      />
    )
  }

  if (ontContext.isError || !oltId) {
    return (
      <FtthCardIssueState
        title="Gráficos históricos"
        issue="error"
        context="el contexto OLT para gráficos históricos"
        cardClassName="mx-4 my-6 rounded-xl border bg-(--card) p-6 shadow-sm xl:mx-3"
        bodyClassName="min-h-[120px]"
      />
    )
  }

  return (
    <div className="mx-4 mb-6 flex min-h-0 flex-col gap-4 xl:mx-3">
      <header className="space-y-3 rounded-xl border border-(--table-stroke) bg-(--card) p-4 shadow-sm dark:border-white/10">
        <div>
          <h1 className="m-0 text-lg font-semibold tracking-tight text-(--primary-2) dark:text-(--secondary)">
            Gráficos históricos
          </h1>
          <p className="mt-1 text-xs text-(--text-secondary)">
            Elegí una o más métricas. El estado se abre por defecto. El período se elige por gráfico.
          </p>
        </div>

        <div className="text-center">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--text-secondary)">
            Métricas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 py-0.5">
            {GRAPH_OPTIONS.map((option) => {
              const isOn = openGraphIds.includes(option.id)
              const Icon = historicGraphIcon(option.id, option.title)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleGraph(option.id)}
                  aria-pressed={isOn}
                  className={clsx(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                    isOn
                      ? 'border-(--primary) bg-(--primary)/20 text-(--text-primary) dark:border-(--secondary) dark:bg-(--secondary)/35 dark:text-white'
                      : 'border-(--table-stroke) bg-(--card) text-(--text-secondary) hover:text-(--text-primary) dark:border-white/12 dark:bg-(--table-header)/40 dark:text-white/80 dark:hover:text-white',
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {openOptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-(--table-stroke) px-3 py-6 text-center text-sm text-(--text-secondary) dark:border-white/12">
            Elegí una o más métricas para ver el histórico.
          </p>
        ) : (
          openOptions.map((option) => (
            <HistoricGraphCard
              key={option.id}
              title={option.title}
              graphId={option.id}
              ontSerial={ont}
              oltId={oltId}
              onClose={() => closeGraph(option.id)}
              isActive={isActive}
              chartHostKey={chartHostKey}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PeriodChips<T extends string>({
  value,
  options,
  onChange,
  align = 'center',
}: {
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  align?: 'center' | 'end'
}) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-2 py-0.5',
        align === 'end' ? 'justify-end' : 'justify-center',
      )}
    >
      {options.map((option) => {
        const isOn = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isOn}
            className={clsx(
              'min-w-11 shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors md:text-[12px]',
              isOn
                ? 'border-(--primary) bg-(--primary)/20 text-(--text-primary) dark:border-(--secondary) dark:bg-(--secondary)/35 dark:text-white'
                : 'border-(--table-stroke) text-(--text-secondary) hover:text-(--text-primary) dark:border-white/20 dark:text-white/80 dark:hover:text-white',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ChartSpinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx('flex items-center justify-center', className)}
      role="status"
      aria-busy="true"
      aria-label="Cargando gráfico"
    >
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-(--primary-2) border-t-transparent dark:border-(--secondary)" />
    </div>
  )
}

function HistoricGraphCard({
  title,
  graphId,
  ontSerial,
  oltId,
  onClose,
  isActive,
  chartHostKey,
}: {
  title: string
  graphId: ComparisonGraphId
  ontSerial: string
  oltId: string
  onClose: () => void
  isActive: boolean
  chartHostKey: number
}) {
  const [timeFilter, setTimeFilter] = useState<HistoricStatusTimeFilter>(
    DEFAULT_HISTORIC_STATUS_TIME_FILTER,
  )
  const isStatus = graphId === 'estado'
  const metricTitle = ontMetricThresholdTitleForGraph(graphId)
  const HeaderIcon = historicGraphIcon(graphId, title)
  const days = historicPeriodToIsoDays(timeFilter)

  const query = useOntHistoricSeriesQuery({
    ontSerial,
    oltId,
    graphId,
    days,
    timeFilter,
    enabled: true,
  })

  const series = query.data
  const hasPriorData = Boolean(series && series.points.length > 0)
  const loading = query.isFetching
  const showInitialSpinner = loading && !hasPriorData
  const showRefreshOverlay = loading && hasPriorData
  const showError = !loading && (query.isError || series?.status === 'error')
  const showEmpty =
    !loading &&
    !showError &&
    (!series || series.points.length === 0 || series.status === 'no-data')

  const chartRows = useMemo(
    () => (series ? seriesToRows(series) : []),
    [series],
  )
  const statusBarModel = useMemo(
    () => (isStatus && series ? buildHistoricStatusBarModel(series.points) : null),
    [isStatus, series],
  )
  const unit = fallbackHistoricUnit(graphId, series?.unit)
  const latest = isStatus
    ? resolveHistoricStatusLatest(series)
    : hasPriorData
      ? resolveHistoricPowerLatest(chartRows, metricTitle, unit)
      : null

  const graphIssue = showError ? 'error' : showEmpty ? 'no-data' : null
  const periodChips = (
    <PeriodChips
      value={timeFilter}
      options={HISTORIC_STATUS_TIME_FILTER_OPTIONS}
      onChange={setTimeFilter}
      align="end"
    />
  )

  return (
    <section
      className={clsx(
        'rounded-xl border bg-(--card) p-3 shadow-sm md:p-4',
        graphIssue
          ? resolveFtthDisplayIssueToneClass(graphIssue)
          : 'border-(--table-stroke) dark:border-white/12',
      )}
    >
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:justify-start sm:gap-4">
          <h2 className="m-0 inline-flex min-w-0 items-center gap-1.5 text-base font-semibold tracking-tight text-(--text-primary) md:text-[1.05rem]">
            <HeaderIcon className="size-[18px] shrink-0 text-(--text-secondary)" aria-hidden />
            <span className="min-w-0 truncate">{title}</span>
          </h2>
          {latest ? (
            <div className="flex min-w-0 items-baseline gap-2">
              <span
                className={clsx(
                  'text-xl font-semibold tracking-tight md:text-2xl',
                  !latest.statusLabel && latest.statusTone
                    ? statusTextClass(latest.statusTone)
                    : 'text-(--text-primary)',
                )}
              >
                {latest.formatted}
              </span>
              {latest.statusLabel && latest.statusTone ? (
                <span className={clsx('text-sm font-semibold', statusTextClass(latest.statusTone))}>
                  {latest.statusLabel}
                </span>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={`Cerrar gráfico ${title}`}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) sm:hidden dark:hover:bg-white/8"
          >
            <IoClose size={16} />
          </button>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          {periodChips}
          <button
            type="button"
            onClick={onClose}
            aria-label={`Cerrar gráfico ${title}`}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) sm:inline-flex dark:hover:bg-white/8"
          >
            <IoClose size={16} />
          </button>
        </div>
      </header>

      {!isActive ? (
        <div className={isStatus ? 'h-[120px]' : 'h-[280px]'} aria-hidden />
      ) : showInitialSpinner ? (
        <ChartSpinner className={isStatus ? 'h-[120px]' : 'h-[280px]'} />
      ) : graphIssue ? (
        <div className={clsx('flex items-center justify-center px-2', isStatus ? 'h-[120px]' : 'h-[220px]')}>
          <FtthDataIssueNotice
            presentation="inline"
            issue={graphIssue}
            context={`el gráfico "${title}"`}
          />
        </div>
      ) : isStatus ? (
        <div className="relative px-1 pb-1">
          {statusBarModel ? <OntHistoricStatusBarChart model={statusBarModel} /> : null}
          {showRefreshOverlay ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--card)/55 backdrop-blur-[1px] dark:bg-black/25">
              <ChartSpinner />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative w-full" key={chartHostKey}>
          <OntHistoricPowerChart
            title={title}
            metricTitle={metricTitle}
            unit={unit}
            rows={chartRows}
          />
          {showRefreshOverlay ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--card)/55 backdrop-blur-[1px] dark:bg-black/25">
              <ChartSpinner />
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}

function historicGraphIcon(graphId: ComparisonGraphId, title: string) {
  return getOntMetricHeaderIcon(ontMetricThresholdTitleForGraph(graphId) || title)
}

function fallbackHistoricUnit(graphId: ComparisonGraphId, unit?: string): string {
  const trimmed = unit?.trim() ?? ''
  if (trimmed) return trimmed
  if (isPowerGraph(graphId)) return 'dBm'
  if (graphId === 'ont-voltage') return 'V'
  if (graphId === 'ont-temp-laser') return '°C'
  return ''
}

function resolveHistoricStatusLatest(
  series: ComparisonOntSeries | undefined,
): { formatted: string; statusLabel: string | null; statusTone: 'green' | 'yellow' | 'red' | 'neutral' | null } | null {
  if (!series?.points.length) return null
  for (let index = series.points.length - 1; index >= 0; index -= 1) {
    const point = series.points[index]
    if (!point) continue
    if (!point.statusLabel && typeof point.value !== 'number') continue
    const kind = toHistoricStatusBarKind(point.statusLabel)
    const label = historicStatusBarLabel(kind)
    const statusTone =
      kind === 'GOOD' ? 'green' : kind === 'DEGRADED' ? 'yellow' : kind === 'INTERRUPTED' ? 'red' : 'neutral'
    return { formatted: label, statusLabel: null, statusTone }
  }
  return null
}

function seriesToRows(
  series: ComparisonOntSeries,
): Array<{ x: string; label: string; value: number | null }> {
  return series.points.map((point) => ({
    x: point.time || point.label,
    label: point.label || point.time,
    value: point.value,
  }))
}
