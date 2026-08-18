import type { FtthMapMarkerPoint } from '@/features/ont/ui/map/FtthSinglePointMapCard'
import type { OntNeighborMapPoint, OltMetricsGridRowRecord } from '@/features/ont/types/ont'

function findColumnIndex(columnNames: string[], aliases: string[]): number {
  const normalizedAliases = aliases.map((alias) => alias.trim().toLowerCase())
  return columnNames.findIndex((name) =>
    normalizedAliases.includes(name.trim().toLowerCase()),
  )
}

function cellByIndex(row: OltMetricsGridRowRecord, index: number): string {
  if (index < 0) return 'Sin Datos'
  const raw = String(row[`c${index}`] ?? '').trim()
  return raw.length > 0 ? raw : 'Sin Datos'
}

function normalizeSerialKey(serial: string): string {
  return serial.trim().toLocaleUpperCase('es-AR')
}

function normalizeSerialLoose(serial: string): string {
  return normalizeSerialKey(serial).replace(/[^A-Z0-9]/g, '')
}

export function parseOntMapCoordinate(value: string | undefined): number | null {
  if (!value || value === 'Sin Datos') return null
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatUnitWithAddressContext(unit: string, street: string, height: string): string {
  if (unit !== 'Sin Datos') return unit
  const hasStreetAndHeight = street !== 'Sin Datos' && height !== 'Sin Datos'
  return hasStreetAndHeight ? '-' : 'Sin Datos'
}

export function buildNeighborMapPointsFromGrid(
  columnNames: string[],
  rows: OltMetricsGridRowRecord[],
  coordinates: Array<{ serial: string; lat: string | null; lon: string | null }>,
): OntNeighborMapPoint[] {
  const serialIndex = findColumnIndex(columnNames, ['serial'])
  const estadoIndex = findColumnIndex(columnNames, ['estado'])
  const ontRxIndex = findColumnIndex(columnNames, ['ont rx pwr', 'ont rx'])
  const oltRxIndex = findColumnIndex(columnNames, ['olt rx pwr', 'olt rx'])
  const ontTxIndex = findColumnIndex(columnNames, ['ont tx pwr', 'ont tx'])
  const oltTxIndex = findColumnIndex(columnNames, ['olt tx pwr', 'olt tx'])
  const oltVoltIndex = findColumnIndex(columnNames, ['olt volt'])
  const ontTempIndex = findColumnIndex(columnNames, ['ont temp'])
  const ontVoltIndex = findColumnIndex(columnNames, ['ont volt'])
  const ontBiasCurrentIndex = findColumnIndex(columnNames, ['ontbiascurrent'])
  const oltBiasCurrentIndex = findColumnIndex(columnNames, ['oltbiascurrent'])
  const portTempIndex = findColumnIndex(columnNames, ['port temp'])
  const calleIndex = findColumnIndex(columnNames, ['calle'])
  const alturaIndex = findColumnIndex(columnNames, ['altura'])
  const pisoIndex = findColumnIndex(columnNames, ['piso'])
  const deptoIndex = findColumnIndex(columnNames, ['depto'])

  if (serialIndex < 0) return []

  const detailsBySerial = new Map<string, Omit<OntNeighborMapPoint, 'serial' | 'lat' | 'lng'>>()

  for (const row of rows) {
    const serial = cellByIndex(row, serialIndex)
    const street = cellByIndex(row, calleIndex)
    const height = cellByIndex(row, alturaIndex)
    const floor = cellByIndex(row, pisoIndex)
    const apartment = cellByIndex(row, deptoIndex)
    const detail = {
      estado: cellByIndex(row, estadoIndex),
      ontRx: cellByIndex(row, ontRxIndex),
      ontTx: cellByIndex(row, ontTxIndex),
      oltRx: cellByIndex(row, oltRxIndex),
      oltTx: cellByIndex(row, oltTxIndex),
      oltVolt: cellByIndex(row, oltVoltIndex),
      ontTemp: cellByIndex(row, ontTempIndex),
      ontVolt: cellByIndex(row, ontVoltIndex),
      ontBiasCurrent: cellByIndex(row, ontBiasCurrentIndex),
      oltBiasCurrent: cellByIndex(row, oltBiasCurrentIndex),
      portTemp: cellByIndex(row, portTempIndex),
      calle: street,
      altura: height,
      piso: formatUnitWithAddressContext(floor, street, height),
      depto: formatUnitWithAddressContext(apartment, street, height),
    }
    const strict = normalizeSerialKey(serial)
    const loose = normalizeSerialLoose(serial)
    if (strict) detailsBySerial.set(strict, detail)
    if (loose) detailsBySerial.set(loose, detail)
  }

  return coordinates
    .filter((coordinate) => Boolean(coordinate.serial && coordinate.lat && coordinate.lon))
    .map((coordinate) => {
      const serial = coordinate.serial.trim()
      const detail =
        detailsBySerial.get(normalizeSerialKey(serial)) ??
        detailsBySerial.get(normalizeSerialLoose(serial))
      return {
        serial,
        estado: detail?.estado ?? 'Sin Datos',
        ontRx: detail?.ontRx ?? 'Sin Datos',
        ontTx: detail?.ontTx ?? 'Sin Datos',
        oltRx: detail?.oltRx ?? 'Sin Datos',
        oltTx: detail?.oltTx ?? 'Sin Datos',
        oltVolt: detail?.oltVolt ?? 'Sin Datos',
        ontTemp: detail?.ontTemp ?? 'Sin Datos',
        ontVolt: detail?.ontVolt ?? 'Sin Datos',
        ontBiasCurrent: detail?.ontBiasCurrent ?? 'Sin Datos',
        oltBiasCurrent: detail?.oltBiasCurrent ?? 'Sin Datos',
        portTemp: detail?.portTemp ?? 'Sin Datos',
        calle: detail?.calle ?? 'Sin Datos',
        altura: detail?.altura ?? 'Sin Datos',
        piso: detail?.piso ?? 'Sin Datos',
        depto: detail?.depto ?? 'Sin Datos',
        lat: coordinate.lat as string,
        lng: coordinate.lon as string,
      }
    })
}

function formatNeighborAddressBase(point: OntNeighborMapPoint): string {
  const street = point.calle !== 'Sin Datos' ? point.calle : ''
  const height = point.altura !== 'Sin Datos' ? point.altura : ''
  const addressBase = [street, height].filter(Boolean).join(' ').trim()
  return addressBase || 'Dirección sin datos'
}

function formatNeighborStreet(point: OntNeighborMapPoint): string {
  return point.calle !== 'Sin Datos' ? point.calle : 'Dirección sin datos'
}

function formatNeighborHeight(point: OntNeighborMapPoint): string {
  return point.altura !== 'Sin Datos' ? point.altura : 'S/N'
}

function formatNeighborUnit(point: OntNeighborMapPoint): string {
  const floor = point.piso !== 'Sin Datos' ? point.piso : ''
  const apartment = point.depto !== 'Sin Datos' ? point.depto : ''
  const extra = [floor ? `Piso ${floor}` : '', apartment ? `Depto ${apartment}` : '']
    .filter(Boolean)
    .join(' · ')
  return extra || 'Sin unidad'
}

function getToneByStatuses(statuses: string[]): FtthMapMarkerPoint['tone'] {
  if (statuses.length === 0) return 'neutral'
  const normalized = statuses.map((status) =>
    status.trim().toUpperCase().replace(/\s+/g, '_'),
  )
  const isGood = (value: string) => value === 'GOOD'
  const isInterrupted = (value: string) =>
    value === 'INTERRUPTED' || value === 'SWITCHED_OFF' || value === 'SWITCHEDOFF'
  if (normalized.every(isGood)) return 'green'
  if (normalized.every(isInterrupted)) return 'red'
  if (normalized.some(isGood)) return 'yellow'
  return 'orange'
}

export function buildOntGroupedMapMarkers(
  points: OntNeighborMapPoint[],
): FtthMapMarkerPoint[] {
  const grouped = new Map<
    string,
    {
      latitude: number
      longitude: number
      statuses: string[]
      count: number
      neighbors: NonNullable<FtthMapMarkerPoint['neighbors']>
      address: string
    }
  >()

  for (const point of points) {
    const latitude = parseOntMapCoordinate(point.lat)
    const longitude = parseOntMapCoordinate(point.lng)
    if (latitude === null || longitude === null) continue

    const key = `${latitude.toFixed(4)}|${longitude.toFixed(4)}`
    const mappedNeighbor = {
      serial: point.serial,
      address: formatNeighborAddressBase(point),
      addressBase: formatNeighborAddressBase(point),
      streetName: formatNeighborStreet(point),
      heightLabel: formatNeighborHeight(point),
      unitLabel: formatNeighborUnit(point),
      estado: point.estado,
      ontRx: point.ontRx,
      ontTx: point.ontTx,
      oltRx: point.oltRx,
      oltTx: point.oltTx,
      oltVolt: point.oltVolt,
      ontTemp: point.ontTemp,
      ontVolt: point.ontVolt,
      ontBiasCurrent: point.ontBiasCurrent,
      oltBiasCurrent: point.oltBiasCurrent,
      portTemp: point.portTemp,
    }

    const existing = grouped.get(key)
    if (existing) {
      existing.statuses.push(point.estado)
      existing.count += 1
      existing.neighbors.push(mappedNeighbor)
      continue
    }

    grouped.set(key, {
      latitude,
      longitude,
      statuses: [point.estado],
      count: 1,
      neighbors: [mappedNeighbor],
      address: formatNeighborAddressBase(point),
    })
  }

  return Array.from(grouped.entries()).map(([key, item]) => ({
    id: key,
    label: `${item.count} vecino${item.count === 1 ? '' : 's'}`,
    latitude: item.latitude,
    longitude: item.longitude,
    tone: getToneByStatuses(item.statuses),
    count: item.count,
    address: item.address,
    neighbors: item.neighbors,
  }))
}

export function filterMapMarkersBySerials(
  points: FtthMapMarkerPoint[],
  selectedSerials: string[],
): FtthMapMarkerPoint[] {
  if (selectedSerials.length === 0) return points
  const selectedSet = new Set(selectedSerials.map(normalizeSerialKey))

  return points
    .map((point): FtthMapMarkerPoint | null => {
      const neighbors = (point.neighbors ?? []).filter((neighbor) =>
        selectedSet.has(normalizeSerialKey(neighbor.serial)),
      )
      if (neighbors.length === 0) return null
      return {
        ...point,
        count: neighbors.length,
        label: `${neighbors.length} vecino${neighbors.length === 1 ? '' : 's'}`,
        tone: getToneByStatuses(neighbors.map((neighbor) => neighbor.estado)),
        neighbors,
      }
    })
    .filter((point): point is FtthMapMarkerPoint => point !== null)
}

export function buildOntNeighborsMapViewModel(
  mapPoints: OntNeighborMapPoint[],
  mapStats: { totalCoordinates: number; validCoordinates: number },
) {
  const markers = buildOntGroupedMapMarkers(mapPoints)
  const first = markers[0]
  return {
    mapPoints: markers,
    mapSubtitle: `${markers.length} ubicaciones agrupadas · ${mapStats.validCoordinates}/${mapStats.totalCoordinates} vecinos con coordenadas`,
    mapCenter: {
      latitude: first?.latitude ?? null,
      longitude: first?.longitude ?? null,
    },
  }
}
