import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export interface OntBirthCertificateItem {
  idCert: string
  fechaHora: string
  id: string
  date: string
  serialNumber: string
  rx: string
  tx: string
  bias: string
  voltaje: string
  distancia: string
  temperatura: string
  cdo: string
  puertoInstalado: string
  workOrder: string
  caseNumber: string
}

export type OntBirthCertificateResult =
  | { issue: 'none'; certificates: OntBirthCertificateItem[] }
  | { issue: 'no-data'; certificates: []; detail?: string }
  | { issue: 'error' | 'unexpected'; certificates: []; detail?: string }

export async function fetchOntBirthCertificate(
  ontId: string,
  signal?: AbortSignal,
): Promise<OntBirthCertificateResult> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId) {
    return { issue: 'unexpected', certificates: [] }
  }

  try {
    const response = await apiFetch('/api/services/ont/birthcertificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ontId: normalizedOntId }),
      signal,
    })

    if (response.status === 204) {
      return { issue: 'error', certificates: [], detail: 'Sesión inválida.' }
    }

    const data = await parseJsonResponse(response)
    const payloadStatus =
      data && typeof data === 'object' && typeof (data as { status?: unknown }).status === 'number'
        ? (data as { status: number }).status
        : null

    if (response.status === 202 || payloadStatus === 202) {
      return {
        issue: 'error',
        certificates: [],
        detail: 'Ocurrió un error en la consulta de certificado de nacimiento.',
      }
    }

    if (response.status === 206 || payloadStatus === 206) {
      return {
        issue: 'no-data',
        certificates: [],
        detail: 'No se encontraron datos de el certificado de nacimiento.',
      }
    }

    if (!response.ok) {
      return { issue: 'unexpected', certificates: [] }
    }

    if (!data || typeof data !== 'object') {
      return { issue: 'unexpected', certificates: [] }
    }

    const list = mapBirthCertificateList((data as { data?: unknown }).data)
    if (list === null) return { issue: 'unexpected', certificates: [] }
    if (list.length === 0) {
      return {
        issue: 'no-data',
        certificates: [],
        detail: 'No se encontraron datos de el certificado de nacimiento.',
      }
    }

    return { issue: 'none', certificates: list }
  } catch {
    return { issue: 'error', certificates: [] }
  }
}

function mapBirthCertificateList(data: unknown): OntBirthCertificateItem[] | null {
  if (data == null) return []
  if (!Array.isArray(data)) return null
  return data
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      return {
        idCert: toStringOrEmpty(source.id_cert),
        fechaHora: toStringOrEmpty(source.fecha_hora),
        id: toStringOrEmpty(source.id),
        date: toStringOrEmpty(source.date),
        serialNumber: toStringOrEmpty(source.serialnumber),
        rx: toStringOrEmpty(source.rx),
        tx: toStringOrEmpty(source.tx),
        bias: toStringOrEmpty(source.bias),
        voltaje: toStringOrEmpty(source.voltaje),
        distancia: toStringOrEmpty(source.distancia),
        temperatura: toStringOrEmpty(source.temperatura),
        cdo: toStringOrEmpty(source.cdo),
        puertoInstalado: toStringOrEmpty(source.puertoinstalado),
        workOrder: toStringOrEmpty(source.workorder),
        caseNumber: toStringOrEmpty(source.case),
      }
    })
    .filter(Boolean) as OntBirthCertificateItem[]
}
