import {
  slotPortSeverityLabel,
  type SlotPortSeverity,
} from '@/features/ont/api/placa-puerto-estado'
import { usePlacaPuertoEstadoQuery } from '@/features/ont/hooks/use-placa-puerto-estado-query'

interface Props {
  olt: string
  placa: number
  puerto: number
  variant?: 'desktop' | 'mobile'
}

const meta: Record<SlotPortSeverity, { text: string; dot: string }> = {
  ok: {
    text: 'text-[#1f8a3b] dark:text-(--card-green)',
    dot: 'bg-(--card-green)',
  },
  warning: {
    text: 'text-[#9a7400] dark:text-(--card-yellow)',
    dot: 'bg-(--card-yellow)',
  },
  critical: {
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
  const query = usePlacaPuertoEstadoQuery(olt, placa, puerto)
  const severity = query.data
  if (!severity) return null

  const tone = meta[severity]
  const label = slotPortSeverityLabel(severity)

  if (variant === 'mobile') {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white"
        aria-label={`Estado placa/puerto: ${label}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[#6b7280] dark:text-white/55">
      <span className="text-[#6b7280]/50 dark:text-white/30">·</span>
      Estado placa/puerto:{' '}
      <strong className={`font-semibold ${tone.text}`}>{label}</strong>
    </span>
  )
}
