import { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'

import {
  HISTORIC_STATUS_BAR_LEGEND,
  historicStatusHoverLabel,
  sampleAtPercent,
  type HistoricStatusBarKind,
  type HistoricStatusBarModel,
  type HistoricStatusBarSample,
} from '@/features/ont/lib/historic-status-bar'

interface Props {
  model: HistoricStatusBarModel
  variant?: 'full' | 'compact'
  periodLabel?: string
}

export function OntHistoricStatusBarChart({
  model,
  variant = 'full',
  periodLabel,
}: Props) {
  const isCompact = variant === 'compact'

  return (
    <div className={clsx('flex', isCompact ? 'min-w-0 items-center gap-1.5' : 'flex-col gap-3 pt-12')}>
      <div className={clsx('relative min-w-0', isCompact && 'flex-1')}>
        <StatusBarTrack model={model} compact={isCompact} />
      </div>
      {isCompact && periodLabel ? (
        <span className="shrink-0 text-[11px] font-semibold text-(--text-secondary)">{periodLabel}</span>
      ) : null}
      {isCompact ? null : (
        <>
          <div className="relative mt-1 h-9 text-[11px] font-medium text-(--text-secondary)">
            {model.ticks.map((tick) => (
              <span
                key={`${tick.label}-${tick.offsetPercent}`}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${tick.offsetPercent}%` }}
              >
                <span className="h-1.5 w-px bg-(--text-secondary)/45" aria-hidden />
                <span className="mt-1 whitespace-nowrap">{tick.label}</span>
              </span>
            ))}
          </div>
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-xs text-(--text-primary)">
            {HISTORIC_STATUS_BAR_LEGEND.map((item) => (
              <li key={item.status} className="inline-flex items-center gap-1.5">
                <span className={clsx('h-2.5 w-2.5 rounded-[2px]', item.swatchClass)} aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function StatusBarTrack({
  model,
  compact,
}: {
  model: HistoricStatusBarModel
  compact: boolean
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [activeSample, setActiveSample] = useState<HistoricStatusBarSample | null>(null)

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current
      if (!bar || model.samples.length === 0) return
      const rect = bar.getBoundingClientRect()
      if (rect.width <= 0) return
      const percent = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      setActiveSample(sampleAtPercent(model.samples, percent))
    },
    [model.samples],
  )

  return (
    <>
      <div
        ref={barRef}
        className={clsx(
          'relative flex w-full cursor-crosshair overflow-hidden rounded-full bg-(--table-header)',
          compact ? 'h-3.5' : 'h-9',
        )}
        role="img"
        aria-label="Histórico de estado de la ONT. Pasá el cursor para ver el estado y el horario de cada punto."
        onPointerMove={(event) => updateFromClientX(event.clientX)}
        onPointerDown={(event) => updateFromClientX(event.clientX)}
        onPointerLeave={() => setActiveSample(null)}
      >
        {model.segments.map((segment, index) => (
          <div
            key={`${segment.status}-${segment.startLabel}-${index}`}
            className={clsx(historicBarClass(segment.status), 'pointer-events-none min-w-0')}
            style={{ flexGrow: segment.weight, flexBasis: 0 }}
          />
        ))}
        {activeSample ? (
          <span
            className="pointer-events-none absolute top-0.5 bottom-0.5 w-0.5 rounded-full bg-white/90 shadow-[0_0_0_1px_rgb(15_23_42/0.25)] dark:bg-white"
            style={{ left: `${activeSample.offsetPercent}%`, transform: 'translateX(-50%)' }}
            aria-hidden
          />
        ) : null}
      </div>
      {activeSample ? (
        <div
          className={clsx(
            'pointer-events-none absolute z-20 min-w-[10rem] rounded-lg border border-(--table-stroke) bg-(--card) px-2.5 py-1.5 text-[11px] shadow-md dark:border-white/12',
            'bottom-[calc(100%+8px)]',
          )}
          style={{
            left: `${activeSample.offsetPercent}%`,
            transform:
              activeSample.offsetPercent < 12
                ? 'translateX(0)'
                : activeSample.offsetPercent > 88
                  ? 'translateX(-100%)'
                  : 'translateX(-50%)',
          }}
          role="status"
        >
          <p className="m-0 font-semibold text-(--text-primary)">{activeSample.hoverWhen}</p>
          <p className={clsx('m-0', hoverStatusClass(activeSample.status))}>
            {historicStatusHoverLabel(activeSample.status)}
            {activeSample.isLatest ? ' · en curso' : ''}
          </p>
        </div>
      ) : null}
    </>
  )
}

function hoverStatusClass(status: HistoricStatusBarKind): string {
  if (status === 'INTERRUPTED') return 'text-(--state-03)'
  if (status === 'DEGRADED') return 'text-(--state-02)'
  if (status === 'GOOD') return 'text-(--state-01)'
  return 'text-(--text-secondary)'
}

function historicBarClass(status: HistoricStatusBarModel['segments'][number]['status']): string {
  return (
    HISTORIC_STATUS_BAR_LEGEND.find((item) => item.status === status)?.barClass ?? 'bg-(--gray-01)'
  )
}
