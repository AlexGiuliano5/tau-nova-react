import { Outlet, useParams } from 'react-router-dom'

import { RecentNetworkElementSearchRecorder } from '@/features/ftth/components/RecentNetworkElementSearchRecorder'
import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'

export function OltDetailLayout() {
  const { olt = '' } = useParams()
  const oltTitle = normalizeOltRouteParam(olt)

  if (!oltTitle) return null

  return (
    <section className="flex min-h-0 flex-1 flex-col pb-2">
      <RecentNetworkElementSearchRecorder value={oltTitle} />
      <Outlet />
    </section>
  )
}
