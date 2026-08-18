import { Navigate, useParams } from 'react-router-dom'

import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { OltDistribucionCardClient } from '@/features/olt/ui/OltDistribucionCardClient'
import { OltInformacionOntSectionClient } from '@/features/olt/ui/OltInformacionOntSectionClient'
import { OltStatusHistoryCardClient } from '@/features/olt/ui/OltStatusHistoryCardClient'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

export function OltSummaryPage() {
  const { olt = '' } = useParams()
  const oltTitle = normalizeOltRouteParam(olt)

  if (!oltTitle) {
    return <Navigate to="/ftth" replace />
  }

  return (
    <>
      <div className="sticky top-0 z-20">
        <FtthBreadcrumb title={`OLT ${oltTitle}`} backHref="/ftth/busqueda/arbol" />
      </div>

      <div className="xl:m-3 xl:flex xl:flex-col xl:gap-9">
        <div className="flex flex-col gap-1 xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-stretch xl:gap-8">
          <div className="order-2 xl:order-0 xl:col-start-1 xl:row-start-1 xl:min-w-0">
            <OltDistribucionCardClient olt={oltTitle} />
          </div>

          <div className="order-3 xl:order-0 xl:col-start-2 xl:row-start-1 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:self-stretch xl:min-w-0">
            <OltStatusHistoryCardClient olt={oltTitle} />
          </div>
        </div>

        <OltInformacionOntSectionClient oltRouteParam={oltTitle} />
      </div>
    </>
  )
}
