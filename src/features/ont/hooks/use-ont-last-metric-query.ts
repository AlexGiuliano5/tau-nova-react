import { useQuery } from '@tanstack/react-query'

import { fetchLastMetricByOnt } from '@/features/ont/api/last-metrics'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'

const STALE_MS = 5 * 60 * 1000
const GC_MS = 30 * 60 * 1000

export class OntLastMetricError extends Error {
  readonly code: 'auth' | 'no-data' | 'bff-error' | 'unknown'

  constructor(code: 'auth' | 'no-data' | 'bff-error' | 'unknown') {
    super(code)
    this.name = 'OntLastMetricError'
    this.code = code
  }
}

/** Solo LastMetrics (sin probe infraco). Preferir `useOntContextQuery` en detalle ONT. */
export function useOntLastMetricQuery(ont: string) {
  const ontKey = normalizeOntId(ont) || ont.trim()

  return useQuery({
    queryKey: ['ont-last-metric', ontKey],
    enabled: Boolean(ontKey),
    staleTime: STALE_MS,
    gcTime: GC_MS,
    queryFn: async ({ signal }) => {
      const result = await fetchLastMetricByOnt(ont, signal)
      if (!result.ok) {
        throw new OntLastMetricError(result.error)
      }
      return result.data
    },
  })
}
