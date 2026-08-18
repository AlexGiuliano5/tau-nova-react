import { useCallback, useEffect, useRef, useState } from 'react'

import { CardSpinner } from '@/features/ftth/components/CardSpinner'
import { HistoricTimeFilterChips } from '@/features/ftth/components/HistoricTimeFilterChips'
import { fetchOltStatusGraph } from '@/features/olt/api/status-graph'
import {
  fetchOltStatusTimeFilterPreference,
  saveOltStatusTimeFilterPreference,
} from '@/features/olt/api/status-time-filter-preference'
import {
  DEFAULT_OLT_STATUS_TIME_FILTER,
  OLT_STATUS_TIME_FILTER_OPTIONS,
  type OltStatusGraphResult,
  type OltStatusTimeFilter,
} from '@/features/olt/types/status-chart'
import { oltStatusHistoryCardClassName } from '@/features/olt/ui/OltStatusHistoryCardContent'
import { OltStatusHistoryCardLoading } from '@/features/olt/ui/OltStatusHistoryCardLoading'
import { PortStatusHistoryCard } from '@/features/port/ui/PortStatusHistoryCard'

interface Props {
  olt: string
  placa: number
  puerto: number
}

const errorResult: OltStatusGraphResult = { rows: [], issue: 'unexpected' }

export function PortStatusHistoryCardClient({ olt, placa, puerto }: Props) {
  const [timeFilterReady, setTimeFilterReady] = useState(false)
  const [timeFilter, setTimeFilter] = useState<OltStatusTimeFilter>(
    DEFAULT_OLT_STATUS_TIME_FILTER,
  )
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<OltStatusGraphResult>({ rows: [], issue: 'none' })
  const timeFilterRef = useRef(timeFilter)

  useEffect(() => {
    timeFilterRef.current = timeFilter
  }, [timeFilter])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    void (async () => {
      try {
        const next = await fetchOltStatusTimeFilterPreference(controller.signal)
        if (active) setTimeFilter(next)
      } finally {
        if (active) setTimeFilterReady(true)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!timeFilterReady) return

    let active = true
    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      try {
        const next = await fetchOltStatusGraph(olt, timeFilter, controller.signal, {
          slot: placa,
          port: puerto,
        })
        if (active) setResult(next)
      } catch {
        if (active && !controller.signal.aborted) setResult(errorResult)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [olt, placa, puerto, timeFilter, timeFilterReady])

  const handleTimeFilterChange = useCallback((next: OltStatusTimeFilter) => {
    if (next === timeFilterRef.current) return
    setTimeFilter(next)
    void saveOltStatusTimeFilterPreference(next)
  }, [])

  if (!timeFilterReady) return <OltStatusHistoryCardLoading />

  if (loading) {
    return (
      <div className={oltStatusHistoryCardClassName} aria-busy="true" aria-live="polite">
        <header className="flex shrink-0 flex-col gap-2">
          <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
            Histórico de estados
          </h2>
          <HistoricTimeFilterChips
            value={timeFilter}
            options={OLT_STATUS_TIME_FILTER_OPTIONS}
            onChange={handleTimeFilterChange}
            disabled={!timeFilterReady}
          />
        </header>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <CardSpinner label="Cargando histórico de estados" />
        </div>
      </div>
    )
  }

  return (
    <PortStatusHistoryCard
      issue={result.issue}
      rows={result.rows}
      timeFilter={timeFilter}
      onTimeFilterChange={handleTimeFilterChange}
      timeFilterReady={timeFilterReady}
    />
  )
}
