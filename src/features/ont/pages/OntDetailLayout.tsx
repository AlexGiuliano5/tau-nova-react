import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { RecentNetworkElementSearchRecorder } from '@/features/ftth/components/RecentNetworkElementSearchRecorder'
import { OntHistoricGraphsPage } from '@/features/ont/pages/OntHistoricGraphsPage'
import { OntInfoPage } from '@/features/ont/pages/OntInfoPage'
import { OntDetailBreadcrumb } from '@/features/ont/ui/OntDetailBreadcrumb'
import { OntDetailTabs } from '@/features/ont/ui/OntDetailTabs'

type DetailTab = 'info' | 'graphs'

/**
 * Keep-alive de solapas visitadas (sin unmount) para no re-disparar APIs.
 */
export function OntDetailLayout() {
  const { ont = '' } = useParams()

  if (!ont.trim()) {
    return <Navigate to="/ftth" replace />
  }

  return <OntDetailLayoutBody key={ont} ont={ont} />
}

function OntDetailLayoutBody({ ont }: { ont: string }) {
  const location = useLocation()
  const tab = resolveOntDetailTab(location.pathname)
  const isInfo = tab === 'info'
  const isGraphs = tab === 'graphs'
  const shouldRedirect = tab === null

  const [mountedTabs, setMountedTabs] = useState(() => ({
    info: tab === 'info' || tab === null,
    graphs: tab === 'graphs',
  }))

  useEffect(() => {
    if (shouldRedirect) return
    setMountedTabs((prev) => ({
      info: prev.info || isInfo,
      graphs: prev.graphs || isGraphs,
    }))
  }, [isInfo, isGraphs, shouldRedirect])

  if (shouldRedirect) {
    return <Navigate to={`/ftth/ont/${encodeURIComponent(ont)}/info`} replace />
  }

  const decodedOnt = decodeURIComponent(ont).trim()

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <RecentNetworkElementSearchRecorder value={decodedOnt} />
      <OntDetailBreadcrumb ont={ont} showLinkIndicator desktopBottomRule={false} />
      <OntDetailTabs ont={ont} />
      <div className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto md:pt-3">
        {mountedTabs.info ? (
          <div
            className={clsx(!isInfo && 'hidden')}
            aria-hidden={!isInfo}
            inert={!isInfo || undefined}
          >
            <OntInfoPage />
          </div>
        ) : null}
        {mountedTabs.graphs ? (
          <div
            className={clsx(!isGraphs && 'hidden')}
            aria-hidden={!isGraphs}
            inert={!isGraphs || undefined}
          >
            <OntHistoricGraphsPage isActive={isGraphs} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function resolveOntDetailTab(pathname: string): DetailTab | null {
  if (pathname.includes('/graficos-historicos')) return 'graphs'
  if (pathname.includes('/info')) return 'info'
  if (/\/ftth\/ont\/[^/]+\/?$/.test(pathname)) return 'info'
  return null
}
