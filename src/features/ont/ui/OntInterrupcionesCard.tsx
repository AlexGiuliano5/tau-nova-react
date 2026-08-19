import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import {
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiZap,
} from 'react-icons/fi'

import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import {
  resolveFtthDisplayIssueToneClass,
  type FtthDisplayIssue,
} from '@/features/ftth/lib/card-issue'
import {
  buildInterruptionsSummary,
  formatDisplayInterruptionDuration,
  formatInterruptionDayMonth,
  formatInterruptionDurationBadge,
  formatInterruptionTime,
  sortInterruptionsNewestFirst,
} from '@/features/ont/lib/ont-interruptions-display'
import type { OntHistoricDownItem, OntInterruptionsIssue } from '@/features/ont/types/ont'
import { OntCardStatusCallout, OntCardTitle } from '@/features/ont/ui/OntCardChrome'
import { interrupcionesCardClassName } from '@/features/ont/ui/OntInfoCardLoadings'

interface Props {
  interruptions: OntHistoricDownItem[]
  issue: OntInterruptionsIssue
}

const NEUTRAL_CARD_TONE = 'border-[#d9e0e8] dark:border-white/10'
const NO_DROPS_MESSAGE = 'La ONT no registró caídas en los últimos 7 días.'
const MAX_VISIBLE_INTERRUPTION_ITEMS = 3

type TimelineTone = 'ongoing' | 'resolved'

export function OntInterrupcionesCard({ interruptions, issue }: Props) {
  const [showHistoric, setShowHistoric] = useState(false)

  const sortedInterruptions = useMemo(
    () => sortInterruptionsNewestFirst(interruptions),
    [interruptions],
  )

  const summary = useMemo(
    () => buildInterruptionsSummary(sortedInterruptions),
    [sortedInterruptions],
  )

  const canShowHistoric = sortedInterruptions.length > MAX_VISIBLE_INTERRUPTION_ITEMS
  const visibleInterruptions = showHistoric
    ? sortedInterruptions
    : sortedInterruptions.slice(0, MAX_VISIBLE_INTERRUPTION_ITEMS)

  const shouldShowNoDrops = issue === 'no-drops'
  const shouldShowWarning = issue === 'no-data'
  const shouldShowError = issue === 'error' || issue === 'unexpected'
  const shouldShowList = issue === 'none' && sortedInterruptions.length > 0

  return (
    <div className={clsx(interrupcionesCardClassName, resolveInterrupcionesCardTone(issue))}>
      <div className={`flex min-h-0 flex-col ${shouldShowList ? 'flex-1' : ''}`}>
        <header className="flex items-center justify-between gap-3">
          <OntCardTitle icon={FiZap}>Interrupciones</OntCardTitle>
          {shouldShowList && canShowHistoric ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[11px] font-semibold text-(--primary-2) transition-colors hover:bg-(--primary-2)/8 dark:text-(--secondary) dark:hover:bg-(--secondary)/15"
              onClick={() => setShowHistoric((prev) => !prev)}
            >
              {showHistoric ? 'Ver menos' : 'Ver historial'}
              <FiChevronRight
                className={`size-3.5 transition-transform ${showHistoric ? 'rotate-90' : ''}`}
                aria-hidden
              />
            </button>
          ) : null}
        </header>

        <div
          className={`flex min-h-0 flex-col ${
            shouldShowList ? 'mt-3 flex-1 gap-3' : 'mt-1.5 gap-1.5'
          }`}
        >
          {shouldShowError ? (
            <FtthDataIssueNotice
              presentation="inline"
              issue={issue === 'unexpected' ? 'unexpected' : 'error'}
              context="las interrupciones"
              className="text-xs"
            />
          ) : shouldShowWarning ? (
            <FtthDataIssueNotice
              presentation="inline"
              issue="no-data"
              context="las interrupciones"
              className="text-xs"
            />
          ) : shouldShowNoDrops ? (
            <OntCardStatusCallout
              tone="ok"
              icon={FiCheck}
              title="Sin caídas (7 días)"
              description={NO_DROPS_MESSAGE}
            />
          ) : shouldShowList ? (
            <>
              <InterruptionsSummary
                totalCount={summary.totalCount}
                accumulatedLabel={summary.accumulatedLabel}
                lastEventDate={summary.lastEventDate}
                lastEventTime={summary.lastEventTime}
              />

              <ul className="flex flex-col overflow-hidden rounded-xl border border-[#e8edf3] bg-[#fbfcfd] dark:border-white/10 dark:bg-white/[0.03]">
                {visibleInterruptions.map((item, index) => {
                  const isLatest = index === 0
                  return (
                    <li
                      key={`${item.status}-${item.date}-${item.time}-${item.duration}-${index}`}
                    >
                      <InterruptionTimelineItem
                        item={item}
                        tone={item.isOngoing ? 'ongoing' : 'resolved'}
                        isLatest={isLatest}
                        isFirst={isLatest}
                        isLast={index === visibleInterruptions.length - 1}
                      />
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <FtthDataIssueNotice
              presentation="inline"
              issue="no-data"
              context="las interrupciones"
              className="text-xs"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function InterruptionsSummary({
  totalCount,
  accumulatedLabel,
  lastEventDate,
  lastEventTime,
}: {
  totalCount: number
  accumulatedLabel: string
  lastEventDate: string
  lastEventTime: string
}) {
  return (
    <div className="grid grid-cols-3 divide-x divide-[#dfe5ec] overflow-hidden rounded-xl border border-[#e8edf3] bg-[#f5f7fa] dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.04]">
      <SummaryMetric
        icon={<FiZap className="size-3.5" aria-hidden />}
        primary={String(totalCount)}
        secondary={totalCount === 1 ? 'interrupción' : 'interrupciones'}
      />
      <SummaryMetric
        icon={<FiClock className="size-3.5" aria-hidden />}
        primary={accumulatedLabel}
        secondary="acumulado"
      />
      <SummaryMetric
        icon={<FiCalendar className="size-3.5" aria-hidden />}
        primary={lastEventDate}
        secondary={lastEventTime || 'última'}
        emphasizePrimary
      />
    </div>
  )
}

function SummaryMetric({
  icon,
  primary,
  secondary,
  emphasizePrimary = false,
}: {
  icon: ReactNode
  primary: string
  secondary: string
  emphasizePrimary?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 px-2 py-2.5 text-center">
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-white text-(--primary-2) shadow-[0_1px_2px_rgb(15_23_42/0.06)] ring-1 ring-[#e2e8f0] dark:bg-white/8 dark:text-(--secondary) dark:ring-white/12">
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <p
          className={`truncate ${
            emphasizePrimary
              ? 'text-[12px] font-semibold text-(--text-primary)'
              : 'text-[13px] font-semibold tracking-tight text-(--text-primary)'
          }`}
        >
          {primary}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-(--text-secondary)/80">{secondary}</p>
      </div>
    </div>
  )
}

function InterruptionTimelineItem({
  item,
  tone,
  isLatest,
  isFirst,
  isLast,
}: {
  item: OntHistoricDownItem
  tone: TimelineTone
  isLatest: boolean
  isFirst: boolean
  isLast: boolean
}) {
  const dayMonth = formatInterruptionDayMonth(item.date)
  const time = formatInterruptionTime(item.time)
  const title = item.isOngoing ? 'Interrupción actual' : 'Servicio restablecido'
  const durationLabel = item.isOngoing
    ? 'En curso'
    : formatDisplayInterruptionDuration(item.duration)
  const badgeLabel = item.isOngoing
    ? 'EN CURSO'
    : formatInterruptionDurationBadge(item.duration)

  return (
    <div
      className={clsx(
        'relative flex items-stretch gap-3 px-3',
        isLatest ? 'py-3' : 'py-1.5',
        !isLast && 'border-b border-[#e8edf3] dark:border-white/8',
        resolveRowToneClassName(tone, isLatest),
      )}
    >
      <TimelineRail tone={tone} isLatest={isLatest} isFirst={isFirst} isLast={isLast} />

      <div
        className={clsx(
          'flex w-[3.25rem] shrink-0 flex-col leading-tight',
          isLatest ? 'pt-0.5' : 'pt-px',
        )}
      >
        <span
          className={clsx(
            'font-semibold text-(--text-primary)',
            isLatest ? 'text-[12px]' : 'text-[11px]',
          )}
        >
          {dayMonth}
        </span>
        <span
          className={clsx(
            'tabular-nums text-(--text-secondary)/75',
            isLatest ? 'text-[11px]' : 'text-[10px]',
          )}
        >
          {time}
        </span>
      </div>

      <div
        className={clsx(
          'min-w-0 flex-1 leading-tight',
          isLatest ? 'pt-0.5' : 'pt-px',
        )}
      >
        <p
          className={clsx(
            'truncate font-semibold text-(--text-primary)',
            isLatest ? 'text-[12.5px]' : 'text-[11px]',
          )}
        >
          {title}
        </p>
        <p
          className={clsx(
            'text-(--text-secondary)/80',
            isLatest ? 'mt-1 text-[11px]' : 'mt-0.5 text-[10px]',
          )}
        >
          Duración{' '}
          <span className="font-semibold text-(--text-primary)">{durationLabel}</span>
        </p>
      </div>

      <span
        className={clsx(
          'inline-flex h-fit shrink-0 rounded-full font-semibold tracking-wide',
          isLatest ? 'mt-0.5 px-2.5 py-1 text-[10px]' : 'mt-px px-2 py-0.5 text-[9px]',
          resolveBadgeClassName(tone),
        )}
      >
        {badgeLabel}
      </span>
    </div>
  )
}

const timelineLineClassName = 'w-px bg-[#d5dde7] dark:bg-white/15'

function TimelineRail({
  tone,
  isLatest,
  isFirst,
  isLast,
}: {
  tone: TimelineTone
  isLatest: boolean
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="relative flex w-4 shrink-0 flex-col items-center self-stretch">
      <span
        className={`h-1.5 w-px shrink-0 ${isFirst ? 'bg-transparent' : timelineLineClassName}`}
        aria-hidden
      />
      <TimelineDot tone={tone} isLatest={isLatest} />
      <span
        className={`min-h-1 w-px flex-1 ${isLast ? 'bg-transparent' : timelineLineClassName}`}
        aria-hidden
      />
    </div>
  )
}

function TimelineDot({ tone, isLatest }: { tone: TimelineTone; isLatest: boolean }) {
  if (tone === 'ongoing') {
    return (
      <span
        className={clsx(
          'relative z-10 inline-flex shrink-0 items-center justify-center',
          isLatest ? 'size-4' : 'size-3.5',
        )}
        aria-hidden
      >
        {isLatest ? (
          <span className="absolute size-3 animate-ping rounded-full bg-(--state-03)/35" />
        ) : null}
        <span
          className={clsx(
            'relative rounded-full bg-(--state-03) ring-2 ring-white dark:ring-[#1f1f1f]',
            isLatest ? 'size-2.5' : 'size-2',
          )}
        />
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'relative z-10 inline-flex shrink-0 items-center justify-center',
        isLatest ? 'size-4' : 'size-3.5',
      )}
      aria-hidden
    >
      {isLatest ? (
        <span className="absolute size-3.5 animate-ping rounded-full bg-(--state-01)/35" />
      ) : null}
      <span
        className={clsx(
          'relative inline-flex items-center justify-center rounded-full bg-(--state-01) text-white',
          isLatest
            ? 'size-4 shadow-[0_0_0_3px_rgb(108_166_82/0.18)]'
            : 'size-3',
        )}
      >
        <FiCheck className={clsx('stroke-[3]', isLatest ? 'size-2.5' : 'size-2')} />
      </span>
    </span>
  )
}

function resolveRowToneClassName(tone: TimelineTone, isLatest: boolean): string {
  if (tone === 'ongoing') {
    return 'bg-[color-mix(in_srgb,var(--state-03)_4%,transparent)]'
  }
  if (isLatest) {
    return 'bg-[color-mix(in_srgb,var(--state-01)_4%,transparent)]'
  }
  return ''
}

function resolveBadgeClassName(tone: TimelineTone): string {
  if (tone === 'ongoing') {
    return 'bg-(--tag-state-03) text-(--state-03) dark:bg-(--state-03)/20 dark:text-[#ff9aa0]'
  }
  return 'bg-(--tag-state-01) text-(--state-01) dark:bg-(--state-01)/20 dark:text-[#9ad48a]'
}

function resolveInterrupcionesCardTone(issue: OntInterruptionsIssue): string {
  if (issue === 'none' || issue === 'no-drops') return NEUTRAL_CARD_TONE
  return resolveFtthDisplayIssueToneClass(issue as FtthDisplayIssue)
}
