import clsx from 'clsx'

import { HistoricTimeFilterChips } from '@/features/ftth/components/HistoricTimeFilterChips'
import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import {
  hasFtthCardIssue,
  resolveFtthDisplayIssueToneClass,
  toFtthDisplayIssue,
  type FtthDataIssue,
} from '@/features/ftth/lib/card-issue'
import {
  OLT_STATUS_TIME_FILTER_OPTIONS,
  type OltStatusChartRow,
  type OltStatusTimeFilter,
} from '@/features/olt/types/status-chart'
import {
  OltStatusHistoryCardContent,
  oltStatusHistoryCardClassName,
} from '@/features/olt/ui/OltStatusHistoryCardContent'

interface Props {
  rows: OltStatusChartRow[]
  issue: FtthDataIssue
  timeFilter?: OltStatusTimeFilter
  onTimeFilterChange?: (value: OltStatusTimeFilter) => void
  timeFilterReady?: boolean
}

export function OltStatusHistoryCard({
  rows,
  issue,
  timeFilter,
  onTimeFilterChange,
  timeFilterReady = true,
}: Props) {
  const displayIssue = hasFtthCardIssue(issue)
    ? issue
    : rows.length === 0
      ? 'no-data'
      : null

  if (displayIssue === null) {
    return (
      <OltStatusHistoryCardContent
        rows={rows}
        timeFilter={timeFilter}
        onTimeFilterChange={onTimeFilterChange}
        timeFilterReady={timeFilterReady}
      />
    )
  }

  const showTimeFilter = timeFilter !== undefined && onTimeFilterChange !== undefined
  const toneIssue = toFtthDisplayIssue(displayIssue)!

  return (
    <div
      className={clsx(
        oltStatusHistoryCardClassName,
        'border',
        resolveFtthDisplayIssueToneClass(toneIssue),
      )}
    >
      <header className="flex shrink-0 flex-col gap-2">
        <h2 className="text-lg font-semibold leading-tight tracking-tight text-(--text-primary) md:text-[1.05rem]">
          Gráfico histórico
        </h2>
        {showTimeFilter ? (
          <HistoricTimeFilterChips
            value={timeFilter}
            options={OLT_STATUS_TIME_FILTER_OPTIONS}
            onChange={onTimeFilterChange}
            disabled={!timeFilterReady}
          />
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <FtthDataIssueNotice
          presentation="inline"
          issue={toneIssue}
          context="el histórico de estados"
        />
      </div>
    </div>
  )
}
