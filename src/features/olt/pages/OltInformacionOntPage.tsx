import { Navigate, useParams } from 'react-router-dom'

import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { OltInformacionOntSectionClient } from '@/features/olt/ui/OltInformacionOntSectionClient'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

export function OltInformacionOntPage() {
  const { olt = '' } = useParams()
  const oltTitle = normalizeOltRouteParam(olt)

  if (!oltTitle) {
    return <Navigate to="/ftth" replace />
  }

  return (
    <>
      <div className="sticky top-0 z-20">
        <FtthBreadcrumb
          title="Información de las ONT"
          backHref={`/ftth/olt/${encodeURIComponent(oltTitle)}`}
        />
      </div>
      <div className="md:mx-4 md:mt-4">
        <OltInformacionOntSectionClient oltRouteParam={oltTitle} forceFullTable />
      </div>
    </>
  )
}
