import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiClock, FiGlobe, FiPhone, FiRadio, FiX } from 'react-icons/fi'
import { IoGitNetworkOutline } from 'react-icons/io5'

import {
  fetchOntCapaControl,
  type BffOntCapaControlData,
} from '@/features/ont/api/capa-control'
import { resolveCapaControlPortalPresentation } from '@/features/ont/lib/capa-control-portal'
import { isOntMissingValue } from '@/features/ont/lib/missing-value'
import { resolveCapaControlSerialNumber } from '@/features/ont/lib/ont-serial'
import { OntCardEmptyBody, OntCardTitle } from '@/features/ont/ui/OntCardChrome'
import {
  capaControlCardShellClassName,
  OntCapaControlGroupedMetricCard,
  type CapaControlStatItem,
} from '@/features/ont/ui/OntCapaControlGroupedMetricCard'

const EMPTY = 'Sin Datos'

interface Props {
  ont: string
  refreshToken?: number
  /** Orden de visibilidad de capa. Sin valor = las 5 en orden default. */
  visiblePrefIds?: string[]
}

const DEFAULT_CAPA_PREF_IDS = [
  'capa-access',
  'capa-ip',
  'capa-portal',
  'capa-levanto',
  'capa-hdm-sip',
] as const

export function OntCapaControlSection({ ont, refreshToken = 0, visiblePrefIds }: Props) {
  const serialNumber = useMemo(() => resolveCapaControlSerialNumber(ont.trim()), [ont])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BffOntCapaControlData | null>(null)

  useEffect(() => {
    if (!serialNumber) {
      setLoading(false)
      setData(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    void (async () => {
      const result = await fetchOntCapaControl(serialNumber, refreshToken > 0, controller.signal)
      if (controller.signal.aborted) return
      if (result.ok && !result.data.error) {
        setData(result.data)
      } else {
        setData(null)
      }
      setLoading(false)
    })()

    return () => controller.abort()
  }, [serialNumber, refreshToken])

  const access = data?.access.trim() || EMPTY
  const ip = data?.ipAddress.trim() || EMPTY
  const startTime = formatStartTime(data?.startTime)
  const hdmSip = data?.hdmSip.trim() || EMPTY
  const portalRaw = data?.portal ?? null
  const allOtherEmpty =
    access === EMPTY && ip === EMPTY && startTime === EMPTY && hdmSip === EMPTY
  const portalPresentation = resolveCapaControlPortalPresentation(portalRaw, {
    allOtherFieldsEmpty: allOtherEmpty,
  })

  const statsById: Record<string, CapaControlStatItem> = {
    'capa-access': {
      label: 'Access',
      icon: IoGitNetworkOutline,
      value: (
        <span className="block wrap-break-word font-mono text-[10px] md:text-[10px] lg:text-[11px]" title={access}>
          {access}
        </span>
      ),
    },
    'capa-ip': {
      label: 'IP',
      icon: FiGlobe,
      value: (
        <span className="block wrap-break-word font-mono" title={ip}>
          {ip}
        </span>
      ),
    },
    'capa-portal': {
      label: 'Portal',
      icon: FiRadio,
      value: <PortalIcon tone={portalPresentation.tone} title={portalPresentation.description} />,
      valueClassName: 'text-base',
    },
    'capa-levanto': {
      label: 'Levantó por última vez',
      icon: FiClock,
      value: (
        <span className="block wrap-break-word tabular-nums text-[10px] md:text-[10px] lg:text-[11px]" title={startTime}>
          {startTime}
        </span>
      ),
    },
    'capa-hdm-sip': {
      label: 'HDM | SIP',
      icon: FiPhone,
      value: (
        <span className="block wrap-break-word font-mono" title={hdmSip}>
          {hdmSip}
        </span>
      ),
    },
  }

  const order = visiblePrefIds?.length ? visiblePrefIds : DEFAULT_CAPA_PREF_IDS
  const stats = order.flatMap((id) => {
    const stat = statsById[id]
    return stat ? [stat] : []
  })

  const isEmpty =
    !loading &&
    allOtherEmpty &&
    portalPresentation.tone === 'neutral' &&
    isOntMissingValue(portalPresentation.displayCode)

  return (
    <div className="flex flex-col gap-2">
      <OntCardTitle icon={IoGitNetworkOutline} as="h2">
        Capa de control
      </OntCardTitle>
      {isEmpty ? (
        <div className={`${capaControlCardShellClassName} min-h-[6.5rem]`}>
          <OntCardEmptyBody className="py-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
          {stats.map((stat) => (
            <OntCapaControlGroupedMetricCard
              key={stat.label}
              stats={[stat]}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PortalIcon({ tone, title }: { tone: 'green' | 'red' | 'neutral'; title: string }) {
  if (tone === 'green') {
    return (
      <span
        className="inline-flex size-7 items-center justify-center rounded-full bg-(--card-green)/25 text-(--card-green)"
        title={title}
      >
        <FiCheck className="size-4" aria-hidden />
      </span>
    )
  }
  if (tone === 'red') {
    return (
      <span
        className="inline-flex size-7 items-center justify-center rounded-full bg-(--card-red)/25 text-(--card-red)"
        title={title}
      >
        <FiX className="size-4" aria-hidden />
      </span>
    )
  }
  return (
    <span className="text-xs text-(--text-secondary)" title={title}>
      {EMPTY}
    </span>
  )
}

function formatStartTime(value?: string): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return EMPTY
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(parsed)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00'

  return `${read('day')}/${read('month')}/${read('year')}, ${read('hour')}:${read('minute')}:${read('second')}`
}
