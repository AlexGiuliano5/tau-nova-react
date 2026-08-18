import { Navigate, useParams } from 'react-router-dom'

import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { buildOltHref, buildOltPlacaPuertoHref } from '@/features/ftth/lib/tree-navigation'
import { parseOltPlacaPuertoSegments } from '@/features/port/lib/olt-placa-puerto-route'
import { PortMetricsGridSectionClient } from '@/features/port/ui/PortMetricsGridSectionClient'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

/**
 * Tabla completa de ONT del puerto (mobile: desde “Ver tabla completa”).
 */
export function PortMetricsTablePage() {
  const { olt = '', placa = '', puerto = '' } = useParams()
  const oltTitle = normalizeOltRouteParam(olt)
  const parsed = parseOltPlacaPuertoSegments(placa, puerto)

  if (!oltTitle) {
    return <Navigate to="/ftth" replace />
  }

  if (!parsed) {
    return <Navigate to={buildOltPlacaPuertoHref(oltTitle, 1, 0)} replace />
  }

  const backHref = buildOltPlacaPuertoHref(oltTitle, parsed.placa, parsed.puerto)

  return (
    <>
      <div className="sticky top-0 z-20">
        <FtthBreadcrumb
          title={`OLT ${oltTitle} · Placa ${parsed.placa} / Puerto ${parsed.puerto} · Tabla`}
          backHref={backHref}
          placaPuertoContext={{
            olt: oltTitle,
            placa: parsed.placa,
            puerto: parsed.puerto,
          }}
          desktopItems={[
            { label: 'Home', href: '/ftth' },
            { label: 'OLT' },
            { label: oltTitle, href: buildOltHref(oltTitle) },
            {
              label: `Placa ${parsed.placa} / Puerto ${parsed.puerto}`,
              href: backHref,
            },
            { label: 'Tabla' },
          ]}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:m-3">
        <PortMetricsGridSectionClient
          olt={oltTitle}
          placa={parsed.placa}
          puerto={parsed.puerto}
          forceFullTable
        />
      </div>
    </>
  )
}
