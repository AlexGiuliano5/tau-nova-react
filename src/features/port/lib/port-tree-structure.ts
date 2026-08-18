import type { BffPortTreeOntChild, PortTreeNodeType, PortTreeSeverity } from '@/features/port/types/port-tree'
import { normalizePortTreeSeverity } from '@/features/port/lib/port-tree-severity'

/** Grupo sintético de ONTs colgadas directo del NAP (p. ej. rama `S/D`). */
export function isDirectOntGroupName(name: string): boolean {
  return name.trim() === ''
}

export function isPortTreeOntLeafEntry(entry: Record<string, unknown>): boolean {
  const ont = normalizePortTreeString(entry.ont)
  const severity = normalizePortTreeSeverity(entry.severity)
  return Boolean(ont && severity)
}

export function normalizePortTreeOntLeaf(
  entry: Record<string, unknown>,
): BffPortTreeOntChild | null {
  const ont = normalizePortTreeString(entry.ont)
  const severity = normalizePortTreeSeverity(entry.severity)
  if (!ont || !severity) return null

  const name = normalizePortTreeString(entry.name) || ont
  const type = normalizePortTreeNodeType(entry.type)
  const childs = Array.isArray(entry.childs) ? entry.childs : []

  return { name, ont, type, severity, childs }
}

export function createDirectOntGroup(childs: BffPortTreeOntChild[]): {
  name: string
  type: PortTreeNodeType
  childs: BffPortTreeOntChild[]
} {
  return {
    name: '',
    type: 'square',
    childs,
  }
}

export function normalizePortTreeString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export function normalizePortTreeNodeType(value: unknown): PortTreeNodeType {
  if (typeof value !== 'string') return 'unknown'
  const normalized = value.trim().toLowerCase()
  if (normalized === 'circle') return 'circle'
  if (normalized === 'triangle') return 'triangle'
  if (normalized === 'square') return 'square'
  return 'unknown'
}

export type { PortTreeSeverity }
