import { normalizeOltRouteParam } from '@/features/ftth/lib/olt-names'
import {
  createDirectOntGroup,
  isPortTreeOntLeafEntry,
  normalizePortTreeNodeType,
  normalizePortTreeOntLeaf,
  normalizePortTreeString,
} from '@/features/port/lib/port-tree-structure'
import type {
  BffPortTreeOntChild,
  BffPortTreeResponse,
  GetOltPortTreeResult,
} from '@/features/port/types/port-tree'
import { apiFetch } from '@/shared/api/http'

const DEFAULT_VERSION = 'v2'

export async function fetchOltPortTree(
  oltFromRoute: string,
  placa: number,
  puerto: number,
  signal?: AbortSignal,
): Promise<GetOltPortTreeResult> {
  const olt = normalizeOltRouteParam(oltFromRoute)
  if (!olt || !Number.isFinite(placa) || !Number.isFinite(puerto)) {
    return { tree: null, issue: 'no-data' }
  }

  try {
    const response = await apiFetch('/api/services/port/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        olt,
        slot: String(placa),
        port: String(puerto),
        version: DEFAULT_VERSION,
      }),
      signal,
    })

    const rawText = await response.text()

    if (response.status === 204) return { tree: null, issue: 'error' }
    if (response.status === 206) return { tree: null, issue: 'no-data' }
    if (response.status === 202 || !response.ok) return { tree: null, issue: 'error' }

    let raw: unknown = null
    if (rawText) {
      try {
        raw = JSON.parse(rawText) as unknown
      } catch {
        raw = null
      }
    }

    const normalized = normalizePortTreePayload(raw)
    if (!normalized) return { tree: null, issue: 'unexpected' }
    if (normalized.childs.length === 0) return { tree: normalized, issue: 'no-data' }

    return { tree: normalized, issue: 'none' }
  } catch {
    return { tree: null, issue: 'unexpected' }
  }
}

function normalizePortTreePayload(raw: unknown): BffPortTreeResponse | null {
  if (!raw || typeof raw !== 'object') return null

  const root = raw as Record<string, unknown>
  const name = normalizePortTreeString(root.name)
  const type = normalizePortTreeNodeType(root.type)
  const childs = normalizeLvl1Children(root.childs)
  if (!name || !childs) return null

  return { name, type, childs }
}

function normalizeLvl1Children(raw: unknown): BffPortTreeResponse['childs'] | null {
  if (!Array.isArray(raw)) return null

  const children: BffPortTreeResponse['childs'] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const name = normalizePortTreeString(e.name)
    const type = normalizePortTreeNodeType(e.type)
    const childs = normalizeLvl2Children(e.childs)
    if (!name || !childs) continue
    children.push({ name, type, childs })
  }

  return children
}

function normalizeLvl2Children(
  raw: unknown,
): BffPortTreeResponse['childs'][number]['childs'] | null {
  if (!Array.isArray(raw)) return null

  const children: BffPortTreeResponse['childs'][number]['childs'] = []
  const directOnts: BffPortTreeOntChild[] = []

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>

    if (isPortTreeOntLeafEntry(e)) {
      const ontLeaf = normalizePortTreeOntLeaf(e)
      if (ontLeaf) directOnts.push(ontLeaf)
      continue
    }

    const name = normalizePortTreeString(e.name)
    const type = normalizePortTreeNodeType(e.type)
    const childs = normalizeLvl3Children(e.childs)
    if (!name || childs === null) continue
    children.push({ name, type, childs })
  }

  if (directOnts.length > 0) {
    children.push(createDirectOntGroup(directOnts))
  }

  return children
}

function normalizeLvl3Children(
  raw: unknown,
): BffPortTreeResponse['childs'][number]['childs'][number]['childs'] | null {
  if (!Array.isArray(raw)) return null

  const children: BffPortTreeResponse['childs'][number]['childs'][number]['childs'] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const ontLeaf = normalizePortTreeOntLeaf(entry as Record<string, unknown>)
    if (ontLeaf) children.push(ontLeaf)
  }

  return children
}
