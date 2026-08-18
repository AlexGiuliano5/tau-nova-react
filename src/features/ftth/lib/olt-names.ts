import { TreeType, type BffTreeResponse } from '@/features/ftth/types/tree'

export function oltNamesFromTree(tree: BffTreeResponse | null): string[] {
  if (!tree?.treeArray?.length) return []

  const seen = new Set<string>()
  for (const row of tree.treeArray) {
    if (row.type !== TreeType.Olt) continue
    const n = row.name?.trim()
    if (n) seen.add(n)
  }

  return [...seen].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
}

const DEFAULT_MIN_PREFIX = 3

export function filterOltsByPrefix(
  olts: string[],
  query: string,
  minLength = DEFAULT_MIN_PREFIX,
): string[] {
  const q = query.trim().toLowerCase()
  if (q.length < minLength) return []
  return olts.filter((name) => name.toLowerCase().startsWith(q))
}

export const OLT_AUTOCOMPLETE_MIN_CHARS = DEFAULT_MIN_PREFIX

/** Normaliza el segmento de ruta `[olt]` (mayúsculas, trim) para BFF y títulos. */
export function normalizeOltRouteParam(olt: string): string {
  let decoded = olt
  try {
    decoded = decodeURIComponent(olt)
  } catch {
    // URL inválida: se usa el valor crudo
  }
  return decoded.trim().toUpperCase()
}
