import { useEffect, useMemo, useState } from 'react'

import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import type { OntContext } from '@/features/ont/types/ont'
import {
  FtthSinglePointMapCard,
  type FtthMapMarkerPoint,
} from '@/features/ont/ui/map/FtthSinglePointMapCard'
import { FtthSinglePointMapCardLoading } from '@/features/ont/ui/map/FtthSinglePointMapCardLoading'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

interface Props {
  ont: string
  context: OntContext
}

interface AddressBySerial {
  lat: string
  lon: string
  calle: string
  altura: string
  piso: string
  dpto: string
  provincia: string
  localidad: string
}

export function InfracoMapCardClient({ ont, context }: Props) {
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState<AddressBySerial | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    void (async () => {
      const next = await fetchAddressBySerial(ont, controller.signal)
      if (controller.signal.aborted) return
      setAddress(next)
      setLoading(false)
    })()

    return () => controller.abort()
  }, [ont])

  const points = useMemo((): FtthMapMarkerPoint[] => {
    if (!address) return []
    const latitude = parseCoord(address.lat)
    const longitude = parseCoord(address.lon)
    if (latitude == null || longitude == null) return []

    const serial = (normalizeOntId(ont) || ont).trim()
    const rx = context.realtime?.ontRxPower?.trim() || 'Sin Datos'
    const tx = context.realtime?.ontTxPower?.trim() || 'Sin Datos'
    const estado = context.estado || 'Sin Datos'
    const street = [address.calle, address.altura].filter(Boolean).join(' ').trim()

    return [
      {
        id: serial,
        label: serial,
        latitude,
        longitude,
        tone: 'neutral',
        address: street || undefined,
        neighbors: [
          {
            serial,
            address: street || 'Sin Datos',
            addressBase: street || 'Sin Datos',
            streetName: address.calle || 'Sin Datos',
            heightLabel: address.altura || '',
            unitLabel: [address.piso, address.dpto].filter(Boolean).join(' ') || '',
            estado,
            ontRx: rx,
            ontTx: tx,
            oltRx: 'Sin Datos',
            oltTx: 'Sin Datos',
            oltVolt: 'Sin Datos',
            ontTemp: context.realtime?.ontTemperature?.trim() || 'Sin Datos',
            ontVolt: context.realtime?.ontVoltage?.trim() || 'Sin Datos',
            ontBiasCurrent: 'Sin Datos',
            oltBiasCurrent: 'Sin Datos',
            portTemp: 'Sin Datos',
          },
        ],
      },
    ]
  }, [address, context.estado, context.realtime, ont])

  if (loading) {
    return <FtthSinglePointMapCardLoading className="m-4" title="Mapa" />
  }

  return (
    <FtthSinglePointMapCard
      points={points}
      title="Mapa"
      subtitle={
        points.length > 0
          ? 'Ubicación del cliente e infraestructura FTTH'
          : 'Sin coordenadas para esta ONT'
      }
      className="m-4"
      singlePointZoom={16}
    />
  )
}

async function fetchAddressBySerial(
  ont: string,
  signal?: AbortSignal,
): Promise<AddressBySerial | null> {
  const serial = normalizeOntId(ont) || ont.trim()
  if (!serial) return null

  try {
    const response = await apiFetch(
      `/api/addresses/serial/${encodeURIComponent(serial)}`,
      { method: 'GET', signal },
    )
    if (!response.ok) return null
    const raw = await parseJsonResponse(response)
    return normalizeAddress(raw)
  } catch {
    return null
  }
}

function normalizeAddress(raw: unknown): AddressBySerial | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const nested =
    source.data && typeof source.data === 'object'
      ? (source.data as Record<string, unknown>)
      : source

  return {
    lat: stringField(nested.lat ?? nested.Lat ?? nested.latitude),
    lon: stringField(nested.lon ?? nested.Lng ?? nested.lng ?? nested.longitude),
    calle: stringField(nested.calle ?? nested.Calle),
    altura: stringField(nested.altura ?? nested.Altura),
    piso: stringField(nested.piso ?? nested.Piso),
    dpto: stringField(nested.dpto ?? nested.Dpto ?? nested.depto),
    provincia: stringField(nested.provincia ?? nested.Provincia),
    localidad: stringField(nested.localidad ?? nested.Localidad),
  }
}

function stringField(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value.trim()
  return ''
}

function parseCoord(value: string): number | null {
  const n = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
