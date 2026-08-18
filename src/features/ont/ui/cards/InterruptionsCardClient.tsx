import { useEffect, useState } from 'react'

import { fetchOntHistoricDown } from '@/features/ont/api/historic-down'
import type {
  OntContext,
  OntHistoricDownItem,
  OntInterruptionsIssue,
} from '@/features/ont/types/ont'
import { OntInterrupcionesCard } from '@/features/ont/ui/OntInterrupcionesCard'
import { OntInterrupcionesCardLoading } from '@/features/ont/ui/OntInfoCardLoadings'

interface Props {
  ont: string
  context: OntContext
}

export function InterruptionsCardClient({ ont, context }: Props) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<OntHistoricDownItem[]>([])
  const [issue, setIssue] = useState<OntInterruptionsIssue>('none')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void (async () => {
      try {
        const result = await fetchOntHistoricDown(ont, context.olt, controller.signal)
        if (controller.signal.aborted) return
        setItems(result.interruptions)
        setIssue(result.issue)
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        setItems([])
        setIssue('error')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [ont, context.olt])

  if (loading) return <OntInterrupcionesCardLoading />
  return <OntInterrupcionesCard interruptions={items} issue={issue} />
}
