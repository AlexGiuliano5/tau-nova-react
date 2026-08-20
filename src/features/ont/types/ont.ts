import type { BffInfoRealTimeByOntData } from '@/features/ont/api/info-realtime-by-ont'

export interface BffLastMetricByOntLastValue {
  title: string
  actual: string
  min: string
  avg: string
  max: string
  time: string
}

export interface BffLastMetricByOntResponse {
  slot: string
  port: string
  olt: string
  estado: string
  lastValues: BffLastMetricByOntLastValue[]
}

export interface OntClientInfo {
  nombre: string
  provincia: string
  localidad: string
  direccion: string
  pisoDpto: string
  telefonoFijo: string
  telefonoMovil: string
}

export interface BffOntInfoByOntResponse {
  lastUpTime: string
  lastDnTime: string
  downCause: string
  distance: string
  equipmentType: string
}

/** Item crudo del BFF (`statusDown[]`). */
export interface BffHistoricDownItem {
  status: string
  date: string
  dateEnd: string
  duration: string
}

/** Item listo para la card Interrupciones (post-normalización). */
export interface OntHistoricDownItem {
  status: string
  date: string
  time: string
  duration: string
  timestampMs: number | null
  /** true cuando la caída sigue abierta (sin fin / sin duración válida). */
  isOngoing: boolean
}

export type OntInterruptionsIssue =
  | 'none'
  | 'no-drops'
  | 'no-data'
  | 'error'
  | 'unexpected'

export interface OntInterruptionsResult {
  interruptions: OntHistoricDownItem[]
  issue: OntInterruptionsIssue
}

export interface OltMetricsGridRowRecord {
  rowKey: string
  [field: string]: string | undefined
}

export interface OntNeighborMapPoint {
  serial: string
  estado: string
  ontRx: string
  ontTx: string
  oltRx: string
  oltTx: string
  oltVolt: string
  ontTemp: string
  ontVolt: string
  ontBiasCurrent: string
  oltBiasCurrent: string
  portTemp: string
  calle: string
  altura: string
  piso: string
  depto: string
  lat: string
  lng: string
}

export interface OntNeighborsGridModel {
  columnNames: string[]
  rows: OltMetricsGridRowRecord[]
  mapPoints: OntNeighborMapPoint[]
  mapStats: { totalCoordinates: number; validCoordinates: number }
}

import type { BffInfoRealTimeByOntData } from '@/features/ont/api/info-realtime-by-ont'

export type OntViewMode = 'normal' | 'infraco'

export interface OntContext {
  mode: OntViewMode
  olt: string
  slot: string
  port: string
  estado: string
  lastValues: BffLastMetricByOntLastValue[]
  entityId: string
  /** Presente en modo infraco (probe infoRealTimeByOnt). */
  realtime?: BffInfoRealTimeByOntData
  /** Serial canónico para infraco / breadcrumbs. */
  ontId?: string
}
