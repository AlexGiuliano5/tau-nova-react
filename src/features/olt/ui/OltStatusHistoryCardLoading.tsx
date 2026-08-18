import { CardSpinner } from '@/features/ftth/components/CardSpinner'
import { oltStatusHistoryCardClassName } from '@/features/olt/ui/OltStatusHistoryCardContent'

export function OltStatusHistoryCardLoading() {
  return (
    <div
      className={`${oltStatusHistoryCardClassName} min-h-[280px] items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando histórico de estados" />
    </div>
  )
}
