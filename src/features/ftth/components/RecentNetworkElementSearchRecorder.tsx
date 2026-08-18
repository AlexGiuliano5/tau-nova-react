import { useEffect, useRef } from 'react'

import { saveRecentNetworkElementSearch } from '@/features/ftth/api/recent-searches'

interface Props {
  value: string
}

/**
 * Persiste un reciente al entrar a OLT/ONT.
 * Una sola escritura por valor mientras el layout permanece montado.
 */
export function RecentNetworkElementSearchRecorder({ value }: Props) {
  const lastRecordedValueRef = useRef<string | null>(null)

  useEffect(() => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return

    if (lastRecordedValueRef.current === normalizedValue) return

    lastRecordedValueRef.current = normalizedValue
    void saveRecentNetworkElementSearch({ value: normalizedValue }).catch(() => {})
  }, [value])

  return null
}
