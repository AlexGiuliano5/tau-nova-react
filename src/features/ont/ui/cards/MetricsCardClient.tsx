import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'

import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { resolveFtthDisplayIssueToneClass } from '@/features/ftth/lib/card-issue'
import { fetchOntAggByOnt } from '@/features/ont/api/agg-by-ont'
import {
  fetchInfoRealTimeByOnt,
  type BffInfoRealTimeByOntData,
} from '@/features/ont/api/info-realtime-by-ont'
import { mapInfracoRealtimeToMetricCards } from '@/features/ont/api/ont-context'
import {
  applyOntAggByOntToMetricCards,
  getOntMetricCardStatusColor,
  lastValuesToMetricCards,
  type OntMetricCardModel,
  unwrapAggByOntWire,
} from '@/features/ont/lib/ont-metric-display'
import type { OntContext } from '@/features/ont/types/ont'
import { OntCapaControlSection } from '@/features/ont/ui/OntCapaControlSection'
import { metricsCardClassName } from '@/features/ont/ui/OntInfoCardLoadings'
import { OntMetricCard } from '@/features/ont/ui/OntMetricCard'
import { HelpInfoPopover } from '@/shared/ui/HelpInfoPopover'

interface Props {
  ont: string
  context: OntContext
}

const REALTIME_TITLE_BY_FIELD: Array<{
  field: keyof Pick<
    BffInfoRealTimeByOntData,
    'ontRxPower' | 'ontTxPower' | 'ontVoltage' | 'ontTemperature'
  >
  titles: string[]
}> = [
  { field: 'ontRxPower', titles: ['ONT RX'] },
  { field: 'ontTxPower', titles: ['ONT TX'] },
  { field: 'ontVoltage', titles: ['ONT VOLTAGE', 'ONT Voltage'] },
  { field: 'ontTemperature', titles: ['ONT TEMPERATURE', 'ONT TEMP LASER', 'ONT Temperature'] },
]

function initialMetrics(context: OntContext): OntMetricCardModel[] {
  if (context.mode === 'infraco' && context.realtime) {
    return mapInfracoRealtimeToMetricCards(context.realtime)
  }
  return lastValuesToMetricCards(context.lastValues)
}

export function MetricsCardClient({ ont, context }: Props) {
  const isInfraco = context.mode === 'infraco'
  const [metrics, setMetrics] = useState<OntMetricCardModel[]>(() => initialMetrics(context))
  const [aggregateLoading, setAggregateLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [capaRefreshToken, setCapaRefreshToken] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    setMetrics(initialMetrics(context))
  }, [context])

  useEffect(() => {
    if (isInfraco) return
    const oltId = context.olt?.trim()
    if (!oltId || !ont.trim()) return

    const controller = new AbortController()
    setAggregateLoading(true)

    void (async () => {
      const wire = await fetchOntAggByOnt(ont, oltId, controller.signal)
      if (controller.signal.aborted) return
      if (wire) {
        setMetrics((prev) => applyOntAggByOntToMetricCards(prev, unwrapAggByOntWire(wire)))
      }
      setAggregateLoading(false)
    })()

    return () => controller.abort()
  }, [ont, context.olt, isInfraco])

  const handleRecalculate = useCallback(async () => {
    if (recalculating) return
    setRecalculating(true)
    setFeedback(null)
    setMetrics((prev) => prev.map((m) => ({ ...m, loading: true })))

    const result = await fetchInfoRealTimeByOnt(ont)
    if (!result.ok) {
      setMetrics((prev) => prev.map((m) => ({ ...m, loading: false })))
      setFeedback('No se pudo recalcular las métricas.')
      setRecalculating(false)
      return
    }

    if (isInfraco) {
      setMetrics(mapInfracoRealtimeToMetricCards(result.data))
    } else {
      setMetrics((prev) => mergeRealtimeIntoMetrics(prev, result.data))
      setCapaRefreshToken((token) => token + 1)

      const oltId = context.olt?.trim()
      if (oltId) {
        setAggregateLoading(true)
        const wire = await fetchOntAggByOnt(ont, oltId)
        if (wire) {
          setMetrics((prev) => applyOntAggByOntToMetricCards(prev, unwrapAggByOntWire(wire)))
        }
        setAggregateLoading(false)
      }
    }

    setFeedback('Métricas actualizadas.')
    setRecalculating(false)
  }, [context.olt, isInfraco, ont, recalculating])

  const isEmpty = metrics.length === 0

  return (
    <div
      className={clsx(
        metricsCardClassName,
        'gap-3 md:gap-2.5',
        isEmpty ? resolveFtthDisplayIssueToneClass('no-data') : null,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h1 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
            Métricas
          </h1>
          <HelpInfoPopover
            ariaLabel="Ver ayuda sobre métricas"
            panelClassName="left-0 translate-x-0"
            content={
              <div className="space-y-2">
                <p>Las métricas muestran valores de potencia y estado reportados por la ONT.</p>
                {!isInfraco ? (
                  <p>Expandí cada tarjeta para ver mínimo, promedio y máximo.</p>
                ) : null}
              </div>
            }
          />
        </div>
        <div className="flex items-center gap-2">
          {feedback ? (
            <p className="text-xs text-(--text-secondary)" role="status">
              {feedback}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleRecalculate()}
            disabled={recalculating}
            className="h-7 shrink-0 rounded-lg bg-(--primary-2) px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:text-[10px] dark:bg-(--secondary-3)"
          >
            {recalculating ? 'Recalculando…' : 'Recalcular'}
          </button>
        </div>
      </header>

      {isEmpty ? (
        <div
          className={clsx(
            'w-full rounded-xl border px-3 py-2.5',
            resolveFtthDisplayIssueToneClass('no-data'),
          )}
          role="status"
        >
          <FtthDataIssueNotice presentation="inline" issue="no-data" context="las métricas" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <OntMetricCard
              key={metric.title}
              metric={metric}
              ontId={ont}
              oltId={context.olt}
              aggregateLoading={!isInfraco && aggregateLoading && !metric.loading}
            />
          ))}
        </div>
      )}

      {!isInfraco ? (
        <OntCapaControlSection ont={ont} refreshToken={capaRefreshToken} />
      ) : null}
    </div>
  )
}

function mergeRealtimeIntoMetrics(
  cards: OntMetricCardModel[],
  data: BffInfoRealTimeByOntData,
): OntMetricCardModel[] {
  const eventTime = data.eventTime?.trim() || undefined

  return cards.map((card) => {
    const match = REALTIME_TITLE_BY_FIELD.find((entry) =>
      entry.titles.some((title) => title.toUpperCase() === card.title.trim().toUpperCase()),
    )
    if (!match) {
      return { ...card, loading: false }
    }

    const nextActualRaw = data[match.field]
    const nextActual = nextActualRaw?.trim() ? nextActualRaw.trim() : card.actual
    return {
      ...card,
      previousActual: card.actual,
      previousEventTime: card.eventTime || card.time,
      eventTime,
      time: eventTime || card.time,
      actual: nextActual,
      color: getOntMetricCardStatusColor(card.title, nextActual),
      recalculated: true,
      loading: false,
    }
  })
}
