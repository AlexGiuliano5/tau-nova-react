import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import { buildOltHref } from '@/features/ftth/lib/tree-navigation'
import { parseOltPlacaPuertoSegments } from '@/features/port/lib/olt-placa-puerto-route'
import { PortMetricsGridSectionClient } from '@/features/port/ui/PortMetricsGridSectionClient'
import { PortStatusHistoryCardClient } from '@/features/port/ui/PortStatusHistoryCardClient'
import { PortTopologyCardClient } from '@/features/port/ui/PortTopologyCardClient'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

/**
 * Detalle placa/puerto: topología + histórico de estados + grilla de ONT.
 */
export function PortDetailPage() {
  const { olt = '', placa = '', puerto = '' } = useParams()
  const [searchParams] = useSearchParams()
  const oltTitle = normalizeOltRouteParam(olt)
  const parsed = parseOltPlacaPuertoSegments(placa, puerto)

  if (!oltTitle) {
    return <Navigate to="/ftth" replace />
  }

  const oltHref = buildOltHref(oltTitle)

  if (!parsed) {
    return (
      <>
        <div className="sticky top-0 z-20">
          <FtthBreadcrumb
            title={`OLT ${oltTitle} · Placa / puerto`}
            backHref={oltHref}
          />
        </div>
        <div className="m-4 rounded-xl border border-(--outline) bg-(--card) p-6 text-sm text-(--text-secondary)">
          Placa o puerto inválidos en la URL.
        </div>
      </>
    )
  }

  const highlightRaw = searchParams.get('highlightOnt')
  const highlightOnt = highlightRaw ? decodeURIComponent(highlightRaw) : undefined
  const title = `OLT ${oltTitle} · Placa ${parsed.placa} / Puerto ${parsed.puerto}`

  return (
    <>
      <div className="sticky top-0 z-20">
        <FtthBreadcrumb
          title={title}
          backHref={oltHref}
          placaPuertoContext={{
            olt: oltTitle,
            placa: parsed.placa,
            puerto: parsed.puerto,
          }}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 xl:m-3">
        <div className="min-w-0">
          <PortTopologyCardClient
            olt={oltTitle}
            placa={parsed.placa}
            puerto={parsed.puerto}
            highlightOnt={highlightOnt}
          />
        </div>
        <div className="min-w-0">
          <PortStatusHistoryCardClient
            olt={oltTitle}
            placa={parsed.placa}
            puerto={parsed.puerto}
          />
        </div>
        <div className="min-w-0">
          <PortMetricsGridSectionClient
            olt={oltTitle}
            placa={parsed.placa}
            puerto={parsed.puerto}
          />
        </div>
      </div>
    </>
  )
}
