import clsx from 'clsx'

import {
  formatOntStatusLabel,
  normalizeOntStatusKey,
} from '@/features/ont/lib/ont-status-labels'

interface Props {
  estadoRaw: string
  iconSize?: number
}

const pillBaseClassName =
  'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight'

function estadoPillClassName(status: string): string {
  if (status === 'GOOD') {
    return 'bg-(--tag-state-01) text-(--state-01) dark:bg-(--state-01)/20 dark:text-[#9ad48a]'
  }
  if (status === 'INTERRUPTED') {
    return 'bg-(--tag-state-03) text-(--state-03) dark:bg-(--state-03)/20 dark:text-[#ff9aa0]'
  }
  if (status === 'REDUCED_ROBUSTNESS' || status === 'DEGRADED') {
    return 'bg-(--tag-state-02) text-[#9a7400] dark:bg-(--state-02)/25 dark:text-[#f0c56a]'
  }
  return 'bg-(--card-gray) text-(--text-secondary) dark:bg-white/10 dark:text-(--text-secondary)'
}

export function NeighborsEstadoIcon({ estadoRaw }: Props) {
  const status = normalizeOntStatusKey(estadoRaw)
  const label = formatOntStatusLabel(estadoRaw)

  if (!estadoRaw.trim() || estadoRaw === 'Sin Datos' || !status || label === 'Sin Datos') {
    return (
      <span className="text-(--divisor) dark:text-white/40" title="Sin Datos">
        Sin Datos
      </span>
    )
  }

  return (
    <span title={label} className={clsx(pillBaseClassName, estadoPillClassName(status))}>
      {label}
    </span>
  )
}
