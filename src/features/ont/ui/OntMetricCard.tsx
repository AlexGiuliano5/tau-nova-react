import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { IoChevronDown, IoRemove, IoTrendingDown, IoTrendingUp } from 'react-icons/io5'

import {
  formatOntMetricCardDateTime,
  formatOntMetricCardValue,
  ontMetricActualValueChanged,
  type OntMetricCardModel,
} from '@/features/ont/lib/ont-metric-display'
import {
  getOntMetricThresholdConfig,
  resolveOntMetricThresholdSegment,
  type OntMetricThresholdConfig,
  type OntMetricThresholdTone,
} from '@/features/ont/lib/ont-metric-thresholds'
import { getOntMetricHeaderIcon } from '@/features/ont/lib/ont-metric-header-icon'
import { resolveOntBipMetricGraphId } from '@/features/ont/lib/resolve-ont-bip-metric-graph-id'
import { OntBipMetricSparkline } from '@/features/ont/ui/OntBipMetricSparkline'

interface Props {
  metric: OntMetricCardModel
  /** Serial ONT para sparkline histórico en tarjetas BIP. */
  ontId?: string
  /** OLT requerida por `historicalbyont`. */
  oltId?: string
  /** Spinner sólo sobre min / prom / max (ej. esperando `aggobyont`). */
  aggregateLoading?: boolean
}

type ThresholdBarConfig = OntMetricThresholdConfig

function getMetricColorClass(color: OntMetricCardModel['color']): string {
  switch (color) {
    case 'neutral':
      return 'bg-(--secondary)/28 dark:bg-(--secondary)/55'
    case 'card-red':
      return 'bg-(--card-red)/85'
    case 'card-yellow':
      return 'bg-(--card-yellow)/85'
    case 'card-orange':
      return 'bg-(--card-orange)/85'
    case 'card-green':
      return 'bg-(--card-green)/85'
    case 'card-blue':
      return 'bg-(--primary-2)/85 dark:bg-(--secondary)/80'
    default:
      return 'bg-(--secondary)/28 dark:bg-(--secondary)/55'
  }
}

function getMetricBorderClassName(color: OntMetricCardModel['color']): string {
  switch (color) {
    case 'card-red':
      return 'border-(--card-red)/60 dark:border-(--card-red)/55'
    case 'card-yellow':
      return 'border-(--card-yellow)/65 dark:border-(--card-yellow)/50'
    case 'card-orange':
      return 'border-(--card-orange)/60 dark:border-(--card-orange)/55'
    case 'card-green':
      return 'border-(--card-green)/60 dark:border-(--card-green)/55'
    case 'card-blue':
      return 'border-(--primary-2)/55 dark:border-(--secondary)/50'
    default:
      return 'border-[#d9e0e8] dark:border-white/10'
  }
}

function getMetricValueClassName(color: OntMetricCardModel['color']): string {
  switch (color) {
    case 'card-red':
      return 'text-[#cc2e26] dark:text-(--card-red)'
    case 'card-yellow':
      return 'text-[#9a7400] dark:text-(--card-yellow)'
    case 'card-orange':
      return 'text-[#c45c12] dark:text-(--card-orange)'
    case 'card-green':
      return 'text-[#1f8a3b] dark:text-(--card-green)'
    case 'card-blue':
      return 'text-(--primary-2) dark:text-(--secondary)'
    default:
      return 'text-(--text-primary)'
  }
}

function getThresholdBarToneClassName(tone: OntMetricThresholdTone): string {
  switch (tone) {
    case 'red':
      return 'bg-[color-mix(in_srgb,var(--card-red)_78%,white)] dark:bg-(--card-red)/70'
    case 'orange':
      return 'bg-[color-mix(in_srgb,var(--card-orange)_80%,white)] dark:bg-(--card-orange)/70'
    case 'yellow':
      return 'bg-[color-mix(in_srgb,var(--card-yellow)_82%,white)] dark:bg-(--card-yellow)/70'
    case 'green':
      return 'bg-[color-mix(in_srgb,var(--card-green)_78%,white)] dark:bg-(--card-green)/70'
    case 'blue':
      return 'bg-[color-mix(in_srgb,var(--primary-2)_74%,white)] dark:bg-(--primary-2)/65'
    default:
      return 'bg-(--gray-01) dark:bg-white/15'
  }
}

function parseMetricNumber(value: string): number | null {
  const normalized = value.trim()
  if (!normalized || normalized === 'Sin Datos') {
    return null
  }
  const parsed = Number.parseFloat(normalized.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function getThresholdPositionPercent(value: number, config: ThresholdBarConfig): number {
  return Math.min(100, Math.max(0, ((value - config.min) / (config.max - config.min)) * 100))
}

function getMarkerStyle(percent: number): CSSProperties {
  if (percent <= 1) {
    return { left: 0 }
  }
  if (percent >= 99) {
    return { left: 'auto', right: 0 }
  }
  return { left: `${percent}%`, transform: 'translateX(-50%)' }
}

function formatThresholdTickValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toString()
}

function getThresholdCaptionItems(
  config: ThresholdBarConfig,
): Array<{ percent: number; text: string; align: 'left' | 'center' | 'right' }> {
  const items: Array<{ percent: number; text: string; align: 'left' | 'center' | 'right' }> = []
  const first = config.segments[0]
  const last = config.segments[config.segments.length - 1]
  if (first) {
    items.push({
      percent: 0,
      text: `${formatThresholdTickValue(first.start)} ${first.label.toLowerCase()}`,
      align: 'left',
    })
  }

  const optimo = config.segments.find((segment) => segment.label.toLowerCase() === 'óptimo')
  if (optimo && optimo !== first) {
    items.push({
      percent: getThresholdPositionPercent(optimo.start, config),
      text: `${formatThresholdTickValue(optimo.start)} ${optimo.label.toLowerCase()}`,
      align: 'center',
    })
  }

  if (last && last !== first) {
    const isOptimo = last.label.toLowerCase() === 'óptimo'
    items.push({
      percent: 100,
      text: isOptimo ? last.label.toLowerCase() : `${formatThresholdTickValue(last.end)} ${last.label.toLowerCase()}`,
      align: 'right',
    })
  }

  return items
}

function getRecalculationDirection(
  previousActual: string | undefined,
  currentActual: string,
): 'up' | 'down' | 'equal' {
  const previousValue = parseMetricNumber(previousActual ?? '')
  const currentValue = parseMetricNumber(currentActual)

  if (previousValue !== null && currentValue !== null) {
    if (currentValue === previousValue) {
      return 'equal'
    }
    if (currentValue < previousValue) {
      return 'down'
    }
    return 'up'
  }

  const previousLabel = toNonEmptyLabel(previousActual)
  const currentLabel = toNonEmptyLabel(currentActual)
  if (previousLabel === currentLabel) {
    return 'equal'
  }
  if (previousLabel !== 'Sin Datos' && currentLabel === 'Sin Datos') {
    return 'down'
  }

  return 'up'
}

function getToneBadgeClassName(tone: OntMetricThresholdTone): string {
  switch (tone) {
    case 'red':
      return 'bg-(--card-red)/12 text-[#cc2e26] dark:bg-(--card-red)/20 dark:text-(--card-red)'
    case 'orange':
      return 'bg-(--card-orange)/14 text-[#c45c12] dark:bg-(--card-orange)/20 dark:text-(--card-orange)'
    case 'yellow':
      return 'bg-(--card-yellow)/18 text-[#9a7400] dark:bg-(--card-yellow)/20 dark:text-(--card-yellow)'
    case 'green':
      return 'bg-(--card-green)/14 text-[#1f8a3b] dark:bg-(--card-green)/20 dark:text-(--card-green)'
    case 'blue':
      return 'bg-(--primary-2)/12 text-(--primary-2) dark:bg-(--secondary)/20 dark:text-(--secondary)'
    default:
      return 'bg-black/5 text-(--text-secondary) dark:bg-white/10'
  }
}

function toNonEmptyLabel(value: string | undefined): string {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : 'Sin Datos'
}

function OntAggregateStatsSpinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-(--text-secondary) border-t-transparent" />
  )
}

export function OntMetricCard({
  metric,
  ontId,
  oltId,
  aggregateLoading = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [livePulseKey, setLivePulseKey] = useState(0)
  const loading = Boolean(metric.loading)
  const showAggregateStatsBusy = Boolean(aggregateLoading)
  const hasData = metric.actual !== 'Sin Datos'
  const showMetricGuides = !loading && metric.actual !== 'Sin Datos'
  const unitLabel = metric.unit || 'Sin Datos'
  const showRecalculatedBadge = Boolean(metric.recalculated)
  const hasComparisonTooltipData = Boolean(
    metric.previousActual || metric.eventTime || metric.previousEventTime || metric.time,
  )
  const previousActualLabel = formatOntMetricCardValue(toNonEmptyLabel(metric.previousActual))
  const currentActualLabel = formatOntMetricCardValue(toNonEmptyLabel(metric.actual))
  const previousEventTimeLabel = formatOntMetricCardDateTime(
    metric.previousEventTime?.trim() || metric.time,
  )
  const eventTimeLabel = formatOntMetricCardDateTime(metric.eventTime)
  const titleLabel =
    unitLabel && unitLabel !== 'Sin Datos' ? `${metric.title} (${unitLabel})` : metric.title
  const thresholdBarConfig = getOntMetricThresholdConfig(metric.title)
  const isBipMetric = Boolean(resolveOntBipMetricGraphId(metric.title))
  const showAggregateStats = !isBipMetric
  const parsedActualValue = parseMetricNumber(metric.actual)
  const activeSegment =
    thresholdBarConfig && parsedActualValue !== null
      ? resolveOntMetricThresholdSegment(parsedActualValue, thresholdBarConfig)
      : null
  const recalculationDirection = getRecalculationDirection(metric.previousActual, metric.actual)
  const HeaderIcon = getOntMetricHeaderIcon(metric.title)
  const bipHistoricGraphId = resolveOntBipMetricGraphId(metric.title)
  const showBipSparkline = Boolean(ontId && oltId && bipHistoricGraphId)

  const didValueChangeOnRecalc = useMemo(() => {
    if (!metric.recalculated || loading) {
      return false
    }
    if (!metric.previousActual) {
      return false
    }
    return ontMetricActualValueChanged(metric.previousActual, metric.actual)
  }, [loading, metric.actual, metric.previousActual, metric.recalculated])

  useEffect(() => {
    if (!didValueChangeOnRecalc) {
      return
    }
    setLivePulseKey((key) => key + 1)
  }, [didValueChangeOnRecalc, metric.actual])

  const actualMarkerLeftPercent =
    thresholdBarConfig && parsedActualValue !== null
      ? getThresholdPositionPercent(parsedActualValue, thresholdBarConfig)
      : null
  const captionItems = thresholdBarConfig ? getThresholdCaptionItems(thresholdBarConfig) : []

  const comparisonTooltip = hasComparisonTooltipData ? (
    <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.35rem)] z-30 hidden w-[320px] -translate-x-1/2 rounded-lg border border-black/10 bg-white/95 p-2 text-[11px] text-(--text-primary) shadow-[0_8px_20px_rgb(0_0_0/0.2)] backdrop-blur-[1px] md:group-hover:block md:group-focus-within:block dark:border-white/15 dark:bg-(--card)">
      <div className="grid grid-cols-2 gap-x-2 text-center text-(--text-secondary)">
        <span>Información anterior</span>
        <span>Información actual</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 text-center">
        <span className="truncate rounded-md border border-black/10 bg-black/5 px-1.5 py-1 font-semibold dark:border-white/15 dark:bg-white/5">
          {previousActualLabel}
        </span>
        <span className="truncate rounded-md border border-black/10 bg-black/5 px-1.5 py-1 font-semibold dark:border-white/15 dark:bg-white/5">
          {currentActualLabel}
        </span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 text-center text-(--text-secondary)">
        <span>Hora anterior</span>
        <span>Hora actual</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 text-center">
        <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-1 text-[10px] leading-tight font-medium whitespace-normal wrap-break-word dark:border-white/15 dark:bg-white/5">
          {previousEventTimeLabel}
        </span>
        <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-1 text-[10px] leading-tight font-medium whitespace-normal wrap-break-word dark:border-white/15 dark:bg-white/5">
          {eventTimeLabel}
        </span>
      </div>
    </div>
  ) : null

  return (
    <div
      key={didValueChangeOnRecalc ? `card-pulse-${livePulseKey}` : undefined}
      className={clsx(
        'relative flex min-h-[100px] w-full flex-col gap-1 rounded-lg border bg-(--card) p-2 shadow-[0_1px_3px_rgb(15_23_42/0.05)] dark:bg-(--card)',
        'lg:min-h-[168px] lg:rounded-xl lg:px-2.5 lg:py-2 lg:shadow-[0_4px_12px_rgb(15_23_42/0.06)]',
        getMetricBorderClassName(metric.color),
        didValueChangeOnRecalc && 'ont-metric-card-live-pulse',
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <h2 className="inline-flex min-w-0 items-center gap-1.5 text-left text-[13px] font-medium leading-tight text-(--text-primary)">
          <HeaderIcon className="size-[18px] shrink-0 text-(--text-secondary)" aria-hidden />
          <span className="min-w-0 truncate">{titleLabel}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {showRecalculatedBadge ? (
            <div className="group relative">
              <span
                className={clsx(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full',
                  activeSegment
                    ? getToneBadgeClassName(activeSegment.tone)
                    : 'bg-black/5 text-(--text-secondary) dark:bg-white/10',
                )}
                aria-label={
                  recalculationDirection === 'down'
                    ? 'Métrica recalculada con valor hacia abajo'
                    : recalculationDirection === 'equal'
                      ? 'Métrica recalculada sin cambios'
                      : 'Métrica recalculada con valor hacia arriba'
                }
              >
                {recalculationDirection === 'down' ? (
                  <IoTrendingDown className="h-3 w-3 shrink-0" />
                ) : recalculationDirection === 'equal' ? (
                  <IoRemove className="h-3 w-3 shrink-0" />
                ) : (
                  <IoTrendingUp className="h-3 w-3 shrink-0" />
                )}
              </span>
              {comparisonTooltip}
            </div>
          ) : null}
          {activeSegment && !loading ? (
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none',
                getToneBadgeClassName(activeSegment.tone),
              )}
            >
              {activeSegment.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center lg:justify-start">
        {hasData ? (
          <>
            <div className="flex w-full flex-col items-center justify-center lg:min-h-[2.5rem]">
              {showMetricGuides && !loading ? (
                <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 lg:flex lg:justify-center">
                  <span
                    className={clsx(
                      'h-1.5 min-h-[6px] w-full rounded-full lg:hidden',
                      getMetricColorClass(metric.color),
                    )}
                  />
                  <div className="group relative flex shrink-0 flex-col items-center justify-center">
                    <span
                      className={clsx(
                        'flex items-center justify-center text-center text-[1.6rem] font-semibold tabular-nums leading-none md:text-[1.45rem] lg:text-[1.85rem]',
                        getMetricValueClassName(metric.color),
                      )}
                    >
                      {currentActualLabel}
                    </span>
                    {!showRecalculatedBadge ? comparisonTooltip : null}
                  </div>
                  <span
                    className={clsx(
                      'h-1.5 min-h-[6px] w-full rounded-full lg:hidden',
                      getMetricColorClass(metric.color),
                    )}
                  />
                </div>
              ) : loading ? (
                <div
                  className="flex min-h-9 min-w-9 items-center justify-center"
                  role="status"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <span className="sr-only">Cargando {metric.title}</span>
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-(--text-secondary) border-t-transparent" />
                </div>
              ) : (
                <div className="group relative flex flex-col items-center">
                  <span
                    className={clsx(
                      'inline-flex items-center justify-center text-[1.6rem] font-semibold leading-none md:text-[1.45rem] lg:text-[1.85rem]',
                      getMetricValueClassName(metric.color),
                    )}
                  >
                    {currentActualLabel}
                  </span>
                  {!showRecalculatedBadge ? comparisonTooltip : null}
                </div>
              )}
            </div>

            {thresholdBarConfig && !loading && actualMarkerLeftPercent !== null ? (
              <div className="mt-3 hidden w-full lg:block">
                <div className="relative h-2 overflow-hidden rounded-full bg-(--background)">
                  <div className="flex h-full w-full">
                    {thresholdBarConfig.segments.map((segment) => {
                      const width =
                        ((segment.end - segment.start) /
                          (thresholdBarConfig.max - thresholdBarConfig.min)) *
                        100
                      return (
                        <span
                          key={`${segment.label}-${segment.start}-${segment.end}`}
                          className={clsx('block h-full', getThresholdBarToneClassName(segment.tone))}
                          style={{ width: `${width}%` }}
                        />
                      )
                    })}
                  </div>
                  <span
                    className="absolute inset-y-0 z-10 w-0.5 bg-(--text-primary)"
                    style={getMarkerStyle(actualMarkerLeftPercent)}
                    aria-hidden
                  />
                </div>
                <div className="relative mt-1 min-h-[1rem] text-[8px] font-medium leading-tight text-(--text-secondary)">
                  {captionItems.map((item) => (
                    <span
                      key={`${item.text}-${item.percent}`}
                      className="absolute top-0 whitespace-nowrap"
                      style={
                        item.align === 'left'
                          ? { left: 0 }
                          : item.align === 'right'
                            ? { right: 0 }
                            : { left: `${item.percent}%`, transform: 'translateX(-50%)' }
                      }
                    >
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {!thresholdBarConfig && !isBipMetric && !loading ? (
              <p className="mt-3 hidden text-center text-[10px] text-(--text-secondary)/80 lg:block">
                Sin umbral configurado
              </p>
            ) : null}

            {showAggregateStats ? (
              <div className="flex h-7 shrink-0 items-center justify-center md:hidden">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={`Mostrar detalle de ${metric.title}`}
                  className="inline-flex items-center justify-center rounded-md p-1 text-(--text-secondary)"
                  onClick={() => setIsExpanded((prev) => !prev)}
                >
                  <IoChevronDown
                    className={clsx(
                      'transition-transform duration-200',
                      isExpanded && 'rotate-180',
                    )}
                    size={20}
                  />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex w-full items-center justify-center py-3">
            <div className="group relative">
              <span className="inline-flex w-full items-center justify-center text-center text-[1.6rem] font-semibold leading-none md:text-[1.45rem] lg:text-[1.85rem]">
                {currentActualLabel}
              </span>
              {comparisonTooltip}
            </div>
          </div>
        )}
      </div>

      {showBipSparkline && ontId && oltId && bipHistoricGraphId ? (
        <div className="mx-auto flex w-full max-w-[220px] justify-end pb-1 lg:max-w-none">
          <OntBipMetricSparkline ont={ontId} oltId={oltId} graphId={bipHistoricGraphId} />
        </div>
      ) : null}

      {showAggregateStats ? (
        <div
          className={clsx(
            'w-full shrink-0 pt-2 lg:flex lg:flex-col lg:pt-0',
            isExpanded ? 'block' : 'hidden md:block',
          )}
        >
          <div className="mx-auto mt-2 w-full max-w-[220px] border-t border-black/10 pt-2 lg:mt-2 lg:max-w-none lg:pt-1.5 dark:border-white/10">
            <div
              role={showAggregateStatsBusy ? 'status' : undefined}
              aria-busy={showAggregateStatsBusy ? true : undefined}
              className="mx-auto grid w-full grid-cols-3 gap-2 text-center lg:gap-1.5"
            >
              {showAggregateStatsBusy ? (
                <span className="sr-only">
                  Cargando mínimo, promedio y máximo para {metric.title}
                </span>
              ) : null}
              {(
                [
                  { label: 'min', value: metric.min },
                  { label: 'prom', value: metric.avg },
                  { label: 'max', value: metric.max },
                ] as const
              ).map(({ label, value }) => (
                <div
                  key={label}
                  className="flex min-h-[36px] flex-col items-center justify-center gap-0.5 text-center lg:min-h-[28px]"
                >
                  {showAggregateStatsBusy ? (
                    <OntAggregateStatsSpinner />
                  ) : (
                    <span className="text-xs font-semibold md:text-[11px]">{formatOntMetricCardValue(value)}</span>
                  )}
                  <span className="text-[10px] leading-tight text-(--text-secondary) md:text-[9px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
