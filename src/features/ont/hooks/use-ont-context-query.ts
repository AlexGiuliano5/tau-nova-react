import { useQuery } from '@tanstack/react-query'

import { resolveOntContext } from '@/features/ont/api/ont-context'
import { OntLastMetricError } from '@/features/ont/hooks/use-ont-last-metric-query'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'

const STALE_MS = 5 * 60 * 1000
const GC_MS = 30 * 60 * 1000

/**
 * Contexto de pantalla ONT: normal (LastMetrics) o infraco (realtime si no hay celda).
 * Comparte errores con OntLastMetricError para mensajes de UI existentes.
 */
export function useOntContextQuery(ont: string) {
  const ontKey = normalizeOntId(ont) || ont.trim()

  return useQuery({
    queryKey: ['ont-context', ontKey],
    enabled: Boolean(ontKey),
    staleTime: STALE_MS,
    gcTime: GC_MS,
    queryFn: async ({ signal }) => {
      const result = await resolveOntContext(ont, signal)
      if (!result.ok) {
        throw new OntLastMetricError(result.error === 'auth' ? 'auth' : result.error)
      }
      return result.context
    },
  })
}
