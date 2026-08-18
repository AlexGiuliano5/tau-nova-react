import { useEffect, useMemo, useState } from 'react'

import {
  mapInfracoRealtimeToDetails,
} from '@/features/ont/api/ont-context'
import {
  fetchOntBirthCertificate,
  type OntBirthCertificateResult,
} from '@/features/ont/api/birth-certificate'
import { fetchOntInfoByOnt } from '@/features/ont/api/info-by-ont'
import { formatOntSerial, normalizeOntId } from '@/features/ont/lib/ont-serial'
import type { OntContext } from '@/features/ont/types/ont'
import { OntInfoCard, type OntInfoDetails } from '@/features/ont/ui/OntInfoCard'
import { OntInfoCardLoading } from '@/features/ont/ui/OntInfoCardLoadings'

interface Props {
  ont: string
  context: OntContext
}

export function DetailsCardClient({ ont, context }: Props) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<OntInfoDetails | null>(null)
  const [birthCertificate, setBirthCertificate] = useState<OntBirthCertificateResult | null>(null)
  const [birthCertificateLoading, setBirthCertificateLoading] = useState(true)

  const isInfraco = context.mode === 'infraco'

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setBirthCertificateLoading(true)

    void (async () => {
      try {
        if (isInfraco && context.realtime) {
          if (controller.signal.aborted) return
          setDetails(mapInfracoRealtimeToDetails(ont, context.realtime))
          setBirthCertificate(null)
          setLoading(false)
          setBirthCertificateLoading(false)
          return
        }

        const [infoResult, birthResult] = await Promise.all([
          fetchOntInfoByOnt(context.olt, ont, controller.signal),
          fetchOntBirthCertificate(ont, controller.signal),
        ])

        if (controller.signal.aborted) return

        if (!infoResult.ok) {
          setDetails(buildFallbackDetails(ont, context))
        } else {
          setDetails({
            ponId: normalizeOntId(ont) || ont,
            serial: formatOntSerial(ont),
            vendor: infoResult.data.equipmentType || 'Sin Datos',
            olt: context.olt || 'Sin Datos',
            placa: context.slot || 'Sin Datos',
            puerto: context.port || 'Sin Datos',
            estado: context.estado || 'Sin Datos',
            distancia: infoResult.data.distance || 'Sin Datos',
            ultimaVezActiva: infoResult.data.lastUpTime || 'Sin Datos',
            ultimaVezInactiva: infoResult.data.lastDnTime || 'Sin Datos',
            causaUltimaInactividad: infoResult.data.downCause || 'Sin Datos',
          })
        }

        setBirthCertificate(birthResult)
      } catch {
        if (!controller.signal.aborted) {
          setDetails(
            isInfraco && context.realtime
              ? mapInfracoRealtimeToDetails(ont, context.realtime)
              : buildFallbackDetails(ont, context),
          )
          setBirthCertificate(isInfraco ? null : { issue: 'error', certificates: [] })
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setBirthCertificateLoading(false)
        }
      }
    })()

    return () => controller.abort()
  }, [ont, context, isInfraco])

  if (loading) return <OntInfoCardLoading />
  return (
    <OntInfoCard
      ontInfo={details}
      birthCertificate={isInfraco ? null : birthCertificate}
      birthCertificateLoading={!isInfraco && birthCertificateLoading}
      showBirthCertificate={!isInfraco}
    />
  )
}

function buildFallbackDetails(ont: string, context: OntContext): OntInfoDetails {
  return {
    ponId: normalizeOntId(ont) || ont,
    serial: formatOntSerial(ont),
    vendor: 'Sin Datos',
    olt: context.olt || 'Sin Datos',
    placa: context.slot || 'Sin Datos',
    puerto: context.port || 'Sin Datos',
    estado: context.estado || 'Sin Datos',
    distancia: 'Sin Datos',
    ultimaVezActiva: 'Sin Datos',
    ultimaVezInactiva: 'Sin Datos',
    causaUltimaInactividad: 'Sin Datos',
  }
}
