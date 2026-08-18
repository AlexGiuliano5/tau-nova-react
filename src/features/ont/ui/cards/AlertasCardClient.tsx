import { useEffect, useState } from 'react'

import { fetchOntOutageStatus } from '@/features/ont/api/outage'
import { OntAlertasCard, type OntOutageStatus } from '@/features/ont/ui/OntAlertasCard'
import { OntAlertasCardLoading } from '@/features/ont/ui/OntInfoCardLoadings'

export function AlertasCardClient({ ont }: { ont: string }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<OntOutageStatus>('unknown')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void (async () => {
      try {
        const result = await fetchOntOutageStatus(ont, controller.signal)
        if (!controller.signal.aborted) setStatus(result.status)
      } catch {
        if (!controller.signal.aborted) setStatus('unknown')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [ont])

  if (loading) return <OntAlertasCardLoading />
  return <OntAlertasCard status={status} />
}
