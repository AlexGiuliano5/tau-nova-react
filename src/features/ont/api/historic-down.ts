import {
  parseInterruptionTimestamp,
  resolveIsOngoingInterruption,
  splitInterruptionDateTime,
} from '@/features/ont/lib/ont-interruptions-display'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { toStringOrEmpty } from '@/features/ont/lib/metrics-grid'
import type {
  OntHistoricDownItem,
  OntInterruptionsResult,
} from '@/features/ont/types/ont'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

function toTextOrNoData(value: unknown): string {
  const text = toStringOrEmpty(value).trim()
  return text || 'Sin Datos'
}

function isEmptyInterruptionItem(item: OntHistoricDownItem): boolean {
  return [item.status, item.date, item.time, item.duration].every(
    (value) => !value || value === 'Sin Datos',
  )
}

function mapStatusDownItem(item: Record<string, unknown>): OntHistoricDownItem {
  const rawDate = toTextOrNoData(item.date)
  const { date, time } =
    rawDate === 'Sin Datos'
      ? { date: 'Sin Datos', time: 'Sin Datos' }
      : splitInterruptionDateTime(rawDate)
  const duration = toTextOrNoData(item.duration)
  const dateEnd = toStringOrEmpty(item.dateEnd)

  return {
    status: toTextOrNoData(item.status),
    date,
    time,
    duration,
    timestampMs: rawDate === 'Sin Datos' ? null : parseInterruptionTimestamp(rawDate),
    isOngoing: resolveIsOngoingInterruption(duration, dateEnd),
  }
}

/** Misma lógica de issues que tau-nova `resolveOntHistoricDown`. */
export async function fetchOntHistoricDown(
  ontId: string,
  oltId?: string,
  signal?: AbortSignal,
): Promise<OntInterruptionsResult> {
  const normalizedOntId = normalizeOntId(ontId)
  if (!normalizedOntId) {
    return { interruptions: [], issue: 'no-data' }
  }

  const body: { ontId: string; oltId?: string } = { ontId: normalizedOntId }
  if (oltId?.trim()) body.oltId = oltId.trim()

  try {
    const response = await apiFetch('/api/services/ont/historicdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })

    if (response.status === 401 || response.status === 403) {
      return { interruptions: [], issue: 'error' }
    }
    if (response.status === 204 || response.status === 202) {
      return { interruptions: [], issue: 'no-data' }
    }
    if (!response.ok) {
      return { interruptions: [], issue: 'error' }
    }

    const data = await parseJsonResponse(response)
    if (!data || typeof data !== 'object') {
      return { interruptions: [], issue: 'unexpected' }
    }

    const root = data as { status?: unknown; statusDown?: unknown; detail?: unknown }
    const queryStatus =
      typeof root.status === 'number' && Number.isFinite(root.status) ? root.status : 200

    if (queryStatus === 206) {
      return { interruptions: [], issue: 'no-data' }
    }

    if (!Array.isArray(root.statusDown)) {
      return { interruptions: [], issue: 'unexpected' }
    }

    const interruptions = root.statusDown
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(mapStatusDownItem)
      .filter((item) => !isEmptyInterruptionItem(item))

    if (interruptions.length === 0) {
      return { interruptions: [], issue: 'no-drops' }
    }

    return { interruptions, issue: 'none' }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    return { interruptions: [], issue: 'error' }
  }
}
