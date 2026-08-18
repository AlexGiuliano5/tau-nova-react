import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useParams } from 'react-router-dom'
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  DEFAULT_HISTORIC_CHART_DAYS,
  DEFAULT_HISTORIC_STATUS_TIME_FILTER,
  formatHistoricStatusTick,
  HISTORIC_CHART_DAY_OPTIONS,
  HISTORIC_STATUS_TIME_FILTER_OPTIONS,
  isMetricGraph,
  isStatusOrTrafficGraph,
  type ComparisonGraphId,
  type ComparisonOntSeries,
  type HistoricChartDays,
  type HistoricStatusTimeFilter,
} from '@/features/ont/api/comparison-historic'
import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { resolveFtthDisplayIssueToneClass } from '@/features/ftth/lib/card-issue'
import { useOntContextQuery } from '@/features/ont/hooks/use-ont-context-query'
import { useOntHistoricSeriesQuery } from '@/features/ont/hooks/use-ont-historic-series-query'

const SERIES_COLOR = 'var(--primary)'

const GRAPH_OPTIONS: Array<{ id: ComparisonGraphId; label: string; title: string }> = [
  { id: 'estado', label: 'Estado', title: 'Estado' },
  { id: 'ont-rx', label: 'ONT Rx', title: 'ONT Rx Power' },
  { id: 'ont-tx', label: 'ONT Tx', title: 'ONT Tx Power' },
  { id: 'olt-rx', label: 'OLT Rx', title: 'OLT Rx Power' },
  { id: 'olt-tx', label: 'OLT Tx', title: 'OLT Tx Power' },
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
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleGraph(option.id)}
                  aria-pressed={isOn}
                  className={clsx(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                    isOn
                      ? 'border-(--primary) bg-(--primary)/20 text-(--text-primary) dark:border-(--secondary) dark:bg-(--secondary)/35 dark:text-white'
                      : 'border-(--table-stroke) bg-(--card) text-(--text-secondary) hover:text-(--text-primary) dark:border-white/12 dark:bg-(--table-header)/40 dark:text-white/80 dark:hover:text-white',
                  )}
                >
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
}: {
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-0.5">
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
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent dark:border-violet-400 dark:border-t-transparent" />
    </div>
  )
}

function HistoricBrushTraveller(props: {
  x: number
  y: number
  width: number
  height: number
}) {
  const { x, y, width, height } = props
  const w = Math.max(width, 8)
  const padY = 2
  const capH = Math.max(height - padY * 2, 10)
  const capY = y + (height - capH) / 2
  const rx = Math.min(w / 2, capH / 2, 6)

  return (
    <rect
      x={x}
      y={capY}
      width={w}
      height={capH}
      rx={rx}
      ry={rx}
      fill="var(--chart-brush-handle-fill)"
      stroke="var(--chart-brush-handle-stroke)"
      strokeWidth={1}
    />
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
  const useStatusPeriod = isStatusOrTrafficGraph(graphId)
  const [days, setDays] = useState<HistoricChartDays>(DEFAULT_HISTORIC_CHART_DAYS)
  const [timeFilter, setTimeFilter] = useState<HistoricStatusTimeFilter>(
    DEFAULT_HISTORIC_STATUS_TIME_FILTER,
  )
  const isStatus = graphId === 'estado'

  const query = useOntHistoricSeriesQuery({
    ontSerial,
    oltId,
    graphId,
    days,
    timeFilter,
    // Mantener query viva aunque la solapa esté oculta → no refetch al volver
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
  const unit = series?.unit
  const showBrush = chartRows.length > 2

  const graphIssue = showError ? 'error' : showEmpty ? 'no-data' : null

  return (
    <section
      className={clsx(
        'rounded-xl border bg-(--card) p-3 shadow-sm',
        graphIssue
          ? resolveFtthDisplayIssueToneClass(graphIssue)
          : 'border-(--table-stroke) dark:border-white/12',
      )}
    >
      <header className="relative mb-2 flex items-center justify-center border-b border-(--table-stroke)/70 pb-2 dark:border-white/10">
        <h2 className="m-0 text-center text-sm font-semibold text-(--text-primary)">{title}</h2>
        {unit && hasPriorData ? (
          <span className="absolute left-0 text-[11px] text-(--text-secondary)">{unit}</span>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Cerrar gráfico ${title}`}
          className="absolute right-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) dark:hover:bg-white/8"
        >
          <IoClose size={16} />
        </button>
      </header>

      <div className="mb-3">
        {useStatusPeriod ? (
          <PeriodChips
            value={timeFilter}
            options={HISTORIC_STATUS_TIME_FILTER_OPTIONS}
            onChange={setTimeFilter}
          />
        ) : isMetricGraph(graphId) ? (
          <PeriodChips
            value={days}
            options={HISTORIC_CHART_DAY_OPTIONS}
            onChange={setDays}
          />
        ) : null}
      </div>

      {!isActive ? (
        <div className="h-[240px]" aria-hidden />
      ) : showInitialSpinner ? (
        <ChartSpinner className="h-[240px]" />
      ) : graphIssue ? (
        <div className="flex h-[220px] items-center justify-center px-2">
          <FtthDataIssueNotice
            presentation="inline"
            issue={graphIssue}
            context={`el gráfico "${title}"`}
          />
        </div>
      ) : (
        <div className="historic-line-chart relative w-full" key={chartHostKey}>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--table-stroke)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  width={isStatus ? 78 : 42}
                  domain={isStatus ? [-0.25, 4.25] : ['auto', 'auto']}
                  ticks={isStatus ? [4, 3, 2, 1, 0] : undefined}
                  tickFormatter={isStatus ? formatHistoricStatusTick : undefined}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--table-stroke)',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value) => {
                    if (isStatus && typeof value === 'number') {
                      return [formatHistoricStatusTick(value), title]
                    }
                    return [value, title]
                  }}
                />
                <Line
                  type={isStatus ? 'stepAfter' : 'monotone'}
                  dataKey="value"
                  name={title}
                  stroke={SERIES_COLOR}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
                {showBrush ? (
                  <Brush
                    dataKey="x"
                    height={28}
                    gap={1}
                    fill="var(--chart-brush-track)"
                    stroke="var(--chart-brush-rim)"
                    travellerWidth={10}
                    traveller={HistoricBrushTraveller}
                    tickFormatter={() => ''}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
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

function seriesToRows(
  series: ComparisonOntSeries,
): Array<{ x: string; label: string; value: number | null }> {
  return series.points.map((point) => ({
    x: point.time || point.label,
    label: point.label || point.time,
    value: point.value,
  }))
}
