import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { hasFtthCardIssue } from '@/features/ftth/lib/card-issue'
import type { OltSlotPortGridActionResult, OltSlotPortGridModel } from '@/features/olt/types/slot-port'
import { OltDistribucionCardInteractive } from '@/features/olt/ui/OltDistribucionCardInteractive'

interface Props {
  model: OltSlotPortGridModel | null
  oltRouteParam: string
  issue: OltSlotPortGridActionResult['issue']
}

const cardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 xl:h-full xl:p-3 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-3 md:gap-2.5'

export function OltDistribucionCard({ model, oltRouteParam, issue }: Props) {
  if (hasFtthCardIssue(issue) || !model || model.rows.length === 0) {
    const cardIssue = hasFtthCardIssue(issue) ? issue : 'no-data'
    return (
      <FtthCardIssueState
        title="Distribución OLT"
        issue={cardIssue}
        cardClassName={cardClassName}
        context="la distribución OLT"
        bodyClassName="min-h-[280px] xl:flex-1"
      />
    )
  }

  return (
    <div className={cardClassName}>
      <div className="xl:flex xl:min-h-0 xl:min-w-0 xl:flex-1 xl:flex-col">
        <OltDistribucionCardInteractive
          model={model}
          oltRouteParam={oltRouteParam}
          desktopFullView
        />
      </div>
    </div>
  )
}
