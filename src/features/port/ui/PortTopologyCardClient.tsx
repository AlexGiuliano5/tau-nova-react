import { useEffect, useState } from 'react'

import { CardSpinner } from '@/features/ftth/components/CardSpinner'
import { fetchOltPortTree } from '@/features/port/api/port-tree'
import type { GetOltPortTreeResult } from '@/features/port/types/port-tree'
import { PortTopologyCard } from '@/features/port/ui/PortTopologyCard'

interface Props {
  olt: string
  placa: number
  puerto: number
  highlightOnt?: string
}

const errorResult: GetOltPortTreeResult = { tree: null, issue: 'unexpected' }

const loadingClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 xl:p-3 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-3'

export function PortTopologyCardClient({ olt, placa, puerto, highlightOnt }: Props) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<GetOltPortTreeResult>({ tree: null, issue: 'none' })

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      try {
        const next = await fetchOltPortTree(olt, placa, puerto, controller.signal)
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
  }, [olt, placa, puerto])

  if (loading) {
    return (
      <div className={loadingClassName} aria-busy="true" aria-live="polite">
        <header>
          <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
            Topología de puerto
          </h2>
        </header>
        <div className="flex min-h-[200px] items-center justify-center md:min-h-[320px]">
          <CardSpinner label="Cargando topología de puerto" />
        </div>
      </div>
    )
  }

  return <PortTopologyCard tree={result.tree} issue={result.issue} highlightOnt={highlightOnt} />
}
