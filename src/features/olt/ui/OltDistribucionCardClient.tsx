import { useEffect, useState } from 'react'

import { fetchOltSlotPortGrid } from '@/features/olt/api/slot-port'
import type { OltSlotPortGridActionResult } from '@/features/olt/types/slot-port'
import { OltDistribucionCard } from '@/features/olt/ui/OltDistribucionCard'
import { OltDistribucionCardLoading } from '@/features/olt/ui/OltDistribucionCardLoading'

interface Props {
  olt: string
}

const errorResult: OltSlotPortGridActionResult = {
  model: null,
  issue: 'unexpected',
}

export function OltDistribucionCardClient({ olt }: Props) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<OltSlotPortGridActionResult>({
    model: null,
    issue: 'none',
  })

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      try {
        const next = await fetchOltSlotPortGrid(olt, controller.signal)
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
  }, [olt])

  if (loading) return <OltDistribucionCardLoading />

  return <OltDistribucionCard model={result.model} oltRouteParam={olt} issue={result.issue} />
}
