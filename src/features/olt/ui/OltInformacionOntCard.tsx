import { Link } from 'react-router-dom'

import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { hasFtthCardIssue } from '@/features/ftth/lib/card-issue'
import type {
  OltMetricsGridPageModel,
  OltMetricsGridPreviewActionResult,
} from '@/features/olt/types/metrics-grid'
import { oltInformacionOntCardClassName } from '@/features/olt/ui/olt-informacion-ont-card-class-name'
import { OltOntMetricsGridPreview } from '@/features/olt/ui/OltOntMetricsGridPreview'

interface Props {
  model: OltMetricsGridPageModel
  oltRouteParam: string
  issue: OltMetricsGridPreviewActionResult['issue']
}

export function OltInformacionOntCard({ model, oltRouteParam, issue }: Props) {
  if (hasFtthCardIssue(issue) || model.rows.length === 0) {
    const cardIssue = hasFtthCardIssue(issue) ? issue : 'no-data'
    return (
      <FtthCardIssueState
        title="Información de las ONT"
        issue={cardIssue}
        cardClassName={oltInformacionOntCardClassName}
        context="la información de las ONT"
        bodyClassName="min-h-[200px]"
      />
    )
  }

  return (
    <div className={oltInformacionOntCardClassName}>
      <header>
        <h2 className="text-xl font-semibold">Información de las ONT</h2>
      </header>

      <OltOntMetricsGridPreview model={model} />

      <Link
        to={`/ftth/olt/${encodeURIComponent(oltRouteParam)}/informacion-ont`}
        className="mt-3 flex w-full justify-center font-semibold text-(--primary) dark:text-(--secondary)"
      >
        Ver tabla completa
      </Link>
    </div>
  )
}
