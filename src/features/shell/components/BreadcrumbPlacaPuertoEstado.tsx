import { useEffect, useState } from 'react'

import {
  fetchPlacaPuertoEstado,
  type SlotPortSeverity,
} from '@/features/ont/api/placa-puerto-estado'

interface Props {
  olt: string
  placa: number
  puerto: number
  variant?: 'desktop' | 'mobile'
}

const meta: Record<SlotPortSeverity, { label: string; text: string; dot: string }> = {
  ok: {
    label: 'Óptimo',
    text: 'text-[#1f8a3b] dark:text-(--card-green)',
    dot: 'bg-(--card-green)',
  },
  warning: {
    label: 'Advertencia',
    text: 'text-[#9a7400] dark:text-(--card-yellow)',
    dot: 'bg-(--card-yellow)',
  },
  critical: {
    label: 'Crítico',
    text: 'text-[#cc2e26] dark:text-(--card-red)',
    dot: 'bg-(--card-red)',
  },
}

export function BreadcrumbPlacaPuertoEstado({
  olt,
  placa,
  puerto,
  variant = 'desktop',
}: Props) {
  const [severity, setSeverity] = useState<SlotPortSeverity | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setSeverity(null)

    void fetchPlacaPuertoEstado(olt, placa, puerto, controller.signal).then((result) => {
      if (!active) return
      setSeverity(result.ok ? result.severity : null)
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [olt, placa, puerto])

  if (!severity) return null

  const tone = meta[severity]

  if (variant === 'mobile') {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white"
        aria-label={`Estado placa/puerto: ${tone.label}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
        {tone.label}
      </span>
    )
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-black/65 dark:text-white/70">
      <span className="text-black/40 dark:text-white/45">·</span>
      Estado placa/puerto:{' '}
      <strong className={`font-semibold ${tone.text}`}>{tone.label}</strong>
    </span>
  )
}
