import clsx from 'clsx'
import { FiActivity } from 'react-icons/fi'

import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import { resolveFtthDisplayIssueToneClass } from '@/features/ftth/lib/card-issue'
import type { BffLastMetricByOntLastValue } from '@/features/ont/types/ont'
import { OntCardTitle } from '@/features/ont/ui/OntCardChrome'
import { metricsCardClassName } from '@/features/ont/ui/OntInfoCardLoadings'

interface Props {
  metrics: BffLastMetricByOntLastValue[]
}

export function OntMetricsCard({ metrics }: Props) {
  const isEmpty = metrics.length === 0

  return (
    <div
      className={clsx(
        metricsCardClassName,
        isEmpty ? resolveFtthDisplayIssueToneClass('no-data') : null,
      )}
    >
      <OntCardTitle icon={FiActivity}>Métricas</OntCardTitle>
      {isEmpty ? (
        <div
          className={clsx(
            'w-full rounded-xl border px-3 py-2.5',
            resolveFtthDisplayIssueToneClass('no-data'),
          )}
          role="status"
        >
          <FtthDataIssueNotice presentation="inline" issue="no-data" context="las métricas" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.title}
              className="rounded-xl border border-[#e8edf3] bg-(--background) p-3 dark:border-white/10"
            >
              <p className="text-[11px] font-semibold tracking-wide text-(--text-secondary) uppercase">
                {metric.title}
              </p>
              <p className="mt-1 text-xl font-semibold text-(--text-primary)">
                {metric.actual || '—'}
              </p>
              <p className="mt-1 text-[11px] text-(--text-secondary)">
                min {metric.min || '—'} · avg {metric.avg || '—'} · max {metric.max || '—'}
              </p>
              {metric.time ? (
                <p className="mt-1 text-[11px] text-(--text-secondary)">{metric.time}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
