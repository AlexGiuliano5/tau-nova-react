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
  type OntMetricThresholdConfig,
  type OntMetricThresholdTone,
} from '@/features/ont/lib/ont-metric-thresholds'
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

interface ThresholdSegment {
  label: string
  start: number
  end: number
  tone: OntMetricThresholdTone
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
    default:
      return 'bg-(--secondary)/28 dark:bg-(--secondary)/55'
  }
}

function getMetricAccentClassName(color: OntMetricCardModel['color']): string {
  const darkNeutralAccent = 'dark:lg:border-white/10 dark:lg:bg-(--card)'

  switch (color) {
    case 'card-red':
      return `lg:border-(--card-red)/45 lg:bg-(--card-red)/10 ${darkNeutralAccent}`
    case 'card-yellow':
      return `lg:border-(--card-yellow)/55 lg:bg-(--card-yellow)/12 ${darkNeutralAccent}`
    case 'card-orange':
      return `lg:border-(--card-orange)/50 lg:bg-(--card-orange)/12 ${darkNeutralAccent}`
    case 'card-green':
      return `lg:border-(--card-green)/45 lg:bg-(--card-green)/10 ${darkNeutralAccent}`
    default:
      return `lg:border-(--secondary)/30 lg:bg-(--violeta-iconos-teco)/45 ${darkNeutralAccent}`
  }
}

function getThresholdToneClassName(tone: ThresholdSegment['tone']): string {
  switch (tone) {
    case 'red':
      return 'bg-(--card-red)'
    case 'orange':
      return 'bg-(--card-orange)'
    case 'yellow':
      return 'bg-(--card-yellow)'
    case 'green':
      return 'bg-(--card-green)'
    case 'blue':
      return 'bg-(--primary-2)'
    default:
      return 'bg-(--gray-03)'
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

function getThresholdBarConfig(title: string): ThresholdBarConfig | null {
  return getOntMetricThresholdConfig(title)
}

function getThresholdTickValues(config: ThresholdBarConfig): number[] {
  if (config.tickValues && config.tickValues.length > 0) {
    return config.tickValues
  }
  const allValues = [config.min, ...config.segments.map((segment) => segment.end)]
  const uniqueValues = Array.from(new Set(allValues.map((value) => value.toFixed(2))))
  return uniqueValues.map((value) => Number.parseFloat(value))
}

function getThresholdPositionPercent(value: number, config: ThresholdBarConfig): number {
  return Math.min(100, Math.max(0, ((value - config.min) / (config.max - config.min)) * 100))
}

function getThresholdTickMarkStyle(percent: number): CSSProperties {
  if (percent <= 1) {
    return { left: '0%', transform: 'none' }
  }
  if (percent >= 99) {
    return { left: '100%', transform: 'translateX(-100%)' }
  }
  return { left: `${percent}%`, transform: 'translateX(-50%)' }
}

function getThresholdTickValueStyle(percent: number): CSSProperties {
  if (percent <= 2) {
    return { left: '0%', transform: 'translateX(0)', textAlign: 'left' }
  }
  if (percent >= 98) {
    return { left: '100%', transform: 'translateX(-100%)', textAlign: 'right' }
  }
  return { left: `${percent}%`, transform: 'translateX(-50%)', textAlign: 'center' }
}

function formatThresholdTickValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toString()
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

function getToneBadgeClassName(tone: ThresholdSegment['tone']): string {
  switch (tone) {
    case 'red':
      return 'border border-(--card-red)/45 bg-(--card-red)/12 text-(--card-red) dark:border-(--card-red)/50 dark:bg-(--card-red)/20'
    case 'orange':
      return 'border border-(--card-orange)/45 bg-(--card-orange)/12 text-(--card-orange) dark:border-(--card-orange)/50 dark:bg-(--card-orange)/20'
    case 'yellow':
      return 'border border-(--card-yellow)/55 bg-(--card-yellow)/12 text-(--text-primary) dark:border-(--card-yellow)/60 dark:bg-(--card-yellow)/20'
    case 'green':
      return 'border border-(--card-green)/45 bg-(--card-green)/12 text-(--state-01) dark:border-(--card-green)/55 dark:bg-(--card-green)/20 dark:text-(--card-green)'
    case 'blue':
      return 'border border-(--primary-2)/35 bg-(--primary-2)/12 text-(--primary-2) dark:border-(--secondary)/45 dark:bg-(--secondary-3)/35 dark:text-(--secondary)'
    default:
      return 'border border-(--secondary)/35 bg-(--secondary)/14 text-(--text-secondary) dark:border-(--secondary)/45 dark:bg-(--secondary-3)/35'
  }
}

function getThresholdToneForValue(
  value: number,
  thresholdBarConfig: ThresholdBarConfig,
): ThresholdSegment['tone'] | null {
  const lastSegmentIndex = thresholdBarConfig.segments.length - 1
  const matchingSegment = thresholdBarConfig.segments.find((segment, index) => {
    if (index === lastSegmentIndex) {
      return value >= segment.start && value <= segment.end
    }
    return value >= segment.start && value < segment.end
  })
  return matchingSegment?.tone ?? null
}

function getRecalculationBadgeClassName(
  thresholdBarConfig: ThresholdBarConfig | null,
  parsedActualValue: number | null,
): string {
  if (thresholdBarConfig && parsedActualValue !== null) {
    const tone = getThresholdToneForValue(parsedActualValue, thresholdBarConfig)
    return getToneBadgeClassName(tone ?? 'neutral')
  }

  return 'border border-(--secondary)/35 bg-(--violeta-iconos-teco)/70 text-(--secondary-3) dark:border-(--secondary)/45 dark:bg-(--secondary-3)/40 dark:text-(--secondary)'
}

function toNonEmptyLabel(value: string | undefined): string {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : 'Sin Datos'
}

function splitMetricSurveyDateTime(value?: string): { fecha: string; hora: string } {
  const normalized = value?.trim() ?? ''
  if (!normalized) {
    return { fecha: '', hora: '' }
  }

  const spaceIndex = normalized.indexOf(' ')
  if (spaceIndex === -1) {
    return { fecha: normalized, hora: '' }
  }

  return {
    fecha: normalized.slice(0, spaceIndex),
    hora: normalized.slice(spaceIndex + 1).trim(),
  }
}

const DESKTOP_THRESHOLD_ZONE_HEIGHT_CLASS = 'lg:h-[84px]'

const surveyHoraChipClassName =
  'pointer-events-auto absolute right-0 inline-flex items-center rounded-md border border-black/10 bg-black/5 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums leading-none text-(--text-primary) dark:border-white/15 dark:bg-white/10 md:text-[10px]'

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
  const surveyHora = splitMetricSurveyDateTime(metric.time).hora
  const showSurveyHora = !metric.recalculated && !loading && Boolean(surveyHora)
  const thresholdBarConfig = getThresholdBarConfig(metric.title)
  const parsedActualValue = parseMetricNumber(metric.actual)
  const thresholdTickValues = thresholdBarConfig ? getThresholdTickValues(thresholdBarConfig) : []
  const recalculationDirection = getRecalculationDirection(metric.previousActual, metric.actual)
  const recalculationBadgeClassName = getRecalculationBadgeClassName(
    thresholdBarConfig,
    parsedActualValue,
  )
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
        'relative flex min-h-[100px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-[#d9e0e8] bg-white/65 p-1.5 shadow-[0_1px_3px_rgb(15_23_42/0.05)] dark:border-white/10 dark:bg-(--card)',
        'lg:h-[210px] lg:min-h-[210px] lg:flex-col lg:items-stretch lg:gap-1.5 lg:rounded-xl lg:border lg:px-2.5 lg:py-2 lg:shadow-[0_6px_16px_rgb(15_23_42/0.07)]',
        getMetricAccentClassName(metric.color),
        didValueChangeOnRecalc && 'ont-metric-card-live-pulse',
      )}
    >
      {showRecalculatedBadge ? (
        <div className="group absolute left-1.5 top-1 z-20 md:left-2 md:top-2 lg:left-auto lg:right-2 lg:top-2.5">
          <span
            className={clsx(
              'inline-flex h-5 w-5 items-center justify-center rounded-full p-0',
              recalculationBadgeClassName,
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

      <div className="flex w-full min-h-0 flex-1 flex-col gap-2 max-lg:w-full max-lg:flex-none lg:min-h-0 lg:gap-1">
        <div
          className={clsx(
            'pointer-events-none relative flex w-full shrink-0 items-center justify-center px-1 lg:min-h-8',
            showSurveyHora && 'px-[4.75rem]',
          )}
        >
          <h2 className="pointer-events-auto text-center text-[10px] font-semibold leading-tight text-(--text-secondary) md:text-[9px] lg:text-[10px] lg:font-semibold lg:tracking-[0.01em]">
            {titleLabel}
          </h2>
          {showSurveyHora ? <span className={surveyHoraChipClassName}>{surveyHora}</span> : null}
        </div>
        <div
          className={clsx(
            'flex min-h-0 w-full flex-1 flex-col items-center justify-center lg:items-stretch',
            thresholdBarConfig ? 'lg:justify-start' : 'lg:justify-center',
          )}
        >
          {hasData ? (
            <>
              <div className="mx-auto flex w-full max-w-[220px] shrink-0 flex-col items-center justify-center min-h-0 lg:max-w-none lg:min-h-[2.25rem]">
                {showMetricGuides && !loading ? (
                  <div
                    className={clsx(
                      'grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-3',
                      thresholdBarConfig && 'lg:flex lg:items-center lg:justify-center',
                    )}
                  >
                    <span
                      className={clsx(
                        'h-1.5 min-h-[6px] w-full rounded-full lg:h-2',
                        thresholdBarConfig && 'lg:hidden',
                        getMetricColorClass(metric.color),
                      )}
                    />
                    <div className="group relative flex min-h-[1.25em] shrink-0 flex-col items-center justify-center justify-self-center">
                      <span className="flex items-center justify-center text-center text-[1.6rem] font-semibold tabular-nums leading-none md:text-[1.35rem] lg:text-[1.95rem]">
                        {currentActualLabel}
                      </span>
                      {!showRecalculatedBadge ? comparisonTooltip : null}
                    </div>
                    <span
                      className={clsx(
                        'h-1.5 min-h-[6px] w-full rounded-full lg:h-2',
                        thresholdBarConfig && 'lg:hidden',
                        getMetricColorClass(metric.color),
                      )}
                    />
                  </div>
                ) : loading ? (
                  <div
                    className="flex min-h-9 min-w-9 shrink-0 items-center justify-center justify-self-center"
                    role="status"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <span className="sr-only">Cargando {metric.title}</span>
                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-(--text-secondary) border-t-transparent" />
                  </div>
                ) : (
                  <div className="group relative flex flex-col items-center">
                    <span className="inline-flex items-center justify-center text-[1.6rem] font-semibold leading-none md:text-[1.35rem] lg:text-[1.95rem]">
                      {currentActualLabel}
                    </span>
                    {!showRecalculatedBadge ? comparisonTooltip : null}
                  </div>
                )}
              </div>

              {thresholdBarConfig ? (
                <div
                  className={clsx(
                    'hidden w-full shrink-0 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:overflow-visible lg:pt-3',
                    DESKTOP_THRESHOLD_ZONE_HEIGHT_CLASS,
                  )}
                >
                  {!loading && thresholdBarConfig && actualMarkerLeftPercent !== null ? (
                    <>
                      <div className="relative shrink-0">
                        <div className="relative min-h-[20px] lg:min-h-[26px]">
                          <div
                            className="pointer-events-none absolute bottom-0 z-10 flex flex-col items-center"
                            style={{
                              left: `${actualMarkerLeftPercent}%`,
                              transform: 'translateX(-50%)',
                            }}
                          >
                            <span className="rounded bg-(--primary-2) px-1 py-0.5 text-[8px] font-semibold tracking-wide text-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] dark:bg-(--secondary-3)">
                              ACTUAL
                            </span>
                            <span
                              className="h-3.5 w-px shrink-0 bg-(--primary-2) dark:bg-(--secondary-3)"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                        <div className="relative z-0 flex h-1.5 overflow-hidden rounded-full border border-(--outline)/70 bg-(--background)">
                          {thresholdBarConfig.segments.map((segment) => {
                            const width =
                              ((segment.end - segment.start) /
                                (thresholdBarConfig.max - thresholdBarConfig.min)) *
                              100
                            return (
                              <span
                                key={`${segment.label}-${segment.start}-${segment.end}`}
                                className={clsx(
                                  'block h-full',
                                  getThresholdToneClassName(segment.tone),
                                )}
                                style={{ width: `${width}%` }}
                              />
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-1 flex shrink-0 overflow-hidden text-[8px] font-medium leading-tight text-(--text-secondary) lg:mt-0.5 lg:text-[8px] lg:leading-tight">
                        {thresholdBarConfig.segments.map((segment) => {
                          const width =
                            ((segment.end - segment.start) /
                              (thresholdBarConfig.max - thresholdBarConfig.min)) *
                            100
                          return (
                            <span
                              key={`label-${segment.label}-${segment.start}`}
                              className="block truncate px-0.5 text-center whitespace-nowrap"
                              style={{ width: `${width}%` }}
                            >
                              {segment.label}
                            </span>
                          )
                        })}
                      </div>
                      <div className="mt-0.5 shrink-0 pb-1 lg:mt-0.5 lg:pb-0">
                        <div className="relative h-1.5 lg:h-1">
                          {thresholdTickValues.map((value) => {
                            const tickPercent = getThresholdPositionPercent(
                              value,
                              thresholdBarConfig,
                            )
                            return (
                              <span
                                key={`tick-mark-${value}`}
                                className="absolute top-0 block h-1.5 w-px bg-(--outline) lg:h-1"
                                style={getThresholdTickMarkStyle(tickPercent)}
                                aria-hidden="true"
                              />
                            )
                          })}
                        </div>
                        <div className="relative mt-0.5 min-h-[0.75rem] text-[9px] font-semibold tabular-nums leading-none text-(--text-primary) lg:mt-0.5 lg:min-h-[12px] lg:text-[9px]">
                          {thresholdTickValues.map((value) => {
                            const tickPercent = getThresholdPositionPercent(
                              value,
                              thresholdBarConfig,
                            )
                            return (
                              <span
                                key={`tick-value-${value}`}
                                className="absolute top-0 whitespace-nowrap"
                                style={getThresholdTickValueStyle(tickPercent)}
                              >
                                {formatThresholdTickValue(value)}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}

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
            </>
          ) : (
            <div className="flex h-18 w-full items-center justify-center lg:min-h-0">
              <div className="group relative">
                <span className="inline-flex w-full items-center justify-center text-center text-[1.6rem] font-semibold leading-none md:text-[1.35rem] lg:text-[2.05rem]">
                  {currentActualLabel}
                </span>
                {comparisonTooltip}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBipSparkline && ontId && oltId && bipHistoricGraphId ? (
        <div className="mx-auto flex w-full max-w-[220px] justify-end pb-1 lg:max-w-none">
          <OntBipMetricSparkline ont={ontId} oltId={oltId} graphId={bipHistoricGraphId} />
        </div>
      ) : null}

      <div
        className={clsx(
          'w-full shrink-0 pt-2 lg:flex lg:flex-col lg:shrink-0 lg:pt-0',
          isExpanded ? 'block' : 'hidden md:block',
        )}
      >
        <div
          className={clsx(
            'mx-auto w-full max-w-[220px] border-t border-black/10 pt-3 lg:max-w-none lg:pt-1.5 dark:border-white/10',
            showBipSparkline ? 'mt-0 lg:mt-1' : 'mt-4 lg:mt-3',
          )}
        >          <div
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
                className="flex min-h-[44px] flex-col items-center justify-center gap-1 text-center lg:min-h-[32px] lg:gap-0.5"
              >
                {showAggregateStatsBusy ? (
                  <OntAggregateStatsSpinner />
                ) : (
                  <span className="text-xs font-semibold md:text-[11px] lg:text-[11px]">
                    {formatOntMetricCardValue(value)}
                  </span>
                )}
                <span className="text-[10px] leading-tight text-(--text-secondary) md:text-[9px] lg:text-[9px] lg:font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
