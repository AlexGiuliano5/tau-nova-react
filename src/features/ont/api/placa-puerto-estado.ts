import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

export type SlotPortSeverity = 'ok' | 'warning' | 'critical'

export type PlacaPuertoEstadoResult =
  | { ok: true; severity: SlotPortSeverity }
  | { ok: false }

const cache = new Map<string, SlotPortSeverity | null>()
const inflight = new Map<string, Promise<SlotPortSeverity | null>>()

export async function fetchPlacaPuertoEstado(
  olt: string,
  placa: number,
  puerto: number,
  signal?: AbortSignal,
): Promise<PlacaPuertoEstadoResult> {
  if (!olt.trim() || !Number.isFinite(placa) || !Number.isFinite(puerto)) {
    return { ok: false }
  }
  // Misma regla que tau-nova: placa 1-based sobre columnas de slotportarray.
  if (placa < 1) return { ok: false }

  const key = `${olt.trim().toUpperCase()}|${placa}|${puerto}`
  if (cache.has(key)) {
    const cached = cache.get(key)
    return cached ? { ok: true, severity: cached } : { ok: false }
  }

  const existing = inflight.get(key)
  if (existing) {
    const severity = await existing
    return severity ? { ok: true, severity } : { ok: false }
  }

  const pending = loadSeverity(olt.trim(), placa, puerto, signal)
    .then((severity) => {
      cache.set(key, severity)
      return severity
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, pending)
  const severity = await pending
  return severity ? { ok: true, severity } : { ok: false }
}

async function loadSeverity(
  olt: string,
  placa: number,
  puerto: number,
  signal?: AbortSignal,
): Promise<SlotPortSeverity | null> {
  try {
    const response = await apiFetch('/api/services/port/slotportarray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ olt }),
      signal,
    })

    if (!response.ok) return null
    const raw = await parseJsonResponse(response)
    const matrix = parseIndexMatrix(raw)
    if (!matrix) return null

    const rowCount = matrix.length
    const rowIndex = rowCount - 1 - puerto
    if (rowIndex < 0 || rowIndex >= rowCount) return null

    const cell = matrix[rowIndex]?.[placa - 1]
    if (!cell) return null
    return mapSeverity(cell.severity)
  } catch {
    return null
  }
}

interface MatrixCell {
  severity: string
}

type Matrix = Array<Array<MatrixCell | null>>

function parseIndexMatrix(raw: unknown): Matrix | null {
  const rows = extractRows(raw)
  if (!rows) return null

  const normalized: Matrix = []
  for (const row of rows) {
    if (!Array.isArray(row)) return null
    normalized.push(
      row.map((value) => {
        if (!value || typeof value !== 'object') return null
        const severity =
          typeof (value as { severity?: unknown }).severity === 'string'
            ? (value as { severity: string }).severity
            : ''
        return { severity }
      }),
    )
  }
  return normalized
}

function extractRows(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) {
    if (raw.length === 0) return []
    if (Array.isArray(raw[0])) return raw
    return null
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const fromIndex = o.index ?? o.Index
    if (Array.isArray(fromIndex) && (fromIndex.length === 0 || Array.isArray(fromIndex[0]))) {
      return fromIndex as unknown[]
    }
  }
  return null
}

function mapSeverity(raw: string): SlotPortSeverity {
  const v = raw.trim().toLowerCase()
  if (v === 'warning') return 'warning'
  if (v === 'critical') return 'critical'
  return 'ok'
}
