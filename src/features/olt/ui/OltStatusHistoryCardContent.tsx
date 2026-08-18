import { HistoricTimeFilterChips } from '@/features/ftth/components/HistoricTimeFilterChips'
import {
  OLT_STATUS_TIME_FILTER_OPTIONS,
  type OltStatusChartRow,
  type OltStatusTimeFilter,
} from '@/features/olt/types/status-chart'
import { OltStatusHistoryChart } from '@/features/olt/ui/OltStatusHistoryChart'

export const oltStatusHistoryCardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 xl:h-full xl:min-h-0 xl:p-3 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex min-h-[min(78dvh,880px)] flex-col gap-3 md:min-h-[min(80dvh,920px)] md:gap-2.5'

interface Props {
  rows: OltStatusChartRow[]
  timeFilter?: OltStatusTimeFilter
  onTimeFilterChange?: (value: OltStatusTimeFilter) => void
  timeFilterReady?: boolean
}

export function OltStatusHistoryCardContent({
  rows,
  timeFilter,
  onTimeFilterChange,
  timeFilterReady = true,
}: Props) {
  const showTimeFilter = timeFilter !== undefined && onTimeFilterChange !== undefined

  return (
    <div className={oltStatusHistoryCardClassName}>
      <header className="flex shrink-0 flex-col gap-2">
        <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
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
      <div className="flex min-h-0 flex-1 flex-col">
        <OltStatusHistoryChart data={rows} />
      </div>
    </div>
  )
}
