import { useQuery } from '@tanstack/react-query'

import {
  fetchOntComparisonSeries,
  type ComparisonGraphId,
  type HistoricChartDays,
  type HistoricStatusTimeFilter,
  isMetricGraph,
  isStatusOrTrafficGraph,
} from '@/features/ont/api/comparison-historic'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'

const STALE_MS = 5 * 60 * 1000
const GC_MS = 30 * 60 * 1000

export function useOntHistoricSeriesQuery(input: {
  ontSerial: string
  oltId: string
  graphId: ComparisonGraphId
  days: HistoricChartDays
  timeFilter: HistoricStatusTimeFilter
  enabled?: boolean
}) {
  const ontKey = normalizeOntId(input.ontSerial) || input.ontSerial.trim()
  const periodKey = isMetricGraph(input.graphId)
    ? `days:${input.days}`
    : isStatusOrTrafficGraph(input.graphId)
      ? `tf:${input.timeFilter}`
      : 'none'

  return useQuery({
    queryKey: [
      'ont-historic-series',
      ontKey,
      input.oltId.trim(),
      input.graphId,
      periodKey,
    ],
    enabled:
      (input.enabled ?? true) &&
      Boolean(ontKey) &&
      Boolean(input.oltId.trim()),
    staleTime: STALE_MS,
    gcTime: GC_MS,
    queryFn: async ({ signal }) => {
      const series = await fetchOntComparisonSeries(
        {
          ontSerial: input.ontSerial,
          oltId: input.oltId,
          graphId: input.graphId,
          days: input.days,
          timeFilter: input.timeFilter,
        },
        signal,
      )
      return series
    },
  })
}
