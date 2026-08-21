import clsx from 'clsx'
import type { IconType } from 'react-icons'
import type { ReactNode } from 'react'

export interface CapaControlStatItem {
  label: string
  value: ReactNode
  icon: IconType
  valueClassName?: string
}

interface Props {
  stats: CapaControlStatItem[]
  loading?: boolean
}

export const capaControlCardShellClassName =
  'relative flex w-full flex-col rounded-lg border border-[#d9e0e8] bg-white/65 p-2 shadow-[0_1px_3px_rgb(15_23_42/0.05)] dark:border-white/10 dark:bg-(--card) lg:rounded-xl lg:border lg:p-3 lg:shadow-[0_6px_16px_rgb(15_23_42/0.07)] lg:border-[#d9e0e8]/90 lg:bg-white/90 dark:lg:border-white/10 dark:lg:bg-(--card)'

export function OntCapaControlGroupedMetricCard({ stats, loading = false }: Props) {
  const isSingleStat = stats.length === 1

  return (
    <div className={capaControlCardShellClassName}>
      <div className={clsx('grid gap-0', isSingleStat ? 'grid-cols-1' : 'grid-cols-2')}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={clsx(
                'flex min-h-[4.5rem] flex-col items-start justify-center gap-1.5 px-2 py-1.5 lg:min-h-[5rem]',
                !isSingleStat && index > 0 && 'border-l border-black/8 dark:border-white/10',
              )}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-(--primary-2) border-t-transparent dark:border-(--secondary)" />
              ) : (
                <>
                  <div className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="size-[18px] shrink-0 text-(--text-secondary)" aria-hidden />
                    <span className="text-[13px] font-medium leading-tight md:text-[14px]">
                      {stat.label}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'w-full text-xs font-semibold leading-snug text-(--text-primary) md:text-[12px]',
                      stat.valueClassName,
                    )}
                  >
                    {stat.value}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
