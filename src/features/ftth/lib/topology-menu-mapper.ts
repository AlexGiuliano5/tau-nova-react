import {
  buildOltHref,
  buildOltPlacaPuertoHref,
} from '@/features/ftth/lib/tree-navigation'
import type { BffTreeResponse, TreeNode, TreeNodeType } from '@/features/ftth/types/tree'

export interface TopologyMenuNode {
  id: string
  label: string
  href?: string
  children: TopologyMenuNode[]
}

interface TraversalContext {
  oltName?: string
  placaNumber?: number
}

function normalizeLabel(value: string): string {
  return value.trim()
}

function makeNodeId(path: string[]): string {
  return path.join(' > ')
}

function buildTypeIndex(treeData: BffTreeResponse | null): Map<string, Set<TreeNodeType>> {
  const index = new Map<string, Set<TreeNodeType>>()
  if (!treeData?.treeArray?.length) return index

  for (const row of treeData.treeArray) {
    const name = normalizeLabel(row.name ?? '')
    if (!name) continue
    const bucket = index.get(name) ?? new Set<TreeNodeType>()
    bucket.add(row.type)
    index.set(name, bucket)
  }
  return index
}

function isOltByType(nodeName: string, typeIndex: Map<string, Set<TreeNodeType>>): boolean {
  return Boolean(typeIndex.get(nodeName)?.has('olt'))
}

function isOntName(nodeName: string): boolean {
  const normalized = nodeName.trim().toUpperCase().replace(/^ONT\s+/, '')
  return /^[A-Z0-9]{12}$/.test(normalized) || /^[A-Z0-9]{16}$/.test(normalized)
}

function parsePlacaNumber(nodeName: string): number | null {
  const match = /placa\s*(\d{1,2})/i.exec(nodeName) ?? /^(\d{1,2})$/.exec(nodeName)
  if (!match) return null
  const value = Number(match[1])
  return Number.isInteger(value) ? value : null
}

function parsePuertoNumber(nodeName: string): number | null {
  const match =
    /puerto\s*(\d{1,2})/i.exec(nodeName) ?? /^p(?:uerto)?\s*(\d{1,2})$/i.exec(nodeName)
  if (!match) return null
  const value = Number(match[1])
  return Number.isInteger(value) ? value : null
}

function parsePlacaPuertoPair(nodeName: string): { placa: number; puerto: number } | null {
  const match = /placa\s*(\d{1,2}).*puerto\s*(\d{1,2})/i.exec(nodeName)
  if (!match) return null
  const placa = Number(match[1])
  const puerto = Number(match[2])
  if (!Number.isInteger(placa) || !Number.isInteger(puerto)) return null
  return { placa, puerto }
}

function resolveLeafHref(
  label: string,
  context: TraversalContext,
  isOlt: boolean,
): string | undefined {
  if (isOlt) return buildOltHref(label)

  if (context.oltName) {
    const pair = parsePlacaPuertoPair(label)
    if (pair) {
      return buildOltPlacaPuertoHref(context.oltName, pair.placa, pair.puerto)
    }
    const puerto = parsePuertoNumber(label)
    if (puerto !== null && typeof context.placaNumber === 'number') {
      return buildOltPlacaPuertoHref(context.oltName, context.placaNumber, puerto)
    }
  }

  if (isOntName(label)) {
    const ontSerial = label.replace(/^ONT\s+/i, '').trim()
    if (ontSerial) return `/ftth/ont/${encodeURIComponent(ontSerial)}/info`
  }

  return undefined
}

function mapTreeNode(
  node: TreeNode,
  path: string[],
  context: TraversalContext,
  typeIndex: Map<string, Set<TreeNodeType>>,
): TopologyMenuNode {
  const label = normalizeLabel(node.name ?? '')
  const children = Array.isArray(node.childs) ? node.childs : []
  const nodePath = [...path, label]
  const isLeaf = children.length === 0
  const isOlt = isOltByType(label, typeIndex)

  const nextContext: TraversalContext = { ...context }
  if (isOlt) {
    nextContext.oltName = label
    nextContext.placaNumber = undefined
  }

  const maybePlaca = parsePlacaNumber(label)
  if (maybePlaca !== null) nextContext.placaNumber = maybePlaca

  return {
    id: makeNodeId(nodePath),
    label,
    href: isLeaf ? resolveLeafHref(label, context, isOlt) : undefined,
    children: children
      .map((child) => mapTreeNode(child, nodePath, nextContext, typeIndex))
      .filter((child) => child.label.length > 0),
  }
}

export function mapTopologyMenuNodes(treeData: BffTreeResponse | null): TopologyMenuNode[] {
  if (!treeData?.tree?.length) return []
  const typeIndex = buildTypeIndex(treeData)
  return treeData.tree
    .map((rootNode) => mapTreeNode(rootNode, [], {}, typeIndex))
    .filter((node) => node.label.length > 0)
}
