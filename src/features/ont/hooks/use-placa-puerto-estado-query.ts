import { useQuery } from '@tanstack/react-query'

import { fetchPlacaPuertoEstado } from '@/features/ont/api/placa-puerto-estado'

const STALE_MS = 60_000

export function usePlacaPuertoEstadoQuery(
  olt: string,
  placa: number | null,
  puerto: number | null,
) {
  const oltKey = olt.trim().toUpperCase()
  const enabled =
    Boolean(oltKey) &&
    placa != null &&
    puerto != null &&
    Number.isFinite(placa) &&
    Number.isFinite(puerto) &&
    placa >= 1

  return useQuery({
    queryKey: ['olt', 'placa-puerto-estado', oltKey, placa, puerto],
    enabled,
    staleTime: STALE_MS,
    queryFn: async ({ signal }) => {
      const result = await fetchPlacaPuertoEstado(olt, placa as number, puerto as number, signal)
      return result.ok ? result.severity : null
    },
  })
}
