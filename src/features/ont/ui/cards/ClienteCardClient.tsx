import { useEffect, useState } from 'react'

import { fetchOntClientInfo } from '@/features/ont/api/client-info'
import type { OntClientInfo } from '@/features/ont/types/ont'
import { OntClientCard } from '@/features/ont/ui/OntClientCard'
import { OntClientCardLoading } from '@/features/ont/ui/OntInfoCardLoadings'

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  return (error as { name?: string }).name === 'AbortError'
}

export function ClienteCardClient({ ont }: { ont: string }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OntClientInfo | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)

    void (async () => {
      try {
        const next = await fetchOntClientInfo(ont, controller.signal)
        if (!active || controller.signal.aborted) return
        setData(next)
        setLoading(false)
      } catch (error) {
        if (!active || controller.signal.aborted || isAbortError(error)) return
        setData(null)
        setLoading(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [ont])

  if (loading) return <OntClientCardLoading />
  return <OntClientCard clientInfo={data} />
}
