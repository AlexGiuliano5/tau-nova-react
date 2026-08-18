import clsx from 'clsx'

import { HistoricTimeFilterChips } from '@/features/ftth/components/HistoricTimeFilterChips'
import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import {
  resolveFtthCardIssueToneClass,
  resolveFtthPayloadNoticeIssue,
  type FtthDataIssue,
} from '@/features/ftth/lib/card-issue'
import {
  OLT_STATUS_TIME_FILTER_OPTIONS,
  type OltStatusChartRow,
  type OltStatusTimeFilter,
} from '@/features/olt/types/status-chart'
import { OltStatusHistoryChart } from '@/features/olt/ui/OltStatusHistoryChart'
import { oltStatusHistoryCardClassName } from '@/features/olt/ui/OltStatusHistoryCardContent'

interface Props {
  rows: OltStatusChartRow[]
  issue: FtthDataIssue
  timeFilter?: OltStatusTimeFilter
  onTimeFilterChange?: (value: OltStatusTimeFilter) => void
  timeFilterReady?: boolean
}

/** Histórico de estados a nivel placa/puerto (mismo chart que OLT, título distinto). */
export function PortStatusHistoryCard({
  rows,
  issue,
  timeFilter,
  onTimeFilterChange,
  timeFilterReady = true,
}: Props) {
  const noticeIssue = resolveFtthPayloadNoticeIssue(issue, rows.length > 0)
  const showTimeFilter = timeFilter !== undefined && onTimeFilterChange !== undefined

  if (noticeIssue !== null) {
    return (
      <div
        className={clsx(
          oltStatusHistoryCardClassName,
          'border',
          resolveFtthCardIssueToneClass(noticeIssue),
        )}
      >
        <header className="flex shrink-0 flex-col gap-2">
          <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
            Histórico de estados
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
            issue={noticeIssue}
            context="el histórico de estados de este puerto"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={oltStatusHistoryCardClassName}>
      <header className="flex shrink-0 flex-col gap-2">
        <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
          Histórico de estados
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
      <div className="flex min-h-0 flex-1 flex-col">
        <OltStatusHistoryChart data={rows} />
      </div>
    </div>
  )
}
