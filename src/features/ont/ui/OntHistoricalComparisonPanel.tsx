import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
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
import { IoClose } from 'react-icons/io5'

import {
  DEFAULT_HISTORIC_CHART_DAYS,
  DEFAULT_HISTORIC_STATUS_TIME_FILTER,
  fetchOntComparisonSeries,
  formatHistoricStatusTick,
  HISTORIC_CHART_DAY_OPTIONS,
  HISTORIC_STATUS_TIME_FILTER_OPTIONS,
  HISTORIC_STATUS_Y_TICKS,
  isMetricGraph,
  isStatusOrTrafficGraph,
  type ComparisonGraphId,
  type ComparisonOntSeries,
  type HistoricChartDays,
  type HistoricStatusTimeFilter,
} from '@/features/ont/api/comparison-historic'
import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { resolveFtthDisplayIssueToneClass } from '@/features/ftth/lib/card-issue'

/** Serial tal como viene del grid (hex largo), sin formato vendor acortado. */
function displayFullSerial(serial: string): string {
  const trimmed = serial.trim()
  return trimmed.length > 0 ? trimmed : '—'
}

const SERIES_COLORS = [
  'var(--primary)',
  'var(--card-orange)',
  '#22c55e',
  '#a855f7',
  '#f43f5e',
  '#06b6d4',
  '#eab308',
  '#6366f1',
]

/** Misma lista de métricas que la comparativa de tau-nova. */
const METRIC_OPTIONS: Array<{ id: ComparisonGraphId; label: string; title: string }> = [
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

interface Props {
  ontSerials: string[]
  oltId: string
  onClose: () => void
  onRemoveOnt?: (serial: string) => void
  hideHeader?: boolean
}

export function OntHistoricalComparisonPanel({
  ontSerials,
  oltId,
  onClose,
  onRemoveOnt,
  hideHeader = false,
}: Props) {
  const [selectedGraphIds, setSelectedGraphIds] = useState<ComparisonGraphId[]>([])

  const toggleMetric = (id: ComparisonGraphId) => {
    setSelectedGraphIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev],
    )
  }

  const closeMetric = (id: ComparisonGraphId) => {
    setSelectedGraphIds((prev) => prev.filter((item) => item !== id))
  }

  const selectedOptions = selectedGraphIds
    .map((id) => METRIC_OPTIONS.find((option) => option.id === id))
    .filter((option): option is (typeof METRIC_OPTIONS)[number] => Boolean(option))

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-(--card)">
      {!hideHeader ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--table-stroke) px-4 py-3 dark:border-white/10">
          <h2 className="m-0 text-[1.05rem] font-semibold leading-tight tracking-tight text-(--primary-2) dark:text-(--secondary)">
            Comparar histórico
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de comparación"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--table-stroke) text-(--text-secondary) transition-colors hover:bg-(--table-header) hover:text-(--text-primary) dark:border-white/15 dark:hover:bg-white/8"
          >
            <IoClose size={16} />
          </button>
        </div>
      ) : null}

      <div className="shrink-0 space-y-3 border-b border-(--table-stroke) px-4 py-3 dark:border-white/10">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-(--text-secondary)">
            ONTs seleccionadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ontSerials.map((serial, index) => {
              const displaySerial = displayFullSerial(serial)
              return (
                <span
                  key={serial}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-(--table-stroke) bg-(--table-header) px-2.5 py-1 text-[11px] font-medium text-(--text-primary)"
                >
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }}
                  />
                  <span className="break-all">{displaySerial}</span>
                  {onRemoveOnt ? (
                    <button
                      type="button"
                      aria-label={`Quitar ${displaySerial}`}
                      className="ml-0.5 shrink-0 text-(--text-secondary) hover:text-(--text-primary)"
                      onClick={() => onRemoveOnt(serial)}
                    >
                      <IoClose size={12} />
                    </button>
                  ) : null}
                </span>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--text-secondary)">
            Métricas
          </p>
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="flex min-w-0 flex-nowrap items-center gap-2 py-0.5">
              {METRIC_OPTIONS.map((option) => {
                const isOn = selectedGraphIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleMetric(option.id)}
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
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {selectedOptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-(--table-stroke) px-3 py-4 text-center text-sm text-(--text-secondary) dark:border-white/12">
            Elegí una o más métricas para ver el histórico comparado.
          </p>
        ) : (
          selectedOptions.map((metric) => (
            <ComparisonMetricChart
              key={metric.id}
              title={metric.title}
              graphId={metric.id}
              ontSerials={ontSerials}
              oltId={oltId}
              onClose={() => closeMetric(metric.id)}
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
    <div className="-mx-0.5 overflow-x-auto px-0.5">
      <div className="flex min-w-0 flex-nowrap items-center justify-center gap-2 py-0.5">
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

function ComparisonMetricChart({
  title,
  graphId,
  ontSerials,
  oltId,
  onClose,
}: {
  title: string
  graphId: ComparisonGraphId
  ontSerials: string[]
  oltId: string
  onClose: () => void
}) {
  const useStatusPeriod = isStatusOrTrafficGraph(graphId)
  const [days, setDays] = useState<HistoricChartDays>(DEFAULT_HISTORIC_CHART_DAYS)
  const [timeFilter, setTimeFilter] = useState<HistoricStatusTimeFilter>(
    DEFAULT_HISTORIC_STATUS_TIME_FILTER,
  )
  const [series, setSeries] = useState<ComparisonOntSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set())
  const ontSerialsKey = ontSerials.join('|')
  const isStatus = graphId === 'estado'
  const hasPriorData = series.length > 0

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void (async () => {
      const results = await Promise.all(
        ontSerials.map((serial) =>
          fetchOntComparisonSeries(
            {
              ontSerial: serial,
              oltId,
              graphId,
              days,
              timeFilter,
            },
            controller.signal,
          ),
        ),
      )
      if (controller.signal.aborted) return
      setSeries(results)
      setLoading(false)
    })()
    return () => controller.abort()
  }, [ontSerialsKey, oltId, graphId, days, timeFilter, ontSerials])

  useEffect(() => {
    const activeKeys = new Set(ontSerials.map((serial) => seriesKey(serial)))
    setHiddenSeries((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const key of prev) {
        if (activeKeys.has(key)) next.add(key)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [ontSerialsKey, ontSerials])

  const chartRows = useMemo(() => mergeSeriesToRows(series), [series])
  const unit = series.find((item) => item.unit)?.unit
  const showBrush = chartRows.length > 2
  const legendSeries = useMemo(
    () =>
      series.map((item, index) => ({
        dataKey: seriesKey(item.serial),
        name: displayFullSerial(item.serial),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      })),
    [series],
  )

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  const showInitialSpinner = loading && !hasPriorData
  const showRefreshOverlay = loading && hasPriorData
  const showEmpty = !loading && chartRows.length === 0
  const graphIssue = showEmpty ? 'no-data' : null

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
        <h3 className="m-0 text-center text-sm font-semibold text-(--text-primary)">{title}</h3>
        {unit && !loading ? (
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

      {showInitialSpinner ? (
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
        <div className="historic-line-chart w-full">
          <div className="relative h-[240px] w-full">
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
                  domain={isStatus ? [-0.25, HISTORIC_STATUS_Y_TICKS[0] + 0.25] : ['auto', 'auto']}
                  ticks={isStatus ? [...HISTORIC_STATUS_Y_TICKS] : undefined}
                  tickFormatter={isStatus ? formatHistoricStatusTick : undefined}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--table-stroke)',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value, name) => {
                    if (isStatus && typeof value === 'number') {
                      return [formatHistoricStatusTick(value), name]
                    }
                    return [value, name]
                  }}
                />
                {series.map((item, index) => {
                  const dataKey = seriesKey(item.serial)
                  return (
                    <Line
                      key={item.serial}
                      type={isStatus ? 'stepAfter' : 'monotone'}
                      dataKey={dataKey}
                      name={displayFullSerial(item.serial)}
                      stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                      hide={hiddenSeries.has(dataKey)}
                    />
                  )
                })}
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

            {showRefreshOverlay ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--card)/55 backdrop-blur-[1px] dark:bg-black/25">
                <ChartSpinner />
              </div>
            ) : null}
          </div>

          <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1">
            {legendSeries.map((item) => {
              const isHidden = hiddenSeries.has(item.dataKey)
              return (
                <li key={item.dataKey} className="max-w-full">
                  <button
                    type="button"
                    onClick={() => toggleSeries(item.dataKey)}
                    aria-pressed={!isHidden}
                    title={isHidden ? `Mostrar ${item.name}` : `Ocultar ${item.name}`}
                    className={clsx(
                      'inline-flex max-w-full items-center gap-1.5 text-[11px] font-medium transition-opacity',
                      isHidden
                        ? 'text-(--text-secondary) opacity-45 line-through'
                        : 'text-(--text-primary) hover:opacity-80',
                    )}
                  >
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{
                        background: isHidden ? 'var(--text-secondary)' : item.color,
                      }}
                      aria-hidden
                    />
                    <span className="break-all text-left">{item.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

function seriesKey(serial: string): string {
  return `s_${serial}`
}

function mergeSeriesToRows(
  series: ComparisonOntSeries[],
): Array<Record<string, string | number | null>> {
  const timeMap = new Map<string, Record<string, string | number | null>>()

  for (const item of series) {
    for (const point of item.points) {
      const key = point.time || point.label
      const row = timeMap.get(key) ?? { x: key, label: point.label || point.time }
      row[seriesKey(item.serial)] = point.value
      timeMap.set(key, row)
    }
  }

  return Array.from(timeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row)
}
