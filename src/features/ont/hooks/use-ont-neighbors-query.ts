import { useQuery } from '@tanstack/react-query'

import { fetchOntNeighborsGrid } from '@/features/ont/api/neighbors'

export function useOntNeighborsQuery(entityId: string) {
  return useQuery({
    queryKey: ['ont-neighbors-grid', entityId],
    queryFn: async ({ signal }) => {
      const result = await fetchOntNeighborsGrid(entityId, signal)
      if (!result.ok) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 60_000,
  })
}
