import { IoCheckmarkSharp, IoCloseSharp } from 'react-icons/io5'

import {
  formatOntStatusLabel,
  normalizeOntStatusKey,
} from '@/features/ont/lib/ont-status-labels'

interface Props {
  estadoRaw: string
  iconSize?: number
}

export function NeighborsEstadoIcon({ estadoRaw, iconSize = 15 }: Props) {
  const status = normalizeOntStatusKey(estadoRaw)
  const label = formatOntStatusLabel(estadoRaw)

  if (!estadoRaw.trim() || estadoRaw === 'Sin Datos') {
    return (
      <span className="text-(--text-secondary)" title="Sin Datos">
        Sin Datos
      </span>
    )
  }

  if (status === 'GOOD') {
    return (
      <span title={label} className="inline-flex">
        <IoCheckmarkSharp
          size={iconSize}
          className="rounded-full bg-(--state-01) p-px text-white"
          aria-label={label}
        />
      </span>
    )
  }

  if (status === 'INTERRUPTED') {
    return (
      <span title={label} className="inline-flex">
        <IoCloseSharp
          size={iconSize}
          className="rounded-full bg-(--state-03) p-px text-white"
          aria-label={label}
        />
      </span>
    )
  }

  if (status === 'REDUCED_ROBUSTNESS' || status === 'DEGRADED') {
    return (
      <span title={label} className="inline-flex">
        <IoCheckmarkSharp
          size={iconSize}
          className="rounded-full bg-(--state-02) p-px text-white"
          aria-label={label}
        />
      </span>
    )
  }

  return (
    <span title={label} className="inline-flex">
      <IoCloseSharp
        size={iconSize}
        className="rounded-full bg-(--gray-02) p-px text-white"
        aria-label={label}
      />
    </span>
  )
}
