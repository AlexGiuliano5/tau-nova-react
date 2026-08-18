import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFtthOltNames } from '@/features/ftth/hooks/use-ftth-olt-names'
import {
  networkElementInvalidSearchMessage,
  resolveNetworkElementSearchHref,
} from '@/features/ftth/lib/network-element-search'

export type NetworkElementSearchSubmitResult = 'navigated' | 'empty' | 'invalid'

type Options = {
  emptyValueMessage?: string
  onNavigateSuccess?: () => void
  oltNameList?: string[]
}

/**
 * Resolver + navegación. Los recientes se persisten al entrar a OLT/ONT.
 */
export function useNetworkElementSearchNavigation(options: Options = {}) {
  const { emptyValueMessage, onNavigateSuccess, oltNameList } = options
  const oltNamesFromClient = useFtthOltNames()
  const oltNames = oltNameList !== undefined ? oltNameList : oltNamesFromClient
  const navigate = useNavigate()

  const resolveHref = useCallback(
    (raw: string) => resolveNetworkElementSearchHref(raw, oltNames),
    [oltNames],
  )

  const submit = useCallback(
    (
      raw: string,
      setError: (message: string | null) => void,
    ): NetworkElementSearchSubmitResult => {
      const next = raw.trim()
      if (!next) {
        if (emptyValueMessage) {
          setError(emptyValueMessage)
        }
        return 'empty'
      }

      const destination = resolveNetworkElementSearchHref(next, oltNames)
      if (!destination) {
        setError(networkElementInvalidSearchMessage)
        return 'invalid'
      }

      setError(null)
      void navigate(destination)
      onNavigateSuccess?.()
      return 'navigated'
    },
    [emptyValueMessage, navigate, oltNames, onNavigateSuccess],
  )

  return {
    oltNames,
    resolveHref,
    submit,
  }
}
