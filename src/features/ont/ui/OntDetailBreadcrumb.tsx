import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useOntContextQuery } from '@/features/ont/hooks/use-ont-context-query'
import { BreadcrumbPlacaPuertoEstado } from '@/features/shell/components/BreadcrumbPlacaPuertoEstado'
import {
  FtthBreadcrumb,
  type BreadcrumbPlacaPuertoContext,
  type FtthBreadcrumbItem,
} from '@/features/shell/components/FtthBreadcrumb'

interface Props {
  ont: string
  showLinkIndicator?: boolean
  /** Vuelve a esta ruta desde el breadcrumb mobile (p. ej. vecinos → info). */
  backHref?: string
}

export function OntDetailBreadcrumb({
  ont,
  showLinkIndicator = true,
  backHref = '/ftth',
}: Props) {
  const [searchParams] = useSearchParams()
  const ontContext = useOntContextQuery(ont)

  const context = useMemo(() => {
    if (!ontContext.data) return null
    const data = ontContext.data
    if (data.mode === 'infraco') {
      return { infraco: true as const, olt: '', placa: '', puerto: '' }
    }
    return {
      infraco: false as const,
      olt: data.olt,
      placa: data.slot,
      puerto: data.port,
    }
  }, [ontContext.data])

  // Serial tal como viene en la URL (sin formatOntSerial corto)
  const displaySerial = ont.trim() || '-'
  const fromNap = normalizeBreadcrumbValue(searchParams.get('nap') ?? undefined)
  const fromCdo = normalizeBreadcrumbValue(searchParams.get('cdo') ?? undefined)

  const desktopItems = useMemo(
    () =>
      buildOntDesktopItems({
        ontSerial: displaySerial,
        infraco: context?.infraco,
        olt: context?.olt,
        placa: context?.placa,
        puerto: context?.puerto,
        nap: fromNap ?? undefined,
        cdo: fromCdo ?? undefined,
      }),
    [
      context?.infraco,
      context?.olt,
      context?.placa,
      context?.puerto,
      displaySerial,
      fromNap,
      fromCdo,
    ],
  )

  const placaPuertoContext = useMemo<BreadcrumbPlacaPuertoContext | null>(() => {
    if (context?.infraco || !context?.olt) return null
    const placa = Number.parseInt(context.placa, 10)
    const puerto = Number.parseInt(context.puerto, 10)
    if (!Number.isFinite(placa) || !Number.isFinite(puerto) || placa < 1) return null
    return { olt: context.olt, placa, puerto }
  }, [context?.infraco, context?.olt, context?.placa, context?.puerto])

  const estadoDesktop = placaPuertoContext ? (
    <BreadcrumbPlacaPuertoEstado
      olt={placaPuertoContext.olt}
      placa={placaPuertoContext.placa}
      puerto={placaPuertoContext.puerto}
      variant="desktop"
    />
  ) : null

  const estadoMobile = placaPuertoContext ? (
    <BreadcrumbPlacaPuertoEstado
      olt={placaPuertoContext.olt}
      placa={placaPuertoContext.placa}
      puerto={placaPuertoContext.puerto}
      variant="mobile"
    />
  ) : null

  return (
    <FtthBreadcrumb
      title={`ONT ${displaySerial}`}
      backHref={backHref}
      showLinkIndicator={showLinkIndicator}
      desktopItems={desktopItems}
      lookerHref={`/ftth/ont/${encodeURIComponent(ont)}/looker`}
      placaPuertoEstadoSlot={estadoDesktop}
      mobileEstadoSlot={estadoMobile}
    />
  )
}

function buildOntDesktopItems({
  ontSerial,
  infraco,
  olt,
  placa,
  puerto,
  nap,
  cdo,
}: {
  ontSerial: string
  infraco?: boolean
  olt?: string
  placa?: string
  puerto?: string
  nap?: string
  cdo?: string
}): FtthBreadcrumbItem[] {
  if (infraco) {
    return [
      { label: 'Home', href: '/ftth' },
      { label: 'infraco' },
      { label: ontSerial },
    ]
  }

  const normalizedOlt = normalizeBreadcrumbValue(olt)
  const normalizedPlaca = normalizeBreadcrumbValue(placa)
  const normalizedPuerto = normalizeBreadcrumbValue(puerto)

  if (!normalizedOlt) {
    return [
      { label: 'Home', href: '/ftth' },
      { label: 'ONT' },
      { label: ontSerial },
    ]
  }

  const items: FtthBreadcrumbItem[] = [
    { label: 'Home', href: '/ftth' },
    { label: 'OLT' },
    {
      label: normalizedOlt,
      href: `/ftth/olt/${encodeURIComponent(normalizedOlt)}`,
    },
  ]

  if (normalizedPlaca && normalizedPuerto) {
    const portHref = `/ftth/olt/${encodeURIComponent(normalizedOlt)}/placa/${encodeURIComponent(normalizedPlaca)}/puerto/${encodeURIComponent(normalizedPuerto)}`
    items.push({
      label: `${normalizedOlt}/${normalizedPlaca}/${normalizedPuerto}`,
      href: `${portHref}?highlightOnt=${encodeURIComponent(ontSerial)}`,
    })
  }

  const normalizedNap = normalizeBreadcrumbValue(nap)
  const normalizedCdo = normalizeBreadcrumbValue(cdo)

  if (normalizedNap) {
    items.push({
      label: `Nap ${normalizedNap}`,
      href: `/ftth/nap/${encodeURIComponent(normalizedNap)}?highlightOnt=${encodeURIComponent(ontSerial)}`,
    })
  }

  if (normalizedCdo) {
    items.push({
      label: `Cdo ${normalizedCdo}`,
      href: `/ftth/cdo/${encodeURIComponent(normalizedCdo)}?highlightOnt=${encodeURIComponent(ontSerial)}`,
    })
  }

  items.push({ label: ontSerial })
  return items
}

function normalizeBreadcrumbValue(value?: string | null): string | null {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized || normalized.toUpperCase() === 'SIN DATOS') return null
  return normalized
}
