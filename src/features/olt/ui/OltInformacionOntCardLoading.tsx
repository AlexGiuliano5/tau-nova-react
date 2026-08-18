import { CardSpinner } from '@/features/ftth/components/CardSpinner'
import { oltInformacionOntCardClassName } from '@/features/olt/ui/olt-informacion-ont-card-class-name'

export function OltInformacionOntCardLoading() {
  return (
    <div
      className={`${oltInformacionOntCardClassName} min-h-[220px] items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <CardSpinner label="Cargando información de las ONT" />
    </div>
  )
}
