import { FiAlertTriangle, FiCheck, FiHelpCircle } from 'react-icons/fi'

import { OntCardStatusCallout, OntCardTitle } from '@/features/ont/ui/OntCardChrome'
import { alertasCardClassName } from '@/features/ont/ui/OntInfoCardLoadings'

export type OntOutageStatus = 'outage' | 'no-outage' | 'unknown'

interface Props {
  status: OntOutageStatus
}

export function OntAlertasCard({ status }: Props) {
  return (
    <div className={alertasCardClassName}>
      <header>
        <OntCardTitle icon={FiAlertTriangle}>Alertas</OntCardTitle>
      </header>
      <OutageMessage status={status} />
    </div>
  )
}

function OutageMessage({ status }: { status: OntOutageStatus }) {
  if (status === 'outage') {
    return (
      <OntCardStatusCallout
        tone="warning"
        icon={FiAlertTriangle}
        title="Outage activo"
        description="Esta ONT se encuentra con un outage."
      />
    )
  }

  if (status === 'no-outage') {
    return (
      <OntCardStatusCallout
        tone="ok"
        icon={FiCheck}
        title="Sin alertas"
        description="Esta ONT no presenta outages activos."
      />
    )
  }

  return (
    <OntCardStatusCallout
      tone="unknown"
      icon={FiHelpCircle}
      title="Estado desconocido"
      description="No se puede establecer si esta ONT cuenta con outage."
    />
  )
}
